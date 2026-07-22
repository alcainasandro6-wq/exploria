import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { formatPrice, formatDate } from '@/lib/utils'
import { DollarSign, Receipt } from 'lucide-react'
import type { Commission } from '@/types/database'

interface CommissionWithReservation extends Commission {
  reservation: { confirmation_code: string; activity_date: string } | null
}

export default async function ProviderCommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const [commissionsResult, { data: payments }] = await Promise.all([
    supabase
      .from('commissions')
      .select('*, reservation:reservations(confirmation_code, activity_date)')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false }),
  ])
  const commissions = commissionsResult.data as unknown as CommissionWithReservation[] | null

  const pending = (commissions ?? []).filter((c) => c.status === 'pending')
  const paid = (commissions ?? []).filter((c) => c.status === 'paid')
  const pendingTotal = pending.reduce((s, c) => s + Number(c.platform_commission_amount), 0)
  const paidTotal = paid.reduce((s, c) => s + Number(c.platform_commission_amount), 0)

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title="Comisiones y facturación" subtitle="Comisión de plataforma por reserva confirmada + facturas de tu suscripción" />

      <div className="grid grid-cols-2 gap-5 mb-6">
        <StatCard icon={DollarSign} label="Pendiente de liquidar" value={formatPrice(pendingTotal)} color="amber" />
        <StatCard icon={DollarSign} label="Liquidado" value={formatPrice(paidTotal)} color="emerald" />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Comisiones por reserva</CardTitle></CardHeader>
        <CardContent>
          {(commissions ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no hay comisiones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Reserva</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Fecha actividad</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Comisión plataforma</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(commissions ?? []).map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700">{c.reservation?.confirmation_code}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.reservation?.activity_date ? formatDate(c.reservation.activity_date) : '—'}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{formatPrice(Number(c.platform_commission_amount))}</td>
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

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-4 h-4" />Facturas de suscripción</CardTitle></CardHeader>
        <CardContent>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no hay facturas.</p>
          ) : (
            <div className="space-y-2">
              {(payments ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.description || 'Suscripción'}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">{formatPrice(Number(p.amount))}</span>
                    <Badge variant={p.status === 'succeeded' || p.status === 'paid' ? 'success' : 'secondary'}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
