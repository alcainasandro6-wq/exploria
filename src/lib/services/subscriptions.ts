import { createClient } from '@/lib/supabase/server'
import type { ProviderSubscription, SubscriptionPlanRecord, SubscriptionStatus } from '@/types/database'

// =====================================================
// Subscription Service
// =====================================================

export interface SubscriptionWithPlan extends ProviderSubscription {
  plan: SubscriptionPlanRecord
  provider?: { id: string; company_name: string; slug: string; profile_id: string }
}

export async function getProviderSubscription(
  providerId: string
): Promise<SubscriptionWithPlan | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('provider_subscriptions')
    .select(`*, plan:subscription_plans(*)`)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as SubscriptionWithPlan
}

export async function isSubscriptionActive(providerId: string): Promise<boolean> {
  const sub = await getProviderSubscription(providerId)
  if (!sub) return false
  return (
    (sub.status === 'active' || sub.status === 'trialing') &&
    new Date(sub.current_period_end) > new Date()
  )
}

export interface SubscriptionUsage {
  currentActivities: number
  maxActivities: number
  canPublishMore: boolean
  daysUntilRenewal: number
  isActive: boolean
  plan: string | null
  status: SubscriptionStatus | null
}

export async function getSubscriptionUsage(providerId: string): Promise<SubscriptionUsage> {
  const supabase = await createClient()

  const [subResult, activityCountResult] = await Promise.all([
    getProviderSubscription(providerId),
    supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('status', 'published'),
  ])

  const currentActivities = activityCountResult.count ?? 0
  const maxActivities = subResult?.plan?.max_activities ?? 0
  const isActive =
    subResult != null &&
    (subResult.status === 'active' || subResult.status === 'trialing') &&
    new Date(subResult.current_period_end) > new Date()

  const daysUntilRenewal = subResult
    ? Math.ceil((new Date(subResult.current_period_end).getTime() - Date.now()) / 86_400_000)
    : 0

  return {
    currentActivities,
    maxActivities,
    canPublishMore: isActive && (maxActivities === -1 || currentActivities < maxActivities),
    daysUntilRenewal,
    isActive,
    plan: subResult?.plan?.name ?? null,
    status: subResult?.status ?? null,
  }
}

export async function getAllSubscriptionPlans(): Promise<SubscriptionPlanRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SubscriptionPlanRecord[]
}

// Admin: all active subscriptions
export async function getAllActiveSubscriptions(): Promise<SubscriptionWithPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('provider_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*),
      provider:providers(id, company_name, slug, profile_id)
    `)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SubscriptionWithPlan[]
}
