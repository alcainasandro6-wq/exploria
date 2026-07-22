import { createClient } from '@/lib/supabase/server'
import type { Coupon, Favorite, Message, Profile, Provider, Review } from '@/types/database'

export async function getCustomerProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data as Profile | null
}

export async function getCustomerFavorites(customerId: string): Promise<Favorite[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('*, activity:activities(*, images:activity_images(*), category:categories(*), provider:providers(company_name, is_verified))')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as unknown as Favorite[]
}

export async function getCustomerReviews(customerId: string): Promise<Review[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*, activity:activities(title, slug, images:activity_images(url, is_cover))')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as unknown as Review[]
}

export interface ReviewableBooking {
  id: string
  activity_id: string
  activity_date: string
  confirmation_code: string
  activity: { title: string; slug: string } | null
}

// Completed bookings that don't have a review yet
export async function getReviewableBookings(customerId: string): Promise<ReviewableBooking[]> {
  const supabase = await createClient()
  const { data: completed, error } = await supabase
    .from('reservations')
    .select('id, activity_id, activity_date, confirmation_code, activity:activities(title, slug)')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
  if (error || !completed) return []
  const completedRows = completed as unknown as ReviewableBooking[]

  const { data: reviewed } = await supabase
    .from('reviews')
    .select('reservation_id')
    .eq('customer_id', customerId)

  const reviewedIds = new Set((reviewed ?? []).map((r) => r.reservation_id))
  return completedRows.filter((r) => !reviewedIds.has(r.id))
}

export async function getCustomerMessages(userId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`from_id.eq.${userId},to_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Message[]
}

// Coupons visible to this customer: public/global + personally assigned (RLS-scoped)
export async function getCustomerCoupons(): Promise<Coupon[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Coupon[]
}

export async function getProvidersDirectory(): Promise<Provider[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('is_active', true)
    .order('company_name', { ascending: true })
  if (error) return []
  return data as Provider[]
}
