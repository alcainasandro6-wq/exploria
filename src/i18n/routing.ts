import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en', 'fr', 'de', 'pl', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: false,
})
