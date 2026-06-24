import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'

const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: {
      template: '%s | Exploria',
      default: 'Exploria - Actividades en Torrevieja',
    },
    description: t('hero_subtitle'),
    keywords: ['actividades torrevieja', 'turismo alicante', 'excursiones torrevieja', 'deportes acuáticos'],
    authors: [{ name: 'Exploria' }],
    metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL || 'https://exploria.es').trim().replace(/^﻿/, '')),
    openGraph: {
      type: 'website',
      locale: locale,
      siteName: 'Exploria',
    },
    alternates: {
      languages: {
        'es': '/es',
        'en': '/en',
        'fr': '/fr',
        'de': '/de',
        'pl': '/pl',
        'ru': '/ru',
      },
    },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'es' | 'en' | 'fr' | 'de' | 'pl' | 'ru')) {
    notFound()
  }

  setRequestLocale(locale)

  let messages
  try {
    messages = await getMessages()
  } catch (e) {
    console.error('[Layout] getMessages failed:', e)
    throw e
  }

  return (
    <html lang={locale} suppressHydrationWarning className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen w-full flex flex-col antialiased overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider>
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
          </CurrencyProvider>
          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
