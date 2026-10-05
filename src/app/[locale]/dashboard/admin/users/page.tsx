import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/services/admin'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import { AdminUsersTable } from '@/components/dashboard/admin/AdminUsersTable'
import type { UserRole } from '@/types/database'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_users_page')

  const ROLE_LABELS: Record<UserRole, string> = {
    customer: t('role_customer'), hotel: t('role_hotel'), provider: t('role_provider'), admin: t('role_admin'),
  }

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
        title={t('title')}
        subtitle={t('subtitle', { count: users.length })}
        action={<ExportButtons data={exportData} filename="usuarios" title={`${t('export_title')} — BookActivities`} />}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <AdminUsersTable users={users} currentUserId={user.id} />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
