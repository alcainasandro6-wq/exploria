import { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/constants'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookactivities.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/activities', '/categories', '/blog', '/about', '/contact', '/faq', '/terms', '/privacy', '/cookies']

  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    }
  }

  return entries
}
