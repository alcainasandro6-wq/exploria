'use client'

import { useEffect, useRef } from 'react'

/**
 * Shifts the returned ref's element vertically at a fraction of scroll
 * speed, based on its own position in the viewport (not global scrollY),
 * so multiple instances on the same page move independently of each other.
 */
export function useParallax<T extends HTMLElement>(speed = 0.15) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let ticking = false
    const update = () => {
      const rect = el.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const distanceFromCenter = rect.top + rect.height / 2 - viewportCenter
      el.style.transform = `translateY(${distanceFromCenter * speed * -1}px)`
      ticking = false
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [speed])

  return ref
}
