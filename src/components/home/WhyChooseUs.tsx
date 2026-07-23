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
    title: 'Garantía de calidad',
    desc: 'Cada proveedor pasa por un proceso de verificación antes de publicar. Experiencias reales, valoradas por viajeros reales.',
  },
  {
    num: '02',
    icon: Clock,
    title: 'Cancelación flexible',
    desc: 'La mayoría de actividades admiten cancelación gratuita hasta 24-48h antes. Reserva sin miedo a imprevistos.',
  },
  {
    num: '03',
    icon: Headset,
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
    <section ref={sectionRef} className="py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'text-center mb-16 transition-all duration-700 ease-out',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-black tracking-tight">¿Por qué elegirnos?</h2>
          <div className="h-px w-16 bg-black/20 mx-auto mt-5" />
        </div>

        <div className="grid sm:grid-cols-3 gap-7">
          {REASONS.map(({ num, icon: Icon, title, desc }, i) => (
            <div
              key={num}
              style={{ transitionDelay: visible ? `${i * 140}ms` : '0ms' }}
              className={cn(
                'group relative bg-white rounded-2xl border border-slate-200 p-8 pt-10',
                'transition-all duration-500 ease-out will-change-transform',
                'hover:-translate-y-1.5 hover:border-black hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              )}
            >
              <span className="absolute top-4 right-5 text-xs font-semibold text-slate-300 tracking-wide">
                {num}
              </span>
              <div
                className={cn(
                  'w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center mb-6',
                  'transition-colors duration-300 ease-out group-hover:bg-black group-hover:border-black'
                )}
              >
                <Icon className="w-6 h-6 text-black transition-colors duration-300 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg text-black mb-2.5">{title}</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed">{desc}</p>

              <div className="absolute inset-x-0 bottom-0 h-px bg-black scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/activities" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full text-sm font-semibold px-6 py-3')}>
            Nuestros servicios →
          </Link>
        </div>
      </div>
    </section>
  )
}
