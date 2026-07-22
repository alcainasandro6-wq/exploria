import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import { ActivityEditorForm } from '@/components/dashboard/provider/ActivityEditorForm'
import { getCategories } from '@/lib/services/categories'
import { getProviderSubscription } from '@/lib/services/subscriptions'
import { createClient } from '@/lib/supabase/server'

export default async function NewActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  if (!provider) redirect('/dashboard/provider')

  const [categories, subscription] = await Promise.all([
    getCategories(),
    getProviderSubscription(provider.id),
  ])

  return (
    <DashboardLayout role="provider">
      {subscription && (
        <SubscriptionBanner
          subscription={{
            plan: subscription.plan?.display_name ?? '',
            status: subscription.status,
            nextBilling: subscription.current_period_end,
            price: subscription.plan?.price_monthly ?? 0,
          }}
        />
      )}
      <ActivityEditorForm providerId={provider.id} categories={categories} activity={null} />
    </DashboardLayout>
  )
}
