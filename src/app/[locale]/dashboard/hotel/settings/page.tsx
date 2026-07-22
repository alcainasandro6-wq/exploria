import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { HotelSettingsForm } from '@/components/dashboard/hotel/HotelSettingsForm'

export default async function HotelSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title="Configuración" subtitle="Información pública de tu hotel" />
      <HotelSettingsForm hotel={hotel} />
    </DashboardLayout>
  )
}
