import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getAllPacksAdmin } from '@/lib/services/packs'
import { getAllActivitiesAdmin } from '@/lib/services/admin'
import { PacksGrid } from '@/components/dashboard/admin/PacksGrid'

export default async function AdminPacksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_packs_page')

  const [packs, activities] = await Promise.all([
    getAllPacksAdmin(),
    getAllActivitiesAdmin(),
  ])

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />
      <PacksGrid packs={packs} activities={activities} />
    </DashboardLayout>
  )
}
