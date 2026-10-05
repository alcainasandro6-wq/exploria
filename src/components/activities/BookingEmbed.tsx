import { extractEmbedSrc } from '@/lib/embed'
import { TuriTopWidget } from '@/components/activities/TuriTopWidget'
import type { ExternalBookingPlatform } from '@/types/database'

const PLATFORM_LABELS: Record<ExternalBookingPlatform, string> = {
  bokun: 'Bokun',
  turitop: 'TuriTop',
  civitatis: 'Civitatis',
  getyourguide: 'GetYourGuide',
  clickandboat: 'ClickAndBoat',
  other: 'Sistema de reservas del proveedor',
}

interface BookingEmbedInput {
  embedCode: string | null
  platform: ExternalBookingPlatform | null
  turitopServiceCode: string | null
  turitopCompanyCode: string | null | undefined
}

/** Shared with the activity page so it can decide whether to hide the
 *  internal "Solicitar reserva" widget in favor of this real calendar. */
export function hasBookableEmbed({ embedCode, platform, turitopServiceCode, turitopCompanyCode }: BookingEmbedInput): boolean {
  if (platform === 'turitop') return !!turitopServiceCode && !!turitopCompanyCode
  return !!extractEmbedSrc(embedCode)
}

interface BookingEmbedProps extends BookingEmbedInput {
  locale: string
}

export function BookingEmbed({ embedCode, platform, turitopServiceCode, turitopCompanyCode, locale }: BookingEmbedProps) {
  const isTuriTop = platform === 'turitop' && !!turitopServiceCode && !!turitopCompanyCode
  const src = isTuriTop ? null : extractEmbedSrc(embedCode)
  if (!isTuriTop && !src) return null

  return (
    <div>
      <h3 className="font-bold text-slate-900 mb-3">
        Reserva tu plaza
        {platform && <span className="text-slate-400 font-normal text-sm"> · vía {PLATFORM_LABELS[platform]}</span>}
      </h3>
      <div className="rounded-2xl overflow-hidden border border-slate-200">
        {isTuriTop ? (
          <div className="p-4">
            <TuriTopWidget companyCode={turitopCompanyCode!} serviceCode={turitopServiceCode!} locale={locale} />
          </div>
        ) : (
          <iframe
            src={src!}
            className="w-full"
            style={{ minHeight: 480, border: 0 }}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Calendario de disponibilidad — ${platform ? PLATFORM_LABELS[platform] : 'proveedor'}`}
          />
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Este calendario lo gestiona directamente el proveedor. Completa tu reserva desde aquí.
      </p>
    </div>
  )
}
