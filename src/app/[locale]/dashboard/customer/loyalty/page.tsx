import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Gift, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCustomerCoupons } from '@/lib/services/customer'
import { CouponCode } from '@/components/dashboard/customer/CouponCode'

export default async function CustomerLoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const coupons = await getCustomerCoupons()

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Programa de fidelidad" subtitle="Descuentos y promociones exclusivas para ti" />

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
            <Gift className="w-8 h-8 text-slate-300" />
            No tienes cupones activos por ahora. ¡Vuelve pronto!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Tag className="w-4 h-4" />
                    <span className="font-bold text-lg">
                      {coupon.discount_type === 'percent' ? `${coupon.value}%` : `${coupon.value}€`} de descuento
                    </span>
                  </div>
                  {!coupon.customer_id && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Global</span>
                  )}
                </div>
                {coupon.description && <p className="text-sm text-slate-500 mb-3">{coupon.description}</p>}
                <CouponCode code={coupon.code} />
                {coupon.valid_until && (
                  <p className="text-xs text-slate-400 mt-2">
                    Válido hasta {new Date(coupon.valid_until).toLocaleDateString('es-ES')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
