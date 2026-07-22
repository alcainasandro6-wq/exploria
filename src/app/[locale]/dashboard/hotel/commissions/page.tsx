import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Commission } from '@/types/database'

interface CommissionWithReservation extends Commission {
  reservation: { confirmation_code: string; activity_date: string } | null
}

export default async function HotelCommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const { data } = await supabase
    .from('commissions')
    .select('*, reservation:reservations(confirmation_code, activity_date)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
  const commissions = (data as unknown as CommissionWithReservation[]) ?? []

  const pendingTotal = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.hotel_commission_amount), 0)
  const paidTotal = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.hotel_commission_amount), 0)

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title="Comisiones y facturación" subtitle="Comisión de afiliación por cada reserva confirmada a través de tu hotel" />

      <div className="grid grid-cols-2 gap-5 mb-6">
        <StatCard icon={DollarSign} label="Pendiente de liquidar" value={formatPrice(pendingTotal)} color="amber" />
        <StatCard icon={DollarSign} label="Liquidado" value={formatPrice(paidTotal)} color="emerald" />
      </div>

      <Card>
        <CardHeader><CardTitle>Historial de comisiones</CardTitle></CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no hay comisiones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Reserva</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Fecha actividad</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Tu comisión</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700">{c.reservation?.confirmation_code}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.reservation?.activity_date ? formatDate(c.reservation.activity_date) : '—'}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{formatPrice(Number(c.hotel_commission_amount))}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={c.status === 'paid' ? 'success' : c.status === 'pending' ? 'warning' : 'secondary'}>
                          {c.status === 'paid' ? 'Liquidada' : c.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                        </Badge>
                      </td>
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
