import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/services/admin'
import { formatDate, getInitials } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import type { UserRole } from '@/types/database'

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Cliente', hotel: 'Hotel', provider: 'Proveedor', admin: 'Administrador',
}
const ROLE_STYLES: Record<UserRole, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  customer: 'secondary', hotel: 'warning', provider: 'success', admin: 'destructive',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const users = await getAllUsers()

  const exportData = users.map((u) => ({
    nombre: u.full_name ?? '',
    email: u.email,
    telefono: u.phone ?? '',
    rol: ROLE_LABELS[u.role],
    idioma: u.locale,
    alta: u.created_at,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Usuarios"
        subtitle={`${users.length} cuentas registradas`}
        action={<ExportButtons data={exportData} filename="usuarios" title="Usuarios — BookActivities" />}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Rol</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Alta</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {getInitials(u.full_name || u.email)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{u.email}</td>
                    <td className="py-3 px-4"><Badge variant={ROLE_STYLES[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="py-3 px-4 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
