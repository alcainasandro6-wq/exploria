import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getAllReservations } from '@/lib/services/reservations'
import { SyncTuriTopButton } from '@/components/dashboard/SyncTuriTopButton'
import { syncAllTuriTopProviders } from '@/lib/services/turitop-import'
import { ReservationsTable, type ReservationRow } from '@/components/dashboard/admin/ReservationsTable'

export const maxDuration = 120

export default async function AdminReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_reservations_page')

  // Pull in anything new from the providers' TuriTop accounts (throttled to once / 5 min).
  await syncAllTuriTopProviders()
  const reservations = await getAllReservations({ limit: 5000 })

  const rows: ReservationRow[] = reservations.map((r) => ({
    id: r.id,
    code: r.confirmation_code,
    customer: r.customer?.full_name ?? r.external_customer_name ?? '',
    email: r.customer?.email ?? r.external_customer_email ?? '',
    activity: r.activity?.title ?? '',
    provider: r.provider?.company_name ?? '',
    hotel: r.hotel?.name ?? '',
    date: r.activity_date,
    time: (r.activity_time ?? '').slice(0, 5),
    participants: r.participants,
    amount: Number(r.total_price),
    status: r.status,
    origin: r.external_source ? 'turitop' : 'exploria',
    channel: r.external_channel ?? '',
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title={t('title')}
        subtitle={t('subtitle', { count: reservations.length })}
        action={<SyncTuriTopButton admin />}
      />
      <ReservationsTable rows={rows} />
    </DashboardLayout>
  )
}
