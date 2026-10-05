'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Loader2, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { formatDate, getInitials } from '@/lib/utils'
import { adminDeleteUserAction } from '@/app/actions/admin'
import { UserFormModal } from '@/components/dashboard/admin/UserFormModal'
import type { Profile, UserRole } from '@/types/database'

const ROLE_STYLES: Record<UserRole, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  customer: 'secondary', hotel: 'warning', provider: 'success', admin: 'destructive',
}

export function AdminUsersTable({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const t = useTranslations('admin_users_table')
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const ROLE_LABELS: Record<UserRole, string> = {
    customer: t('role_customer'), hotel: t('role_hotel'), provider: t('role_provider'), admin: t('role_admin'),
  }

  const handleDelete = async (u: Profile) => {
    const extraWarning = u.role === 'provider' || u.role === 'hotel'
      ? t('delete_extra_warning', { role: ROLE_LABELS[u.role].toLowerCase() })
      : ''
    if (!confirm(t('delete_confirm', { name: u.full_name || u.email }) + extraWarning)) return

    setDeletingId(u.id)
    const res = await adminDeleteUserAction(u.id)
    setDeletingId(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('deleted_toast'))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setCreateOpen(true)} className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
          <Plus className="w-4 h-4" />
          {t('new_user_button')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_user')}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_email')}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_phone')}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_role')}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_signup')}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {getInitials(u.full_name || u.email)}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{u.full_name || '—'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">{u.email}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{u.phone || '—'}</td>
                <td className="py-3 px-4"><Badge variant={ROLE_STYLES[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                <td className="py-3 px-4 text-sm text-slate-500">{formatDate(u.created_at)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)} className="text-slate-500 hover:bg-slate-100">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(u)}
                      disabled={deletingId === u.id || u.id === currentUserId}
                      title={u.id === currentUserId ? t('cannot_delete_self') : undefined}
                      className="text-red-500 hover:bg-red-50 disabled:opacity-30"
                    >
                      {deletingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormModal open={createOpen} onOpenChange={setCreateOpen} />
      {editingUser && (
        <UserFormModal open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} user={editingUser} />
      )}
    </div>
  )
}
