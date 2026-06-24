export const SITE_NAME = 'Exploria'
export const SITE_DESCRIPTION = 'Descubre las mejores actividades turísticas en Torrevieja'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://exploria.es'

export const LOCALES = ['es', 'en', 'fr', 'de', 'pl', 'ru'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  pl: 'Polski',
  ru: 'Русский',
}

export const LOCALE_FLAGS: Record<string, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  pl: '🇵🇱',
  ru: '🇷🇺',
}

export const CATEGORIES = [
  { id: 'water-sports', name: 'Deportes acuáticos', icon: '', slug: 'deportes-acuaticos' },
  { id: 'boat-tours', name: 'Excursiones en barco', icon: '', slug: 'excursiones-barco' },
  { id: 'kayak', name: 'Kayak y piragüismo', icon: '', slug: 'kayak-piraguismo' },
  { id: 'diving', name: 'Buceo y snorkel', icon: '', slug: 'buceo-snorkel' },
  { id: 'cultural', name: 'Tours culturales', icon: '', slug: 'tours-culturales' },
  { id: 'gastronomy', name: 'Gastronomía', icon: '', slug: 'gastronomia' },
  { id: 'nature', name: 'Naturaleza y senderismo', icon: '', slug: 'naturaleza-senderismo' },
  { id: 'nightlife', name: 'Vida nocturna', icon: '', slug: 'vida-nocturna' },
]

export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    priceMonthly: 49,
    priceAnnual: 470,
    maxActivities: 5,
    features: [
      'Hasta 5 actividades publicadas',
      'Panel de gestión básico',
      'Soporte por email',
      'Estadísticas básicas',
    ],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 99,
    priceAnnual: 950,
    maxActivities: 20,
    features: [
      'Hasta 20 actividades publicadas',
      'Posicionamiento mejorado',
      'Soporte prioritario',
      'Estadísticas avanzadas',
      'Calendario de disponibilidad',
      'Exportación CSV',
    ],
  },
  premium: {
    name: 'Premium',
    priceMonthly: 199,
    priceAnnual: 1910,
    maxActivities: -1,
    features: [
      'Actividades ilimitadas',
      'Máxima visibilidad y destacados',
      'Soporte VIP 24/7',
      'Análisis completo de rendimiento',
      'Badge de proveedor verificado',
      'Campaña de marketing incluida',
      'API de integración',
    ],
  },
}

export const HOTEL_COMMISSION_RATE = 0.08
export const PLATFORM_COMMISSION_RATE = 0.05

export const COLORS = {
  primary: '#0066FF',
  primaryHover: '#0052CC',
  secondary: '#2E8BFF',
  white: '#FFFFFF',
  grayLight: '#F8FAFC',
  gray: '#64748B',
  grayDark: '#1E293B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
}
