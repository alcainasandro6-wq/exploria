import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ShieldCheck, BadgeCheck, Clock } from 'lucide-react'

const TRUST_POINTS = [
  { icon: BadgeCheck, text: 'Proveedores verificados en Torrevieja' },
  { icon: ShieldCheck, text: 'Sin pago online: reservas seguras y directas' },
  { icon: Clock, text: 'Cancelación gratuita en la mayoría de actividades' },
]

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — photo panel, hidden on mobile */}
      <div className="hidden lg:block relative overflow-hidden bg-[#0A0F1E]">
        <Image
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80"
          alt="Actividades en Torrevieja"
          fill
          sizes="50vw"
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/90 via-primary-dark/70 to-[#0A0F1E]/90" />

        <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="inline-flex items-baseline w-fit">
            <span className="text-2xl font-black tracking-[-0.06em] text-white" style={{ fontFamily: 'var(--font-display)' }}>
              bookactivities
            </span>
            <span className="text-2xl font-black text-white/70" style={{ fontFamily: 'var(--font-display)' }}>.</span>
          </Link>

          <div>
            <h2 className="text-[clamp(2rem,3.2vw,3rem)] font-black text-white leading-[1.05] mb-6 max-w-lg">
              El marketplace de experiencias con garantía de calidad
            </h2>
            <div className="space-y-3.5">
              {TRUST_POINTS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white/85 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/40">© {new Date().getFullYear()} BookActivities — Torrevieja, España</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center px-4 sm:px-8 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <Link href="/" className="lg:hidden inline-flex items-baseline mb-8">
            <span className="text-2xl font-black tracking-[-0.06em] text-primary-dark" style={{ fontFamily: 'var(--font-display)' }}>
              bookactivities
            </span>
            <span className="text-2xl font-black text-primary" style={{ fontFamily: 'var(--font-display)' }}>.</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}
