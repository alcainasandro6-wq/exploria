import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ActivityEditorForm } from '@/components/dashboard/provider/ActivityEditorForm'
import { getCategories } from '@/lib/services/categories'
import { getAllProviders } from '@/lib/services/providers'
import { createClient } from '@/lib/supabase/server'

export default async function NewAdminActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [categories, providers] = await Promise.all([
    getCategories(),
    getAllProviders(),
  ])

  return (
    <DashboardLayout role="admin">
      <ActivityEditorForm
        mode="admin"
        providerId=""
        categories={categories}
        activity={null}
        providers={providers}
      />
    </DashboardLayout>
  )
}
