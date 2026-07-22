import { Hero } from '@/components/home/Hero'
import { FeaturedActivities } from '@/components/home/FeaturedActivities'
import { StatsSection } from '@/components/home/StatsSection'
import { ProviderCTA } from '@/components/home/ProviderCTA'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    title: 'BookActivities - Actividades turísticas en Torrevieja',
    description: t('hero_subtitle'),
  }
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedActivities />
      <StatsSection />
      <ProviderCTA />
    </>
  )
}
