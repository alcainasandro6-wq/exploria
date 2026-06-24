'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar, Users, Info, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import type { Activity } from '@/types/database'

interface BookingWidgetProps {
  activity: Activity
}

export function BookingWidget({ activity }: BookingWidgetProps) {
  const t = useTranslations('activity')
  const [participants, setParticipants] = useState(2)
  const [selectedDate, setSelectedDate] = useState('')

  const total = activity.price_from * participants

  const handleBook = () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona una fecha')
      return
    }
    toast.success('¡Solicitud enviada! El proveedor te contactará para confirmar.')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Price Header */}
      <div className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] p-5 text-white">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm opacity-80">Desde</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold">{formatPrice(activity.price_from)}</span>
          <span className="text-sm opacity-80">/ persona</span>
        </div>
        {activity.review_count > 0 && (
          <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
            <span>⭐</span>
            <span className="font-semibold">{activity.rating}</span>
            <span>({activity.review_count} reseñas)</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Date */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            {t('select_date')}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
          />
        </div>

        {/* Participants */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            <Users className="w-4 h-4 inline mr-1.5" />
            {t('select_participants')}
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setParticipants(Math.max(activity.min_participants, participants - 1))}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center text-sm font-semibold py-2.5">
              {participants} {participants === 1 ? 'persona' : 'personas'}
            </div>
            <button
              onClick={() => setParticipants(Math.min(activity.max_participants, participants + 1))}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mín. {activity.min_participants} — Máx. {activity.max_participants} personas
          </p>
        </div>

        {/* Total */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">
              {formatPrice(activity.price_from)} × {participants} persona{participants !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-slate-900">{formatPrice(total)}</span>
          </div>
          <div className="flex items-center justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
            <span>{t('total')}</span>
            <span className="text-[#0066FF]">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Book Button */}
        <Button onClick={handleBook} className="w-full" size="lg">
          {t('book_button')}
        </Button>

        {/* Legal Notice */}
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
          <Info className="w-4 h-4 text-[#0066FF] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('legal_notice')}
          </p>
        </div>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Sin pago online
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Cancelación gratis
          </div>
        </div>
      </div>
    </div>
  )
}
