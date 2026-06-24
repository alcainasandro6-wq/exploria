'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, Building2, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProviderCTA() {
  const t = useTranslations('home')

  const benefits = [
    { icon: Users, text: 'Accede a miles de turistas activos' },
    { icon: TrendingUp, text: 'Aumenta tus reservas hasta un 40%' },
    { icon: Building2, text: 'Integración con hoteles colaboradores' },
    { icon: CheckCircle2, text: 'Panel de gestión profesional' },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Provider CTA */}
          <div className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] rounded-3xl p-8 text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-5">
              Para Proveedores
            </div>
            <h2 className="text-3xl font-extrabold mb-3">{t('cta_title')}</h2>
            <p className="text-blue-100 mb-6 leading-relaxed">{t('cta_subtitle')}</p>
            <ul className="space-y-3 mb-8">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=provider">
              <Button variant="white" size="lg" className="font-bold">
                {t('cta_button')} →
              </Button>
            </Link>
          </div>

          {/* Hotel CTA */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm font-medium mb-5">
              Para Hoteles
            </div>
            <h2 className="text-3xl font-extrabold mb-3">{t('hotels_title')}</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">{t('hotels_subtitle')}</p>
            <ul className="space-y-3 mb-8">
              {[
                'QR exclusivo para tu hotel',
                'Enlace de afiliado personalizado',
                'Comisión automática por reserva',
                'Panel de estadísticas en tiempo real',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0066FF] shrink-0" />
                  <span className="text-sm text-slate-300">{benefit}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=hotel">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-slate-900 font-bold">
                Registrar mi hotel →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
