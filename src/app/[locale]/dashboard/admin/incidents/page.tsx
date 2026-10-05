import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getAllIncidents } from '@/lib/services/admin'
import { IncidentsList } from '@/components/dashboard/admin/IncidentsList'

export default async function AdminIncidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_incidents_page')

  const incidents = await getAllIncidents()

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle', { count: incidents.length })} />

      <Card>
        <CardHeader><CardTitle>{t('all_incidents_title')}</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-4">
          <IncidentsList incidents={incidents} />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
