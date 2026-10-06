'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateReferralCode } from '@/lib/services/providers'
import { testTuriTopConnection, saveTuriTopKey } from '@/lib/services/turitop'
import { syncTuriTopBookings, syncAllTuriTopProviders } from '@/lib/services/turitop-import'
import type { CalendarEvent } from '@/lib/calendar-types'
import { translateActivityFields } from '@/lib/services/translate'
import { LOCALES } from '@/lib/constants'
import type { CouponDiscountType, ActivityStatus, UserRole, ProviderTier, IncidentStatus, ProviderApplicationStatus } from '@/types/database'
import type { CreateActivityInput } from '@/app/actions/providers'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')

  return { user, supabase }
}

// =====================================================
// User management (auth.users + profiles), full CRUD
// =====================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface AdminCreateUserInput {
  email: string
  password: string
  fullName: string
  phone?: string
  role: UserRole
  /** Referral program: the referral_code of the provider who referred this
   *  new provider (e.g. collected from their ?ref= application). Ignored
   *  unless role === 'provider'. */
  referralCode?: string
}

export async function adminCreateUserAction(input: AdminCreateUserInput) {
  try {
    await requireAdmin()
    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
      app_metadata: { role: input.role },
    })
    if (error) return { success: false, error: error.message }

    const userId = data.user.id

    if (input.phone) {
      await admin.from('profiles').update({ phone: input.phone }).eq('id', userId)
    }

    // Provider/hotel accounts need a companion row for their dashboard to
    // work at all — created here with sane defaults, same as a real signup;
    // the admin/provider can fill in the rest from their settings page.
    if (input.role === 'provider') {
      const slug = `${slugify(input.fullName)}-${Date.now().toString(36)}`

      let referredByProviderId: string | null = null
      if (input.referralCode?.trim()) {
        const { data: referrer } = await admin
          .from('providers')
          .select('id')
          .eq('referral_code', input.referralCode.trim().toUpperCase())
          .maybeSingle()
        referredByProviderId = referrer?.id ?? null
      }

      await admin.from('providers').insert({
        profile_id: userId,
        company_name: input.fullName,
        slug,
        phone: input.phone ?? '',
        city: 'Torrevieja',
        country: 'España',
        referral_code: generateReferralCode(input.fullName),
        referred_by_provider_id: referredByProviderId,
      })
    } else if (input.role === 'hotel') {
      const base = slugify(input.fullName)
      const suffix = Date.now().toString(36)
      await admin.from('hotels').insert({
        profile_id: userId,
        name: input.fullName,
        slug: `${base}-${suffix}`,
        affiliate_code: `${base.toUpperCase()}-${suffix}`,
        phone: input.phone ?? '',
      })
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true, userId }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export interface AdminUpdateUserInput {
  email?: string
  password?: string
  fullName?: string
  phone?: string
  role?: UserRole
}

export async function adminUpdateUserAction(userId: string, updates: AdminUpdateUserInput) {
  try {
    await requireAdmin()
    const admin = createAdminClient()

    if (updates.email !== undefined) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email: updates.email })
      if (error) return { success: false, error: error.message }
    }

    if (updates.password) {
      if (updates.password.length < 8) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { password: updates.password })
      if (error) return { success: false, error: error.message }
    }

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.email !== undefined) payload.email = updates.email
    if (updates.fullName !== undefined) payload.full_name = updates.fullName
    if (updates.phone !== undefined) payload.phone = updates.phone
    if (updates.role !== undefined) payload.role = updates.role

    const { error } = await admin.from('profiles').update(payload).eq('id', userId)
    if (error) return { success: false, error: error.message }

    // If the role just changed to provider/hotel and there's no companion
    // row yet, create one with defaults — mirrors adminCreateUserAction.
    // Changing AWAY from provider/hotel intentionally leaves any existing
    // row untouched (deleting it would cascade-delete real activities/data).
    if (updates.role === 'provider') {
      const { data: existing } = await admin.from('providers').select('id').eq('profile_id', userId).maybeSingle()
      if (!existing) {
        const { data: profile } = await admin.from('profiles').select('full_name, phone').eq('id', userId).single()
        const name = profile?.full_name || 'Nuevo proveedor'
        const slug = `${slugify(name)}-${Date.now().toString(36)}`
        await admin.from('providers').insert({
          profile_id: userId, company_name: name, slug,
          phone: profile?.phone ?? '', city: 'Torrevieja', country: 'España',
          referral_code: generateReferralCode(name),
        })
      }
    } else if (updates.role === 'hotel') {
      const { data: existing } = await admin.from('hotels').select('id').eq('profile_id', userId).maybeSingle()
      if (!existing) {
        const { data: profile } = await admin.from('profiles').select('full_name, phone').eq('id', userId).single()
        const name = profile?.full_name || 'Nuevo hotel'
        const base = slugify(name)
        const suffix = Date.now().toString(36)
        await admin.from('hotels').insert({
          profile_id: userId, name, slug: `${base}-${suffix}`,
          affiliate_code: `${base.toUpperCase()}-${suffix}`, phone: profile?.phone ?? '',
        })
      }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminDeleteUserAction(userId: string) {
  try {
    const { user } = await requireAdmin()
    if (user.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta de administrador.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Service approval queue
// =====================================================

export async function reviewActivitySubmissionAction(activityId: string, approve: boolean, feedback?: string) {
  try {
    const { supabase } = await requireAdmin()
    const { data, error } = await supabase.rpc('review_activity_submission', {
      p_activity_id: activityId,
      p_approve: approve,
      p_feedback: feedback ?? null,
    })
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/activities')
    revalidatePath('/')
    revalidatePath('/activities')
    return { success: true, activity: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Admin activity editor — full CRUD, no subscription/approval
// detour (unlike the provider actions in src/app/actions/providers.ts,
// these are scoped by requireAdmin() only, with no ownership check
// and no draft/pending_review status restriction).
// =====================================================

export async function getAdminActivityAction(activityId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { data, error } = await supabase
      .from('activities')
      .select('*, images:activity_images(*), category:categories(*), provider:providers(id, company_name, turitop_company_code)')
      .eq('id', activityId)
      .single()

    if (error || !data) return { success: false, error: 'Activity not found', activity: null }
    return { success: true, activity: data }
  } catch (err) {
    return { success: false, error: (err as Error).message, activity: null }
  }
}

export async function adminCreateActivityAction(providerId: string, input: CreateActivityInput) {
  try {
    const { supabase } = await requireAdmin()

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
        requirements:               input.requirements ?? [],
        google_maps_url:            input.googleMapsUrl ?? null,
        video_url:                  input.videoUrl ?? null,
        faqs:                       input.faqs ?? [],
        extra_info:                 input.extraInfo ?? [],
        booking_widget_embed_code:  input.bookingWidgetEmbedCode ?? null,
        external_booking_platform:  input.externalBookingPlatform ?? null,
        turitop_service_code:       input.turitopServiceCode ?? null,
        turitop_product_id:         input.turitopProductId ?? null,
        // Unlike providers, admin can land directly on 'published' —
        // enforce_subscription_on_activity() skips the subscription
        // check entirely when the caller is an admin (see migration 014).
        status:                     input.publishImmediately ? 'published' : 'draft',
      })
      .select('id, slug, status')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/activities')
    revalidatePath('/')
    revalidatePath('/activities')
    return { success: true, activity: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminUpdateActivityAction(activityId: string, updates: Partial<CreateActivityInput>) {
  try {
    const { supabase } = await requireAdmin()

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

    const { error } = await supabase.from('activities').update(payload).eq('id', activityId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/activities')
    revalidatePath('/')
    revalidatePath('/activities')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminUpdateActivityStatusAction(activityId: string, newStatus: ActivityStatus) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('activities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', activityId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/activities')
    revalidatePath('/')
    revalidatePath('/activities')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminAddActivityImageAction(
  activityId: string,
  url: string,
  opts?: { alt?: string; isCover?: boolean }
) {
  try {
    const { supabase } = await requireAdmin()

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
    revalidatePath(`/dashboard/admin/activities/${activityId}`)
    return { success: true, image: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminSetActivityCoverImageAction(imageId: string, activityId: string) {
  try {
    const { supabase } = await requireAdmin()
    await supabase.from('activity_images').update({ is_cover: false }).eq('activity_id', activityId)
    const { error } = await supabase.from('activity_images').update({ is_cover: true }).eq('id', imageId)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/dashboard/admin/activities/${activityId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminRemoveActivityImageAction(imageId: string, activityId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('activity_images').delete().eq('id', imageId)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/dashboard/admin/activities/${activityId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminDeleteActivityAction(activityId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('activities').delete().eq('id', activityId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/activities')
    revalidatePath('/')
    revalidatePath('/activities')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Subscriptions — admin can gift any plan to a provider for free
// (e.g. a complimentary Premium for a business contact), bypassing
// Stripe entirely. Uses the service-role client since providers only
// have SELECT access to their own row under RLS.
// =====================================================

export async function adminGrantSubscriptionAction(providerId: string, planId: string) {
  try {
    await requireAdmin()
    const admin = createAdminClient()

    const periodEnd = new Date()
    periodEnd.setFullYear(periodEnd.getFullYear() + 100)

    const { error } = await admin.from('provider_subscriptions').insert({
      provider_id: providerId,
      plan_id: planId,
      status: 'active',
      billing_cycle: 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/providers')
    revalidatePath('/dashboard/admin/subscriptions')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminRevokeSubscriptionAction(subscriptionId: string) {
  try {
    await requireAdmin()
    const admin = createAdminClient()

    const { error } = await admin
      .from('provider_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', subscriptionId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/providers')
    revalidatePath('/dashboard/admin/subscriptions')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Provider profile — tier, commission rate, verification, internal notes.
// Uses the plain requireAdmin() client (not the service-role client) since
// providers already has `FOR ALL USING (is_admin())` under RLS.
// =====================================================

export interface AdminUpdateProviderInput {
  commissionRate?: number
  tier?: ProviderTier
  internalNotes?: string
  isVerified?: boolean
}

export async function adminUpdateProviderAction(providerId: string, updates: AdminUpdateProviderInput) {
  try {
    const { supabase } = await requireAdmin()

    if (updates.commissionRate !== undefined && (updates.commissionRate < 0 || updates.commissionRate > 1)) {
      return { success: false, error: 'La comisión debe estar entre 0 y 1 (0% - 100%)' }
    }

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.commissionRate !== undefined) payload.commission_rate = updates.commissionRate
    if (updates.tier !== undefined)           payload.tier            = updates.tier
    if (updates.internalNotes !== undefined)  payload.internal_notes  = updates.internalNotes
    if (updates.isVerified !== undefined)     payload.is_verified     = updates.isVerified

    const { error } = await supabase.from('providers').update(payload).eq('id', providerId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/providers')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Admin can connect/fix a provider's TuriTop API key on their behalf (e.g.
// when the provider calls in for help) — same test-and-save logic as the
// provider's own self-service action in app/actions/providers.ts.
export async function adminUpdateProviderTuriTopAction(providerId: string, apiKey: string) {
  try {
    const { supabase } = await requireAdmin()
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

    if (apiKey.trim() && result.status === 'ok') await syncTuriTopBookings(providerId, { force: true })

    revalidatePath('/dashboard/admin/providers')
    revalidatePath('/dashboard/admin/reservations')
    return { success: true, status: apiKey.trim() ? result.status : 'unverified', connectionError: result.error }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Incidents — admin triage of reservation problems. Setting an incident to
// 'open'/'investigating' holds the linked commission out of payouts by
// setting held_for_incident_id + status='held'; resolving/dismissing it
// releases the commission back to 'liquidable' (if the reservation is
// already completed + 24h past) or 'pending' otherwise.
// =====================================================

export interface AdminUpdateIncidentInput {
  status?: IncidentStatus
  resolution?: string
  refundAmount?: number | null
}

export async function adminUpdateIncidentAction(incidentId: string, updates: AdminUpdateIncidentInput) {
  try {
    const { supabase } = await requireAdmin()

    const { data: incident, error: fetchError } = await supabase
      .from('incidents')
      .select('id, reservation_id, status')
      .eq('id', incidentId)
      .single()
    if (fetchError || !incident) return { success: false, error: 'Incidencia no encontrada' }

    const payload: Record<string, unknown> = {}
    if (updates.resolution !== undefined) payload.resolution = updates.resolution
    if (updates.refundAmount !== undefined) payload.refund_amount = updates.refundAmount

    const nextStatus = updates.status ?? incident.status
    if (updates.status !== undefined) {
      payload.status = updates.status
      if (updates.status === 'resolved' || updates.status === 'dismissed') {
        payload.resolved_at = new Date().toISOString()
      }
    }

    const { error } = await supabase.from('incidents').update(payload).eq('id', incidentId)
    if (error) return { success: false, error: error.message }

    // Keep the linked commission's hold in sync with the incident status.
    const { data: reservation } = await supabase
      .from('reservations')
      .select('status, completed_at')
      .eq('id', incident.reservation_id)
      .single()

    if (nextStatus === 'open' || nextStatus === 'investigating') {
      await supabase
        .from('commissions')
        .update({ status: 'held', held_for_incident_id: incidentId })
        .eq('reservation_id', incident.reservation_id)
    } else {
      const completedLongEnoughAgo =
        reservation?.status === 'completed' &&
        !!reservation.completed_at &&
        Date.now() - new Date(reservation.completed_at).getTime() > 24 * 60 * 60 * 1000

      await supabase
        .from('commissions')
        .update({
          status: completedLongEnoughAgo ? 'liquidable' : 'pending',
          held_for_incident_id: null,
        })
        .eq('reservation_id', incident.reservation_id)
    }

    revalidatePath('/dashboard/admin/incidents')
    revalidatePath('/dashboard/admin/commissions')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Commissions / billing
// =====================================================

export async function markCommissionPaidAction(commissionId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', commissionId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/commissions')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Batch version used by the "Liquidaciones del mes" settlements page —
// marks a whole batch (one provider's or one hotel's pending commissions)
// as paid in one action. NOTE: there is no cron/scheduler in this project,
// so commissions.status never transitions to 'liquidable' automatically —
// the settlements page (src/lib/services/admin.ts#getAdminSettlements)
// computes "is this commission liquidable" at read time instead. A real
// automatic 24h-later transition needs Vercel Cron or a Supabase scheduled
// function; that's a deployment-config task, not something this action
// (or any application code) can provide on its own.
export async function adminMarkCommissionsPaidAction(commissionIds: string[]) {
  try {
    const { supabase } = await requireAdmin()
    if (commissionIds.length === 0) return { success: false, error: 'No hay comisiones seleccionadas' }

    const { error } = await supabase
      .from('commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .in('id', commissionIds)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/commissions')
    revalidatePath('/dashboard/admin/settlements')
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Coupons / promotions
// =====================================================

export async function createCouponAction(input: {
  code: string
  description?: string
  discountType: CouponDiscountType
  value: number
  customerId?: string
  validUntil?: string
  usageLimit?: number
}) {
  try {
    const { user, supabase } = await requireAdmin()
    const { error } = await supabase.from('coupons').insert({
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      discount_type: input.discountType,
      value: input.value,
      customer_id: input.customerId ?? null,
      valid_until: input.validUntil ?? null,
      usage_limit: input.usageLimit ?? null,
      created_by: user.id,
    })
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/coupons')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function toggleCouponActiveAction(couponId: string, isActive: boolean) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', couponId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/admin/coupons')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteCouponAction(couponId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('coupons').delete().eq('id', couponId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/admin/coupons')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Packs (homepage "Mejores Packs" — bundles of real activities)
// =====================================================

export interface AdminPackInput {
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  badge?: string | null
  sortOrder?: number
  isActive?: boolean
}

export async function adminCreatePackAction(input: AdminPackInput) {
  try {
    const { supabase } = await requireAdmin()
    const slug = `${slugify(input.title)}-${Date.now().toString(36)}`

    const { data, error } = await supabase
      .from('packs')
      .insert({
        slug,
        title: input.title,
        subtitle: input.subtitle ?? null,
        image_url: input.imageUrl ?? null,
        badge: input.badge ?? null,
        sort_order: input.sortOrder ?? 0,
        is_active: input.isActive ?? true,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/packs')
    revalidatePath('/')
    return { success: true, packId: data.id as string }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminUpdatePackAction(packId: string, updates: Partial<AdminPackInput>) {
  try {
    const { supabase } = await requireAdmin()

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined)     payload.title      = updates.title
    if (updates.subtitle !== undefined)  payload.subtitle   = updates.subtitle
    if (updates.imageUrl !== undefined)  payload.image_url  = updates.imageUrl
    if (updates.badge !== undefined)     payload.badge      = updates.badge
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder
    if (updates.isActive !== undefined)  payload.is_active  = updates.isActive

    const { error } = await supabase.from('packs').update(payload).eq('id', packId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/packs')
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminDeletePackAction(packId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('packs').delete().eq('id', packId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/packs')
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Replaces the full set of activities linked to a pack (delete-then-insert),
// preserving the caller's array order as sort_order.
export async function adminSetPackActivitiesAction(packId: string, activityIds: string[]) {
  try {
    const { supabase } = await requireAdmin()

    const { error: deleteError } = await supabase.from('pack_activities').delete().eq('pack_id', packId)
    if (deleteError) return { success: false, error: deleteError.message }

    if (activityIds.length > 0) {
      const rows = activityIds.map((activityId, index) => ({ pack_id: packId, activity_id: activityId, sort_order: index }))
      const { error: insertError } = await supabase.from('pack_activities').insert(rows)
      if (insertError) return { success: false, error: insertError.message }
    }

    revalidatePath('/dashboard/admin/packs')
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Translations (DeepL)
// =====================================================

export async function translateActivityAction(activityId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('title, short_description, description, translations')
      .eq('id', activityId)
      .single()
    if (fetchError || !activity) return { success: false, error: 'Activity not found' }

    const targets = LOCALES.filter((l) => l !== 'es')
    const translations = { ...(activity.translations as Record<string, unknown>) }

    for (const locale of targets) {
      const result = await translateActivityFields(
        { title: activity.title, short_description: activity.short_description, description: activity.description },
        locale
      )
      if (!result.success) return { success: false, error: `${locale}: ${result.error}` }
      translations[locale] = {
        title: result.title,
        short_description: result.short_description,
        description: result.description,
      }
    }

    const { error } = await supabase.from('activities').update({ translations }).eq('id', activityId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/activities')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Provider applications ("Hazte proveedor" lead capture)
// =====================================================

export async function adminUpdateProviderApplicationAction(
  applicationId: string,
  updates: { status?: ProviderApplicationStatus; adminNotes?: string }
) {
  try {
    const { supabase } = await requireAdmin()
    const payload: Record<string, unknown> = {}
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.adminNotes !== undefined) payload.admin_notes = updates.adminNotes

    const { error } = await supabase.from('provider_applications').update(payload).eq('id', applicationId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/provider-applications')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Global calendar: every provider's Exploria reservations + TuriTop bookings
// =====================================================

export async function getAdminCalendarAction(from: string, to: string): Promise<{
  success: boolean
  events: CalendarEvent[]
  error?: string
}> {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return { success: false, events: [], error: 'Invalid range' }
    }
    const { supabase } = await requireAdmin()
    await syncAllTuriTopProviders()

    const { data: rows, error } = await supabase
      .from('reservations')
      .select('id, activity_date, activity_time, participants, status, external_customer_name, activity:activities(title), customer:profiles!customer_id(full_name), provider:providers(company_name)')
      .gte('activity_date', from)
      .lte('activity_date', to)
      .order('activity_date')
      .limit(1000)
    if (error) return { success: false, events: [], error: error.message }

    type Row = { id: string; activity_date: string; activity_time: string; participants: number; status: CalendarEvent['status']; external_customer_name: string | null; activity: { title: string } | null; customer: { full_name: string } | null; provider: { company_name: string } | null }
    const events: CalendarEvent[] = ((rows ?? []) as unknown as Row[]).map((r) => ({
      id: r.id,
      date: r.activity_date,
      time: (r.activity_time ?? '').slice(0, 5),
      title: r.activity?.title ?? '—',
      subtitle: [r.provider?.company_name, r.customer?.full_name ?? r.external_customer_name].filter(Boolean).join(' · ') || undefined,
      participants: r.participants,
      status: r.status,
    }))

    return { success: true, events }
  } catch (err) {
    return { success: false, events: [], error: (err as Error).message }
  }
}

export async function syncAllTuriTopNowAction(): Promise<{ success: boolean; imported: number; updated: number; cancelled: number; connected?: number; error?: string }> {
  try {
    await requireAdmin()
    const r = await syncAllTuriTopProviders({ force: true })
    revalidatePath('/dashboard/admin/reservations')
    revalidatePath('/dashboard/admin/calendar')
    return { success: r.ok, imported: r.imported, updated: r.updated, cancelled: r.cancelled, connected: r.connected, error: r.error }
  } catch (err) {
    return { success: false, imported: 0, updated: 0, cancelled: 0, error: (err as Error).message }
  }
}
