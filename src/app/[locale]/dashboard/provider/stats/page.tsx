import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId, getProviderActivityPerformance } from '@/lib/services/providers'
import { getProviderAttributionStats } from '@/lib/services/hotels'
import { ProviderStatsCharts } from '@/components/dashboard/provider/ProviderStatsCharts'

export default async function ProviderStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_stats_page')

  const [performance, attribution] = await Promise.all([
    getProviderActivityPerformance(provider.id),
    getProviderAttributionStats(provider.id),
  ])

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      {performance.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">{t('empty_state')}</CardContent></Card>
      ) : (
        <ProviderStatsCharts performance={performance} attribution={attribution} />
      )}
    </DashboardLayout>
  )
}
