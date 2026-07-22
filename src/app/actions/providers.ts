'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive, getSubscriptionUsage } from '@/lib/services/subscriptions'
import type { ActivityStatus, ExternalBookingPlatform } from '@/types/database'

// =====================================================
// Auth helpers
// =====================================================

async function requireProviderAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: provider } = await supabase
    .from('providers')
    .select('id, is_active')
    .eq('profile_id', user.id)
    .single()

  if (!provider) throw new Error('Provider not found')
  if (!provider.is_active) throw new Error('Provider account is inactive')

  return { user, providerId: provider.id }
}

// =====================================================
// Activity management
// =====================================================

export interface CreateActivityInput {
  title: string
  description: string
  shortDescription?: string
  categoryId?: string
  priceFrom: number
  durationMinutes: number
  maxParticipants: number
  minParticipants?: number
  languages: string[]
  meetingPoint: string
  latitude?: number
  longitude?: number
  city: string
  country?: string
  cancellationPolicy?: string
  included?: string[]
  excluded?: string[]
  requirements?: string[]
  googleMapsUrl?: string
  videoUrl?: string
  faqs?: { question: string; answer: string }[]
  extraInfo?: { title: string; content: string }[]
  bookingWidgetEmbedCode?: string
  externalBookingPlatform?: ExternalBookingPlatform
  publishImmediately?: boolean
}

export async function createActivityAction(input: CreateActivityInput) {
  const { providerId } = await requireProviderAuth()

  // Check subscription before allowing activity creation
  const canPublish = await isSubscriptionActive(providerId)
  if (!canPublish) {
    return {
      success: false,
      error: 'You need an active subscription to create activities. Please upgrade your plan.',
      upgradeRequired: true,
    }
  }

  const supabase = await createClient()

  // Submitting for review counts against the plan's activity quota — final
  // publish only happens after admin approval (see review_activity_submission
  // in supabase/005_bookactivities_v3.sql), but we check the quota at
  // submission time too so providers can't pile up unlimited pending items.
  if (input.publishImmediately) {
    const usage = await getSubscriptionUsage(providerId)
    if (!usage.canPublishMore) {
      return {
        success: false,
        error: `You've reached the ${usage.maxActivities} published activities limit for your plan.`,
        upgradeRequired: true,
      }
    }
  }

  const slug = input.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { data, error } = await supabase
    .from('activities')
    .insert({
      provider_id:                providerId,
      title:                      input.title,
      slug:                       `${slug}-${Date.now().toString(36)}`,
      description:                input.description,
      short_description:          input.shortDescription ?? null,
      category_id:                input.categoryId ?? null,
      price_from:                 input.priceFrom,
      duration_minutes:           input.durationMinutes,
      max_participants:           input.maxParticipants,
      min_participants:           input.minParticipants ?? 1,
      languages:                  input.languages,
      meeting_point:              input.meetingPoint,
      latitude:                   input.latitude ?? null,
      longitude:                  input.longitude ?? null,
      city:                       input.city,
      country:                    input.country ?? 'ES',
      cancellation_policy:        input.cancellationPolicy ?? 'Free cancellation up to 24 hours before',
      included:                   input.included ?? [],
      excluded:                   input.excluded ?? [],
      requirements:                input.requirements ?? [],
      google_maps_url:            input.googleMapsUrl ?? null,
      video_url:                  input.videoUrl ?? null,
      faqs:                       input.faqs ?? [],
      extra_info:                 input.extraInfo ?? [],
      booking_widget_embed_code:  input.bookingWidgetEmbedCode ?? null,
      external_booking_platform:  input.externalBookingPlatform ?? null,
      // A provider can only ever land a new activity in draft or pending_review —
      // 'published' is set exclusively by review_activity_submission() after admin approval.
      status:                     input.publishImmediately ? 'pending_review' : 'draft',
    })
    .select('id, slug, status')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/activities')
  revalidatePath('/activities')
  return { success: true, activity: data }
}

// Providers may only move an activity between draft/pending_review/archived —
// 'published' and 'suspended' are admin-only transitions (see review_activity_submission).
export async function updateActivityStatusAction(
  activityId: string,
  newStatus: Extract<ActivityStatus, 'draft' | 'pending_review' | 'archived'>
) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, status, provider_id')
    .eq('id', activityId)
    .single()

  if (!activity) return { success: false, error: 'Activity not found' }
  if (activity.provider_id !== providerId) return { success: false, error: 'Not your activity' }

  if (newStatus === 'pending_review') {
    const usage = await getSubscriptionUsage(providerId)
    if (!usage.canPublishMore) {
      return {
        success: false,
        error: `Activity limit reached (${usage.maxActivities}). Upgrade to submit more.`,
        upgradeRequired: true,
      }
    }
  }

  const { error } = await supabase
    .from('activities')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', activityId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/activities')
  revalidatePath('/activities')
  return { success: true }
}

export async function updateActivityAction(
  activityId: string,
  updates: Partial<CreateActivityInput>
) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, provider_id')
    .eq('id', activityId)
    .single()

  if (!activity) return { success: false, error: 'Activity not found' }
  if (activity.provider_id !== providerId) return { success: false, error: 'Not your activity' }

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.title !== undefined)              payload.title               = updates.title
  if (updates.description !== undefined)        payload.description         = updates.description
  if (updates.shortDescription !== undefined)   payload.short_description   = updates.shortDescription
  if (updates.categoryId !== undefined)         payload.category_id         = updates.categoryId
  if (updates.priceFrom !== undefined)          payload.price_from          = updates.priceFrom
  if (updates.durationMinutes !== undefined)    payload.duration_minutes    = updates.durationMinutes
  if (updates.maxParticipants !== undefined)    payload.max_participants    = updates.maxParticipants
  if (updates.minParticipants !== undefined)    payload.min_participants    = updates.minParticipants
  if (updates.languages !== undefined)          payload.languages           = updates.languages
  if (updates.meetingPoint !== undefined)       payload.meeting_point       = updates.meetingPoint
  if (updates.latitude !== undefined)           payload.latitude            = updates.latitude
  if (updates.longitude !== undefined)          payload.longitude           = updates.longitude
  if (updates.city !== undefined)               payload.city                = updates.city
  if (updates.cancellationPolicy !== undefined) payload.cancellation_policy = updates.cancellationPolicy
  if (updates.included !== undefined)           payload.included            = updates.included
  if (updates.excluded !== undefined)           payload.excluded            = updates.excluded
  if (updates.requirements !== undefined)       payload.requirements        = updates.requirements
  if (updates.googleMapsUrl !== undefined)      payload.google_maps_url     = updates.googleMapsUrl
  if (updates.videoUrl !== undefined)                payload.video_url                 = updates.videoUrl
  if (updates.faqs !== undefined)                    payload.faqs                      = updates.faqs
  if (updates.extraInfo !== undefined)               payload.extra_info                = updates.extraInfo
  if (updates.bookingWidgetEmbedCode !== undefined)  payload.booking_widget_embed_code = updates.bookingWidgetEmbedCode
  if (updates.externalBookingPlatform !== undefined) payload.external_booking_platform = updates.externalBookingPlatform

  const { error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', activityId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/activities')
  return { success: true }
}

export async function deleteActivityAction(activityId: string) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, provider_id, status')
    .eq('id', activityId)
    .single()

  if (!activity) return { success: false, error: 'Activity not found' }
  if (activity.provider_id !== providerId) return { success: false, error: 'Not your activity' }

  // Soft-delete: archive instead of hard delete (preserves reservation history)
  const { error } = await supabase
    .from('activities')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', activityId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/activities')
  revalidatePath('/activities')
  return { success: true }
}

// Get provider's own activities
export interface ProviderActivitySummary {
  id: string
  title: string
  slug: string
  status: ActivityStatus
  price_from: number
  duration_minutes: number
  booking_count: number
  rating: number
  created_at: string
  updated_at: string
  images: { url: string; is_cover: boolean }[]
}

export async function getProviderActivitiesAction() {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select(`
      id, title, slug, status, price_from, duration_minutes, booking_count, rating,
      created_at, updated_at,
      images:activity_images(url, is_cover)
    `)
    .eq('provider_id', providerId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message, activities: [] as ProviderActivitySummary[] }
  return { success: true, activities: (data ?? []) as unknown as ProviderActivitySummary[] }
}

// Get a single activity owned by the current provider, for the edit screen
export async function getProviderActivityAction(activityId: string) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select('*, images:activity_images(*), category:categories(*)')
    .eq('id', activityId)
    .eq('provider_id', providerId)
    .single()

  if (error || !data) return { success: false, error: 'Activity not found', activity: null }
  return { success: true, activity: data }
}

// Submit a draft (or resubmit a rejected draft) for admin review
export async function submitActivityForReviewAction(activityId: string) {
  const { providerId } = await requireProviderAuth()

  const usage = await getSubscriptionUsage(providerId)
  if (!usage.canPublishMore) {
    return {
      success: false,
      error: `Activity limit reached (${usage.maxActivities}). Upgrade to submit more.`,
      upgradeRequired: true,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('submit_activity_for_review', { p_activity_id: activityId })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/activities')
  return { success: true, activity: data }
}

// Register an uploaded photo/video (the file itself is uploaded directly to
// Supabase Storage from the browser client — this just links the public URL
// to the activity_images row so it shows up in the gallery).
export async function addActivityImageAction(
  activityId: string,
  url: string,
  opts?: { alt?: string; isCover?: boolean }
) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, provider_id')
    .eq('id', activityId)
    .single()
  if (!activity || activity.provider_id !== providerId) {
    return { success: false, error: 'Not your activity' }
  }

  const { count } = await supabase
    .from('activity_images')
    .select('id', { count: 'exact', head: true })
    .eq('activity_id', activityId)

  const { data, error } = await supabase
    .from('activity_images')
    .insert({
      activity_id: activityId,
      url,
      alt: opts?.alt ?? null,
      is_cover: opts?.isCover ?? count === 0,
      sort_order: count ?? 0,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/dashboard/provider/activities/${activityId}`)
  return { success: true, image: data }
}

export async function setActivityCoverImageAction(imageId: string, activityId: string) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, provider_id')
    .eq('id', activityId)
    .single()
  if (!activity || activity.provider_id !== providerId) {
    return { success: false, error: 'Not your activity' }
  }

  await supabase.from('activity_images').update({ is_cover: false }).eq('activity_id', activityId)
  const { error } = await supabase.from('activity_images').update({ is_cover: true }).eq('id', imageId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/dashboard/provider/activities/${activityId}`)
  return { success: true }
}

export async function removeActivityImageAction(imageId: string, activityId: string) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, provider_id')
    .eq('id', activityId)
    .single()
  if (!activity || activity.provider_id !== providerId) {
    return { success: false, error: 'Not your activity' }
  }

  const { error } = await supabase.from('activity_images').delete().eq('id', imageId)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/dashboard/provider/activities/${activityId}`)
  return { success: true }
}

// =====================================================
// Company profile
// =====================================================

export async function updateProviderProfileAction(updates: {
  companyName?: string
  description?: string
  address?: string
  city?: string
  phone?: string
  website?: string
  taxId?: string
  logoUrl?: string
}) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.companyName !== undefined) payload.company_name = updates.companyName
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.address !== undefined) payload.address = updates.address
  if (updates.city !== undefined) payload.city = updates.city
  if (updates.phone !== undefined) payload.phone = updates.phone
  if (updates.website !== undefined) payload.website = updates.website
  if (updates.taxId !== undefined) payload.tax_id = updates.taxId
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl

  const { error } = await supabase.from('providers').update(payload).eq('id', providerId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/settings')
  return { success: true }
}
