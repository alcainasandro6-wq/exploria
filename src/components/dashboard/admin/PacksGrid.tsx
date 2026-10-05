'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { adminDeletePackAction } from '@/app/actions/admin'
import { PackFormModal } from '@/components/dashboard/admin/PackFormModal'
import type { ActivitySummary } from '@/lib/services/admin'
import type { PackWithActivities } from '@/lib/services/packs'

interface PacksGridProps {
  packs: PackWithActivities[]
  activities: ActivitySummary[]
}

export function PacksGrid({ packs, activities }: PacksGridProps) {
  const t = useTranslations('admin_packs_grid')
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<PackWithActivities | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreate = () => { setEditingPack(undefined); setModalOpen(true) }
  const openEdit = (pack: PackWithActivities) => { setEditingPack(pack); setModalOpen(true) }

  const handleDelete = async (pack: PackWithActivities) => {
    if (!confirm(t('delete_confirm', { title: pack.title }))) return
    setDeletingId(pack.id)
    const res = await adminDeletePackAction(pack.id)
    setDeletingId(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('deleted_toast'))
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('add_button')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map((pack) => (
          <Card key={pack.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-900 truncate">{pack.title}</p>
                <Badge variant={pack.is_active ? 'success' : 'secondary'}>
                  {pack.is_active ? t('status_active') : t('status_inactive')}
                </Badge>
              </div>
              {pack.subtitle && <p className="text-sm text-slate-500 line-clamp-2">{pack.subtitle}</p>}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>{t('activities_count', { count: pack.activities.length })}</span>
                {pack.total_price > 0 && <span>· {t('total_price', { price: pack.total_price })}</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{t('sort_order_label', { order: pack.sort_order })}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(pack)}>
                    <Pencil className="w-3.5 h-3.5" />
                    {t('edit_button')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pack)}
                    disabled={deletingId === pack.id}
                    className="text-red-500 hover:bg-red-50"
                  >
                    {deletingId === pack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {packs.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full text-center py-8">{t('empty_state')}</p>
        )}
      </div>

      <PackFormModal
        key={editingPack?.id ?? 'new'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        pack={editingPack}
        activities={activities}
      />
    </>
  )
}
