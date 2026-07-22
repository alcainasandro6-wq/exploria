'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Clock, Headset } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const REASONS = [
  {
    num: '01',
    icon: ShieldCheck,
    gradient: 'from-violet-500 to-indigo-500',
    title: 'Garantía de calidad',
    desc: 'Cada proveedor pasa por un proceso de verificación antes de publicar. Experiencias reales, valoradas por viajeros reales.',
  },
  {
    num: '02',
    icon: Clock,
    gradient: 'from-emerald-500 to-teal-500',
    title: 'Cancelación flexible',
    desc: 'La mayoría de actividades admiten cancelación gratuita hasta 24-48h antes. Reserva sin miedo a imprevistos.',
  },
  {
    num: '03',
    icon: Headset,
    gradient: 'from-amber-500 to-orange-500',
    title: 'Atención personalizada',
    desc: 'Sin pago online: hablas directamente con el proveedor para confirmar cada detalle de tu experiencia.',
  },
] as const

export function WhyChooseUs() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'text-center mb-16 transition-all duration-700 ease-out',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">¿Por qué elegirnos?</h2>
          <div className="h-1 w-16 bg-primary rounded-full mx-auto mt-5" />
        </div>

        <div className="grid sm:grid-cols-3 gap-7">
          {REASONS.map(({ num, icon: Icon, gradient, title, desc }, i) => (
            <div
              key={num}
              style={{ transitionDelay: visible ? `${i * 140}ms` : '0ms' }}
              className={cn(
                'group relative bg-white rounded-2xl border border-slate-100 p-8 pt-10 shadow-sm',
                'transition-all duration-700 ease-out will-change-transform',
                'hover:-translate-y-2 hover:shadow-xl hover:border-transparent',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              )}
            >
              <span className="absolute top-4 right-5 text-xs font-bold text-slate-300 tracking-wide transition-colors group-hover:text-slate-200">
                {num}
              </span>
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-sm',
                  'transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6',
                  gradient
                )}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2.5">{title}</h3>
              <p className="text-base text-slate-500 leading-relaxed">{desc}</p>

              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-gradient-to-r scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out',
                  gradient
                )}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/activities" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full text-base px-6 py-3')}>
            Nuestros servicios →
          </Link>
        </div>
      </div>
    </section>
  )
}
