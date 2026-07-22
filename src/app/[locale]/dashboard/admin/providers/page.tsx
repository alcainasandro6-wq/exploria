import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BadgeCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAllProviders } from '@/lib/services/providers'
import { formatDate } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'

export default async function AdminProvidersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const providers = await getAllProviders()

  const exportData = providers.map((p) => ({
    empresa: p.company_name,
    ciudad: p.city,
    telefono: p.phone,
    email: p.profile?.email ?? '',
    cif: p.tax_id ?? '',
    comision: `${(p.commission_rate * 100).toFixed(0)}%`,
    verificado: p.is_verified ? 'Sí' : 'No',
    activo: p.is_active ? 'Sí' : 'No',
    alta: p.created_at,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Proveedores"
        subtitle={`${providers.length} empresas proveedoras registradas`}
        action={<ExportButtons data={exportData} filename="proveedores" title="Proveedores — BookActivities" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{p.company_name}</p>
                  {p.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <p className="text-sm text-slate-500">{p.city} · {p.phone}</p>
              <p className="text-xs text-slate-400 mt-1">{p.profile?.email}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>Comisión: {(p.commission_rate * 100).toFixed(0)}%</span>
                <span>Alta: {formatDate(p.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}
