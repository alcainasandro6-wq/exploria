'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Loader2, PlugZap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from '@/i18n/navigation'
import { getTuriTopImportCandidatesAction, importTuriTopProductsAction } from '@/app/actions/providers'

interface Candidate { id: string; name: string; linked: boolean }

/** Lets a provider with a connected TuriTop account pull their products in as draft activities. */
export function TuriTopImportCard({ providerId, embedded }: { providerId?: string; embedded?: boolean } = {}) {
  const t = useTranslations('turitop_import')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [items, setItems] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const load = async () => {
    setOpen(true)
    setLoading(true)
    const res = await getTuriTopImportCandidatesAction(providerId)
    setLoading(false)
    if (!res.success) { toast.error(res.error || t('load_error')); setOpen(false); return }
    setItems(res.items)
  }

  const available = items.filter((i) => !i.linked)
  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const doImport = async () => {
    setImporting(true)
    const res = await importTuriTopProductsAction([...selected], providerId)
    setImporting(false)
    if (!res.success) { toast.error(res.error || t('import_error')); return }
    toast.success(t('import_ok', { count: res.imported }))
    setOpen(false)
    setSelected(new Set())
    router.refresh()
  }

  return (
    <Card className={embedded ? 'shadow-none border-dashed' : 'mb-5'}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><PlugZap className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{t('title')}</p>
              <p className="text-xs text-slate-500">{t('description')}</p>
            </div>
          </div>
          {!open && (
            <Button size="sm" onClick={load} className="gap-1.5 shrink-0"><Download className="w-3.5 h-3.5" />{t('open_button')}</Button>
          )}
        </div>

        {open && (
          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</p>
            ) : available.length === 0 ? (
              <p className="text-sm text-slate-400">{t('nothing_to_import')}</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">{t('available_count', { count: available.length })}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => setSelected(selected.size === available.length ? new Set() : new Set(available.map((a) => a.id)))}
                  >
                    {selected.size === available.length ? t('clear_all') : t('select_all')}
                  </button>
                </div>
                <ul className="max-h-72 overflow-y-auto grid sm:grid-cols-2 gap-1.5 pr-1">
                  {available.map((p) => (
                    <li key={p.id}>
                      <label className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-primary w-4 h-4" />
                        <span className="flex-1 min-w-0 truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={doImport} disabled={importing || selected.size === 0} className="gap-1.5">
                    {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {t('import_button', { count: selected.size })}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{t('cancel')}</Button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{t('draft_note')}</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
