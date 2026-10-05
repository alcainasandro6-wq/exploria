import { createClient } from '@/lib/supabase/server'
import type {
  Activity, ActivityImage, ActivityStatus, Coupon, Incident, PlatformStats,
  AdminFinancialStats, AdminTopActivity, AdminTopDestination, ProviderApplication,
} from '@/types/database'

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

export interface IncidentWithReservation extends Omit<Incident, 'reservation'> {
  reservation: {
    confirmation_code: string
    activity_date: string
    activity: { title: string } | null
    customer: { full_name: string | null; email: string } | null
    provider: { company_name: string } | null
  } | null
}

export async function getAllIncidents(): Promise<IncidentWithReservation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      reservation:reservations(
        confirmation_code, activity_date,
        activity:activities(title),
        customer:profiles!customer_id(full_name, email),
        provider:providers(company_name)
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as IncidentWithReservation[]
}

// =====================================================
// Provider applications ("Hazte proveedor" lead capture)
// =====================================================

export async function getAllProviderApplications(): Promise<ProviderApplication[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('provider_applications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ProviderApplication[]
}

// =====================================================
// Financial stats (021_admin_financial_stats.sql)
// =====================================================

export interface AdminFinancialStatsFilters {
  from?: string
  to?: string
  city?: string
  providerId?: string
}

const EMPTY_FINANCIAL_STATS: AdminFinancialStats = {
  sales_today: 0, sales_this_month: 0, avg_ticket: 0, platform_commission_earned: 0,
  pending_to_providers: 0, pending_to_hotels: 0, cancellations_count: 0, refunds_count: 0,
}

export async function getAdminFinancialStats(filters?: AdminFinancialStatsFilters): Promise<AdminFinancialStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_financial_stats', {
    p_from: filters?.from ?? null,
    p_to: filters?.to ?? null,
    p_city: filters?.city ?? null,
    p_provider_id: filters?.providerId ?? null,
  })
  if (error) throw new Error(error.message)
  const row = (data as AdminFinancialStats[])[0]
  return row ?? EMPTY_FINANCIAL_STATS
}

export async function getAdminTopActivities(filters?: { from?: string; to?: string; city?: string; limit?: number }): Promise<AdminTopActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_top_activities', {
    p_from: filters?.from ?? null,
    p_to: filters?.to ?? null,
    p_city: filters?.city ?? null,
    p_limit: filters?.limit ?? 10,
  })
  if (error) throw new Error(error.message)
  return (data as AdminTopActivity[]) ?? []
}

export async function getAdminTopDestinations(filters?: { from?: string; to?: string; limit?: number }): Promise<AdminTopDestination[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_top_destinations', {
    p_from: filters?.from ?? null,
    p_to: filters?.to ?? null,
    p_limit: filters?.limit ?? 10,
  })
  if (error) throw new Error(error.message)
  return (data as AdminTopDestination[]) ?? []
}

// =====================================================
// Settlements ("Liquidaciones del mes") — grouped by provider and by
// hotel, pending commission totals. There is no cron/scheduler in this
// project (see AdminMarkCommissionsPaidAction comment in
// src/app/actions/admin.ts), so "is this commission liquidable" is
// computed here at read time from the linked reservation instead of
// trusting commissions.status to already say 'liquidable'.
// =====================================================

export interface SettlementCommission {
  id: string
  reservation_id: string
  provider_id: string
  hotel_id: string | null
  hotel_commission_amount: number
  platform_commission_amount: number
  total_amount: number
  status: string
  created_at: string
  provider_payout: number // reservation.total_price - commissions.total_amount
  is_liquidable: boolean  // computed at read time, see module comment above
  reservation: {
    confirmation_code: string
    activity_date: string
    activity_time: string
    total_price: number
    status: string
    completed_at: string | null
  } | null
}

export interface SettlementGroup {
  id: string
  name: string
  commissions: SettlementCommission[]
  totalHotelCommission: number
  totalProviderPayout: number
  liquidableCount: number
}

export interface AdminSettlements {
  providers: SettlementGroup[]
  hotels: SettlementGroup[]
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export async function getAdminSettlements(): Promise<AdminSettlements> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commissions')
    .select(`
      id, reservation_id, provider_id, hotel_id,
      hotel_commission_amount, platform_commission_amount, total_amount,
      status, held_for_incident_id, created_at,
      reservation:reservations(confirmation_code, activity_date, activity_time, total_price, status, completed_at),
      provider:providers(company_name),
      hotel:hotels(name)
    `)
    .in('status', ['pending', 'liquidable'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  type Row = {
    id: string; reservation_id: string; provider_id: string; hotel_id: string | null
    hotel_commission_amount: number; platform_commission_amount: number; total_amount: number
    status: string; held_for_incident_id: string | null; created_at: string
    reservation: { confirmation_code: string; activity_date: string; activity_time: string; total_price: number; status: string; completed_at: string | null } | null
    provider: { company_name: string } | null
    hotel: { name: string } | null
  }
  const rows = ((data ?? []) as unknown as Row[])

  const now = Date.now()
  const enriched: { commission: SettlementCommission; providerName: string; hotelName: string | null }[] = rows.map((r) => {
    const completedLongEnoughAgo =
      r.reservation?.status === 'completed' &&
      !!r.reservation.completed_at &&
      now - new Date(r.reservation.completed_at).getTime() > TWENTY_FOUR_HOURS_MS
    const isLiquidable = completedLongEnoughAgo && !r.held_for_incident_id

    const commission: SettlementCommission = {
      id: r.id,
      reservation_id: r.reservation_id,
      provider_id: r.provider_id,
      hotel_id: r.hotel_id,
      hotel_commission_amount: Number(r.hotel_commission_amount),
      platform_commission_amount: Number(r.platform_commission_amount),
      total_amount: Number(r.total_amount),
      status: r.status,
      created_at: r.created_at,
      provider_payout: Number(r.reservation?.total_price ?? 0) - Number(r.total_amount),
      is_liquidable: isLiquidable,
      reservation: r.reservation,
    }
    return { commission, providerName: r.provider?.company_name ?? '—', hotelName: r.hotel?.name ?? null }
  })

  function groupBy(key: 'provider_id' | 'hotel_id', nameField: 'providerName' | 'hotelName'): SettlementGroup[] {
    const groups = new Map<string, SettlementGroup>()
    for (const { commission, providerName, hotelName } of enriched) {
      const groupId = commission[key]
      if (!groupId) continue
      const name = (nameField === 'providerName' ? providerName : hotelName) ?? '—'
      if (!groups.has(groupId)) {
        groups.set(groupId, { id: groupId, name, commissions: [], totalHotelCommission: 0, totalProviderPayout: 0, liquidableCount: 0 })
      }
      const g = groups.get(groupId)!
      g.commissions.push(commission)
      g.totalHotelCommission += commission.hotel_commission_amount
      g.totalProviderPayout += commission.provider_payout
      if (commission.is_liquidable) g.liquidableCount += 1
    }
    return Array.from(groups.values()).sort((a, b) => b.totalProviderPayout - a.totalProviderPayout)
  }

  return {
    providers: groupBy('provider_id', 'providerName'),
    hotels: groupBy('hotel_id', 'hotelName'),
  }
}
