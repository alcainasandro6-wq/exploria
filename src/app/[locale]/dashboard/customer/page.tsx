import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Calendar, Heart, Star, TrendingUp, MapPin, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomerReservations } from '@/lib/services/reservations'
import { getCustomerFavorites, getCustomerReviews } from '@/lib/services/customer'

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'secondary',
  cancelled: 'destructive',
  rejected: 'destructive',
  no_show: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
  no_show: 'No presentado',
}

export default async function CustomerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const [bookings, favorites, reviews] = await Promise.all([
    getCustomerReservations(user.id, { limit: 4 }),
    getCustomerFavorites(user.id),
    getCustomerReviews(user.id),
  ])

  const activeCount = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length
  const completedCount = bookings.filter((b) => b.status === 'completed').length

  const stats = [
    { icon: Calendar, label: 'Reservas activas', value: activeCount, color: 'blue' as const },
    { icon: Heart, label: 'Favoritos', value: favorites.length, color: 'rose' as const },
    { icon: Star, label: 'Valoraciones', value: reviews.length, color: 'amber' as const },
    { icon: TrendingUp, label: 'Actividades completadas', value: completedCount, color: 'emerald' as const },
  ]

  const firstName = profile?.full_name?.split(' ')[0] || 'viajero'

  const quickLinks = [
    { href: '/activities', icon: MapPin, title: 'Explorar actividades', desc: 'Descubre nuevas experiencias', solid: true },
    { href: '/dashboard/customer/favorites', icon: Heart, title: 'Mis favoritos', desc: `${favorites.length} actividades guardadas`, color: 'text-rose-500 bg-rose-50' },
    { href: '/dashboard/customer/loyalty', icon: Star, title: 'Fidelidad', desc: 'Ver descuentos y promos', color: 'text-amber-500 bg-amber-50' },
  ]

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title={`¡Hola, ${firstName}!`} subtitle="Aquí tienes el resumen de tu actividad" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Próximas reservas</CardTitle>
            <Link href="/dashboard/customer/bookings" className="text-sm font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400 mb-3">Todavía no tienes reservas. ¡Explora actividades!</p>
              <Link href="/activities" className={cn(buttonVariants({ size: 'sm' }))}>Explorar actividades</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{booking.activity?.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.activity_date)}
                      </span>
                      <span>{booking.participants} personas</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={STATUS_STYLES[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
                    <span className="text-sm font-bold text-slate-900">{formatPrice(booking.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(({ href, icon: Icon, title, desc, solid, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', solid ? 'bg-primary' : color)}>
                  <Icon className={cn('w-5 h-5', solid && 'text-white')} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  )
}
