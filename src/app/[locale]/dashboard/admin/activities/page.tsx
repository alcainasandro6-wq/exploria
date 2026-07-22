import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getPendingReviewActivities, getAllActivitiesAdmin } from '@/lib/services/admin'
import { getAllProviders } from '@/lib/services/providers'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import { ActivityReviewRow } from '@/components/dashboard/admin/ActivityReviewRow'
import { AdminCreateActivityForm } from '@/components/dashboard/admin/AdminCreateActivityForm'
import { AdminActivityRow } from '@/components/dashboard/admin/AdminActivityRow'
import { isTranslationConfigured } from '@/lib/services/translate'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', pending_review: 'En revisión', published: 'Publicada',
  suspended: 'Suspendida', archived: 'Archivada',
}

export default async function AdminActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [pending, allActivities, providers] = await Promise.all([
    getPendingReviewActivities(),
    getAllActivitiesAdmin(),
    getAllProviders(),
  ])

  const exportData = allActivities.map((a) => ({
    titulo: a.title,
    proveedor: a.provider?.company_name ?? '',
    precio: a.price_from,
    reservas: a.booking_count,
    valoracion: a.rating,
    estado: STATUS_LABELS[a.status] ?? a.status,
    creada: a.created_at,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title="Actividades"
        subtitle={`${allActivities.length} actividades en total`}
        action={<ExportButtons data={exportData} filename="actividades" title="Actividades — BookActivities" />}
      />

      {pending.length > 0 && (
        <Card className="mb-6 border-amber-200">
          <CardHeader><CardTitle>Solicitudes pendientes de aprobación ({pending.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pending.map((activity) => <ActivityReviewRow key={activity.id} activity={activity} />)}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>Subir servicio bajo solicitud</CardTitle></CardHeader>
        <CardContent>
          <AdminCreateActivityForm providers={providers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Todas las actividades</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actividad</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Proveedor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Precio</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Reservas</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  {isTranslationConfigured() && <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Traducción</th>}
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {allActivities.map((a) => <AdminActivityRow key={a.id} activity={a} />)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
