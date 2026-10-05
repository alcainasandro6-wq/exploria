import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { CurrencyProvider } from '@/context/CurrencyContext'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter, Fredoka } from 'next/font/google'

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

// Used for headings on the public site only — dashboards keep --font-display
// (see globals.css .dashboard-shell override).
const titleFont = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-title',
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
      template: '%s | BookActivities',
      default: 'BookActivities - Actividades en Torrevieja',
    },
    description: t.markup('hero_subtitle', { bold: (chunks) => chunks }),
    keywords: ['actividades torrevieja', 'turismo alicante', 'excursiones torrevieja', 'deportes acuáticos'],
    authors: [{ name: 'BookActivities' }],
    metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL || 'https://bookactivities.com').trim().replace(/^﻿/, '')),
    openGraph: {
      type: 'website',
      locale: locale,
      siteName: 'BookActivities',
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
    <html lang={locale} suppressHydrationWarning className={`${displayFont.variable} ${bodyFont.variable} ${titleFont.variable}`}>
      <body className="min-h-screen w-full flex flex-col antialiased overflow-x-clip">
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider>
            <Navbar />
            <main className="flex-1 pt-20">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
          </CurrencyProvider>
          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
