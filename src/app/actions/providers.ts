'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive, getSubscriptionUsage } from '@/lib/services/subscriptions'
import { testTuriTopConnection, saveTuriTopKey, getTuriTopKey, listTuriTopProducts, getTuriTopCalendar, getTuriTopBookings, getTuriTopImportData, type TuriTopProduct } from '@/lib/services/turitop'
import type { CalendarEvent, CalendarAvailability } from '@/lib/calendar-types'
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
  turitopServiceCode?: string
  turitopProductId?: string
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
      turitop_service_code:       input.turitopServiceCode ?? null,
      turitop_product_id:         input.turitopProductId ?? null,
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
  if (updates.turitopServiceCode !== undefined)      payload.turitop_service_code      = updates.turitopServiceCode
  if (updates.turitopProductId !== undefined)        payload.turitop_product_id        = updates.turitopProductId || null

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

// Hard delete — only allowed when the activity has no reservations at all
// (reservation history must be preserved; archive instead in that case).
export async function permanentlyDeleteActivityAction(activityId: string): Promise<{ success: boolean; error?: string; code?: string }> {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('id, provider_id')
    .eq('id', activityId)
    .single()
  if (!activity) return { success: false, error: 'Activity not found' }
  if (activity.provider_id !== providerId) return { success: false, error: 'Not your activity' }

  const { count } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('activity_id', activityId)
  if ((count ?? 0) > 0) return { success: false, error: 'Has reservations', code: 'has_reservations' }

  const { error } = await supabase.from('activities').delete().eq('id', activityId).eq('provider_id', providerId)
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

export async function getProviderActivitiesAction(opts: { archived?: boolean } = {}) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  let query = supabase
    .from('activities')
    .select(`
      id, title, slug, status, price_from, duration_minutes, booking_count, rating,
      created_at, updated_at,
      images:activity_images(url, is_cover)
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
  query = opts.archived ? query.eq('status', 'archived') : query.neq('status', 'archived')
  const { data, error } = await query

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
  turitopCompanyCode?: string
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
  if (updates.turitopCompanyCode !== undefined) payload.turitop_company_code = updates.turitopCompanyCode

  const { error } = await supabase.from('providers').update(payload).eq('id', providerId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/settings')
  return { success: true }
}

// =====================================================
// Public: "Hazte proveedor" application form (no auth — anonymous lead capture)
// =====================================================

export interface SubmitProviderApplicationInput {
  companyName: string
  contactName: string
  email: string
  phone?: string
  activitiesDescription?: string
  website?: string
  referralCode?: string
}

export async function submitProviderApplicationAction(input: SubmitProviderApplicationInput) {
  if (!input.companyName?.trim() || !input.contactName?.trim() || !input.email?.trim()) {
    return { success: false, error: 'Faltan campos obligatorios' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('provider_applications').insert({
    company_name: input.companyName.trim(),
    contact_name: input.contactName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    activities_description: input.activitiesDescription?.trim() || null,
    website: input.website?.trim() || null,
    referral_code: input.referralCode?.trim() || null,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// =====================================================
// TuriTop API connection (real API, distinct from the embed widget's
// company/service codes) — provider connects their own calendar.
// =====================================================

export async function updateTuriTopConnectionAction(apiKey: string) {
  const { providerId } = await requireProviderAuth()
  const supabase = await createClient()

  const result = await testTuriTopConnection(apiKey)

  const credError = await saveTuriTopKey(supabase, providerId, apiKey)
  if (credError) return { success: false, error: credError }

  const { error } = await supabase
    .from('providers')
    .update({
      turitop_has_key: !!apiKey.trim(),
      turitop_connection_status: apiKey.trim() ? result.status : 'unverified',
      turitop_connection_error: apiKey.trim() ? result.error : null,
      turitop_connected_at: apiKey.trim() && result.status === 'ok' ? new Date().toISOString() : null,
    })
    .eq('id', providerId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/provider/settings')
  return { success: true, status: apiKey.trim() ? result.status : 'unverified', connectionError: result.error }
}

// =====================================================
// Per-provider calendar: reservations + the provider's own TuriTop availability
// =====================================================

export async function listTuriTopProductsAction(providerId?: string): Promise<{ success: boolean; products: TuriTopProduct[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, products: [], error: 'Not authenticated' }

    const { data: own } = await supabase.from('providers').select('id').eq('profile_id', user.id).maybeSingle()
    let targetId = own?.id as string | undefined
    if (providerId && providerId !== targetId) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') return { success: false, products: [], error: 'Forbidden' }
      targetId = providerId
    }
    if (!targetId) return { success: false, products: [], error: 'Provider not found' }

    const key = await getTuriTopKey(targetId)
    if (!key) return { success: true, products: [] }
    return { success: true, products: await listTuriTopProducts(key) }
  } catch (err) {
    return { success: false, products: [], error: (err as Error).message }
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export async function getProviderCalendarAction(from: string, to: string): Promise<{
  success: boolean
  events: CalendarEvent[]
  availability: CalendarAvailability[]
  turitopError?: string
  error?: string
}> {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return { success: false, events: [], availability: [], error: 'Invalid range' }
  }
  try {
    const { providerId } = await requireProviderAuth()
    const supabase = await createClient()

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, activity_date, activity_time, participants, status, activity:activities(title), customer:profiles!customer_id(full_name)')
      .eq('provider_id', providerId)
      .gte('activity_date', from)
      .lte('activity_date', to)
      .order('activity_date')
    if (error) return { success: false, events: [], availability: [], error: error.message }

    type Row = { id: string; activity_date: string; activity_time: string; participants: number; status: CalendarEvent['status']; activity: { title: string } | null; customer: { full_name: string } | null }
    const events: CalendarEvent[] = ((reservations ?? []) as unknown as Row[]).map((r) => ({
      id: r.id,
      date: r.activity_date,
      time: (r.activity_time ?? '').slice(0, 5),
      title: r.activity?.title ?? '—',
      subtitle: r.customer?.full_name ?? undefined,
      participants: r.participants,
      status: r.status,
    }))

    // This provider's own TuriTop connection (each provider has its own key).
    const availability: CalendarAvailability[] = []
    let turitopError: string | undefined
    const key = await getTuriTopKey(providerId)
    if (key) {
      try {
        const ttBookings = await getTuriTopBookings(key, from, to)
        for (const b of ttBookings) {
          const status: CalendarEvent['status'] =
            b.status === 'cancelled' || b.status === 'declined' ? 'cancelled'
            : b.status === 'refunded' ? 'cancelled'
            : b.status === 'not done' ? 'no_show'
            : b.status === 'paid' || b.status === 'confirmed' ? 'confirmed'
            : 'pending'
          events.push({
            id: `tt-${b.id}`,
            date: b.date,
            time: b.time,
            title: b.productName,
            subtitle: [b.customerName, 'TuriTop'].filter(Boolean).join(' · '),
            participants: b.participants,
            status,
          })
        }
      } catch (err) {
        turitopError = (err as Error).message
      }

      const { data: mapped } = await supabase
        .from('activities')
        .select('id, title, turitop_product_id')
        .eq('provider_id', providerId)
        .not('turitop_product_id', 'is', null)
        .neq('status', 'archived')
      if (mapped && mapped.length > 0) {
        try {
          const productIds = [...new Set(mapped.map((m) => m.turitop_product_id as string))]
          const days = await getTuriTopCalendar(key, productIds, from, to)
          for (const act of mapped) {
            for (const d of days) {
              if (d.productId !== act.turitop_product_id) continue
              availability.push({
                date: d.date,
                activityId: act.id as string,
                activityTitle: act.title as string,
                available: d.available,
                vacancies: d.available ? d.vacancies : 0,
              })
            }
          }
        } catch (err) {
          turitopError = (err as Error).message
        }
      }
    }

    return { success: true, events, availability, turitopError }
  } catch (err) {
    return { success: false, events: [], availability: [], error: (err as Error).message }
  }
}

// =====================================================
// Import the provider's TuriTop products as draft Exploria activities
// =====================================================

// Provider acts on their own record; an admin may pass any providerId.
async function resolveProviderTarget(providerId?: string): Promise<{ providerId: string; isAdmin: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (providerId) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') return { providerId, isAdmin: true }
  }
  const own = await requireProviderAuth()
  return { providerId: own.providerId, isAdmin: false }
}

export async function importTuriTopProductsAction(productIds: string[], forProviderId?: string): Promise<{
  success: boolean
  imported: number
  skipped: number
  error?: string
  upgradeRequired?: boolean
}> {
  try {
    const { providerId, isAdmin } = await resolveProviderTarget(forProviderId)
    if (!Array.isArray(productIds) || productIds.length === 0 || productIds.length > 50) {
      return { success: false, imported: 0, skipped: 0, error: 'Select between 1 and 50 products' }
    }
    if (!isAdmin && !(await isSubscriptionActive(providerId))) {
      return { success: false, imported: 0, skipped: 0, error: 'You need an active subscription to create activities.', upgradeRequired: true }
    }

    const key = await getTuriTopKey(providerId)
    if (!key) return { success: false, imported: 0, skipped: 0, error: 'TuriTop is not connected' }

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('activities')
      .select('turitop_product_id')
      .eq('provider_id', providerId)
      .not('turitop_product_id', 'is', null)
    const already = new Set((existing ?? []).map((a) => a.turitop_product_id as string))

    let imported = 0
    let skipped = 0
    for (const id of [...new Set(productIds)]) {
      if (!/^[A-Za-z0-9_-]{1,20}$/.test(id) || already.has(id)) { skipped++; continue }
      const d = await getTuriTopImportData(key, id)
      const slug = d.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const { error } = await supabase.from('activities').insert({
        provider_id: providerId,
        title: d.title,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: d.description,
        short_description: d.summary || null,
        price_from: d.priceFrom,
        duration_minutes: d.durationMinutes,
        max_participants: d.maxParticipants,
        min_participants: 1,
        languages: ['es'],
        meeting_point: d.city,
        city: d.city,
        country: 'ES',
        latitude: d.latitude,
        longitude: d.longitude,
        external_booking_platform: 'turitop',
        turitop_service_code: id,
        turitop_product_id: id,
        status: 'draft',
      })
      if (error) return { success: false, imported, skipped, error: error.message }
      imported++
    }

    revalidatePath('/dashboard/provider/activities')
    return { success: true, imported, skipped }
  } catch (err) {
    return { success: false, imported: 0, skipped: 0, error: (err as Error).message }
  }
}

export async function getTuriTopImportCandidatesAction(forProviderId?: string): Promise<{
  success: boolean
  items: { id: string; name: string; linked: boolean }[]
  error?: string
}> {
  try {
    const { providerId } = await resolveProviderTarget(forProviderId)
    const key = await getTuriTopKey(providerId)
    if (!key) return { success: false, items: [], error: 'TuriTop is not connected' }
    const supabase = await createClient()
    const [products, { data: existing }] = await Promise.all([
      listTuriTopProducts(key),
      supabase.from('activities').select('turitop_product_id').eq('provider_id', providerId).not('turitop_product_id', 'is', null),
    ])
    const linked = new Set((existing ?? []).map((a) => a.turitop_product_id as string))
    return { success: true, items: products.map((p) => ({ id: p.id, name: p.name, linked: linked.has(p.id) })) }
  } catch (err) {
    return { success: false, items: [], error: (err as Error).message }
  }
}
