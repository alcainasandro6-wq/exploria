'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, Building2, TrendingUp, Users, ArrowRight } from 'lucide-react'

export function ProviderCTA() {
  const t = useTranslations('home')

  const providerBenefits = [
    { icon: Users, text: 'Accede a miles de turistas activos' },
    { icon: TrendingUp, text: 'Aumenta tus reservas hasta un 40%' },
    { icon: Building2, text: 'Integración con hoteles colaboradores' },
    { icon: CheckCircle2, text: 'Panel de gestión profesional' },
  ]

  const hotelBenefits = [
    'QR exclusivo para tu hotel',
    'Enlace de afiliado personalizado',
    'Comisión automática por reserva',
    'Panel de estadísticas en tiempo real',
  ]

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Únete a la plataforma líder
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Tanto si eres proveedor de actividades como hotel, Exploria tiene el plan perfecto para ti
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Provider CTA */}
          <div className="relative bg-gradient-to-br from-[#0066FF] to-[#0044bb] rounded-3xl p-8 md:p-10 text-white flex flex-col overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 mb-6">
                Para Proveedores
              </span>
              <h3 className="text-2xl md:text-3xl font-black mb-2">{t('cta_title')}</h3>
              <p className="text-blue-100 mb-8 leading-relaxed">{t('cta_subtitle')}</p>
              <ul className="space-y-4 mb-10 flex-1">
                {providerBenefits.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?role=provider"
                className="inline-flex items-center justify-center gap-2 w-full bg-white text-[#0066FF] font-bold py-3.5 px-6 rounded-xl hover:bg-blue-50 transition-colors"
              >
                {t('cta_button')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Hotel CTA */}
          <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-8 md:p-10 text-white flex flex-col overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/3 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative">
              <span className="inline-block bg-[#0066FF]/20 text-[#60a5fa] text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 mb-6">
                Para Hoteles
              </span>
              <h3 className="text-2xl md:text-3xl font-black mb-2">{t('hotels_title')}</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">{t('hotels_subtitle')}</p>
              <ul className="space-y-4 mb-10 flex-1">
                {hotelBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#0066FF] shrink-0" />
                    <span className="text-sm font-medium text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?role=hotel"
                className="inline-flex items-center justify-center gap-2 w-full border-2 border-slate-600 text-white font-bold py-3.5 px-6 rounded-xl hover:border-[#0066FF] hover:bg-[#0066FF]/10 transition-all"
              >
                Registrar mi hotel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
