import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Wallet, Building2, Hotel } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { getAdminSettlements } from '@/lib/services/admin'
import { SettlementGroupCard } from '@/components/dashboard/admin/SettlementGroupCard'

export default async function AdminSettlementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const t = await getTranslations('admin_settlements_page')

  const { providers, hotels } = await getAdminSettlements()

  const totalProviderPayout = providers.reduce((sum, g) => sum + g.totalProviderPayout, 0)
  const totalHotelPayout = hotels.reduce((sum, g) => sum + g.totalHotelCommission, 0)
  const totalLiquidable = providers.reduce((s, g) => s + g.liquidableCount, 0) + hotels.reduce((s, g) => s + g.liquidableCount, 0)

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      {/* NOTE: there is no cron/scheduler in this project — "liquidable"
          below is computed at read time (reservation completed + 24h
          elapsed + not held for an open incident), not a status a
          background job has flipped. See getAdminSettlements() in
          src/lib/services/admin.ts. */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 mb-6">
        {t('liquidable_disclaimer')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard icon={Wallet} label={t('stat_pending_providers')} value={formatPrice(totalProviderPayout)} color="amber" />
        <StatCard icon={Wallet} label={t('stat_pending_hotels')} value={formatPrice(totalHotelPayout)} color="purple" />
        <StatCard icon={Wallet} label={t('stat_liquidable_now')} value={totalLiquidable} color="emerald" />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />{t('providers_section_title')}
        </h2>
        {providers.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">{t('empty_providers')}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {providers.map((g) => <SettlementGroupCard key={g.id} group={g} payoutLabel="provider" />)}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-primary" />{t('hotels_section_title')}
        </h2>
        {hotels.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">{t('empty_hotels')}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {hotels.map((g) => <SettlementGroupCard key={g.id} group={g} payoutLabel="hotel" />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
