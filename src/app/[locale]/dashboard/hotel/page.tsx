import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Calendar, DollarSign, TrendingUp, Users, QrCode, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId, getHotelDashboardStats, getHotelTopActivities } from '@/lib/services/hotels'
import { CopyableCode } from '@/components/dashboard/hotel/CopyableCode'

export default async function HotelDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const [stats, topActivities] = await Promise.all([
    getHotelDashboardStats(hotel.id),
    getHotelTopActivities(hotel.id, 5),
  ])

  const trackingUrl = hotel.tracking_url ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'}/en/activities?ref=${hotel.affiliate_code}&source=qr`

  const statTiles = [
    { icon: Calendar, label: 'Reservas pendientes', value: stats.pending_reservations, color: 'blue' as const },
    { icon: DollarSign, label: 'Comisión estimada', value: formatPrice(stats.estimated_commission), color: 'emerald' as const },
    { icon: TrendingUp, label: 'Total reservas', value: stats.total_reservations, color: 'purple' as const },
    { icon: Users, label: 'Participantes atendidos', value: stats.total_participants, color: 'amber' as const },
  ]

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title="Panel del Hotel" subtitle={`${hotel.name} — ${hotel.city}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statTiles.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" />Mi código QR exclusivo</CardTitle>
            <CardDescription>Coloca este QR en recepción para que tus huéspedes accedan a las actividades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/hotel/qr" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
              Ver y descargar mi QR
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ExternalLink className="w-5 h-5 text-primary" />Enlace de afiliado</CardTitle>
            <CardDescription>Comparte este enlace y todas las reservas generadas se atribuirán a tu hotel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Tu código de afiliado</p>
              <CopyableCode value={hotel.affiliate_code} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">URL de afiliado</p>
              <CopyableCode value={trackingUrl} truncate />
            </div>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">Tu comisión: {(hotel.commission_rate * 100).toFixed(0)}% por reserva</p>
              <p className="text-xs text-slate-500">Las reservas generadas a través de tu enlace o QR se registran automáticamente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Actividades más reservadas por tus huéspedes</CardTitle></CardHeader>
        <CardContent>
          {topActivities.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no hay reservas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actividad</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Reservas</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Participantes</th>
                  </tr>
                </thead>
                <tbody>
                  {topActivities.map((a) => (
                    <tr key={a.activity_id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{a.activity_title}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{a.total_bookings}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{a.total_participants}</td>
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
