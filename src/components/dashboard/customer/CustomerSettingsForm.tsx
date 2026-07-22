'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, User, Phone } from 'lucide-react'
import { updateCustomerProfileAction } from '@/app/actions/customer'
import { toast } from 'sonner'
import { LOCALES, LOCALE_NAMES } from '@/lib/constants'
import type { Profile } from '@/types/database'

export function CustomerSettingsForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [locale, setLocale] = useState(profile.locale)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await updateCustomerProfileAction({ fullName, phone, locale })
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Datos actualizados')
  }

  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>Información de contacto</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" />Nombre completo</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" />Email</label>
          <Input value={profile.email} disabled className="bg-slate-50 text-slate-400" />
          <p className="text-xs text-slate-400">El email no se puede modificar.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" />Teléfono</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Idioma preferido</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
            {LOCALES.map((loc) => <option key={loc} value={loc}>{LOCALE_NAMES[loc]}</option>)}
          </select>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  )
}
