import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { createClient } from '@/lib/supabase/server'
import { getAllHotels } from '@/lib/services/hotels'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'
import { HotelsGrid } from '@/components/dashboard/admin/HotelsGrid'

export default async function AdminHotelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_hotels_page')

  const hotels = await getAllHotels()

  const exportData = hotels.map((h) => ({
    hotel: h.name,
    ciudad: h.city,
    estrellas: h.stars ?? '',
    telefono: h.phone,
    email: h.profile?.email ?? '',
    codigo_afiliado: h.affiliate_code,
    comision: `${(h.commission_rate * 100).toFixed(0)}%`,
    activo: h.is_active ? 'Sí' : 'No',
    alta: h.created_at,
  }))

  return (
    <DashboardLayout role="admin">
      <DashboardHeader
        title={t('title')}
        subtitle={t('subtitle', { count: hotels.length })}
        action={<ExportButtons data={exportData} filename="hoteles" title={`${t('export_title')} — BookActivities`} />}
      />

      <HotelsGrid hotels={hotels} />
    </DashboardLayout>
  )
}
