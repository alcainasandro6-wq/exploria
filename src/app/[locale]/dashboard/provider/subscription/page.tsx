import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { getProviderSubscription, getAllSubscriptionPlans } from '@/lib/services/subscriptions'
import { SubscriptionPlansGrid } from '@/components/dashboard/provider/SubscriptionPlansGrid'
import { CancelSubscriptionButton } from '@/components/dashboard/provider/CancelSubscriptionButton'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function ProviderSubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const t = await getTranslations('provider_subscription_page')

  const [subscription, plans] = await Promise.all([
    getProviderSubscription(provider.id),
    getAllSubscriptionPlans(),
  ])

  const hasActiveSubscription = !!subscription && ['active', 'trialing'].includes(subscription.status) && new Date(subscription.current_period_end) > new Date()

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      {hasActiveSubscription && subscription && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <CreditCard className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">
              {t('plan_status_label', {
                plan: subscription.plan?.display_name ?? '',
                status: subscription.status === 'trialing' ? t('status_trialing') : t('status_active'),
              })}
            </p>
            <p className="text-sm text-emerald-600">
              {t('next_billing_label', { date: formatDate(subscription.current_period_end), price: formatPrice(subscription.plan?.price_monthly ?? 0) })}
            </p>
          </div>
          <CancelSubscriptionButton />
        </div>
      )}

      <SubscriptionPlansGrid
        plans={plans}
        currentPlan={subscription?.plan?.name ?? null}
        hasActiveSubscription={hasActiveSubscription}
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('faq_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div>
            <strong className="text-slate-800">{t('faq_cancel_question')}</strong>
            <p className="mt-1">{t('faq_cancel_answer')}</p>
          </div>
          <div>
            <strong className="text-slate-800">{t('faq_no_payment_question')}</strong>
            <p className="mt-1">{t('faq_no_payment_answer')}</p>
          </div>
          <div>
            <strong className="text-slate-800">{t('faq_change_plan_question')}</strong>
            <p className="mt-1">{t('faq_change_plan_answer')}</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
