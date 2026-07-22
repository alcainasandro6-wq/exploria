'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { translateActivityFields } from '@/lib/services/translate'
import { LOCALES } from '@/lib/constants'
import type { CouponDiscountType } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')

  return { user, supabase }
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
    return { success: true, activity: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function adminCreateActivityForProviderAction(providerId: string, title: string) {
  try {
    const { supabase } = await requireAdmin()
    const slug = title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const { data, error } = await supabase
      .from('activities')
      .insert({
        provider_id: providerId,
        title,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: '',
        price_from: 0,
        duration_minutes: 60,
        meeting_point: '',
        cancellation_policy: 'Cancelación gratuita hasta 24 horas antes de la actividad.',
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/admin/activities')
    return { success: true, activityId: data.id }
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
