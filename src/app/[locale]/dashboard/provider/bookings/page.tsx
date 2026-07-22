import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { getProviderReservations } from '@/lib/services/reservations'
import { ProviderBookingRow } from '@/components/dashboard/provider/ProviderBookingRow'

export default async function ProviderBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const bookings = await getProviderReservations(provider.id)

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title="Reservas" subtitle={`${bookings.length} reservas en total`} />

      {bookings.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">Todavía no has recibido reservas.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => <ProviderBookingRow key={booking.id} booking={booking} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
