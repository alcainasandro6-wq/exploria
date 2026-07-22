import { createClient } from '@/lib/supabase/server'
import type {
  Reservation,
  ReservationStatus,
  ReservationSource,
} from '@/types/database'

// =====================================================
// Types
// =====================================================

export interface CreateReservationInput {
  activityId: string
  providerId: string
  activityDate: string          // ISO date "2025-08-01"
  activityTime: string          // "HH:MM"
  participants: number
  notes?: string
  affiliateCode?: string
  source?: ReservationSource
  totalPrice: number
}

export interface ReservationFilters {
  status?: ReservationStatus | ReservationStatus[]
  dateFrom?: string
  dateTo?: string
  hotelId?: string
  affiliateCode?: string
  source?: ReservationSource
  limit?: number
  offset?: number
}

// =====================================================
// State machine guard (client-side validation mirror)
// =====================================================

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending:   ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled', 'completed', 'no_show'],
  rejected:  [],
  cancelled: [],
  completed: [],
  no_show:   [],
}

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function isTerminal(status: ReservationStatus): boolean {
  return ['rejected', 'cancelled', 'completed', 'no_show'].includes(status)
}

// =====================================================
// Service functions
// =====================================================

export async function createReservation(
  input: CreateReservationInput,
  customerId: string
): Promise<Reservation> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      activity_id:      input.activityId,
      provider_id:      input.providerId,
      customer_id:      customerId,
      activity_date:    input.activityDate,
      activity_time:    input.activityTime,
      booking_date:     new Date().toISOString().split('T')[0],
      participants:     input.participants,
      total_price:      input.totalPrice,
      notes:            input.notes ?? null,
      affiliate_code:   input.affiliateCode ?? null,
      source:           input.source ?? 'web',
      status:           'pending',
      // hotel_id resolved automatically by DB trigger via affiliate_code
    })
    .select(`
      *,
      activity:activities(id, title, slug, price_from, duration_minutes, meeting_point,
        provider:providers(id, company_name, slug, phone),
        images:activity_images(url, is_cover)
      ),
      hotel:hotels(id, name, affiliate_code)
    `)
    .single()

  if (error) throw new Error(`Failed to create reservation: ${error.message}`)
  return data as Reservation
}

// Delegate transition to DB function (authoritative state machine)
export async function transitionReservation(
  reservationId: string,
  newStatus: ReservationStatus,
  notes?: string
): Promise<Reservation> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('transition_reservation', {
      p_reservation_id: reservationId,
      p_new_status:     newStatus,
      p_notes:          notes ?? null,
    })

  if (error) throw new Error(`Transition failed: ${error.message}`)
  return data as Reservation
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      activity:activities(id, title, slug, price_from, duration_minutes, meeting_point,
        images:activity_images(url, is_cover)
      ),
      hotel:hotels(id, name, affiliate_code),
      customer:profiles!customer_id(id, full_name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as Reservation
}

// Customer: their own reservations
export async function getCustomerReservations(
  customerId: string,
  filters: ReservationFilters = {}
): Promise<Reservation[]> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select(`
      *,
      activity:activities(id, title, slug, price_from, duration_minutes,
        images:activity_images(url, is_cover),
        provider:providers(company_name, phone)
      ),
      hotel:hotels(id, name)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (filters.status) {
    Array.isArray(filters.status)
      ? query = query.in('status', filters.status)
      : query = query.eq('status', filters.status)
  }
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Reservation[]
}

// Provider: reservations for their activities
export async function getProviderReservations(
  providerId: string,
  filters: ReservationFilters = {}
): Promise<Reservation[]> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select(`
      *,
      activity:activities(id, title, slug),
      hotel:hotels(id, name, affiliate_code),
      customer:profiles!customer_id(id, full_name, email, phone)
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })

  if (filters.status) {
    Array.isArray(filters.status)
      ? query = query.in('status', filters.status)
      : query = query.eq('status', filters.status)
  }
  if (filters.dateFrom) query = query.gte('activity_date', filters.dateFrom)
  if (filters.dateTo)   query = query.lte('activity_date', filters.dateTo)
  if (filters.hotelId)  query = query.eq('hotel_id', filters.hotelId)
  if (filters.limit)    query = query.limit(filters.limit)
  if (filters.offset)   query = query.range(filters.offset, (filters.offset + (filters.limit ?? 20)) - 1)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Reservation[]
}

// Hotel: reservations attributed to them
export async function getHotelReservations(
  hotelId: string,
  filters: ReservationFilters = {}
): Promise<Reservation[]> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select(`
      *,
      activity:activities(id, title, slug, price_from),
      customer:profiles!customer_id(id, full_name)
    `)
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })

  if (filters.status) {
    Array.isArray(filters.status)
      ? query = query.in('status', filters.status)
      : query = query.eq('status', filters.status)
  }
  if (filters.source)   query = query.eq('source', filters.source)
  if (filters.dateFrom) query = query.gte('activity_date', filters.dateFrom)
  if (filters.dateTo)   query = query.lte('activity_date', filters.dateTo)
  if (filters.limit)    query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Reservation[]
}

// Admin: all reservations
export async function getAllReservations(
  filters: ReservationFilters = {}
): Promise<Reservation[]> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select(`
      *,
      activity:activities(id, title, slug),
      hotel:hotels(id, name),
      customer:profiles!customer_id(id, full_name, email),
      provider:providers!provider_id(id, company_name)
    `)
    .order('created_at', { ascending: false })

  if (filters.status) {
    Array.isArray(filters.status)
      ? query = query.in('status', filters.status)
      : query = query.eq('status', filters.status)
  }
  if (filters.limit)  query = query.limit(filters.limit)
  if (filters.offset) query = query.range(filters.offset, (filters.offset + (filters.limit ?? 50)) - 1)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Reservation[]
}

// Reservation count badge for provider dashboard
export async function getPendingReservationCount(providerId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .eq('status', 'pending')
  if (error) return 0
  return count ?? 0
}
