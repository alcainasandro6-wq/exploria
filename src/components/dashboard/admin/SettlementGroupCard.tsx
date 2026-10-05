'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { adminMarkCommissionsPaidAction } from '@/app/actions/admin'
import type { SettlementGroup } from '@/lib/services/admin'

interface SettlementGroupCardProps {
  group: SettlementGroup
  payoutLabel: string // "provider_payout" for provider groups, "hotel_commission_amount" for hotel groups
}

export function SettlementGroupCard({ group, payoutLabel }: SettlementGroupCardProps) {
  const t = useTranslations('admin_settlements_page')
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(
    new Set(group.commissions.filter((c) => c.is_liquidable).map((c) => c.id))
  )
  const [loading, setLoading] = useState(false)

  const pendingCommissions = useMemo(
    () => group.commissions.filter((c) => !paidIds.has(c.id)),
    [group.commissions, paidIds]
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMarkPaid = async () => {
    const ids = Array.from(selected).filter((id) => !paidIds.has(id))
    if (ids.length === 0) return
    setLoading(true)
    const res = await adminMarkCommissionsPaidAction(ids)
    setLoading(false)
    if (!res.success) { toast.error(res.error); return }
    setPaidIds((prev) => new Set([...prev, ...ids]))
    setSelected(new Set())
    toast.success(t('marked_paid_toast'))
  }

  if (pendingCommissions.length === 0) return null

  const selectedCount = Array.from(selected).filter((id) => !paidIds.has(id)).length
  const selectedTotal = group.commissions
    .filter((c) => selected.has(c.id) && !paidIds.has(c.id))
    .reduce((sum, c) => sum + (payoutLabel === 'hotel' ? c.hotel_commission_amount : c.provider_payout), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{group.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={group.liquidableCount > 0 ? 'success' : 'secondary'}>
              {group.liquidableCount} {t('liquidable_badge_suffix')}
            </Badge>
            <span className="text-sm font-bold text-slate-900">
              {formatPrice(payoutLabel === 'hotel' ? group.totalHotelCommission : group.totalProviderPayout)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-8 py-2 px-4"></th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_date')}</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_amount')}</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_status')}</th>
              </tr>
            </thead>
            <tbody>
              {pendingCommissions.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{formatDate(c.created_at)}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {formatPrice(payoutLabel === 'hotel' ? c.hotel_commission_amount : c.provider_payout)}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant={c.is_liquidable ? 'success' : 'warning'}>
                      {c.is_liquidable ? t('status_liquidable') : t('status_not_yet')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {selectedCount > 0 ? t('selected_summary', { count: selectedCount, amount: formatPrice(selectedTotal) }) : t('select_hint')}
          </span>
          <Button size="sm" onClick={handleMarkPaid} disabled={loading || selectedCount === 0}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('mark_batch_paid_button')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
