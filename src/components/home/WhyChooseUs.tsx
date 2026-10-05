'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Clock, Headset } from 'lucide-react'
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
    desc: 'La mayoría de actividades admiten cancelación gratuita hasta 24–48 h antes. Reserva sin miedo a imprevistos.',
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
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="why-section">
      {/* Top strip — off-white */}
      <div className="why-top">
        <div className="why-container">
          <div className="why-header">
            <p className="why-label">Por qué elegirnos</p>
            <h2 className="why-title">
              Una forma más<br />sencilla de reservar
            </h2>
          </div>
          <p className="why-intro">
            Trabajamos solo con proveedores verificados y sin intermediarios en el pago,
            para que cada reserva se sienta tan segura como reservar directamente.
          </p>
        </div>
      </div>

      {/* Cards strip — dark */}
      <div className="why-dark">
        <div className="why-container">
          <div className="why-grid">
            {REASONS.map(({ num, icon: Icon, title, desc }, i) => (
              <div
                key={num}
                style={{ transitionDelay: visible ? `${i * 130}ms` : '0ms' }}
                className={cn(
                  'why-card',
                  visible ? 'why-card--visible' : 'why-card--hidden'
                )}
              >
                <span className="why-num" aria-hidden="true">{num}</span>
                <div className="why-icon-wrap">
                  <Icon className="why-icon" />
                </div>
                <h3 className="why-card-title">{title}</h3>
                <p className="why-card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
