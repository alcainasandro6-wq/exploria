import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, Users, Building2, TrendingUp, Clock, CheckCircle2, DollarSign, Send,
  Receipt, Wallet, XCircle, RotateCcw, MapPin, Sparkles,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import {
  getPlatformStats, getPendingReviewActivities,
  getAdminFinancialStats, getAdminTopActivities, getAdminTopDestinations,
} from '@/lib/services/admin'
import { AdminFinancialFilterBar } from '@/components/dashboard/admin/AdminFinancialFilterBar'
import { rangeToDates, type AdminFinancialFilters } from '@/lib/dashboard-date-ranges'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; city?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_home_page')

  const params = await searchParams
  const validRanges = ['day', 'week', 'month', 'year'] as const
  const range = (validRanges as readonly string[]).includes(params.range ?? '')
    ? (params.range as AdminFinancialFilters['range'])
    : ''
  const city = params.city ?? ''
  const filters: AdminFinancialFilters = { range, city }
  const { from, to } = rangeToDates(range)

  const [stats, pendingActivities, financialStats, topActivities, topDestinations] = await Promise.all([
    getPlatformStats(),
    getPendingReviewActivities(),
    getAdminFinancialStats({ from, to, city: city || undefined }),
    getAdminTopActivities({ from, to, city: city || undefined, limit: 5 }),
    getAdminTopDestinations({ from, to, limit: 5 }),
  ])

  const tiles = [
    { icon: Calendar, label: t('stat_total_reservations'), value: stats.total_reservations, color: 'blue' as const },
    { icon: Clock, label: t('stat_pending'), value: stats.pending_count, color: 'amber' as const },
    { icon: CheckCircle2, label: t('stat_completed'), value: stats.completed_count, color: 'emerald' as const },
    { icon: Building2, label: t('stat_active_providers'), value: stats.active_providers, color: 'purple' as const },
    { icon: Building2, label: t('stat_active_hotels'), value: stats.active_hotels, color: 'indigo' as const },
    { icon: TrendingUp, label: t('stat_hotel_bookings'), value: stats.hotel_attributed, color: 'cyan' as const },
    { icon: Users, label: t('stat_direct_bookings'), value: stats.direct_bookings, color: 'rose' as const },
    { icon: DollarSign, label: t('stat_mrr'), value: formatPrice(stats.mrr_eur), color: 'green' as const },
  ]

  const financialTiles = [
    { icon: DollarSign, label: t('stat_sales_today'), value: formatPrice(financialStats.sales_today), color: 'green' as const },
    { icon: TrendingUp, label: t('stat_sales_this_month'), value: formatPrice(financialStats.sales_this_month), color: 'blue' as const },
    { icon: Receipt, label: t('stat_avg_ticket'), value: formatPrice(financialStats.avg_ticket), color: 'indigo' as const },
    { icon: DollarSign, label: t('stat_commission_earned'), value: formatPrice(financialStats.platform_commission_earned), color: 'emerald' as const },
    { icon: Wallet, label: t('stat_pending_providers'), value: formatPrice(financialStats.pending_to_providers), color: 'amber' as const },
    { icon: Wallet, label: t('stat_pending_hotels'), value: formatPrice(financialStats.pending_to_hotels), color: 'purple' as const },
    { icon: XCircle, label: t('stat_cancellations'), value: financialStats.cancellations_count, color: 'rose' as const },
    { icon: RotateCcw, label: t('stat_refunds'), value: financialStats.refunds_count, color: 'cyan' as const },
  ]

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {tiles.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('financial_section_title')}</h2>
      </div>
      <AdminFinancialFilterBar filters={filters} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {financialTiles.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />{t('top_activities_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topActivities.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">{t('top_empty')}</p>
            ) : (
              <div className="space-y-2">
                {topActivities.map((a) => (
                  <div key={a.activity_id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.city} · {a.reservations_count} {t('reservations_suffix')}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0">{formatPrice(a.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{t('top_destinations_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topDestinations.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">{t('top_empty')}</p>
            ) : (
              <div className="space-y-2">
                {topDestinations.map((d) => (
                  <div key={d.city} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{d.city}</p>
                      <p className="text-xs text-slate-500">{d.reservations_count} {t('reservations_suffix')}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0">{formatPrice(d.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Send className="w-4 h-4 text-primary" />{t('pending_approval_title')}</CardTitle>
            <Link href="/dashboard/admin/activities?status=pending_review" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              {t('view_all')}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingActivities.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t('no_pending')}</p>
          ) : (
            <div className="space-y-3">
              {pendingActivities.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.provider?.company_name}</p>
                  </div>
                  <Badge variant="warning">{t('in_review')}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
