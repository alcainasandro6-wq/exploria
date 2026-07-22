'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MessageCircle, Phone, MapPin } from 'lucide-react'

const WHATSAPP_NUMBER = '34658062392'
const PHONE_DISPLAY = '+34 658 06 23 92'

export function Footer() {
  const t = useTranslations('footer')
  const tn = useTranslations('nav')

  const exploreLinks = [
    { href: '/activities', label: tn('activities') },
    { href: '/categories', label: tn('categories') },
    { href: '/providers', label: tn('providers') },
    { href: '/blog', label: tn('blog') },
  ]

  const companyLinks = [
    { href: '/about', label: tn('about') },
    { href: '/faq', label: 'Preguntas frecuentes' },
    { href: '/contact', label: tn('contact') },
    { href: '/providers', label: 'Acceso profesional' },
  ]

  const legalLinks = [
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
    { href: '/cookies', label: t('cookies') },
  ]

  return (
    <footer className="bg-[#070D1F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand + contact */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-baseline mb-4">
              <span className="text-2xl font-black tracking-[-0.06em] text-white" style={{ fontFamily: 'var(--font-display)' }}>
                bookactivities
              </span>
              <span className="text-2xl font-black text-secondary" style={{ fontFamily: 'var(--font-display)' }}>.</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-xs">
              {t('description')}
            </p>
            <div className="space-y-2.5">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {PHONE_DISPLAY}
              </a>
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                {PHONE_DISPLAY}
              </a>
              <div className="flex items-center gap-2.5 text-sm text-white/50">
                <MapPin className="w-4 h-4 shrink-0" />
                Torrevieja, Alicante — España
              </div>
            </div>
          </div>

          {/* Explora */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{t('activities')}</h3>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{t('company')}</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{t('legal')}</h3>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} BookActivities — {t('rights')}
          </p>
          <p className="text-xs text-white/40">
            Servicios receptivos · Torrevieja, Costa Blanca
          </p>
        </div>
      </div>
    </footer>
  )
}
