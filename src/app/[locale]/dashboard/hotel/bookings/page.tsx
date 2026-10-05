import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { getHotelReservations } from '@/lib/services/reservations'
import { formatPrice, formatDate } from '@/lib/utils'
import { ActivityCalendar } from '@/components/booking/ActivityCalendar'
import { reservationsToEvents } from '@/lib/calendar-utils'

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success', pending: 'warning', completed: 'secondary',
  cancelled: 'destructive', rejected: 'destructive', no_show: 'destructive',
}

export default async function HotelBookingsPage() {
  const t = await getTranslations('hotel_bookings_page')
  const STATUS_LABELS: Record<string, string> = {
    confirmed: t('status_confirmed'), pending: t('status_pending'), completed: t('status_completed'),
    cancelled: t('status_cancelled'), rejected: t('status_rejected'), no_show: t('status_no_show'),
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const bookings = await getHotelReservations(hotel.id)

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader
        title={t('title')}
        subtitle={t('subtitle', { count: bookings.length })}
        action={
          <Link href="/dashboard/hotel/bookings/new" className={cn(buttonVariants({ variant: 'white' }), 'gap-1.5')}>
            <Plus className="w-4 h-4" />
            {t('new_booking_button')}
          </Link>
        }
      />

      <ActivityCalendar className="mb-6" events={reservationsToEvents(bookings, (r) => r.customer?.full_name ?? undefined)} />

      <Card>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">{t('empty_state')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_customer')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_activity')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_date')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_amount')}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('table_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{b.customer?.full_name || t('default_customer')}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{b.activity?.title}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatDate(b.activity_date)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900">{formatPrice(b.total_price)}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_STYLES[b.status]}>{STATUS_LABELS[b.status]}</Badge></td>
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
