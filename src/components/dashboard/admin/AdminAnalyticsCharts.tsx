'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PRIMARY = '#005B8D'
const SECONDARY = '#3D84AC'

interface AdminAnalyticsChartsProps {
  reservations: { created_at: string; total_price: number; status: string }[]
  profiles: { created_at: string; role: string }[]
  topActivities: { booking_count: number; provider: { company_name: string } | null }[]
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-ES', { month: 'short' })
}

function lastSixMonthKeys(): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function AdminAnalyticsCharts({ reservations, profiles, topActivities }: AdminAnalyticsChartsProps) {
  const months = lastSixMonthKeys()

  const bookingsByMonth = months.map((key) => {
    const items = reservations.filter((r) => monthKey(r.created_at) === key)
    return { name: monthLabel(key), reservas: items.length }
  })

  const signupsByMonth = months.map((key) => {
    const items = profiles.filter((p) => monthKey(p.created_at) === key)
    return {
      name: monthLabel(key),
      clientes: items.filter((p) => p.role === 'customer').length,
      proveedores: items.filter((p) => p.role === 'provider').length,
      hoteles: items.filter((p) => p.role === 'hotel').length,
    }
  })

  const providerBookings = topActivities.reduce<Record<string, number>>((acc, a) => {
    const name = a.provider?.company_name ?? 'Desconocido'
    acc[name] = (acc[name] ?? 0) + a.booking_count
    return acc
  }, {})
  const providerData = Object.entries(providerBookings)
    .map(([name, reservas]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, reservas }))
    .sort((a, b) => b.reservas - a.reservas)
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Reservas e ingresos (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="reservas" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3 }} name="Reservas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Nuevos registros por mes</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="clientes" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={18} name="Clientes" />
                  <Bar dataKey="proveedores" fill={SECONDARY} radius={[4, 4, 0, 0]} maxBarSize={18} name="Proveedores" />
                  <Bar dataKey="hoteles" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={18} name="Hoteles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Proveedores con más reservas</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Bar dataKey="reservas" fill={PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
