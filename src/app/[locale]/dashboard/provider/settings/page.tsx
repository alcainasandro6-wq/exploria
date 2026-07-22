import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { ProviderCompanyForm } from '@/components/dashboard/provider/ProviderCompanyForm'

export default async function ProviderSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title="Mi empresa" subtitle="Información pública de tu empresa proveedora" />
      <ProviderCompanyForm provider={provider} />
    </DashboardLayout>
  )
}
