import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Search, SlidersHorizontal } from 'lucide-react'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { ActivityFilters } from '@/components/activities/ActivityFilters'
import type { Metadata } from 'next'
import type { Activity } from '@/types/database'

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1', provider_id: 'p1', title: 'Buceo con instructores certificados en Torrevieja', slug: 'buceo-torrevieja', description: 'Sumérgete en las cristalinas aguas del Mediterráneo.', short_description: null, category_id: 'c1', price_from: 45, duration_minutes: 180, max_participants: 8, min_participants: 2, languages: ['es', 'en'], meeting_point: 'Puerto de Torrevieja', latitude: 37.9781, longitude: -0.6782, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.9, review_count: 127, booking_count: 342, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i1', activity_id: '1', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', alt: 'Buceo', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c1', name: 'Buceo y snorkel', slug: 'buceo-snorkel', description: null, icon: '🤿', image_url: null, sort_order: 1, is_active: true, created_at: '' },
    provider: { id: 'p1', profile_id: 'pr1', company_name: 'Buceo Mediterráneo', slug: 'buceo-mediterraneo', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '2', provider_id: 'p2', title: 'Excursión en catamarán al atardecer', slug: 'catamaran-atardecer', description: 'Navega al atardecer.', short_description: null, category_id: 'c2', price_from: 35, duration_minutes: 120, max_participants: 20, min_participants: 4, languages: ['es', 'en', 'de'], meeting_point: 'Puerto de Torrevieja', latitude: 37.9781, longitude: -0.6782, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.8, review_count: 89, booking_count: 215, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i2', activity_id: '2', url: 'https://images.unsplash.com/photo-1559628233-100c798642d8?w=800&q=80', alt: 'Catamarán', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c2', name: 'Excursiones en barco', slug: 'excursiones-barco', description: null, icon: '⛵', image_url: null, sort_order: 2, is_active: true, created_at: '' },
    provider: { id: 'p2', profile_id: 'pr2', company_name: 'Nautic Torrevieja', slug: 'nautic-torrevieja', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '3', provider_id: 'p3', title: 'Tour kayak por las lagunas de Torrevieja', slug: 'kayak-lagunas-torrevieja', description: 'Explora las lagunas rosadas.', short_description: null, category_id: 'c3', price_from: 28, duration_minutes: 150, max_participants: 12, min_participants: 2, languages: ['es', 'en', 'ru'], meeting_point: 'Laguna Rosa', latitude: 37.9600, longitude: -0.6900, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.7, review_count: 64, booking_count: 156, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i3', activity_id: '3', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', alt: 'Kayak', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c3', name: 'Kayak y piragüismo', slug: 'kayak-piraguismo', description: null, icon: '🚣', image_url: null, sort_order: 3, is_active: true, created_at: '' },
    provider: { id: 'p3', profile_id: 'pr3', company_name: 'Kayak Adventures', slug: 'kayak-adventures', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '4', provider_id: 'p4', title: 'Paddle Surf para principiantes', slug: 'paddle-surf-los-naufragos', description: 'Aprende paddle surf.', short_description: null, category_id: 'c4', price_from: 25, duration_minutes: 90, max_participants: 10, min_participants: 1, languages: ['es', 'en'], meeting_point: 'Playa Los Naufragos', latitude: 37.9900, longitude: -0.6600, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.6, review_count: 42, booking_count: 98, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i4', activity_id: '4', url: 'https://images.unsplash.com/photo-1623016570059-c80ee11f7ae5?w=800&q=80', alt: 'Paddle Surf', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c4', name: 'Deportes acuáticos', slug: 'deportes-acuaticos', description: null, icon: '🏄', image_url: null, sort_order: 4, is_active: true, created_at: '' },
    provider: { id: 'p4', profile_id: 'pr4', company_name: 'Blue Water Sports', slug: 'blue-water-sports', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '5', provider_id: 'p5', title: 'Tour gastronómico por el mercado municipal', slug: 'tour-gastronomico-mercado', description: 'Descubre la gastronomía alicantina.', short_description: null, category_id: 'c5', price_from: 55, duration_minutes: 180, max_participants: 12, min_participants: 4, languages: ['es', 'en', 'fr'], meeting_point: 'Mercado Municipal', latitude: 37.9810, longitude: -0.6830, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.9, review_count: 33, booking_count: 77, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i5', activity_id: '5', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', alt: 'Gastronomía', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c5', name: 'Gastronomía', slug: 'gastronomia', description: null, icon: '🍽️', image_url: null, sort_order: 5, is_active: true, created_at: '' },
    provider: { id: 'p5', profile_id: 'pr5', company_name: 'Sabores de la Costa', slug: 'sabores-de-la-costa', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '6', provider_id: 'p6', title: 'Senderismo por el Parque Natural de la Mata', slug: 'senderismo-parque-mata', description: 'Descubre la flora y fauna.', short_description: null, category_id: 'c6', price_from: 20, duration_minutes: 240, max_participants: 15, min_participants: 3, languages: ['es', 'en'], meeting_point: 'Parque Natural La Mata', latitude: 38.0100, longitude: -0.6500, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.5, review_count: 28, booking_count: 64, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i6', activity_id: '6', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', alt: 'Senderismo', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c6', name: 'Naturaleza', slug: 'naturaleza-senderismo', description: null, icon: '🌿', image_url: null, sort_order: 6, is_active: true, created_at: '' },
    provider: { id: 'p6', profile_id: 'pr6', company_name: 'Natura Guides', slug: 'natura-guides', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' }
  },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'activities' })
  return { title: t('title') }
}

export default async function ActivitiesPage() {
  const t = await getTranslations('activities')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{t('title')}</h1>
          <p className="text-slate-500">
            {MOCK_ACTIVITIES.length} actividades disponibles en Torrevieja
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <ActivityFilters />
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <span className="text-sm text-slate-500">{MOCK_ACTIVITIES.length} resultados</span>
              <button className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-50">
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </button>
            </div>

            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6 hidden lg:flex">
              <span className="text-sm text-slate-500">{MOCK_ACTIVITIES.length} actividades encontradas</span>
              <select className="text-sm border border-slate-200 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]">
                <option value="relevance">Relevancia</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {MOCK_ACTIVITIES.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
