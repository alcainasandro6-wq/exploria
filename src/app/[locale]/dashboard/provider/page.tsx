import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardSidebar as DS } from '@/components/dashboard/DashboardSidebar'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import {
  Package, Calendar, DollarSign, TrendingUp, Eye, Star, AlertCircle, PlusCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

const MOCK_SUBSCRIPTION = {
  plan: 'Pro',
  status: 'active' as const,
  nextBilling: '2025-08-01',
  price: 99,
}

const MOCK_ACTIVITIES = [
  { id: 'a1', title: 'Buceo con instructores certificados', status: 'published', bookings: 42, rating: 4.9, views: 1240 },
  { id: 'a2', title: 'Tour snorkel avanzado', status: 'published', bookings: 28, rating: 4.7, views: 890 },
  { id: 'a3', title: 'Curso de buceo PADI', status: 'draft', bookings: 0, rating: 0, views: 0 },
]

const MOCK_RECENT_BOOKINGS = [
  { id: 'b1', customer: 'Carlos M.', activity: 'Buceo certificados', date: '2025-07-15', participants: 2, status: 'pending' },
  { id: 'b2', customer: 'Sophie K.', activity: 'Buceo certificados', date: '2025-07-14', participants: 4, status: 'confirmed' },
  { id: 'b3', customer: 'Anna W.', activity: 'Snorkel avanzado', date: '2025-07-13', participants: 2, status: 'confirmed' },
]

export default function ProviderDashboardPage() {
  const stats = [
    { icon: Package, label: 'Actividades publicadas', value: 2, color: 'text-blue-600 bg-blue-50' },
    { icon: Calendar, label: 'Reservas este mes', value: 18, color: 'text-purple-600 bg-purple-50' },
    { icon: DollarSign, label: 'Ingresos estimados', value: formatPrice(1620), color: 'text-emerald-600 bg-emerald-50' },
    { icon: Star, label: 'Valoración media', value: '4.9', color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="provider"
        userName="Buceo Mediterráneo"
        userEmail="info@buceomed.es"
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Proveedor</h1>
            <p className="text-slate-500 mt-1">Buceo Mediterráneo</p>
          </div>
          <Link 
            href="/dashboard/provider/activities/new"
            className={cn(buttonVariants(), 'flex items-center')}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nueva actividad
          </Link>
        </div>

        {/* Subscription Status */}
        <SubscriptionBanner subscription={MOCK_SUBSCRIPTION} />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mis actividades</CardTitle>
                <Link 
                  href="/dashboard/provider/activities"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  Ver todas
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ACTIVITIES.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#0066FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{activity.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />{activity.views} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{activity.bookings} reservas
                        </span>
                        {activity.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />{activity.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={activity.status === 'published' ? 'success' : 'secondary'}>
                      {activity.status === 'published' ? 'Publicada' : 'Borrador'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reservas pendientes</CardTitle>
                <Link 
                  href="/dashboard/provider/bookings"
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  Ver todas
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_RECENT_BOOKINGS.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">
                        {booking.customer.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{booking.customer}</p>
                      <p className="text-xs text-slate-500 truncate">{booking.activity} · {booking.participants} pers. · {formatDate(booking.date)}</p>
                    </div>
                    {booking.status === 'pending' ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="text-xs h-7 px-2.5">Confirmar</Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">Rechazar</Button>
                      </div>
                    ) : (
                      <Badge variant="success">Confirmado</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
