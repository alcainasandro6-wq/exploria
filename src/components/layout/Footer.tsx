'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, Mail, ArrowUpRight } from 'lucide-react'

const SOCIAL = [
  { letter: 'in', label: 'Instagram', href: '#' },
  { letter: 'x', label: 'X / Twitter', href: '#' },
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
      ],
    },
    {
      title: 'Para empresas',
      links: [
        { href: '/providers', label: 'Publica actividades' },
        { href: '/providers', label: 'Hoteles afiliados' },
        { href: '/about', label: 'Sobre nosotros' },
        { href: '/blog', label: 'Blog' },
        { href: '/contact', label: 'Contacto' },
      ],
    },
    {
      title: 'Soporte',
      links: [
        { href: '/faq', label: 'Preguntas frecuentes' },
        { href: '/terms', label: t('terms') },
        { href: '/privacy', label: t('privacy') },
        { href: '/cookies', label: t('cookies') },
      ],
    },
  ]

  return (
    <footer className="relative bg-[#070D1F] text-slate-400 overflow-hidden">

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1A56FF]/50 to-transparent" />

      {/* Blue glow from top center */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-[#1A56FF]/5 blur-[90px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="pt-16 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand — spans 2 cols on lg */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-6">
            <img
              src="/logo.svg"
              alt="Exploria"
              width={126}
              height={34}
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Descubre las mejores experiencias en el Mediterráneo. Tu puerta a aventuras auténticas en la Costa Blanca.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-[#1A56FF]/70 shrink-0" />
                <span className="text-slate-500">Torrevieja, Alicante, España</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[#1A56FF]/70 shrink-0" />
                <span className="text-slate-500">hola@exploria.es</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              {SOCIAL.map(({ letter, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-slate-600 hover:text-white hover:border-[#1A56FF]/50 hover:bg-[#1A56FF]/12 transition-all duration-300 text-[10px] font-bold uppercase"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="group text-sm text-slate-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} Exploria · Todos los derechos reservados
          </p>
          <p className="text-xs text-slate-800">
            Plataforma intermediaria · Torrevieja, España
          </p>
        </div>
      </div>
    </footer>
  )
}
