import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId, getHotelDashboardStats, getHotelTopActivities } from '@/lib/services/hotels'
import { HotelStatsCharts } from '@/components/dashboard/hotel/HotelStatsCharts'

export default async function HotelStatsPage() {
  const t = await getTranslations('hotel_stats_page')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const [stats, topActivities] = await Promise.all([
    getHotelDashboardStats(hotel.id),
    getHotelTopActivities(hotel.id, 8),
  ])

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      {topActivities.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">{t('empty_state')}</CardContent></Card>
      ) : (
        <HotelStatsCharts stats={stats} topActivities={topActivities} />
      )}
    </DashboardLayout>
  )
}
