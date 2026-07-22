import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Building2, TrendingUp, Clock, CheckCircle2, DollarSign, Send } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getPlatformStats, getPendingReviewActivities } from '@/lib/services/admin'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [stats, pendingActivities] = await Promise.all([
    getPlatformStats(),
    getPendingReviewActivities(),
  ])

  const tiles = [
    { icon: Calendar, label: 'Reservas totales', value: stats.total_reservations, color: 'blue' as const },
    { icon: Clock, label: 'Pendientes de confirmar', value: stats.pending_count, color: 'amber' as const },
    { icon: CheckCircle2, label: 'Completadas', value: stats.completed_count, color: 'emerald' as const },
    { icon: Building2, label: 'Proveedores activos', value: stats.active_providers, color: 'purple' as const },
    { icon: Building2, label: 'Hoteles activos', value: stats.active_hotels, color: 'indigo' as const },
    { icon: TrendingUp, label: 'Reservas vía hotel', value: stats.hotel_attributed, color: 'cyan' as const },
    { icon: Users, label: 'Reservas directas', value: stats.direct_bookings, color: 'rose' as const },
    { icon: DollarSign, label: 'MRR suscripciones', value: formatPrice(stats.mrr_eur), color: 'green' as const },
  ]

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Resumen de la plataforma" subtitle="Vista global de BookActivities" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {tiles.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Send className="w-4 h-4 text-primary" />Servicios pendientes de aprobación</CardTitle>
            <Link href="/dashboard/admin/activities?status=pending_review" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Ver todos
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingActivities.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No hay solicitudes pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pendingActivities.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.provider?.company_name}</p>
                  </div>
                  <Badge variant="warning">En revisión</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
