import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getAllProviders } from '@/lib/services/providers'
import { getAllSubscriptionPlans, getAllActiveSubscriptions } from '@/lib/services/subscriptions'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import { ProvidersGrid } from '@/components/dashboard/admin/ProvidersGrid'

export default async function AdminProvidersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_providers_page')

  const [providers, plans, activeSubscriptions] = await Promise.all([
    getAllProviders(),
    getAllSubscriptionPlans(),
    getAllActiveSubscriptions(),
  ])
  const subscriptionByProvider = Object.fromEntries(activeSubscriptions.map((s) => [s.provider_id, s]))

  const exportData = providers.map((p) => ({
    empresa: p.company_name,
    ciudad: p.city,
    telefono: p.phone,
    email: p.profile?.email ?? '',
    cif: p.tax_id ?? '',
    comision: `${(p.commission_rate * 100).toFixed(0)}%`,
    verificado: p.is_verified ? 'Sí' : 'No',
    activo: p.is_active ? 'Sí' : 'No',
    alta: p.created_at,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title={t('title')}
        subtitle={t('subtitle', { count: providers.length })}
        action={<ExportButtons data={exportData} filename="proveedores" title={`${t('export_title')} — BookActivities`} />}
      />

      <ProvidersGrid providers={providers} plans={plans} subscriptionByProvider={subscriptionByProvider} />
    </DashboardLayout>
  )
}
