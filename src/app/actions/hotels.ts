'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  getHotelByProfileId,
  generateAffiliateCode,
  ensureTrackingUrl,
  trackAffiliateClick,
  getHotelDashboardStats,
  getHotelTopActivities,
  createAffiliateLink,
} from '@/lib/services/hotels'
import type { Hotel, HotelDashboardStats, HotelTopActivity } from '@/types/database'

// =====================================================
// Auth helper
// =====================================================

async function requireHotelAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) throw new Error('Hotel account not found')
  if (!hotel.is_active) throw new Error('Hotel account is inactive')

  return { user, hotel }
}

// =====================================================
// QR / tracking
// =====================================================

// Returns the hotel's QR tracking URL (creates if missing)
export async function getOrCreateTrackingUrlAction(): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { hotel } = await requireHotelAuth()
    const url = hotel.tracking_url ?? (await ensureTrackingUrl(hotel.id, hotel.affiliate_code))
    return { success: true, url }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Generate a new campaign affiliate link (for targeted campaigns)
export async function generateCampaignLinkAction(): Promise<{ success: boolean; url?: string; code?: string; error?: string }> {
  try {
    const { hotel } = await requireHotelAuth()
    const link = await createAffiliateLink(hotel.id)
    return { success: true, url: link.url, code: link.code }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Attribution tracking (called from middleware / layout)
// =====================================================

// Increment click count when a user arrives via hotel QR / link
export async function trackReferralClickAction(
  code: string,
  _source: string    // kept for future analytics
): Promise<void> {
  try {
    await trackAffiliateClick(code)
  } catch {
    // Non-critical — never throw
  }
}

// =====================================================
// Dashboard
// =====================================================

export async function getHotelDashboardAction(): Promise<{
  success: boolean
  hotel?: Hotel
  stats?: HotelDashboardStats
  topActivities?: HotelTopActivity[]
  error?: string
}> {
  try {
    const { hotel } = await requireHotelAuth()
    const [stats, topActivities] = await Promise.all([
      getHotelDashboardStats(hotel.id),
      getHotelTopActivities(hotel.id, 5),
    ])
    return { success: true, hotel, stats, topActivities }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// =====================================================
// Hotel profile management
// =====================================================

export async function updateHotelProfileAction(updates: {
  name?: string
  description?: string
  website?: string
  phone?: string
  stars?: number
}) {
  try {
    const { hotel } = await requireHotelAuth()
    const supabase = await createClient()

    const { error } = await supabase
      .from('hotels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', hotel.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/hotel')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Admin: create hotel account
export async function adminCreateHotelAction(input: {
  profileId: string
  name: string
  address: string
  city: string
  country?: string
  phone: string
  stars?: number
  taxId?: string
  commissionRate?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { success: false, error: 'Admin access required' }

  const affiliateCode = generateAffiliateCode(input.name)
  const slug = input.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { data, error } = await supabase
    .from('hotels')
    .insert({
      profile_id:       input.profileId,
      name:             input.name,
      slug:             `${slug}-${Date.now().toString(36)}`,
      address:          input.address,
      city:             input.city,
      country:          input.country ?? 'ES',
      phone:            input.phone,
      stars:            input.stars ?? null,
      tax_id:           input.taxId ?? null,
      commission_rate:  input.commissionRate ?? 0.05,
      affiliate_code:   affiliateCode,
      is_active:        true,
    })
    .select('id, affiliate_code')
    .single()

  if (error) return { success: false, error: error.message }

  // Ensure tracking URL is set right away
  if (data) await ensureTrackingUrl(data.id, data.affiliate_code)

  revalidatePath('/dashboard/admin/hotels')
  return { success: true, hotel: data }
}
