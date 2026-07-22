import { createClient } from '@/lib/supabase/server'
import { buildTrackingUrl } from './attribution'
import type {
  Hotel,
  HotelDashboardStats,
  HotelTopActivity,
  ProviderAttributionStats,
  AffiliateLink,
} from '@/types/database'

// =====================================================
// Hotel Service
// =====================================================

export async function getHotelByProfileId(profileId: string): Promise<Hotel | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('profile_id', profileId)
    .single()
  return data as Hotel | null
}

export async function getHotelByAffiliateCode(code: string): Promise<Hotel | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('affiliate_code', code)
    .eq('is_active', true)
    .single()
  return data as Hotel | null
}

// Generate a unique affiliate code based on hotel name
export function generateAffiliateCode(hotelName: string): string {
  const base = hotelName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}${suffix}`
}

// Ensure tracking_url is populated
export async function ensureTrackingUrl(hotelId: string, affiliateCode: string): Promise<string> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'
  const trackingUrl = buildTrackingUrl(affiliateCode, siteUrl)

  await supabase
    .from('hotels')
    .update({ tracking_url: trackingUrl })
    .eq('id', hotelId)

  return trackingUrl
}

// Create affiliate link record (separate from hotels.affiliate_code for per-campaign tracking)
export async function createAffiliateLink(hotelId: string, label?: string): Promise<AffiliateLink> {
  const supabase = await createClient()
  const hotel = await supabase.from('hotels').select('affiliate_code').eq('id', hotelId).single()
  if (!hotel.data) throw new Error('Hotel not found')

  const code = `${hotel.data.affiliate_code}-${Date.now().toString(36).toUpperCase()}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'
  const url = buildTrackingUrl(code, siteUrl)

  const { data, error } = await supabase
    .from('affiliate_links')
    .insert({ hotel_id: hotelId, code, url })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as AffiliateLink
}

// Track a QR click (called from server action when ?ref= is detected)
export async function trackAffiliateClick(affiliateCode: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('track_affiliate_click', { p_code: affiliateCode })
}

// =====================================================
// Dashboard analytics
// =====================================================

export async function getHotelDashboardStats(hotelId: string): Promise<HotelDashboardStats> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('get_hotel_dashboard_stats', { p_hotel_id: hotelId })

  if (error) throw new Error(error.message)
  const row = (data as HotelDashboardStats[])[0]
  return row ?? {
    total_reservations: 0,
    confirmed_reservations: 0,
    pending_reservations: 0,
    completed_reservations: 0,
    total_participants: 0,
    estimated_commission: 0,
    qr_conversions: 0,
    web_conversions: 0,
  }
}

export async function getHotelTopActivities(
  hotelId: string,
  limit = 5
): Promise<HotelTopActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('get_hotel_top_activities', { p_hotel_id: hotelId, p_limit: limit })

  if (error) throw new Error(error.message)
  return (data ?? []) as HotelTopActivity[]
}

export async function getProviderAttributionStats(
  providerId: string
): Promise<ProviderAttributionStats[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('get_provider_attribution_stats', { p_provider_id: providerId })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProviderAttributionStats[]
}

// All hotels (admin)
export async function getAllHotels(): Promise<Hotel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hotels')
    .select('*, profile:profiles!profile_id(email, full_name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Hotel[]
}
