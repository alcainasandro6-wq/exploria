'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, User, Phone } from 'lucide-react'
import { updateCustomerProfileAction } from '@/app/actions/customer'
import { toast } from 'sonner'
import { LOCALES, LOCALE_NAMES } from '@/lib/constants'
import type { Profile } from '@/types/database'

export function CustomerSettingsForm({ profile }: { profile: Profile }) {
  const t = useTranslations('customer_settings_form')
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [locale, setLocale] = useState(profile.locale)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await updateCustomerProfileAction({ fullName, phone, locale })
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('save_success'))
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" />{t('field_name_label')}</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('field_name_placeholder')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" />{t('field_email_label')}</label>
          <Input value={profile.email} disabled className="bg-slate-50 text-slate-400" />
          <p className="text-xs text-slate-400">{t('field_email_note')}</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" />{t('field_phone_label')}</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('field_phone_placeholder')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t('field_locale_label')}</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
            {LOCALES.map((loc) => <option key={loc} value={loc}>{LOCALE_NAMES[loc]}</option>)}
          </select>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 sm:col-span-2 sm:justify-self-start">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('save_button')}
        </Button>
      </CardContent>
    </Card>
  )
}
