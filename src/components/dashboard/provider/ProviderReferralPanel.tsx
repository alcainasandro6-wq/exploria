import { getTranslations } from 'next-intl/server'
import { Gift, Users, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CopyableCode } from '@/components/dashboard/hotel/CopyableCode'
import type { ProviderReferralStats } from '@/lib/services/providers'

export async function ProviderReferralPanel({ stats }: { stats: ProviderReferralStats }) {
  const t = await getTranslations('provider_referrals_section')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookactivities.com'
  const referralUrl = `${siteUrl}/providers?ref=${stats.referral_code}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary" />{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">{t('code_label')}</p>
          <CopyableCode value={stats.referral_code} />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">{t('link_label')}</p>
          <CopyableCode value={referralUrl} truncate />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-primary/5 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <p className="text-xs">{t('stat_total_referred')}</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.total_referred}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <p className="text-xs">{t('stat_active_referred')}</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.active_referred}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
