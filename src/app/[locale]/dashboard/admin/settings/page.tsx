import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Languages, CreditCard, PlugZap, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isTranslationConfigured } from '@/lib/services/translate'

const PLATFORM_LABELS: Record<string, string> = {
  bokun: 'Bokun', turitop: 'TuriTop', civitatis: 'Civitatis',
  getyourguide: 'GetYourGuide', clickandboat: 'ClickAndBoat', other: 'Otro',
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: embedsRaw } = await supabase
    .from('activities')
    .select('title, external_booking_platform, provider:providers(company_name)')
    .not('external_booking_platform', 'is', null)
  const embeds = embedsRaw as unknown as { title: string; external_booking_platform: string; provider: { company_name: string } | null }[] | null

  const deeplConfigured = isTranslationConfigured()
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Integraciones" subtitle="Estado de las APIs conectadas a la plataforma" />

      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Languages className="w-4 h-4 text-primary" />Traducción automática (DeepL)</CardTitle>
            <CardDescription>Usada por el botón &ldquo;Traducir&rdquo; en la ficha de cada actividad</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={deeplConfigured ? 'success' : 'secondary'} className="gap-1">
              {deeplConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {deeplConfigured ? 'Configurado' : 'Pendiente de configurar'}
            </Badge>
            {!deeplConfigured && (
              <p className="text-xs text-slate-400 mt-2">Añade la variable de entorno <code className="bg-slate-100 px-1 rounded">DEEPL_API_KEY</code> para activarlo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />Pagos (Stripe)</CardTitle>
            <CardDescription>Cobro de las suscripciones de los proveedores</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={stripeConfigured ? 'success' : 'secondary'} className="gap-1">
              {stripeConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {stripeConfigured ? 'Configurado' : 'Pendiente de configurar'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlugZap className="w-4 h-4 text-primary" />Calendarios externos de proveedores</CardTitle>
          <CardDescription>Actividades con un calendario de disponibilidad de Bokún, TuriTop, Civitatis, GetYourGuide o ClickAndBoat</CardDescription>
        </CardHeader>
        <CardContent>
          {(embeds ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Ningún proveedor ha conectado todavía un calendario externo.</p>
          ) : (
            <div className="space-y-2">
              {(embeds ?? []).map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.provider?.company_name}</p>
                  </div>
                  <Badge variant="secondary">{PLATFORM_LABELS[e.external_booking_platform as string] ?? e.external_booking_platform}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
