import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ProviderCalendar } from '@/components/dashboard/provider/ProviderCalendar'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'

export default async function ProviderCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_calendar_page')

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />
      <ProviderCalendar />
    </DashboardLayout>
  )
}
