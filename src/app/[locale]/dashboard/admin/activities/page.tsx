import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getPendingReviewActivities, getAllActivitiesAdmin } from '@/lib/services/admin'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import { ActivityReviewRow } from '@/components/dashboard/admin/ActivityReviewRow'
import { AdminActivityRow } from '@/components/dashboard/admin/AdminActivityRow'
import { isTranslationConfigured } from '@/lib/services/translate'
import { cn } from '@/lib/utils'

export default async function AdminActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_activities_page')

  const STATUS_LABELS: Record<string, string> = {
    draft: t('status_draft'), pending_review: t('status_pending_review'), published: t('status_published'),
    suspended: t('status_suspended'), archived: t('status_archived'),
  }

  const [pending, allActivities] = await Promise.all([
    getPendingReviewActivities(),
    getAllActivitiesAdmin(),
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
        title={t('title')}
        subtitle={t('subtitle', { count: allActivities.length })}
        action={(
          <div className="flex items-center gap-2">
            <Link href="/dashboard/admin/activities/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
              <Plus className="w-4 h-4" />
              {t('new_activity_button')}
            </Link>
            <ExportButtons data={exportData} filename="actividades" title={`${t('export_title')} — BookActivities`} />
          </div>
        )}
      />

      {pending.length > 0 && (
        <Card className="mb-6 border-amber-200">
          <CardHeader><CardTitle>{t('pending_requests_title', { count: pending.length })}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pending.map((activity) => <ActivityReviewRow key={activity.id} activity={activity} />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t('all_activities_title')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_activity')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_provider')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_price')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_bookings')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_status')}</th>
                  {isTranslationConfigured() && <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_translation')}</th>}
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
