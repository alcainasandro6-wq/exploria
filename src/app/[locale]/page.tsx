import { Hero } from '@/components/home/Hero'
import { FeaturedActivities } from '@/components/home/FeaturedActivities'
import { PacksSection } from '@/components/home/PacksSection'
import { BlogSection } from '@/components/home/BlogSection'
import { ProviderCTA } from '@/components/home/ProviderCTA'
import { getActivePacks } from '@/lib/services/packs'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    title: 'BookActivities - Actividades turísticas en Torrevieja',
    description: t.markup('hero_subtitle', { bold: (chunks) => chunks }),
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const packs = await getActivePacks()

  return (
    <>
      <Hero />
      <FeaturedActivities />
      <PacksSection packs={packs} />
      <BlogSection />
      <ProviderCTA />
    </>
  )
}
