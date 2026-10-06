import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { getProviderReservations } from '@/lib/services/reservations'
import { SyncTuriTopButton } from '@/components/dashboard/SyncTuriTopButton'
import { syncTuriTopBookings } from '@/lib/services/turitop-import'
import { ProviderBookingRow } from '@/components/dashboard/provider/ProviderBookingRow'

export const maxDuration = 120

export default async function ProviderBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_bookings_page')

  if (provider.turitop_has_key) await syncTuriTopBookings(provider.id)
  const bookings = await getProviderReservations(provider.id)

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title={t('title')} subtitle={t('subtitle', { count: bookings.length })} action={provider.turitop_has_key ? <SyncTuriTopButton /> : undefined} />

      {bookings.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">{t('empty_state')}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => <ProviderBookingRow key={booking.id} booking={booking} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
