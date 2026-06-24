import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

export function Footer() {
  const t = useTranslations('footer')

  const activities = [
    { href: '/activities?category=deportes-acuaticos', label: 'Deportes acuáticos' },
    { href: '/activities?category=excursiones-barco', label: 'Excursiones en barco' },
    { href: '/activities?category=buceo-snorkel', label: 'Buceo y snorkel' },
    { href: '/activities?category=tours-culturales', label: 'Tours culturales' },
    { href: '/activities?category=gastronomia', label: 'Gastronomía' },
  ]

  const company = [
    { href: '/about', label: 'Sobre nosotros' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contacto' },
    { href: '/faq', label: 'FAQ' },
    { href: '/auth/register?role=provider', label: 'Soy proveedor' },
    { href: '/auth/register?role=hotel', label: 'Soy hotel' },
  ]

  const legal = [
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
    { href: '/cookies', label: t('cookies') },
  ]

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-white">Exploria</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{t('description')}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Torrevieja, Alicante, España</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>+34 965 000 000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>hola@exploria.es</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {['Facebook', 'Instagram', 'Twitter', 'YouTube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[#0066FF] transition-colors text-xs font-bold text-slate-400 hover:text-white"
                >
                  {social.charAt(0)}
                </a>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('activities')}
            </h3>
            <ul className="space-y-2">
              {activities.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('company')}
            </h3>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {t('legal')}
            </h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-4 space-y-2">
              <div className="text-xs text-slate-500 leading-relaxed">
                Exploria actúa como intermediario tecnológico. Los servicios son prestados directamente por los proveedores.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Exploria. {t('rights')}.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Hecho con</span>
            <span className="text-red-400">♥</span>
            <span className="text-xs text-slate-600">en Torrevieja</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
