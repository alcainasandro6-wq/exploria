import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Calendar, Heart, Star, MessageSquare, MapPin, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

const MOCK_BOOKINGS = [
  { id: 'b1', activity: 'Buceo con instructores certificados', date: '2025-07-15', status: 'confirmed', price: 90, participants: 2 },
  { id: 'b2', activity: 'Excursión en catamarán al atardecer', date: '2025-07-20', status: 'pending', price: 70, participants: 2 },
  { id: 'b3', activity: 'Tour gastronómico', date: '2025-06-10', status: 'completed', price: 55, participants: 1 },
]

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'secondary',
  cancelled: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export default function CustomerDashboardPage() {
  const stats = [
    { icon: Calendar, label: 'Reservas activas', value: '2', color: 'text-blue-600 bg-blue-50' },
    { icon: Heart, label: 'Favoritos', value: '8', color: 'text-rose-600 bg-rose-50' },
    { icon: Star, label: 'Valoraciones', value: '3', color: 'text-amber-600 bg-amber-50' },
    { icon: TrendingUp, label: 'Actividades completadas', value: '5', color: 'text-emerald-600 bg-emerald-50' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="customer"
        userName="María García"
        userEmail="maria@example.com"
      />

      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">¡Hola, María! 👋</h1>
          <p className="text-slate-500 mt-1">Aquí tienes el resumen de tu actividad</p>
        </div>

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

        {/* Upcoming Bookings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Próximas reservas</CardTitle>
              <Link href="/dashboard/customer/bookings" className="text-sm text-[#0066FF] hover:underline">
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_BOOKINGS.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#0066FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{booking.activity}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.date)}
                      </span>
                      <span>{booking.participants} personas</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={STATUS_STYLES[booking.status] as 'success' | 'warning' | 'secondary' | 'destructive'}>
                      {STATUS_LABELS[booking.status]}
                    </Badge>
                    <span className="text-sm font-bold text-slate-900">{formatPrice(booking.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/activities">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Explorar actividades</p>
                  <p className="text-xs text-slate-400">Descubre nuevas experiencias</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/customer/favorites">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Mis favoritos</p>
                  <p className="text-xs text-slate-400">8 actividades guardadas</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/customer/reviews">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Dejar valoración</p>
                  <p className="text-xs text-slate-400">Tienes 2 pendientes</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
