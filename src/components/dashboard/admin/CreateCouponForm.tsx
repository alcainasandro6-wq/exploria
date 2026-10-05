'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { createCouponAction } from '@/app/actions/admin'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import type { CouponDiscountType } from '@/types/database'

export function CreateCouponForm() {
  const t = useTranslations('admin_create_coupon_form')
  const router = useRouter()
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percent')
  const [value, setValue] = useState('10')
  const [validUntil, setValidUntil] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!code.trim() || !value) { toast.error(t('fill_required_error')); return }
    setCreating(true)
    const res = await createCouponAction({
      code: code.trim(),
      description: description.trim() || undefined,
      discountType,
      value: Number(value),
      validUntil: validUntil || undefined,
    })
    setCreating(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('created_toast'))
    setCode(''); setDescription(''); setValue('10'); setValidUntil('')
    router.refresh()
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">{t('field_code')}</label>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VERANO25" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">{t('field_type')}</label>
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
          <option value="percent">{t('type_percent')}</option>
          <option value="fixed">{t('type_fixed')}</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">{t('field_value')}</label>
        <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">{t('field_valid_until')}</label>
        <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
      </div>
      <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {t('create_button')}
      </Button>
      <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
        <label className="text-xs font-medium text-slate-600">{t('field_description')}</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('field_description_placeholder')} />
      </div>
    </div>
  )
}
