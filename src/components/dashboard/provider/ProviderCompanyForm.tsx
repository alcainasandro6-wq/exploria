'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Upload } from 'lucide-react'
import { updateProviderProfileAction } from '@/app/actions/providers'
import { uploadProviderLogo } from '@/lib/services/upload'
import { toast } from 'sonner'
import type { Provider } from '@/types/database'

export function ProviderCompanyForm({ provider }: { provider: Provider }) {
  const [form, setForm] = useState({
    companyName: provider.company_name,
    description: provider.description ?? '',
    address: provider.address,
    city: provider.city,
    phone: provider.phone,
    website: provider.website ?? '',
    taxId: provider.tax_id ?? '',
  })
  const [logoUrl, setLogoUrl] = useState(provider.logo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await updateProviderProfileAction({ ...form, logoUrl })
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Empresa actualizada')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const res = await uploadProviderLogo(provider.id, file)
    setUploading(false)
    if (!res.success || !res.url) { toast.error(res.error || 'Error al subir el logo'); return }
    setLogoUrl(res.url)
    toast.success('Logo subido. Recuerda guardar los cambios.')
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Datos de la empresa</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
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
            Cambiar logo
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nombre de la empresa</label>
          <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Descripción</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Dirección</label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Ciudad</label>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Teléfono</label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Web</label>
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">CIF / NIF</label>
          <Input value={form.taxId} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  )
}
