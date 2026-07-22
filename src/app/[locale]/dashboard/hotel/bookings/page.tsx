import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { getHotelReservations } from '@/lib/services/reservations'
import { formatPrice, formatDate } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendiente', completed: 'Completado',
  cancelled: 'Cancelado', rejected: 'Rechazado', no_show: 'No presentado',
}
const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success', pending: 'warning', completed: 'secondary',
  cancelled: 'destructive', rejected: 'destructive', no_show: 'destructive',
}

export default async function HotelBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const bookings = await getHotelReservations(hotel.id)

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title="Reservas atribuidas" subtitle={`${bookings.length} reservas generadas a través de tu QR o enlace`} />

      <Card>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Todavía no hay reservas atribuidas a tu hotel.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actividad</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Importe</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{b.customer?.full_name || 'Cliente'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{b.activity?.title}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatDate(b.activity_date)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900">{formatPrice(b.total_price)}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_STYLES[b.status]}>{STATUS_LABELS[b.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
