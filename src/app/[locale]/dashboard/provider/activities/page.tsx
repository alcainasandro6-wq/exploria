import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import { Eye, Star, Calendar, PlusCircle, Edit2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn, formatDuration } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getProviderActivitiesAction } from '@/app/actions/providers'
import { getProviderSubscription, getSubscriptionUsage } from '@/lib/services/subscriptions'
import { getProviderByProfileId } from '@/lib/services/providers'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  pending_review: 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  suspended: 'bg-red-100 text-red-700',
  archived: 'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicada',
  pending_review: 'En revisión',
  draft: 'Borrador',
  suspended: 'Suspendida',
  archived: 'Archivada',
}

export default async function ProviderActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const [{ activities }, subscription, usage] = await Promise.all([
    getProviderActivitiesAction(),
    getProviderSubscription(provider.id),
    getSubscriptionUsage(provider.id),
  ])

  return (
    <DashboardLayout role="provider">
      {subscription && (
        <SubscriptionBanner
          subscription={{
            plan: subscription.plan?.display_name ?? '',
            status: subscription.status,
            nextBilling: subscription.current_period_end,
            price: subscription.plan?.price_monthly ?? 0,
          }}
        />
      )}

      <DashboardHeader
        title="Mis actividades"
        subtitle={`${activities.length} actividades · Plan ${subscription?.plan?.display_name ?? '—'} (máx. ${usage.maxActivities === -1 ? 'ilimitadas' : usage.maxActivities})`}
        action={
          <Link href="/dashboard/provider/activities/new" className={cn(buttonVariants({ variant: 'white' }), 'gap-1.5')}>
            <PlusCircle className="w-4 h-4" />
            Nueva actividad
          </Link>
        }
      />

      {activities.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">Todavía no has creado ninguna actividad.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const cover = activity.images?.find((i) => i.is_cover)?.url ?? activity.images?.[0]?.url
            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-full sm:w-20 h-32 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={activity.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🏝️</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_STYLES[activity.status])}>
                        {STATUS_LABELS[activity.status] ?? activity.status}
                      </span>
                      {activity.duration_minutes && <span className="text-xs text-slate-400">{formatDuration(activity.duration_minutes)}</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{activity.title}</h3>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{activity.price_from}€/persona</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{activity.booking_count ?? 0} reservas</span>
                      {activity.rating > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{activity.rating}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/provider/activities/${activity.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                    {activity.status === 'published' && (
                      <Link href={`/activities/${activity.slug}`} target="_blank" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
