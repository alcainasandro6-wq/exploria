'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { ParallaxImage } from '@/components/ui/parallax-image'
import { Reveal } from '@/components/ui/reveal'

export function ProviderCTA() {
  const t = useTranslations('home')

  const benefits = [
    t.rich('cta_benefit_1', { bold: (chunks) => <strong className="font-bold text-slate-900">{chunks}</strong> }),
    t.rich('cta_benefit_2', { bold: (chunks) => <strong className="font-bold text-slate-900">{chunks}</strong> }),
    t.rich('cta_benefit_3', { bold: (chunks) => <strong className="font-bold text-slate-900">{chunks}</strong> }),
    t.rich('cta_benefit_4', { bold: (chunks) => <strong className="font-bold text-slate-900">{chunks}</strong> }),
  ]

  return (
    <section className="provider-section">
      <div className="provider-container">

        {/* Left — copy */}
        <Reveal className="provider-copy">
          <p className="provider-label">Para proveedores</p>
          <h2 className="provider-title">{t('cta_title')}</h2>
          <p className="provider-desc">
            {t.rich('cta_subtitle', { bold: (chunks) => <strong className="font-bold text-slate-900">{chunks}</strong> })}
          </p>

          <ul className="provider-benefits">
            {benefits.map((item, idx) => (
              <li key={idx} className="provider-benefit">
                <span className="provider-benefit-icon" aria-hidden="true">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span className="provider-benefit-text">{item}</span>
              </li>
            ))}
          </ul>

          <div className="provider-actions">
            <Link href="/providers" className="provider-btn">
              {t('cta_button')}
              <ArrowRight className="provider-btn-icon" />
            </Link>
            <span className="provider-note">{t('cta_note')}</span>
          </div>
        </Reveal>

        {/* Right — real photo, swap /public/provider-background.jpg for your own */}
        <Reveal className="provider-image" delay={120}>
          <ParallaxImage
            src="/provider-background.jpg"
            alt="Proveedor de actividades en Torrevieja"
            speed={0.1}
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </Reveal>

      </div>
    </section>
  )
}
