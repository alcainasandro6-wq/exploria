import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { AdminCalendar } from '@/components/dashboard/admin/AdminCalendar'
import { SyncTuriTopButton } from '@/components/dashboard/SyncTuriTopButton'
import { createClient } from '@/lib/supabase/server'

export default async function AdminCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_calendar_page')

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} action={<SyncTuriTopButton admin />} />
      <AdminCalendar />
    </DashboardLayout>
  )
}
