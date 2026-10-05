import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { getProviderReservations } from '@/lib/services/reservations'
import { ActivityCalendar } from '@/components/booking/ActivityCalendar'
import { reservationsToEvents } from '@/lib/calendar-utils'
import { ProviderBookingRow } from '@/components/dashboard/provider/ProviderBookingRow'

export default async function ProviderBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_bookings_page')

  const bookings = await getProviderReservations(provider.id)

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title={t('title')} subtitle={t('subtitle', { count: bookings.length })} />

      <ActivityCalendar className="mb-6" events={reservationsToEvents(bookings, (r) => r.customer?.full_name ?? undefined)} />

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
