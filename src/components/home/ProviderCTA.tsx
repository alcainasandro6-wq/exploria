'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, TrendingUp, Users, BarChart3, ArrowRight } from 'lucide-react'

export function ProviderCTA() {
  const t = useTranslations('home')

  const benefits = [
    { icon: Users, text: 'Accede a miles de turistas activos cada mes' },
    { icon: TrendingUp, text: 'Aumenta tus reservas hasta un 40%' },
    { icon: BarChart3, text: 'Panel de gestión profesional en tiempo real' },
    { icon: CheckCircle2, text: 'Sin coste fijo — comisión solo por reserva' },
  ]

  const stats = [
    { value: '150+', label: 'Actividades' },
    { value: '8.000+', label: 'Clientes' },
    { value: '4.8', label: 'Valoración' },
    { value: '45+', label: 'Proveedores' },
  ]

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight leading-none mb-5">
              {t('cta_title')}
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-lg">
              {t('cta_subtitle')}
            </p>

            <ul className="space-y-4 mb-10">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#005B8D]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#005B8D]" />
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/providers"
                className="inline-flex items-center gap-2 bg-[#005B8D] hover:bg-[#003654] text-white font-bold py-3.5 px-8 rounded-xl transition-colors"
              >
                {t('cta_button')} <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-slate-400">
                Solicitud revisada en 24–48 h
              </span>
            </div>
          </div>

          {/* Right: visual stats panel */}
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[#005B8D]/5 via-transparent to-sky-400/5 rounded-3xl" />

            <div className="relative bg-[#070D1F] rounded-3xl p-8 overflow-hidden">
              {/* Inner glow */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#005B8D]/15 blur-[60px] pointer-events-none" />

              {/* Header */}
              <div className="relative mb-8">
                <p className="text-slate-400 text-sm mb-1">Plataforma BookActivities</p>
                <p className="text-white font-black text-2xl">Tu negocio, en la Costa Blanca</p>
              </div>

              {/* Stats grid */}
              <div className="relative grid grid-cols-2 gap-3">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`rounded-2xl p-5 border ${
                      i === 0 ? 'bg-[#005B8D]/15 border-[#005B8D]/25' :
                      i === 1 ? 'bg-emerald-500/10 border-emerald-500/20' :
                      i === 2 ? 'bg-amber-400/10 border-amber-400/20' :
                                'bg-purple-500/10 border-purple-500/20'
                    }`}
                  >
                    <div className="text-2xl font-black text-white mb-0.5">{s.value}</div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA inside card */}
              <div className="relative mt-6 pt-6 border-t border-white/8">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Empieza con 30 días gratis</span>
                  <Link
                    href="/providers"
                    className="flex items-center gap-1.5 text-sm font-bold text-[#4D9EFF] hover:text-white transition-colors"
                  >
                    Únete <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
