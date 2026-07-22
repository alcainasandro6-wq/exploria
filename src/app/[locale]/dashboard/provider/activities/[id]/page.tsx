import { notFound, redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import { ActivityEditorForm } from '@/components/dashboard/provider/ActivityEditorForm'
import { getProviderActivityAction } from '@/app/actions/providers'
import { getCategories } from '@/lib/services/categories'
import { getProviderSubscription } from '@/lib/services/subscriptions'
import { createClient } from '@/lib/supabase/server'
import type { ActivityDetail } from '@/lib/services/activities'

export default async function ActivityEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('profile_id', user.id)
    .single()
  if (!provider) redirect('/dashboard/provider')

  const providerId: string = provider.id

  const [{ success, activity }, categories, subscription] = await Promise.all([
    getProviderActivityAction(id),
    getCategories(),
    getProviderSubscription(providerId),
  ])

  if (!success || !activity) notFound()

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
      <ActivityEditorForm providerId={providerId} categories={categories} activity={activity as unknown as ActivityDetail} />
    </DashboardLayout>
  )
}
