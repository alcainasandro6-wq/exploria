import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getCustomerReservations } from '@/lib/services/reservations'
import { ActivityCalendar } from '@/components/booking/ActivityCalendar'
import { reservationsToEvents } from '@/lib/calendar-utils'
import { BookingRow } from '@/components/dashboard/customer/BookingRow'

export default async function CustomerBookingsPage() {
  const t = await getTranslations('customer_bookings_page')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const bookings = await getCustomerReservations(user.id)

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title={t('title')} subtitle={t('subtitle', { count: bookings.length })} />

      <ActivityCalendar className="mb-6" events={reservationsToEvents(bookings, (r) => r.activity?.provider?.company_name ?? undefined)} />

      {bookings.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">{t('empty_state')}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
