'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BadgeCheck, Gift, Settings2 } from 'lucide-react'
import { SearchBox } from '@/components/dashboard/admin/SearchBox'
import { GrantSubscriptionDialog } from '@/components/dashboard/admin/GrantSubscriptionDialog'
import { ManageProviderDialog } from '@/components/dashboard/admin/ManageProviderDialog'
import { formatDate } from '@/lib/utils'
import type { Provider, SubscriptionPlanRecord, ProviderSubscription, ProviderTier } from '@/types/database'

const TIER_BADGE_CLASS: Record<ProviderTier, string> = {
  registered: 'bg-slate-100 text-slate-600',
  verified: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
}

interface ProvidersGridProps {
  providers: Provider[]
  plans: SubscriptionPlanRecord[]
  subscriptionByProvider: Record<string, ProviderSubscription & { plan?: SubscriptionPlanRecord }>
}

export function ProvidersGrid({ providers, plans, subscriptionByProvider }: ProvidersGridProps) {
  const t = useTranslations('admin_providers_grid')
  const [query, setQuery] = useState('')
  const [managingProvider, setManagingProvider] = useState<Provider | null>(null)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)

  const tierLabels: Record<ProviderTier, string> = {
    registered: t('tier_registered'),
    verified: t('tier_verified'),
    premium: t('tier_premium'),
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return providers
    return providers.filter((p) =>
      p.company_name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.profile?.email ?? '').toLowerCase().includes(q)
    )
  }, [providers, query])

  return (
    <>
      <SearchBox value={query} onChange={setQuery} placeholder={t('search_placeholder')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((p) => {
          const subscription = subscriptionByProvider[p.id]
          return (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.company_name}</p>
                    {p.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? t('status_active') : t('status_inactive')}</Badge>
                </div>
                <div className="mb-1">
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_BADGE_CLASS[p.tier]}`}>
                    {tierLabels[p.tier]}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{p.city} · {p.phone}</p>
                <p className="text-xs text-slate-400 mt-1">{p.profile?.email}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span>{t('commission_label', { rate: (p.commission_rate * 100).toFixed(0) })}</span>
                  <span>{t('signup_date', { date: formatDate(p.created_at) })}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  {subscription?.plan ? (
                    <Badge variant="secondary">{t('plan_badge', { planName: subscription.plan.display_name })}</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">{t('no_subscription')}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingProvider(p)}>
                      <Settings2 className="w-3.5 h-3.5" />
                      {t('manage_provider_button')}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setManagingProvider(p)}>
                      <Gift className="w-3.5 h-3.5" />
                      {t('manage_plan_button')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full text-center py-8">{t('empty_state')}</p>
        )}
      </div>

      {managingProvider && (
        <GrantSubscriptionDialog
          open={!!managingProvider}
          onOpenChange={(open) => { if (!open) setManagingProvider(null) }}
          providerId={managingProvider.id}
          providerName={managingProvider.company_name}
          plans={plans}
          currentSubscriptionId={subscriptionByProvider[managingProvider.id]?.id}
          currentPlanId={subscriptionByProvider[managingProvider.id]?.plan_id}
        />
      )}

      {editingProvider && (
        <ManageProviderDialog
          open={!!editingProvider}
          onOpenChange={(open) => { if (!open) setEditingProvider(null) }}
          provider={editingProvider}
        />
      )}
    </>
  )
}
