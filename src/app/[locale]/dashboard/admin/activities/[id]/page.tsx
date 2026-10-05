import { notFound, redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ActivityEditorForm } from '@/components/dashboard/provider/ActivityEditorForm'
import { getAdminActivityAction } from '@/app/actions/admin'
import { getCategories } from '@/lib/services/categories'
import { createClient } from '@/lib/supabase/server'
import type { ActivityDetail } from '@/lib/services/activities'

export default async function AdminActivityEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ success, activity }, categories] = await Promise.all([
    getAdminActivityAction(id),
    getCategories(),
  ])

  if (!success || !activity) notFound()

  return (
    <DashboardLayout role="admin">
      <ActivityEditorForm
        mode="admin"
        providerId={activity.provider_id}
        categories={categories}
        activity={activity as unknown as ActivityDetail}
        providerTuritopCode={(activity.provider as { turitop_company_code?: string | null } | null)?.turitop_company_code}
      />
    </DashboardLayout>
  )
}
