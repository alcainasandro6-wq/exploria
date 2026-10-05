import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Provider, ProviderActivityPerformance } from '@/types/database'

export async function getProviderByProfileId(profileId: string): Promise<Provider | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('providers').select('*').eq('profile_id', profileId).single()
  return data as Provider | null
}

// =====================================================
// Referral program
// =====================================================

// Generate a unique referral code based on the company name — mirrors
// generateAffiliateCode() in src/lib/services/hotels.ts for consistency.
export function generateReferralCode(companyName: string): string {
  const base = companyName
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'PROV'
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}${suffix}`
}

// Lazily generate + persist a referral code for providers created before
// this feature existed (or through a path that didn't set one yet).
export async function getOrCreateReferralCode(providerId: string): Promise<string> {
  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('providers')
    .select('referral_code, company_name')
    .eq('id', providerId)
    .single()

  if (provider?.referral_code) return provider.referral_code

  const code = generateReferralCode(provider?.company_name ?? 'PROV')
  const { error } = await supabase.from('providers').update({ referral_code: code }).eq('id', providerId)
  if (error) throw new Error(error.message)
  return code
}

export interface ProviderReferralStats {
  referral_code: string
  total_referred: number
  active_referred: number
}

// Uses the service-role client so the count reflects every referred provider
// (including ones not yet active), not just the ones visible under the
// "Anyone can view active providers" RLS policy.
export async function getProviderReferralStats(providerId: string): Promise<ProviderReferralStats> {
  const referralCode = await getOrCreateReferralCode(providerId)
  const admin = createAdminClient()

  const { count: total } = await admin
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by_provider_id', providerId)

  const { count: active } = await admin
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by_provider_id', providerId)
    .eq('is_active', true)

  return {
    referral_code: referralCode,
    total_referred: total ?? 0,
    active_referred: active ?? 0,
  }
}

export async function getProviderActivityPerformance(providerId: string): Promise<ProviderActivityPerformance[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_provider_activity_performance', { p_provider_id: providerId })
  if (error) throw new Error(error.message)
  return (data ?? []) as ProviderActivityPerformance[]
}

// Admin: all providers
export async function getAllProviders(): Promise<Provider[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*, profile:profiles!profile_id(email, full_name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Provider[]
}
