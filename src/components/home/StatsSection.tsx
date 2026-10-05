'use client'

import { useEffect, useRef, useState } from 'react'
import { ParallaxImage } from '@/components/ui/parallax-image'
import { cn } from '@/lib/utils'

const STATS = [
  { value: '+3 000', label: 'Viajeros al año' },
  { value: '98 %', label: 'Satisfacción media' },
  { value: '+40', label: 'Actividades disponibles' },
]

export function StatsSection() {
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
    <section ref={sectionRef} className="stats-section">
      {/* Full-bleed parallax backdrop */}
      <ParallaxImage src="/stats-background.jpg" alt="Torrevieja" speed={0.08} sizes="100vw" priority />

      {/* Flat dark tints — no gradients */}
      <div className="stats-tint stats-tint--base" />
      <div className="stats-tint stats-tint--bottom" />

      {/* Content layer */}
      <div className="stats-inner">

        {/* Eyebrow + headline — bottom-left editorial */}
        <div className="stats-copy">
          <p
            className={cn(
              'stats-eyebrow',
              visible ? 'stats-anim--in' : 'stats-anim--out'
            )}
          >
            Costa Blanca
          </p>
          <h2
            className={cn(
              'stats-headline',
              visible ? 'stats-anim--in stats-anim--delay-1' : 'stats-anim--out'
            )}
          >
            Vive Torrevieja<br />como nunca antes
          </h2>
        </div>

        {/* Stat pills — bottom-right */}
        <div className="stats-pills">
          {STATS.map(({ value, label }, i) => (
            <div
              key={label}
              style={{ transitionDelay: visible ? `${200 + i * 120}ms` : '0ms' }}
              className={cn(
                'stats-pill',
                visible ? 'stats-anim--in' : 'stats-anim--out'
              )}
            >
              <span className="stats-pill-value">{value}</span>
              <span className="stats-pill-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
