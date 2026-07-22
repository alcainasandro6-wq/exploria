'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { adminCreateActivityForProviderAction } from '@/app/actions/admin'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import type { Provider } from '@/types/database'

export function AdminCreateActivityForm({ providers }: { providers: Provider[] }) {
  const router = useRouter()
  const [providerId, setProviderId] = useState(providers[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!providerId || !title.trim()) { toast.error('Selecciona un proveedor y un título'); return }
    setCreating(true)
    const res = await adminCreateActivityForProviderAction(providerId, title.trim())
    setCreating(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Borrador creado. Complétalo y publícalo desde su ficha.')
    setTitle('')
    router.refresh()
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <select
        value={providerId}
        onChange={(e) => setProviderId(e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white sm:w-64"
      >
        {providers.map((p) => <option key={p.id} value={p.id}>{p.company_name}</option>)}
      </select>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del nuevo servicio" className="flex-1" />
      <Button onClick={handleCreate} disabled={creating} className="gap-1.5 shrink-0">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Crear borrador
      </Button>
    </div>
  )
}
