'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: '100dvh', minHeight: 560 }}
    >
      <Image
        src="/stats-background.jpg"
        alt="Torrevieja"
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

      <div className="absolute bottom-0 left-0 p-8 sm:p-12 lg:p-16 max-w-2xl">
        <p
          className={cn(
            'text-xs font-bold uppercase tracking-[0.25em] text-white/70 mb-4 transition-all duration-700 ease-out',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          Costa Blanca
        </p>
        <h2
          className={cn(
            'text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05] transition-all duration-700 ease-out delay-150',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          Vive Torrevieja<br />como nunca antes
        </h2>
      </div>
    </section>
  )
}
