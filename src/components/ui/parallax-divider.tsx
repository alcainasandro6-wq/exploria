'use client'

import { ParallaxImage } from '@/components/ui/parallax-image'

interface ParallaxDividerProps {
  src: string
  alt: string
  /** 0.05–0.15 is a good range */
  speed?: number
  height?: string
}

/**
 * Full-bleed parallax image strip used as a visual break between sections.
 * No gradient, no text — pure image with a subtle dark tint.
 */
export function ParallaxDivider({ src, alt, speed = 0.1, height = '40vh' }: ParallaxDividerProps) {
  return (
    <div
      className="parallax-divider"
      style={{ height, minHeight: 220 }}
      aria-hidden="true"
    >
      <ParallaxImage src={src} alt={alt} speed={speed} sizes="100vw" />
      <div className="parallax-divider-tint" />
    </div>
  )
}
