import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getCustomerReservations } from '@/lib/services/reservations'
import { BookingRow } from '@/components/dashboard/customer/BookingRow'

export default async function CustomerBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const bookings = await getCustomerReservations(user.id)

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Mis reservas" subtitle={`${bookings.length} reservas en total`} />

      {bookings.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">Todavía no tienes reservas.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
