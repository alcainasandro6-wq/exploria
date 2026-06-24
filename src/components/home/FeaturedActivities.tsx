'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowUpRight } from 'lucide-react'
import { ActivityCard } from '@/components/activities/ActivityCard'
import type { Activity } from '@/types/database'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1', provider_id: 'p1', title: 'Buceo con instructores certificados en Torrevieja', slug: 'buceo-torrevieja', description: 'Sumérgete en las cristalinas aguas del Mediterráneo.', short_description: 'Sumérgete en las cristalinas aguas del Mediterráneo.', category_id: 'c1', price_from: 45, duration_minutes: 180, max_participants: 8, min_participants: 2, languages: ['es', 'en'], meeting_point: 'Puerto de Torrevieja', latitude: 37.9781, longitude: -0.6782, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: ['Equipo completo', 'Instructor'], excluded: ['Fotos subacuáticas'], requirements: ['Saber nadar'], status: 'published', featured: true, rating: 4.9, review_count: 127, booking_count: 342, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i1', activity_id: '1', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', alt: 'Buceo', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c1', name: 'Buceo y snorkel', slug: 'buceo-snorkel', description: null, icon: null, image_url: null, sort_order: 1, is_active: true, created_at: '' },
    provider: { id: 'p1', profile_id: 'pr1', company_name: 'Buceo Mediterráneo', slug: 'buceo-mediterraneo', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '2', provider_id: 'p2', title: 'Excursión en catamarán al atardecer con cena', slug: 'catamaran-atardecer', description: 'Navega por las aguas de Torrevieja al atardecer.', short_description: 'Navega por las aguas de Torrevieja al atardecer.', category_id: 'c2', price_from: 65, duration_minutes: 240, max_participants: 20, min_participants: 4, languages: ['es', 'en', 'de'], meeting_point: 'Puerto de Torrevieja', latitude: 37.9781, longitude: -0.6782, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: ['Cena incluida', 'Música en vivo'], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.8, review_count: 89, booking_count: 215, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i2', activity_id: '2', url: 'https://images.unsplash.com/photo-1559628233-100c798642d8?w=800&q=80', alt: 'Catamarán', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c2', name: 'Excursiones en barco', slug: 'excursiones-barco', description: null, icon: null, image_url: null, sort_order: 2, is_active: true, created_at: '' },
    provider: { id: 'p2', profile_id: 'pr2', company_name: 'Nautic Torrevieja', slug: 'nautic-torrevieja', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '3', provider_id: 'p3', title: 'Tour kayak por las lagunas rosas de Torrevieja', slug: 'kayak-lagunas-torrevieja', description: 'Explora las únicas lagunas rosadas en kayak.', short_description: 'Explora las únicas lagunas rosadas en kayak.', category_id: 'c3', price_from: 28, duration_minutes: 150, max_participants: 12, min_participants: 2, languages: ['es', 'en', 'ru'], meeting_point: 'Laguna Rosa, Torrevieja', latitude: 37.9600, longitude: -0.6900, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: ['Kayak', 'Chaleco salvavidas', 'Guía'], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.7, review_count: 64, booking_count: 156, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i3', activity_id: '3', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', alt: 'Kayak', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c3', name: 'Kayak y piragüismo', slug: 'kayak-piraguismo', description: null, icon: null, image_url: null, sort_order: 3, is_active: true, created_at: '' },
    provider: { id: 'p3', profile_id: 'pr3', company_name: 'Kayak Adventures', slug: 'kayak-adventures', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '4', provider_id: 'p4', title: 'Paddle Surf para principiantes en playa virgen', slug: 'paddle-surf-los-naufragos', description: 'Aprende paddle surf con instructores expertos.', short_description: 'Aprende paddle surf con instructores expertos.', category_id: 'c4', price_from: 25, duration_minutes: 90, max_participants: 10, min_participants: 1, languages: ['es', 'en'], meeting_point: 'Playa Los Naufragos', latitude: 37.9900, longitude: -0.6600, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: ['Tabla SUP', 'Remo', 'Instructor'], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.6, review_count: 42, booking_count: 98, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i4', activity_id: '4', url: 'https://images.unsplash.com/photo-1623016570059-c80ee11f7ae5?w=800&q=80', alt: 'Paddle Surf', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c4', name: 'Deportes acuáticos', slug: 'deportes-acuaticos', description: null, icon: null, image_url: null, sort_order: 4, is_active: true, created_at: '' },
    provider: { id: 'p4', profile_id: 'pr4', company_name: 'Blue Water Sports', slug: 'blue-water-sports', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '5', provider_id: 'p5', title: 'Tour gastronómico por el mercado municipal', slug: 'tour-gastronomico-mercado', description: 'Descubre la gastronomía alicantina de la mano de un experto.', short_description: 'Descubre la gastronomía alicantina de la mano de un experto.', category_id: 'c5', price_from: 55, duration_minutes: 180, max_participants: 12, min_participants: 4, languages: ['es', 'en', 'fr'], meeting_point: 'Mercado Municipal de Torrevieja', latitude: 37.9810, longitude: -0.6830, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: ['Degustaciones', 'Guía experto', 'Recetas'], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.9, review_count: 33, booking_count: 77, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i5', activity_id: '5', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', alt: 'Gastronomía', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c5', name: 'Gastronomía', slug: 'gastronomia', description: null, icon: null, image_url: null, sort_order: 5, is_active: true, created_at: '' },
    provider: { id: 'p5', profile_id: 'pr5', company_name: 'Sabores de la Costa', slug: 'sabores-de-la-costa', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' }
  },
  {
    id: '6', provider_id: 'p6', title: 'Senderismo al amanecer por el Parque Natural La Mata', slug: 'senderismo-parque-mata', description: 'Descubre la flora y fauna única del parque natural.', short_description: 'Descubre la flora y fauna única del parque natural.', category_id: 'c6', price_from: 20, duration_minutes: 240, max_participants: 15, min_participants: 3, languages: ['es', 'en'], meeting_point: 'Entrada Parque Natural La Mata', latitude: 38.0100, longitude: -0.6500, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: ['Guía naturalista', 'Prismáticos'], excluded: ['Comida', 'Transporte'], requirements: ['Calzado adecuado'], status: 'published', featured: false, rating: 4.5, review_count: 28, booking_count: 64, created_at: '2024-01-01', updated_at: '2024-01-01',
    images: [{ id: 'i6', activity_id: '6', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', alt: 'Senderismo', is_cover: true, sort_order: 0, created_at: '' }],
    category: { id: 'c6', name: 'Naturaleza y senderismo', slug: 'naturaleza-senderismo', description: null, icon: null, image_url: null, sort_order: 6, is_active: true, created_at: '' },
    provider: { id: 'p6', profile_id: 'pr6', company_name: 'Natura Guides', slug: 'natura-guides', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' }
  },
]

export function FeaturedActivities() {
  const t = useTranslations('home')

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A56FF] mb-3">
              Mejor valoradas
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight leading-none">
              {t('featured_title')}
            </h2>
          </div>
          <Link
            href="/activities"
            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#1A56FF] transition-colors"
          >
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_ACTIVITIES.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link
            href="/activities"
            className={cn(buttonVariants({ variant: 'outline' }), 'border-[#1A56FF] text-[#1A56FF] hover:bg-[#1A56FF] hover:text-white font-semibold')}
          >
            Ver todas las actividades
          </Link>
        </div>
      </div>
    </section>
  )
}
