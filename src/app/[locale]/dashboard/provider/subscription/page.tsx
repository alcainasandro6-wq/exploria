'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Check, Star, Zap, Crown, CreditCard, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PLAN_ICONS = {
  basic: Star,
  pro: Zap,
  premium: Crown,
}

export default function ProviderSubscriptionPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [currentPlan] = useState('pro')

  const handleSubscribe = (planKey: string) => {
    toast.info(`Redirigiendo a Stripe para el plan ${planKey}...`)
  }

  const annualDiscount = 20

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role="provider"
        userName="Buceo Mediterráneo"
        userEmail="info@buceomed.es"
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Mi suscripción</h1>
            <p className="text-slate-500 mt-1">
              Elige el plan que mejor se adapta a tu negocio
            </p>
          </div>

          {/* Current Subscription Warning */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <CreditCard className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">Plan Pro activo</p>
              <p className="text-sm text-emerald-600">Próxima facturación: 1 de agosto 2025 · €99</p>
            </div>
            <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700">
              Cancelar suscripción
            </Button>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={cn('text-sm font-medium', billing === 'monthly' ? 'text-slate-900' : 'text-slate-400')}>
              Mensual
            </span>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              className={cn(
                'relative w-14 h-7 rounded-full transition-colors',
                billing === 'annual' ? 'bg-[#0066FF]' : 'bg-slate-200'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                billing === 'annual' ? 'translate-x-7' : 'translate-x-0.5'
              )} />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', billing === 'annual' ? 'text-slate-900' : 'text-slate-400')}>
                Anual
              </span>
              <Badge variant="success">Ahorra {annualDiscount}%</Badge>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {(Object.entries(SUBSCRIPTION_PLANS) as [string, typeof SUBSCRIPTION_PLANS.basic][]).map(([planKey, plan]) => {
              const Icon = PLAN_ICONS[planKey as keyof typeof PLAN_ICONS]
              const isCurrent = currentPlan === planKey
              const isPro = planKey === 'pro'
              const price = billing === 'monthly' ? plan.priceMonthly : plan.priceAnnual
              const monthlyEquivalent = billing === 'annual' ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly

              return (
                <div
                  key={planKey}
                  className={cn(
                    'relative rounded-2xl border-2 overflow-hidden transition-all',
                    isPro ? 'border-[#0066FF] shadow-lg' : 'border-slate-100',
                    isCurrent && 'ring-2 ring-emerald-500 ring-offset-2'
                  )}
                >
                  {isPro && (
                    <div className="bg-[#0066FF] text-white text-xs font-bold text-center py-1.5">
                      ★ MÁS POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div className="bg-emerald-500 text-white text-xs font-bold text-center py-1.5">
                      ✓ TU PLAN ACTUAL
                    </div>
                  )}

                  <div className="bg-white p-6">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                      isPro ? 'bg-[#0066FF] text-white' : 'bg-slate-100 text-slate-600'
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>

                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {billing === 'annual'
                            ? formatPrice(monthlyEquivalent)
                            : formatPrice(plan.priceMonthly)
                          }
                        </span>
                        <span className="text-slate-400 text-sm">/mes</span>
                      </div>
                      {billing === 'annual' && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {formatPrice(plan.priceAnnual)} al año (ahorras {formatPrice(plan.priceMonthly * 12 - plan.priceAnnual)})
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
                      onClick={() => handleSubscribe(planKey)}
                      variant={isCurrent ? 'secondary' : isPro ? 'default' : 'outline'}
                      className="w-full"
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Plan actual' : `Cambiar a ${plan.name}`}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* FAQ */}
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
        </div>
      </main>
    </div>
  )
}
