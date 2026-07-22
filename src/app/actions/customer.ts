'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { user, supabase }
}

export async function updateCustomerProfileAction(updates: { fullName?: string; phone?: string; locale?: string }) {
  try {
    const { user, supabase } = await requireAuth()
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.fullName !== undefined) payload.full_name = updates.fullName
    if (updates.phone !== undefined) payload.phone = updates.phone
    if (updates.locale !== undefined) payload.locale = updates.locale

    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/customer/settings')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function toggleFavoriteAction(activityId: string) {
  try {
    const { user, supabase } = await requireAuth()

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('customer_id', user.id)
      .eq('activity_id', activityId)
      .maybeSingle()

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      revalidatePath('/dashboard/customer/favorites')
      return { success: true, favorited: false }
    }

    const { error } = await supabase.from('favorites').insert({ customer_id: user.id, activity_id: activityId })
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/customer/favorites')
    return { success: true, favorited: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function submitReviewAction(input: {
  activityId: string
  reservationId: string
  rating: number
  title?: string
  comment?: string
}) {
  try {
    const { user, supabase } = await requireAuth()
    const { error } = await supabase.from('reviews').insert({
      activity_id: input.activityId,
      customer_id: user.id,
      reservation_id: input.reservationId,
      rating: input.rating,
      title: input.title ?? null,
      comment: input.comment ?? null,
    })
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/customer/reviews')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function sendMessageAction(input: { toId: string; subject: string; body: string; reservationId?: string }) {
  try {
    const { user, supabase } = await requireAuth()
    const { error } = await supabase.from('messages').insert({
      from_id: user.id,
      to_id: input.toId,
      reservation_id: input.reservationId ?? null,
      subject: input.subject,
      body: input.body,
    })
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/customer/messages')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function markMessageReadAction(messageId: string) {
  try {
    const { supabase } = await requireAuth()
    await supabase.from('messages').update({ is_read: true }).eq('id', messageId)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
