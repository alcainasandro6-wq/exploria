import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ActivityManageButtons } from '@/components/dashboard/provider/ActivityManageButtons'
import { TuriTopImportCard } from '@/components/dashboard/provider/TuriTopImportCard'
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

export default async function ProviderActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const showArchived = (await searchParams).archived === '1'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_activities_page')

  const STATUS_LABELS: Record<string, string> = {
    published: t('status_published'),
    pending_review: t('status_pending_review'),
    draft: t('status_draft'),
    suspended: t('status_suspended'),
    archived: t('status_archived'),
  }

  const [{ activities }, subscription, usage] = await Promise.all([
    getProviderActivitiesAction({ archived: showArchived }),
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
        title={t('title')}
        subtitle={t('subtitle', {
          count: activities.length,
          plan: subscription?.plan?.display_name ?? '—',
          maxActivities: usage.maxActivities === -1 ? t('unlimited') : usage.maxActivities,
        })}
        action={
          <Link href="/dashboard/provider/activities/new" className={cn(buttonVariants({ variant: 'white' }), 'gap-1.5')}>
            <PlusCircle className="w-4 h-4" />
            {t('new_activity_button')}
          </Link>
        }
      />

      {provider.turitop_has_key && !showArchived && <TuriTopImportCard />}

      <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit">
        <Link href="/dashboard/provider/activities" className={cn('px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors', !showArchived ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>{t('tab_active')}</Link>
        <Link href="/dashboard/provider/activities?archived=1" className={cn('px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors', showArchived ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>{t('tab_archived')}</Link>
      </div>

      {activities.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">{showArchived ? t('empty_archived') : t('empty_state')}</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {activities.map((activity) => {
            const cover = activity.images?.find((i) => i.is_cover)?.url ?? activity.images?.[0]?.url
            return (
              <Card key={activity.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="relative h-36 shrink-0 bg-slate-100 overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={activity.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">🏝️</div>
                  )}
                  <span className={cn('absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_STYLES[activity.status])}>
                    {STATUS_LABELS[activity.status] ?? activity.status}
                  </span>
                </div>
                <CardContent className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 min-h-[2.5rem]">{activity.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{t('price_per_person', { price: activity.price_from })}</span>
                      {activity.duration_minutes && <span>{formatDuration(activity.duration_minutes)}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t('bookings_count', { count: activity.booking_count ?? 0 })}</span>
                      {activity.rating > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{activity.rating}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/dashboard/provider/activities/${activity.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 gap-1.5 flex-1 rounded-xl')}>
                      <Edit2 className="w-3.5 h-3.5" />
                      {t('edit_button')}
                    </Link>
                    {activity.status === 'published' && (
                      <Link href={`/activities/${activity.slug}`} target="_blank" title={t('view_button')} aria-label={t('view_button')} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'h-9 w-9 shrink-0 rounded-xl')}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    <ActivityManageButtons activityId={activity.id} status={activity.status} />
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
