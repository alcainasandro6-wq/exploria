'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Upload } from 'lucide-react'
import { updateProviderProfileAction } from '@/app/actions/providers'
import { uploadProviderLogo } from '@/lib/services/upload'
import { toast } from 'sonner'
import type { Provider } from '@/types/database'

export function ProviderCompanyForm({ provider }: { provider: Provider }) {
  const t = useTranslations('provider_company_form')
  const [form, setForm] = useState({
    companyName: provider.company_name,
    description: provider.description ?? '',
    address: provider.address,
    city: provider.city,
    phone: provider.phone,
    website: provider.website ?? '',
    taxId: provider.tax_id ?? '',
    turitopCompanyCode: provider.turitop_company_code ?? '',
  })
  const [logoUrl, setLogoUrl] = useState(provider.logo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await updateProviderProfileAction({ ...form, logoUrl })
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('updated_toast'))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const res = await uploadProviderLogo(provider.id, file)
    setUploading(false)
    if (!res.success || !res.url) { toast.error(res.error || t('logo_upload_error')); return }
    setLogoUrl(res.url)
    toast.success(t('logo_uploaded_toast'))
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-5">
        <div className="flex items-center gap-4 sm:col-span-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-slate-300">{form.companyName.charAt(0)}</span>
            )}
          </div>
          <label className="inline-flex items-center gap-1.5 text-sm font-medium text-primary cursor-pointer hover:underline">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {t('change_logo_button')}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">{t('field_company_name_label')}</label>
          <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">{t('field_description_label')}</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_address_label')}</label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_city_label')}</label>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_phone_label')}</label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_website_label')}</label>
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t('field_tax_id_label')}</label>
          <Input autoComplete="off" value={form.taxId} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t('field_turitop_code_label')}</label>
          <Input autoComplete="off" name="turitop-company-code" value={form.turitopCompanyCode} onChange={(e) => setForm((f) => ({ ...f, turitopCompanyCode: e.target.value }))} placeholder={t('field_turitop_code_placeholder')} />
          <p className="text-xs text-slate-400">{t('field_turitop_code_hint')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 sm:col-span-2 sm:justify-self-start">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('save_button')}
        </Button>
      </CardContent>
    </Card>
  )
}
