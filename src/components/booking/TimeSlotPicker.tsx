'use client'

import { cn } from '@/lib/utils'

const DEFAULT_SLOTS = ['09:00', '11:00', '13:00', '16:00', '18:00']

interface TimeSlotPickerProps {
  value: string
  onChange: (time: string) => void
  slots?: string[]
}

/** A row of tappable time pills instead of a native <input type="time"> —
 *  matches how Click&Boat / TuriTop present a day's available departures. */
export function TimeSlotPicker({ value, onChange, slots = DEFAULT_SLOTS }: TimeSlotPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={cn(
            'px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors',
            value === slot
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary'
          )}
        >
          {slot}
        </button>
      ))}
    </div>
  )
}
