import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import {
  TrendingUp, Users, Building2, Package, CreditCard, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

const MOCK_METRICS = {
  mrr: 4900,
  mrrGrowth: 18.5,
  gmv: 28400,
  gmvGrowth: 12.3,
  totalBookings: 287,
  bookingsGrowth: 22.1,
  activeProviders: 45,
  providersGrowth: 8.9,
  activeHotels: 12,
  totalCommissions: 3820,
  platformCommissions: 1420,
  hotelCommissions: 2400,
}

const TOP_PROVIDERS = [
  { name: 'Buceo Mediterráneo', plan: 'Premium', bookings: 82, revenue: 4100, status: 'active' },
  { name: 'Nautic Torrevieja', plan: 'Pro', bookings: 61, revenue: 2135, status: 'active' },
  { name: 'Kayak Adventures', plan: 'Pro', bookings: 44, revenue: 1232, status: 'active' },
  { name: 'Sabores de la Costa', plan: 'Basic', bookings: 23, revenue: 1265, status: 'active' },
  { name: 'Blue Water Sports', plan: 'Pro', bookings: 38, revenue: 950, status: 'suspended' },
]

const RECENT_SUBS = [
  { provider: 'Surf Paradise', plan: 'Pro', date: '2025-07-10', amount: 99 },
  { provider: 'Flamenco Tours', plan: 'Basic', date: '2025-07-09', amount: 49 },
  { provider: 'Yacht Charter TRV', plan: 'Premium', date: '2025-07-08', amount: 199 },
]

function MetricCard({
  icon: Icon, label, value, growth, suffix = '', color
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  growth?: number
  suffix?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {growth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(growth)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-extrabold text-slate-900">
          {suffix === '€' ? formatPrice(value) : value}
        </div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="admin"
        userName="Administrador"
        userEmail="admin@exploria.es"
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500 mt-1">Resumen general de la plataforma — Julio 2025</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard icon={DollarSign} label="MRR (suscripciones)" value={MOCK_METRICS.mrr} growth={MOCK_METRICS.mrrGrowth} suffix="€" color="text-[#0066FF] bg-blue-50" />
          <MetricCard icon={TrendingUp} label="GMV" value={MOCK_METRICS.gmv} growth={MOCK_METRICS.gmvGrowth} suffix="€" color="text-emerald-600 bg-emerald-50" />
          <MetricCard icon={Activity} label="Reservas totales" value={MOCK_METRICS.totalBookings} growth={MOCK_METRICS.bookingsGrowth} color="text-purple-600 bg-purple-50" />
          <MetricCard icon={Building2} label="Proveedores activos" value={MOCK_METRICS.activeProviders} growth={MOCK_METRICS.providersGrowth} color="text-amber-600 bg-amber-50" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard icon={Users} label="Hoteles colaboradores" value={MOCK_METRICS.activeHotels} color="text-indigo-600 bg-indigo-50" />
          <MetricCard icon={CreditCard} label="Com. plataforma" value={MOCK_METRICS.platformCommissions} suffix="€" color="text-rose-600 bg-rose-50" />
          <MetricCard icon={DollarSign} label="Com. hoteles" value={MOCK_METRICS.hotelCommissions} suffix="€" color="text-teal-600 bg-teal-50" />
          <MetricCard icon={BarChart3} label="Total comisiones" value={MOCK_METRICS.totalCommissions} suffix="€" color="text-orange-600 bg-orange-50" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Top proveedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOP_PROVIDERS.map((provider, idx) => (
                  <div key={provider.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{provider.name}</p>
                      <p className="text-xs text-slate-400">{provider.bookings} reservas · {formatPrice(provider.revenue)}</p>
                    </div>
                    <Badge variant={
                      provider.plan === 'Premium' ? 'default' :
                      provider.plan === 'Pro' ? 'secondary' :
                      'outline'
                    }>
                      {provider.plan}
                    </Badge>
                    <Badge variant={provider.status === 'active' ? 'success' : 'destructive'}>
                      {provider.status === 'active' ? 'Activo' : 'Suspendido'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {RECENT_SUBS.map((sub) => (
                  <div key={sub.provider} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF] font-bold text-sm">
                      {sub.provider.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{sub.provider}</p>
                      <p className="text-xs text-slate-400">Plan {sub.plan} · {sub.date}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{formatPrice(sub.amount)}/mes</span>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">MRR total</span>
                    <span className="font-bold text-[#0066FF]">{formatPrice(MOCK_METRICS.mrr)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MRR Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Distribución de suscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {[
                { plan: 'Basic', count: 18, revenue: 882, color: 'bg-slate-200' },
                { plan: 'Pro', count: 22, revenue: 2178, color: 'bg-[#0066FF]/60' },
                { plan: 'Premium', count: 5, revenue: 995, color: 'bg-[#0066FF]' },
              ].map((item) => (
                <div key={item.plan} className="text-center">
                  <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-white font-bold text-xl">{item.count}</span>
                  </div>
                  <p className="font-bold text-slate-900">{item.plan}</p>
                  <p className="text-sm text-slate-500">{formatPrice(item.revenue)}/mes</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
