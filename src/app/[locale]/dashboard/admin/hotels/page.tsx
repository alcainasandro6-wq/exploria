import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAllHotels } from '@/lib/services/hotels'
import { formatDate } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'

export default async function AdminHotelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const hotels = await getAllHotels()

  const exportData = hotels.map((h) => ({
    hotel: h.name,
    ciudad: h.city,
    estrellas: h.stars ?? '',
    telefono: h.phone,
    email: h.profile?.email ?? '',
    codigo_afiliado: h.affiliate_code,
    comision: `${(h.commission_rate * 100).toFixed(0)}%`,
    activo: h.is_active ? 'Sí' : 'No',
    alta: h.created_at,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Hoteles"
        subtitle={`${hotels.length} hoteles registrados`}
        action={<ExportButtons data={exportData} filename="hoteles" title="Hoteles — BookActivities" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hotels.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{h.name}</p>
                  {h.stars && (
                    <span className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {Array.from({ length: h.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                    </span>
                  )}
                </div>
                <Badge variant={h.is_active ? 'success' : 'secondary'}>{h.is_active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <p className="text-sm text-slate-500">{h.city} · {h.phone}</p>
              <p className="text-xs text-slate-400 mt-1">{h.profile?.email}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span className="font-mono">{h.affiliate_code}</span>
                <span>Alta: {formatDate(h.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}
