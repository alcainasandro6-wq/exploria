import { createClient } from '@/lib/supabase/server'
import type { Activity, ActivityImage, ActivityStatus, Coupon, PlatformStats } from '@/types/database'

interface PendingActivity extends Omit<Activity, 'provider' | 'images'> {
  provider: { company_name: string } | null
  images: ActivityImage[]
}

export interface ActivitySummary {
  id: string
  title: string
  slug: string
  status: ActivityStatus
  price_from: number
  booking_count: number
  rating: number
  created_at: string
  provider: { company_name: string } | null
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_platform_stats')
  if (error) throw new Error(error.message)
  const row = (data as PlatformStats[])[0]
  return row ?? {
    total_reservations: 0, pending_count: 0, confirmed_count: 0, completed_count: 0,
    active_providers: 0, active_hotels: 0, hotel_attributed: 0, direct_bookings: 0, mrr_eur: 0,
  }
}

export async function getAllUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export interface CouponWithCustomer extends Coupon {
  customer: { full_name: string | null; email: string } | null
}

export async function getAllCoupons(): Promise<CouponWithCustomer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*, customer:profiles!customer_id(full_name, email)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as CouponWithCustomer[]
}

export async function getPendingReviewActivities(): Promise<PendingActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, provider:providers(company_name), images:activity_images(url, is_cover)')
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PendingActivity[]
}

export async function getAllActivitiesAdmin(): Promise<ActivitySummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('id, title, slug, status, price_from, booking_count, rating, created_at, provider:providers(company_name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ActivitySummary[]
}
