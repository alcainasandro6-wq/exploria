import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId, getProviderReferralStats } from '@/lib/services/providers'
import { ProviderCompanyForm } from '@/components/dashboard/provider/ProviderCompanyForm'
import { ProviderReferralPanel } from '@/components/dashboard/provider/ProviderReferralPanel'
import { TuriTopConnectionCard } from '@/components/dashboard/provider/TuriTopConnectionCard'

export default async function ProviderSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_settings_page')
  const referralStats = await getProviderReferralStats(provider.id)

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-6 xl:grid-cols-2 items-start">
        <ProviderCompanyForm provider={provider} />
        <div className="space-y-6">
          <TuriTopConnectionCard provider={provider} />
          <ProviderReferralPanel stats={referralStats} />
        </div>
      </div>
    </DashboardLayout>
  )
}
