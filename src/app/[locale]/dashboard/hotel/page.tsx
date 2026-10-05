import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Calendar, DollarSign, TrendingUp, Users, QrCode, ExternalLink, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId, getHotelDashboardStats, getHotelTopActivities } from '@/lib/services/hotels'
import { CopyableCode } from '@/components/dashboard/hotel/CopyableCode'

export default async function HotelDashboardPage() {
  const t = await getTranslations('hotel_home_page')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const [stats, topActivities] = await Promise.all([
    getHotelDashboardStats(hotel.id),
    getHotelTopActivities(hotel.id, 5),
  ])

  const trackingUrl = hotel.tracking_url ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'}/en/activities?ref=${hotel.affiliate_code}&source=qr`

  const statTiles = [
    { icon: Calendar, label: t('stat_pending_reservations'), value: stats.pending_reservations, color: 'blue' as const },
    { icon: DollarSign, label: t('stat_estimated_commission'), value: formatPrice(stats.estimated_commission), color: 'emerald' as const },
    { icon: TrendingUp, label: t('stat_total_reservations'), value: stats.total_reservations, color: 'purple' as const },
    { icon: Users, label: t('stat_total_participants'), value: stats.total_participants, color: 'amber' as const },
  ]

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader
        title={t('title')}
        subtitle={t('subtitle', { name: hotel.name, city: hotel.city })}
        action={
          <Link href="/dashboard/hotel/bookings/new" className={cn(buttonVariants({ variant: 'white' }), 'gap-1.5')}>
            <Plus className="w-4 h-4" />
            {t('new_booking_button')}
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statTiles.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" />{t('qr_card_title')}</CardTitle>
            <CardDescription>{t('qr_card_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/hotel/qr" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
              {t('qr_card_button')}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ExternalLink className="w-5 h-5 text-primary" />{t('affiliate_card_title')}</CardTitle>
            <CardDescription>{t('affiliate_card_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">{t('affiliate_code_label')}</p>
              <CopyableCode value={hotel.affiliate_code} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">{t('affiliate_url_label')}</p>
              <CopyableCode value={trackingUrl} truncate />
            </div>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">{t('commission_rate_text', { rate: (hotel.commission_rate * 100).toFixed(0) })}</p>
              <p className="text-xs text-slate-500">{t('commission_note')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('top_activities_title')}</CardTitle></CardHeader>
        <CardContent>
          {topActivities.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t('empty_state')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_activity')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_bookings')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_participants')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topActivities.map((a) => (
                    <tr key={a.activity_id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{a.activity_title}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{a.total_bookings}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{a.total_participants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
