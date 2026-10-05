'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { IncidentDetailDialog } from '@/components/dashboard/admin/IncidentDetailDialog'
import type { IncidentStatus } from '@/types/database'
import type { IncidentWithReservation } from '@/lib/services/admin'

interface IncidentsListProps {
  incidents: IncidentWithReservation[]
}

const STATUS_VARIANT: Record<IncidentStatus, 'warning' | 'secondary' | 'success' | 'destructive'> = {
  open: 'warning',
  investigating: 'warning',
  resolved: 'success',
  dismissed: 'secondary',
}

const FILTERS: (IncidentStatus | 'all')[] = ['all', 'open', 'investigating', 'resolved', 'dismissed']

export function IncidentsList({ incidents }: IncidentsListProps) {
  const t = useTranslations('admin_incidents_page')
  const tType = useTranslations('admin_incident_type')
  const [filter, setFilter] = useState<IncidentStatus | 'all'>('all')
  const [selected, setSelected] = useState<IncidentWithReservation | null>(null)

  const statusLabels: Record<IncidentStatus, string> = {
    open: t('status_open'),
    investigating: t('status_investigating'),
    resolved: t('status_resolved'),
    dismissed: t('status_dismissed'),
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return incidents
    return incidents.filter((i) => i.status === filter)
  }, [incidents, filter])

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? t('filter_all') : statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_reservation')}</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_type')}</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_customer')}</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_provider')}</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_reported')}</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{t('column_status')}</th>
              <th className="text-left py-2 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2.5 px-4">
                  <p className="font-medium text-slate-900">{i.reservation?.activity?.title ?? '—'}</p>
                  <p className="text-xs font-mono text-slate-400">{i.reservation?.confirmation_code}</p>
                </td>
                <td className="py-2.5 px-4 text-slate-600">{tType(i.type)}</td>
                <td className="py-2.5 px-4 text-slate-600">{i.reservation?.customer?.full_name || i.reservation?.customer?.email || '—'}</td>
                <td className="py-2.5 px-4 text-slate-600">{i.reservation?.provider?.company_name ?? '—'}</td>
                <td className="py-2.5 px-4 text-slate-500">{formatDate(i.created_at)}</td>
                <td className="py-2.5 px-4">
                  <Badge variant={STATUS_VARIANT[i.status]}>{statusLabels[i.status]}</Badge>
                </td>
                <td className="py-2.5 px-4">
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setSelected(i)}>
                    {t('view_button')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-10 text-center">{t('empty_state')}</p>
        )}
      </div>

      {selected && (
        <IncidentDetailDialog
          open={!!selected}
          onOpenChange={(open) => { if (!open) setSelected(null) }}
          incident={selected}
        />
      )}
    </>
  )
}
