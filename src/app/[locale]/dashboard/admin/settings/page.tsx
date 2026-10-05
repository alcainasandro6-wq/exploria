import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Languages, CreditCard, PlugZap, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isTranslationConfigured } from '@/lib/services/translate'
import { getAllProviders } from '@/lib/services/providers'
import type { TuriTopConnectionStatus } from '@/types/database'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_settings_page')

  const PLATFORM_LABELS: Record<string, string> = {
    bokun: 'Bokun', turitop: 'TuriTop', civitatis: 'Civitatis',
    getyourguide: 'GetYourGuide', clickandboat: 'ClickAndBoat', other: t('platform_other'),
  }

  const { data: embedsRaw } = await supabase
    .from('activities')
    .select('title, external_booking_platform, provider:providers(company_name)')
    .not('external_booking_platform', 'is', null)
  const embeds = embedsRaw as unknown as { title: string; external_booking_platform: string; provider: { company_name: string } | null }[] | null

  const deeplConfigured = isTranslationConfigured()
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY

  const providers = await getAllProviders()
  const turitopConnections = providers.filter((p) => p.turitop_has_key)

  const TURITOP_STATUS_META: Record<TuriTopConnectionStatus, { variant: 'success' | 'destructive' | 'secondary'; icon: typeof CheckCircle2 }> = {
    ok: { variant: 'success', icon: CheckCircle2 },
    error: { variant: 'destructive', icon: XCircle },
    unverified: { variant: 'secondary', icon: HelpCircle },
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Languages className="w-4 h-4 text-primary" />{t('deepl_title')}</CardTitle>
            <CardDescription>{t('deepl_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={deeplConfigured ? 'success' : 'secondary'} className="gap-1">
              {deeplConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {deeplConfigured ? t('status_configured') : t('status_pending_config')}
            </Badge>
            {!deeplConfigured && (
              <p className="text-xs text-slate-400 mt-2">{t('deepl_missing_key_prefix')} <code className="bg-slate-100 px-1 rounded">DEEPL_API_KEY</code> {t('deepl_missing_key_suffix')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />{t('stripe_title')}</CardTitle>
            <CardDescription>{t('stripe_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={stripeConfigured ? 'success' : 'secondary'} className="gap-1">
              {stripeConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {stripeConfigured ? t('status_configured') : t('status_pending_config')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlugZap className="w-4 h-4 text-primary" />{t('external_calendars_title')}</CardTitle>
          <CardDescription>{t('external_calendars_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {(embeds ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t('no_external_calendars')}</p>
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlugZap className="w-4 h-4 text-primary" />{t('turitop_api_title')}</CardTitle>
          <CardDescription>{t('turitop_api_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {turitopConnections.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t('turitop_api_empty')}</p>
          ) : (
            <div className="space-y-2">
              {turitopConnections.map((p) => {
                const meta = TURITOP_STATUS_META[p.turitop_connection_status]
                const Icon = meta.icon
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-medium text-slate-900">{p.company_name}</p>
                    <Badge variant={meta.variant} className="gap-1">
                      <Icon className="w-3.5 h-3.5" />
                      {t(`turitop_status_${p.turitop_connection_status}`)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">{t('turitop_api_manage_hint')}</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
