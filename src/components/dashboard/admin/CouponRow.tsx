'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { toggleCouponActiveAction, deleteCouponAction } from '@/app/actions/admin'
import { toast } from 'sonner'
import type { Coupon } from '@/types/database'

interface CouponRowProps {
  coupon: Coupon & { customer?: { full_name: string | null; email: string } | null }
}

export function CouponRow({ coupon }: CouponRowProps) {
  const t = useTranslations('admin_coupon_row')
  const [isActive, setIsActive] = useState(coupon.is_active)
  const [deleted, setDeleted] = useState(false)
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)

  if (deleted) return null

  const handleToggle = async () => {
    setLoading('toggle')
    const res = await toggleCouponActiveAction(coupon.id, !isActive)
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setIsActive(!isActive)
  }

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm', { code: coupon.code }))) return
    setLoading('delete')
    const res = await deleteCouponAction(coupon.id)
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setDeleted(true)
    toast.success(t('deleted_toast'))
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50">
      <td className="py-2.5 px-4 font-mono text-sm font-semibold text-slate-800">{coupon.code}</td>
      <td className="py-2.5 px-4 text-sm text-slate-600">
        {coupon.discount_type === 'percent' ? `${coupon.value}%` : `${coupon.value}€`}
      </td>
      <td className="py-2.5 px-4 text-sm text-slate-600">
        {coupon.customer ? (coupon.customer.full_name || coupon.customer.email) : t('global_label')}
      </td>
      <td className="py-2.5 px-4 text-sm text-slate-500">{coupon.times_used}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td>
      <td className="py-2.5 px-4">
        <button onClick={handleToggle} disabled={loading !== null}>
          <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? t('status_active') : t('status_inactive')}</Badge>
        </button>
      </td>
      <td className="py-2.5 px-4">
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading !== null} className="text-red-500 hover:bg-red-50">
          {loading === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </td>
    </tr>
  )
}
