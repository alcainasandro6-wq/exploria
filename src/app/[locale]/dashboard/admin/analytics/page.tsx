import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { AdminAnalyticsCharts } from '@/components/dashboard/admin/AdminAnalyticsCharts'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const since = sixMonthsAgo.toISOString()

  const [{ data: reservations }, { data: profiles }, { data: providerRows }] = await Promise.all([
    supabase.from('reservations').select('created_at, total_price, status').gte('created_at', since),
    supabase.from('profiles').select('created_at, role').gte('created_at', since),
    supabase.from('activities').select('booking_count, provider:providers(company_name)').order('booking_count', { ascending: false }).limit(8),
  ])

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Analíticas" subtitle="Actividad de clientes, proveedores y hoteles en los últimos 6 meses" />

      <AdminAnalyticsCharts
        reservations={reservations ?? []}
        profiles={profiles ?? []}
        topActivities={(providerRows ?? []) as unknown as { booking_count: number; provider: { company_name: string } | null }[]}
      />
    </DashboardLayout>
  )
}
