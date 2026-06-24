'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, Mail, ArrowUpRight } from 'lucide-react'

const SOCIAL = [
  { letter: 'ig', label: 'Instagram', href: '#' },
  { letter: 'tw', label: 'X / Twitter', href: '#' },
  { letter: 'fb', label: 'Facebook', href: '#' },
  { letter: 'yt', label: 'YouTube', href: '#' },
]

export function Footer() {
  const t = useTranslations('footer')

  const columns = [
    {
      title: 'Actividades',
      links: [
        { href: '/activities?category=deportes-acuaticos', label: 'Deportes acuáticos' },
        { href: '/activities?category=excursiones-barco', label: 'Excursiones en barco' },
        { href: '/activities?category=buceo-snorkel', label: 'Buceo y snorkel' },
        { href: '/activities?category=tours-culturales', label: 'Tours culturales' },
        { href: '/activities?category=gastronomia', label: 'Gastronomía' },
        { href: '/activities', label: 'Ver todas' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { href: '/about', label: 'Sobre nosotros' },
        { href: '/blog', label: 'Blog' },
        { href: '/providers', label: 'Publica actividades' },
        { href: '/contact', label: 'Contacto' },
        { href: '/faq', label: 'Preguntas frecuentes' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/terms', label: t('terms') },
        { href: '/privacy', label: t('privacy') },
        { href: '/cookies', label: t('cookies') },
      ],
    },
  ]

  return (
    <footer className="bg-[#070D1F] text-slate-400">

      {/* Top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#1A56FF]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand — 2 cols */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-5">

            {/* Logo */}
            <Link href="/" className="inline-flex items-baseline">
              <span
                className="text-[26px] font-black tracking-[-0.06em] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                exploria
              </span>
              <span
                className="text-[26px] font-black text-[#1A56FF]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                .
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              La plataforma de actividades turísticas de referencia en la Costa Blanca. Experiencias auténticas con proveedores verificados.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#1A56FF]/60 shrink-0" />
                <span className="text-slate-500">Torrevieja, Alicante, España</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#1A56FF]/60 shrink-0" />
                <span className="text-slate-500">hola@exploria.es</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-2 pt-1">
              {SOCIAL.map(({ letter, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center text-[9px] font-black uppercase text-slate-500 hover:text-white hover:border-[#1A56FF]/50 hover:bg-[#1A56FF]/12 transition-all duration-200"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="group text-sm text-slate-500 hover:text-white transition-colors duration-150 flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity duration-150" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} Exploria · Todos los derechos reservados
          </p>
          <p className="text-xs text-slate-800">
            Plataforma intermediaria de servicios turísticos · Torrevieja, España
          </p>
        </div>
      </div>
    </footer>
  )
}
