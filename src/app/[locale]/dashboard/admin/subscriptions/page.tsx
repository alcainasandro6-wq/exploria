import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getAllActiveSubscriptions } from '@/lib/services/subscriptions'
import { formatPrice, formatDate } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  active: 'success', trialing: 'success', suspended: 'warning', expired: 'destructive', cancelled: 'secondary',
}

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const subscriptions = await getAllActiveSubscriptions()
  const mrr = subscriptions.reduce((s, sub) => s + (sub.plan?.price_monthly ?? 0), 0)

  const exportData = subscriptions.map((s) => ({
    proveedor: s.provider?.company_name ?? '',
    plan: s.plan?.display_name ?? '',
    ciclo: s.billing_cycle,
    precio_mensual: s.plan?.price_monthly ?? 0,
    estado: s.status,
    renueva: s.current_period_end,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Suscripciones"
        subtitle={`${subscriptions.length} suscripciones activas · MRR ${formatPrice(mrr)}`}
        action={<ExportButtons data={exportData} filename="suscripciones" title="Suscripciones — BookActivities" />}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Proveedor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ciclo</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Precio</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Renueva</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{s.provider?.company_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{s.plan?.display_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 capitalize">{s.billing_cycle}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">{formatPrice(s.plan?.price_monthly ?? 0)}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{formatDate(s.current_period_end)}</td>
                    <td className="py-3 px-4"><Badge variant={STATUS_STYLES[s.status]}>{s.status}</Badge></td>
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
