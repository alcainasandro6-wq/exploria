import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
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

  const t = await getTranslations('admin_coupons_page')

  const coupons = await getAllCoupons()

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title={t('title')} subtitle={t('subtitle')} />

      <Card className="mb-6">
        <CardHeader><CardTitle>{t('new_coupon_title')}</CardTitle></CardHeader>
        <CardContent>
          <CreateCouponForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('all_coupons_title')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_code')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_discount')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_scope')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_uses')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_status')}</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => <CouponRow key={c.id} coupon={c} />)}
              </tbody>
            </table>
          </div>
          {coupons.length === 0 && <p className="text-sm text-slate-400 py-10 text-center">{t('empty_state')}</p>}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
