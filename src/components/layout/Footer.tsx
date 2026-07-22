'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')

  const links = [
    { href: '/about', label: 'Sobre nosotros' },
    { href: '/blog', label: 'Guía de Torrevieja' },
    { href: '/faq', label: 'Preguntas frecuentes' },
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
    { href: '/cookies', label: t('cookies') },
    { href: '/providers', label: 'Acceso profesional' },
  ]

  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4">

          {/* Brand + copyright */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="inline-flex items-baseline">
              <span className="text-lg font-black tracking-[-0.06em] text-primary-dark" style={{ fontFamily: 'var(--font-display)' }}>
                bookactivities
              </span>
              <span className="text-lg font-black text-primary" style={{ fontFamily: 'var(--font-display)' }}>.</span>
            </Link>
            <span className="text-slate-300 hidden md:inline">·</span>
            <p className="text-xs text-slate-400 whitespace-nowrap">
              © {new Date().getFullYear()} BookActivities — Servicios receptivos
            </p>
          </div>

          {/* Inline link list */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-slate-500 hover:text-primary transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
