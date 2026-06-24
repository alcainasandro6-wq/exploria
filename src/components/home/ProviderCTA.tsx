'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, TrendingUp, Users, BarChart3, ArrowRight } from 'lucide-react'

export function ProviderCTA() {
  const t = useTranslations('home')

  const benefits = [
    { icon: Users, text: 'Accede a miles de turistas activos' },
    { icon: TrendingUp, text: 'Aumenta tus reservas hasta un 40%' },
    { icon: BarChart3, text: 'Panel de gestión profesional' },
    { icon: CheckCircle2, text: 'Sin coste fijo — comisión solo por reserva' },
  ]

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <span className="inline-block bg-[#0066FF]/20 text-[#60a5fa] text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 mb-6">
              Para proveedores de actividades
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
              {t('cta_title')}
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {t('cta_subtitle')}
            </p>
            <ul className="space-y-4 mb-10">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-[#0066FF]/20 rounded-full flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#60a5fa]" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/providers"
              className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-3.5 px-8 rounded-xl transition-colors"
            >
              {t('cta_button')} <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs text-slate-500">
              Proceso de solicitud y aprobación por el equipo Exploria
            </p>
          </div>

          {/* Right: decorative stats */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { value: '150+', label: 'Actividades publicadas', color: 'bg-[#0066FF]/10 border-[#0066FF]/20' },
              { value: '8.000+', label: 'Clientes satisfechos', color: 'bg-emerald-500/10 border-emerald-500/20' },
              { value: '4.8★', label: 'Valoración media', color: 'bg-yellow-400/10 border-yellow-400/20' },
              { value: '45+', label: 'Proveedores activos', color: 'bg-purple-500/10 border-purple-500/20' },
            ].map((stat) => (
              <div key={stat.label} className={`border rounded-2xl p-6 ${stat.color}`}>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
