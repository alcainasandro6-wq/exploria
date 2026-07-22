import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import { CommissionRow } from '@/components/dashboard/admin/CommissionRow'
import type { Commission } from '@/types/database'

interface CommissionFull extends Commission {
  reservation: { confirmation_code: string; activity_date: string } | null
  provider: { company_name: string } | null
  hotel: { name: string } | null
}

export default async function AdminCommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data }, { data: payments }] = await Promise.all([
    supabase
      .from('commissions')
      .select('*, reservation:reservations(confirmation_code, activity_date), provider:providers(company_name), hotel:hotels(name)')
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.from('payments').select('*, provider:providers(company_name)').order('created_at', { ascending: false }).limit(100),
  ])
  const commissions = (data as unknown as CommissionFull[]) ?? []

  const pendingTotal = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.total_amount), 0)
  const paidTotal = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.total_amount), 0)
  const mrr = (payments ?? []).filter((p) => p.status === 'succeeded' || p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

  const exportData = commissions.map((c) => ({
    reserva: c.reservation?.confirmation_code ?? '',
    fecha: c.reservation?.activity_date ?? '',
    proveedor: c.provider?.company_name ?? '',
    hotel: c.hotel?.name ?? '',
    comision_plataforma: Number(c.platform_commission_amount),
    comision_hotel: Number(c.hotel_commission_amount),
    total: Number(c.total_amount),
    estado: c.status,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Comisiones y facturación"
        subtitle="Liquidaciones a proveedores y hoteles + facturas de suscripción"
        action={<ExportButtons data={exportData} filename="comisiones" title="Comisiones — BookActivities" />}
      />

      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard icon={DollarSign} label="Pendiente de liquidar" value={formatPrice(pendingTotal)} color="amber" />
        <StatCard icon={DollarSign} label="Liquidado" value={formatPrice(paidTotal)} color="emerald" />
        <StatCard icon={DollarSign} label="Ingresos por suscripciones" value={formatPrice(mrr)} color="blue" />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Comisiones por reserva</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Reserva</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Proveedor</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Hotel</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Total comisión</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => <CommissionRow key={c.id} commission={c} />)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Facturas de suscripción</CardTitle></CardHeader>
        <CardContent>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no hay facturas.</p>
          ) : (
            <div className="space-y-2">
              {(payments ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.provider?.company_name} — {p.description || 'Suscripción'}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.created_at)}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatPrice(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
