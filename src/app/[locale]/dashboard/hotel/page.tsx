import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Calendar, DollarSign, TrendingUp, Users, QrCode, Copy, Download, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'

const MOCK_STATS = {
  totalBookings: 47,
  monthlyBookings: 12,
  totalCommission: 1840,
  monthlyCommission: 450,
  conversionRate: 3.2,
  topActivity: 'Buceo Mediterráneo',
}

const MOCK_RECENT_BOOKINGS = [
  { id: 'b1', activity: 'Buceo en Torrevieja', date: '2025-07-10', guests: 2, commission: 36, status: 'confirmed' },
  { id: 'b2', activity: 'Excursión en catamarán', date: '2025-07-08', guests: 4, commission: 56, status: 'confirmed' },
  { id: 'b3', activity: 'Tour gastronómico', date: '2025-07-05', guests: 2, commission: 44, status: 'completed' },
  { id: 'b4', activity: 'Kayak lagunas', date: '2025-07-01', guests: 3, commission: 33.6, status: 'completed' },
]

const AFFILIATE_CODE = 'HOTEL-PALM-2025'
const AFFILIATE_URL = `https://exploria.es/es/activities?hotel=${AFFILIATE_CODE}`

export default function HotelDashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="hotel"
        userName="Hotel Palmeras"
        userEmail="palmeras@example.com"
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Panel del Hotel</h1>
          <p className="text-slate-500 mt-1">Hotel Palmeras — Torrevieja</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { icon: Calendar, label: 'Reservas este mes', value: MOCK_STATS.monthlyBookings, suffix: '', color: 'text-blue-600 bg-blue-50' },
            { icon: DollarSign, label: 'Comisión este mes', value: MOCK_STATS.monthlyCommission, suffix: '€', color: 'text-emerald-600 bg-emerald-50' },
            { icon: TrendingUp, label: 'Total reservas', value: MOCK_STATS.totalBookings, suffix: '', color: 'text-purple-600 bg-purple-50' },
            { icon: Users, label: 'Comisión total', value: MOCK_STATS.totalCommission, suffix: '€', color: 'text-amber-600 bg-amber-50' },
          ].map(({ icon: Icon, label, value, suffix, color }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {suffix === '€' ? formatPrice(value) : value}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#0066FF]" />
                Mi código QR exclusivo
              </CardTitle>
              <CardDescription>
                Coloca este QR en recepción para que tus huéspedes accedan a las actividades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center">
                <div className="w-40 h-40 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-20 h-20 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">QR Code</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm">
                  <Download className="w-4 h-4 mr-1.5" />
                  Descargar PNG
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  <Download className="w-4 h-4 mr-1.5" />
                  Descargar PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-[#0066FF]" />
                Enlace de afiliado
              </CardTitle>
              <CardDescription>
                Comparte este enlace y todas las reservas generadas se atribuirán a tu hotel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Tu código de afiliado</p>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
                  <code className="flex-1 text-sm font-mono font-bold text-[#0066FF]">{AFFILIATE_CODE}</code>
                  <button className="text-slate-400 hover:text-slate-600">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">URL de afiliado</p>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
                  <code className="flex-1 text-xs font-mono text-slate-600 truncate">{AFFILIATE_URL}</code>
                  <button className="text-slate-400 hover:text-slate-600 shrink-0">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-[#0066FF]/5 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0066FF] mb-1">💰 Tu comisión: 8% por reserva</p>
                <p className="text-xs text-slate-500">Las reservas generadas a través de tu enlace o QR se registran automáticamente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reservas recientes</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actividad</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Personas</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Comisión</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RECENT_BOOKINGS.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{booking.activity}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatDate(booking.date)}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{booking.guests}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600">{formatPrice(booking.commission)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={booking.status === 'confirmed' ? 'success' : 'secondary'}>
                          {booking.status === 'confirmed' ? 'Confirmado' : 'Completado'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
