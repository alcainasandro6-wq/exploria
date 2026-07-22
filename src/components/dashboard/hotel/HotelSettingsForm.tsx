'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { updateHotelProfileAction } from '@/app/actions/hotels'
import { toast } from 'sonner'
import type { Hotel } from '@/types/database'

export function HotelSettingsForm({ hotel }: { hotel: Hotel }) {
  const [form, setForm] = useState({
    name: hotel.name,
    description: hotel.description ?? '',
    website: hotel.website ?? '',
    phone: hotel.phone,
    stars: hotel.stars ?? 3,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await updateHotelProfileAction(form)
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Datos actualizados')
  }

  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>Datos del hotel</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nombre</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Descripción</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Teléfono</label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Estrellas</label>
            <select value={form.stars} onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
              {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s} estrellas</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Web</label>
          <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  )
}
