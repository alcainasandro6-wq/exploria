import { redirect } from 'next/navigation'
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

  const [subscription, plans] = await Promise.all([
    getProviderSubscription(provider.id),
    getAllSubscriptionPlans(),
  ])

  const hasActiveSubscription = !!subscription && ['active', 'trialing'].includes(subscription.status) && new Date(subscription.current_period_end) > new Date()

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title="Mi suscripción" subtitle="Elige el plan que mejor se adapta a tu negocio" />

      {hasActiveSubscription && subscription && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <CreditCard className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">
              Plan {subscription.plan?.display_name} {subscription.status === 'trialing' ? '(periodo de prueba)' : 'activo'}
            </p>
            <p className="text-sm text-emerald-600">
              Próxima facturación: {formatDate(subscription.current_period_end)} · {formatPrice(subscription.plan?.price_monthly ?? 0)}
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
          <CardTitle>Preguntas frecuentes sobre la suscripción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div>
            <strong className="text-slate-800">¿Puedo cancelar en cualquier momento?</strong>
            <p className="mt-1">Sí. Puedes cancelar tu suscripción en cualquier momento. Mantendrás el acceso hasta el final del período de facturación.</p>
          </div>
          <div>
            <strong className="text-slate-800">¿Qué pasa si no pago?</strong>
            <p className="mt-1">Si tu pago falla, tus actividades serán suspendidas automáticamente y no recibirás nuevas reservas hasta que regularices el pago.</p>
          </div>
          <div>
            <strong className="text-slate-800">¿Puedo cambiar de plan?</strong>
            <p className="mt-1">Sí. Puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican en el siguiente ciclo de facturación.</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
