'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations('auth_layout')

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — photo panel, hidden on mobile. Swap /public/auth-background.jpg for your own. */}
      <div className="hidden lg:block relative overflow-hidden bg-[#0A0F1E]">
        <Image
          src="/auth-background.jpg"
          alt="Actividades en Torrevieja"
          fill
          sizes="50vw"
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/90 via-primary-dark/70 to-[#0A0F1E]/90" />
        <div className="relative h-full flex flex-col justify-between p-12 xl:p-16">
          <div className="h-8" /> {/* Spacer instead of logo */}

          <div>
            <h2 className="text-[clamp(2rem,3.2vw,3rem)] font-black text-white leading-[1.05] max-w-lg">
              {t('heading')}
            </h2>
          </div>

          <p className="text-xs text-white/40">© {new Date().getFullYear()} BookActivities — Torrevieja, España</p>
        </div>
      </div>

      {/* Right — form panel. Anchored to the top below lg (rather than
          vertically centered) so the submit button's position doesn't
          depend on viewport height — centering it could land it under the
          fixed WhatsApp button on short mobile/tablet screens. */}
      <div className="flex items-start lg:items-center justify-center px-4 sm:px-8 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <Link href="/" className="lg:hidden inline-flex items-center mb-8">
            <Image
              src="/logo.svg"
              alt="BookActivities"
              width={320}
              height={80}
              className="h-14 w-auto object-contain"
            />
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}
