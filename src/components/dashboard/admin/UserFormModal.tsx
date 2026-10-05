'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { adminCreateUserAction, adminUpdateUserAction } from '@/app/actions/admin'
import type { Profile, UserRole } from '@/types/database'

interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit to create a new user; pass an existing profile to edit it. */
  user?: Profile
}

export function UserFormModal({ open, onOpenChange, user }: UserFormModalProps) {
  const t = useTranslations('admin_user_form_modal')
  const router = useRouter()
  const isEdit = !!user
  const [form, setForm] = useState({
    email: user?.email ?? '',
    password: '',
    fullName: user?.full_name ?? '',
    phone: user?.phone ?? '',
    role: (user?.role ?? 'customer') as UserRole,
    referralCode: '',
  })
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: 'customer', label: t('role_customer') },
    { value: 'provider', label: t('role_provider') },
    { value: 'hotel', label: t('role_hotel') },
    { value: 'admin', label: t('role_admin') },
  ]

  const handleSubmit = async () => {
    if (!form.email || !form.fullName) {
      toast.error(t('fill_email_name_error'))
      return
    }
    if (form.password && form.password.length < 8) {
      toast.error(t('password_min_length_error'))
      return
    }
    if (!isEdit && form.password.length < 8) {
      toast.error(t('fill_all_required_error'))
      return
    }
    setSaving(true)
    try {
      const res = isEdit
        ? await adminUpdateUserAction(user!.id, { email: form.email, password: form.password || undefined, fullName: form.fullName, phone: form.phone, role: form.role })
        : await adminCreateUserAction({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone, role: form.role, referralCode: form.referralCode || undefined })
      if (!res.success) { toast.error(res.error); return }
      toast.success(isEdit ? t('updated_toast') : t('created_toast'))
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_full_name')}</label>
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder={t('field_full_name_placeholder')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_email')}</label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="usuario@email.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {isEdit ? t('field_new_password') : t('field_password')}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={isEdit ? t('field_password_edit_placeholder') : t('field_password_create_placeholder')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_phone')}</label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_role')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {(form.role === 'provider' || form.role === 'hotel') && (
              <p className="text-xs text-slate-400">
                {isEdit
                  ? t('provider_hotel_hint_edit')
                  : t('provider_hotel_hint_create')}
              </p>
            )}
          </div>
          {!isEdit && form.role === 'provider' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('field_referral_code')}</label>
              <Input
                value={form.referralCode}
                onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value }))}
                placeholder={t('field_referral_code_placeholder')}
              />
              <p className="text-xs text-slate-400">{t('field_referral_code_hint')}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>{t('cancel_button')}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? t('save_button') : t('create_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
