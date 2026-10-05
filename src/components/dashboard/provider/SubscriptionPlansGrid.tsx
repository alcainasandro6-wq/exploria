'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Star, Zap, Crown, Gift, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { SubscriptionPlan, SubscriptionPlanRecord } from '@/types/database'

const PLAN_ICONS: Record<SubscriptionPlan, typeof Star> = { free: Gift, basic: Star, pro: Zap, premium: Crown }

interface SubscriptionPlansGridProps {
  plans: SubscriptionPlanRecord[]
  currentPlan: SubscriptionPlan | null
  hasActiveSubscription: boolean
}

export function SubscriptionPlansGrid({ plans, currentPlan, hasActiveSubscription }: SubscriptionPlansGridProps) {
  const t = useTranslations('provider_subscription_plans_grid')
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planName: string) => {
    setLoadingPlan(planName)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName, billing }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || t('payment_start_error')); return }
      window.location.assign(data.url)
    } catch {
      toast.error(t('connection_error'))
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={cn('text-sm font-medium', billing === 'monthly' ? 'text-slate-900' : 'text-slate-400')}>{t('monthly_label')}</span>
        <button
          onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
          className={cn('relative w-14 h-7 rounded-full transition-colors', billing === 'annual' ? 'bg-primary' : 'bg-slate-200')}
        >
          <div className={cn('absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform', billing === 'annual' ? 'translate-x-7' : 'translate-x-0.5')} />
        </button>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', billing === 'annual' ? 'text-slate-900' : 'text-slate-400')}>{t('annual_label')}</span>
          <Badge variant="success">{t('save_badge')}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name]
          const isCurrent = hasActiveSubscription && currentPlan === plan.name
          const isPro = plan.name === 'pro'
          const price = billing === 'monthly' ? plan.price_monthly : plan.price_annual
          const monthlyEquivalent = billing === 'annual' ? Math.round(plan.price_annual / 12) : plan.price_monthly

          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border-2 overflow-hidden transition-all',
                isPro ? 'border-primary shadow-lg' : 'border-slate-100',
                isCurrent && 'ring-2 ring-emerald-500 ring-offset-2'
              )}
            >
              {isPro && !isCurrent && <div className="bg-primary text-white text-xs font-bold text-center py-1.5">★ {t('most_popular_badge')}</div>}
              {isCurrent && <div className="bg-emerald-500 text-white text-xs font-bold text-center py-1.5">✓ {t('current_plan_badge')}</div>}

              <div className="bg-white p-6">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', isPro ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600')}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.display_name}</h3>
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{formatPrice(monthlyEquivalent)}</span>
                    <span className="text-slate-400 text-sm">{t('per_month_suffix')}</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {t('annual_price_note', { price: formatPrice(price), savings: formatPrice(plan.price_monthly * 12 - plan.price_annual) })}
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.name)}
                  variant={isCurrent ? 'secondary' : isPro ? 'default' : 'outline'}
                  className="w-full"
                  disabled={isCurrent || loadingPlan !== null}
                >
                  {loadingPlan === plan.name ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isCurrent ? t('current_plan_button') : hasActiveSubscription ? t('switch_to_plan_button', { plan: plan.display_name }) : t('start_with_plan_button', { plan: plan.display_name })}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
