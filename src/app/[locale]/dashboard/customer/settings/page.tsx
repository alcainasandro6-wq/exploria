import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { CustomerSettingsForm } from '@/components/dashboard/customer/CustomerSettingsForm'

export default async function CustomerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Mi cuenta" subtitle="Gestiona tu información de contacto" />
      <CustomerSettingsForm profile={profile} />
    </DashboardLayout>
  )
}
