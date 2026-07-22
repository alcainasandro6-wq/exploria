import { createClient } from '@/lib/supabase/server'
import type { Provider, ProviderActivityPerformance } from '@/types/database'

export async function getProviderByProfileId(profileId: string): Promise<Provider | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('providers').select('*').eq('profile_id', profileId).single()
  return data as Provider | null
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
