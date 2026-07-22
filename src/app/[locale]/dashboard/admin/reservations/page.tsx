import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getAllReservations } from '@/lib/services/reservations'
import { formatPrice, formatDate } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendiente', completed: 'Completado',
  cancelled: 'Cancelado', rejected: 'Rechazado', no_show: 'No presentado',
}
const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success', pending: 'warning', completed: 'secondary',
  cancelled: 'destructive', rejected: 'destructive', no_show: 'destructive',
}

export default async function AdminReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const reservations = await getAllReservations({ limit: 200 })

  const exportData = reservations.map((r) => ({
    codigo: r.confirmation_code,
    cliente: r.customer?.full_name ?? '',
    proveedor: r.provider?.company_name ?? '',
    hotel: r.hotel?.name ?? '',
    actividad: r.activity?.title ?? '',
    fecha_actividad: r.activity_date,
    participantes: r.participants,
    importe: r.total_price,
    estado: STATUS_LABELS[r.status],
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Reservas"
        subtitle={`${reservations.length} reservas en toda la plataforma`}
        action={<ExportButtons data={exportData} filename="reservas" title="Reservas — BookActivities" />}
      />

      <Card>
        <CardHeader><CardTitle>Todas las reservas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Código</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Proveedor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Importe</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs font-mono text-slate-700">{r.confirmation_code}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{r.customer?.full_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{r.provider?.company_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{formatDate(r.activity_date)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">{formatPrice(r.total_price)}</td>
                    <td className="py-3 px-4"><Badge variant={STATUS_STYLES[r.status]}>{STATUS_LABELS[r.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
