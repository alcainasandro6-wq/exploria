'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { MessageCircle, Phone, MapPin } from 'lucide-react'
import Image from 'next/image'

const WHATSAPP_NUMBER = '34658062392'
const PHONE_DISPLAY = '+34 658 06 23 92'

export function Footer() {
  const t = useTranslations('footer')
  const tn = useTranslations('nav')
  const pathname = usePathname()

  // Dashboards have their own chrome (sidebar with sign-out/language) — no
  // public-site footer there, matching the header being hidden too.
  if (pathname.startsWith('/dashboard')) return null

  const exploreLinks = [
    { href: '/activities', label: tn('activities') },
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
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand + contact */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center mb-3">
              <Image
                src="/logo.svg"
                alt="BookActivities"
                width={280}
                height={70}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-800 leading-relaxed mb-5 max-w-xs font-medium">
              {t('description')}
            </p>
            <div className="space-y-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-slate-900 font-semibold hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                {PHONE_DISPLAY}
              </a>
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="flex items-center gap-2.5 text-sm text-slate-900 font-semibold hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-primary shrink-0" />
                {PHONE_DISPLAY}
              </a>
              <div className="flex items-center gap-2.5 text-sm text-slate-800 font-medium">
                <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                Torrevieja, Alicante — España
              </div>
            </div>
          </div>

          {/* Explora */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-950 mb-3.5">{t('activities')}</h3>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-900 font-semibold hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-950 mb-3.5">{t('company')}</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-900 font-semibold hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-950 mb-3.5">{t('legal')}</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-900 font-semibold hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-10 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-700 font-medium">
            © {new Date().getFullYear()} BookActivities — {t('rights')}
          </p>
          <p className="text-xs text-slate-700 font-medium">
            Servicios receptivos · Torrevieja, Costa Blanca
          </p>
        </div>
      </div>
    </footer>
  )
}
