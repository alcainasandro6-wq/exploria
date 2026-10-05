import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { ConciergeBookingForm } from '@/components/dashboard/hotel/ConciergeBookingForm'

export default async function HotelNewBookingPage() {
  const t = await getTranslations('hotel_new_booking_page')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'hotel') redirect('/dashboard')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />
      <ConciergeBookingForm />
    </DashboardLayout>
  )
}
