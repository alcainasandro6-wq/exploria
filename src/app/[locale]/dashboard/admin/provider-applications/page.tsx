import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getAllProviderApplications } from '@/lib/services/admin'
import { ProviderApplicationRow } from '@/components/dashboard/admin/ProviderApplicationRow'

export default async function AdminProviderApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_provider_applications_page')
  const applications = await getAllProviderApplications()

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle', { count: applications.length })} />

      {applications.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">{t('empty_state')}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {applications.map((a) => <ProviderApplicationRow key={a.id} application={a} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
