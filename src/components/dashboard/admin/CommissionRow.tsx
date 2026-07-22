'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { markCommissionPaidAction } from '@/app/actions/admin'
import { toast } from 'sonner'
import type { Commission } from '@/types/database'

interface CommissionRowProps {
  commission: Commission & {
    reservation: { confirmation_code: string } | null
    provider: { company_name: string } | null
    hotel: { name: string } | null
  }
}

export function CommissionRow({ commission }: CommissionRowProps) {
  const [status, setStatus] = useState(commission.status)
  const [loading, setLoading] = useState(false)

  const handleMarkPaid = async () => {
    setLoading(true)
    const res = await markCommissionPaidAction(commission.id)
    setLoading(false)
    if (!res.success) { toast.error(res.error); return }
    setStatus('paid')
    toast.success('Comisión marcada como liquidada')
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50">
      <td className="py-2.5 px-4 font-mono text-xs text-slate-700">{commission.reservation?.confirmation_code}</td>
      <td className="py-2.5 px-4 text-slate-600">{commission.provider?.company_name}</td>
      <td className="py-2.5 px-4 text-slate-600">{commission.hotel?.name ?? '—'}</td>
      <td className="py-2.5 px-4 font-semibold text-slate-900">{formatPrice(Number(commission.total_amount))}</td>
      <td className="py-2.5 px-4">
        <Badge variant={status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'secondary'}>
          {status === 'paid' ? 'Liquidada' : status === 'pending' ? 'Pendiente' : 'Cancelada'}
        </Badge>
      </td>
      <td className="py-2.5 px-4">
        {status === 'pending' && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleMarkPaid} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Marcar pagada'}
          </Button>
        )}
      </td>
    </tr>
  )
}
