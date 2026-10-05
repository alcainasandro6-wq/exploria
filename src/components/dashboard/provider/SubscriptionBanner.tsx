import { getTranslations } from 'next-intl/server'
import { CreditCard, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import type { SubscriptionStatus } from '@/types/database'

interface SubscriptionBannerProps {
  subscription: {
    plan: string
    status: SubscriptionStatus
    nextBilling: string
    price: number
  } | null
}

export async function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  const t = await getTranslations('provider_subscription_banner')

  if (!subscription || subscription.status !== 'active') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-800">{t('no_active_subscription_title')}</h3>
          <p className="text-sm text-red-600 mt-0.5">
            {t('no_active_subscription_desc')}
          </p>
        </div>
        <Link
          href="/dashboard/provider/subscription"
          className={cn(buttonVariants(), 'shrink-0')}
        >
          {t('subscribe_now_button')}
        </Link>
      </div>
    )
  }

  const statusConfig = {
    active: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', badgeVariant: 'success' as const },
    suspended: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', badgeVariant: 'warning' as const },
    expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-100', badgeVariant: 'destructive' as const },
    cancelled: { icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', badgeVariant: 'secondary' as const },
    trialing: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', badgeVariant: 'default' as const },
  }

  const config = statusConfig[subscription.status]
  const Icon = config.icon

  return (
    <div className={`border rounded-2xl p-5 mb-8 flex items-center gap-4 ${config.bg}`}>
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
        <CreditCard className="w-5 h-5 text-[#005B8D]" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-slate-900">{t('plan_label', { plan: subscription.plan })}</span>
          <Badge variant={config.badgeVariant}>{t('active_badge')}</Badge>
        </div>
        <p className="text-sm text-slate-500">
          {t('next_billing_label', { date: formatDate(subscription.nextBilling), price: formatPrice(subscription.price) })}
        </p>
      </div>
      <Link
        href="/dashboard/provider/subscription"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}
      >
        {t('manage_plan_button')}
      </Link>
    </div>
  )
}
