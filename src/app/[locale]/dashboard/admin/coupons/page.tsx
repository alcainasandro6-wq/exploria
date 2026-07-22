import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getAllCoupons } from '@/lib/services/admin'
import { CreateCouponForm } from '@/components/dashboard/admin/CreateCouponForm'
import { CouponRow } from '@/components/dashboard/admin/CouponRow'

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const coupons = await getAllCoupons()

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Cupones y promociones" subtitle="Descuentos globales o personalizados para el programa de fidelidad de clientes" />

      <Card className="mb-6">
        <CardHeader><CardTitle>Nuevo cupón</CardTitle></CardHeader>
        <CardContent>
          <CreateCouponForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Todos los cupones</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Código</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Descuento</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ámbito</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Usos</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => <CouponRow key={c.id} coupon={c} />)}
              </tbody>
            </table>
          </div>
          {coupons.length === 0 && <p className="text-sm text-slate-400 py-10 text-center">Todavía no hay cupones creados.</p>}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
