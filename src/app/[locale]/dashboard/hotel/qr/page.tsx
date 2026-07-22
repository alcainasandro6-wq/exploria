import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { HotelQrCard } from '@/components/dashboard/hotel/HotelQrCard'

export default async function HotelQrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const trackingUrl = hotel.tracking_url ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'}/en/activities?ref=${hotel.affiliate_code}&source=qr`

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title="Mi código QR" subtitle="Imprímelo y colócalo en recepción, habitaciones o zonas comunes" />
      <HotelQrCard url={trackingUrl} hotelName={hotel.name} />
    </DashboardLayout>
  )
}
