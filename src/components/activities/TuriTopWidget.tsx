import Script from 'next/script'
import { getTranslations } from 'next-intl/server'

interface TuriTopWidgetProps {
  companyCode: string
  serviceCode: string
  locale: string
}

// TuriTop's real widget install pattern (help.turitop.com — "Instalación del
// widget"): one global <script data-company> per site/page, plus one
// <div data-service> per activity. Keyed off companyCode so Next's
// script-dedupe doesn't suppress a reload for a different provider's page.
//
// data-embed="inline" renders the full availability calendar directly on the
// page (no popup button required). This is the recommended mode for
// activity-detail pages where the booking form is the primary action.
export async function TuriTopWidget({ companyCode, serviceCode, locale }: TuriTopWidgetProps) {
  const ta = await getTranslations('a11y')
  return (
    <div className="relative min-h-[480px]">
      {/* Skeleton shown while TuriTop JS loads */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm pointer-events-none"
        aria-hidden
      >
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-primary animate-spin" />
        <span>{ta('loading_availability')}</span>
      </div>

      <Script
        id={`js-turitop-${companyCode}`}
        src="https://app.turitop.com/js/load-turitop.min.js"
        strategy="afterInteractive"
        data-company={companyCode}
        data-buttoncolor="green"
        data-afftag="ttafid"
      />
      <div
        className="load-turitop relative z-10"
        data-service={serviceCode}
        data-lang={locale}
        data-embed="inline"
      />
    </div>
  )
}
