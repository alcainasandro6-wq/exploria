import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlugZap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAllProviders } from '@/lib/services/providers'
import { TuriTopProviderRow } from '@/components/dashboard/admin/TuriTopProviderRow'

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

  const providers = await getAllProviders()
  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

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
        <CardContent className="space-y-3">
          <ol className="text-xs text-slate-500 list-decimal pl-4 space-y-0.5">
            <li>{t('turitop_step1')}</li>
            <li>{t('turitop_step2')}</li>
            <li>{t('turitop_step3')}</li>
          </ol>
          {providers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t('no_providers')}</p>
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <TuriTopProviderRow
                  key={p.id}
                  providerId={p.id}
                  companyName={p.company_name}
                  hasKey={p.turitop_has_key}
                  status={p.turitop_connection_status}
                  error={p.turitop_connection_error}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
