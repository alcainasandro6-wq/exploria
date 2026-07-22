'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ProviderActivityPerformance, ProviderAttributionStats } from '@/types/database'

const PRIMARY = '#005B8D'
const CATEGORICAL = ['#005B8D', '#3D84AC'] // hotel-attributed vs direct — fixed order, never cycled

export function ProviderStatsCharts({
  performance,
  attribution,
}: {
  performance: ProviderActivityPerformance[]
  attribution: ProviderAttributionStats[]
}) {
  const bookingsData = performance
    .map((p) => ({ name: p.activity_title.length > 22 ? p.activity_title.slice(0, 22) + '…' : p.activity_title, reservas: p.total_bookings }))
    .sort((a, b) => b.reservas - a.reservas)
    .slice(0, 8)

  const totalHotel = attribution.reduce((s, a) => s + (a.hotel_id ? a.total_reservations : 0), 0)
  const totalDirect = attribution.reduce((s, a) => s + a.direct_bookings, 0)
  const attributionData = [
    { name: 'Vía hotel', value: totalHotel },
    { name: 'Directas', value: totalDirect },
  ]

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Reservas por actividad</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="reservas" fill={PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Origen de las reservas</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attributionData} margin={{ top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {attributionData.map((_, i) => <Cell key={i} fill={CATEGORICAL[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Detalle por actividad</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Actividad</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Reservas</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Confirmadas</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Completadas</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Canceladas</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Valoración</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p) => (
                  <tr key={p.activity_id} className="border-b border-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.activity_title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.total_bookings}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.confirmed}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.completed}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.cancelled}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.avg_rating > 0 ? p.avg_rating.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
