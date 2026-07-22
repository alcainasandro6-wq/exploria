import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getHotelByProfileId } from '@/lib/services/hotels'
import { CopyableCode } from '@/components/dashboard/hotel/CopyableCode'
import { CampaignLinkGenerator } from '@/components/dashboard/hotel/CampaignLinkGenerator'
import { formatDate } from '@/lib/utils'

export default async function HotelAffiliatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const hotel = await getHotelByProfileId(user.id)
  if (!hotel) redirect('/dashboard')

  const { data: links } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })

  const trackingUrl = hotel.tracking_url ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'}/en/activities?ref=${hotel.affiliate_code}&source=qr`

  return (
    <DashboardLayout role="hotel">
      <DashboardHeader title="Enlace de afiliado" subtitle="Genera enlaces de campaña para medir distintos canales" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enlace principal</CardTitle>
          <CardDescription>Tu enlace de siempre — úsalo en tu web o email de bienvenida</CardDescription>
        </CardHeader>
        <CardContent>
          <CopyableCode value={trackingUrl} truncate />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nuevo enlace de campaña</CardTitle>
          <CardDescription>Ej. para una newsletter concreta o una pantalla en el lobby</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignLinkGenerator />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial de enlaces</CardTitle></CardHeader>
        <CardContent>
          {(links ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no has generado enlaces de campaña.</p>
          ) : (
            <div className="space-y-2">
              {(links ?? []).map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-semibold text-slate-800 truncate">{link.code}</p>
                    <p className="text-xs text-slate-400">{formatDate(link.created_at)} · {link.clicks} clics · {link.conversions} conversiones</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
