import { extractEmbedSrc } from '@/lib/embed'
import type { ExternalBookingPlatform } from '@/types/database'

const PLATFORM_LABELS: Record<ExternalBookingPlatform, string> = {
  bokun: 'Bokun',
  turitop: 'TuriTop',
  civitatis: 'Civitatis',
  getyourguide: 'GetYourGuide',
  clickandboat: 'ClickAndBoat',
  other: 'Sistema de reservas del proveedor',
}

interface BookingEmbedProps {
  embedCode: string | null
  platform: ExternalBookingPlatform | null
}

export function BookingEmbed({ embedCode, platform }: BookingEmbedProps) {
  const src = extractEmbedSrc(embedCode)
  if (!src) return null

  return (
    <div>
      <h3 className="font-bold text-slate-900 mb-3">
        Disponibilidad en tiempo real
        {platform && <span className="text-slate-400 font-normal text-sm"> · vía {PLATFORM_LABELS[platform]}</span>}
      </h3>
      <div className="rounded-2xl overflow-hidden border border-slate-200">
        <iframe
          src={src}
          className="w-full"
          style={{ minHeight: 480, border: 0 }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Calendario de disponibilidad — ${platform ? PLATFORM_LABELS[platform] : 'proveedor'}`}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Este calendario es informativo y lo gestiona directamente el proveedor. Para confirmar tu plaza, solicita la reserva desde el panel de la derecha.
      </p>
    </div>
  )
}
