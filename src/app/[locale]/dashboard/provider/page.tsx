import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import { Package, Calendar, DollarSign, Eye, Star, PlusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatPrice, cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId, getProviderActivityPerformance } from '@/lib/services/providers'
import { getProviderSubscription } from '@/lib/services/subscriptions'
import { getProviderReservations } from '@/lib/services/reservations'
import { PendingBookingRow } from '@/components/dashboard/provider/PendingBookingRow'

export default async function ProviderDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const [subscription, performance, pendingBookings, revenueResult] = await Promise.all([
    getProviderSubscription(provider.id),
    getProviderActivityPerformance(provider.id),
    getProviderReservations(provider.id, { status: 'pending', limit: 5 }),
    supabase.from('reservations').select('total_price').eq('provider_id', provider.id).in('status', ['confirmed', 'completed']),
  ])

  const totalBookingsThisPeriod = performance.reduce((sum, a) => sum + a.total_bookings, 0)
  const estimatedRevenue = (revenueResult.data ?? []).reduce((sum, r) => sum + r.total_price, 0)
  const avgRating = performance.length
    ? (performance.reduce((sum, a) => sum + (a.avg_rating ?? 0), 0) / performance.length).toFixed(1)
    : '—'
  const publishedCount = performance.length

  const stats = [
    { icon: Package, label: 'Actividades activas', value: publishedCount, color: 'blue' as const },
    { icon: Calendar, label: 'Reservas totales', value: totalBookingsThisPeriod, color: 'purple' as const },
    { icon: DollarSign, label: 'Ingresos estimados', value: formatPrice(estimatedRevenue), color: 'emerald' as const },
    { icon: Star, label: 'Valoración media', value: avgRating, color: 'amber' as const },
  ]

  return (
    <DashboardLayout role="provider">
      <DashboardHeader
        title="Panel de Proveedor"
        subtitle={provider.company_name}
        action={
          <Link href="/dashboard/provider/activities/new" className={cn(buttonVariants({ variant: 'white' }), 'gap-1.5')}>
            <PlusCircle className="w-4 h-4" />
            Nueva actividad
          </Link>
        }
      />

      {subscription && (
        <SubscriptionBanner
          subscription={{
            plan: subscription.plan?.display_name ?? '',
            status: subscription.status,
            nextBilling: subscription.current_period_end,
            price: subscription.plan?.price_monthly ?? 0,
          }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mis actividades</CardTitle>
              <Link href="/dashboard/provider/activities" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {performance.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Todavía no tienes actividades publicadas.</p>
            ) : (
              <div className="space-y-3">
                {performance.slice(0, 5).map((activity) => (
                  <div key={activity.activity_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{activity.activity_title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{activity.total_bookings} reservas</span>
                        {activity.avg_rating > 0 && (
                          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{activity.avg_rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="success">{activity.confirmed} confirmadas</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reservas pendientes</CardTitle>
              <Link href="/dashboard/provider/bookings" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No tienes reservas pendientes de confirmar.</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((booking) => <PendingBookingRow key={booking.id} booking={booking} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
