'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { ActivityFilters } from '@/components/activities/ActivityFilters'
import { CATEGORIES } from '@/lib/constants'
import type { Activity } from '@/types/database'

const ALL_ACTIVITIES: Activity[] = [
  { id: '1', provider_id: 'p1', title: 'Buceo con instructores certificados en Torrevieja', slug: 'buceo-torrevieja', description: 'Sumérgete en las cristalinas aguas del Mediterráneo con instructores certificados PADI.', short_description: 'Descubre el fondo marino mediterráneo.', category_id: 'c1', price_from: 45, duration_minutes: 180, max_participants: 8, min_participants: 2, languages: ['es', 'en'], meeting_point: 'Puerto de Torrevieja', latitude: 37.9781, longitude: -0.6782, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.9, review_count: 127, booking_count: 342, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i1', activity_id: '1', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', alt: 'Buceo', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c1', name: 'Buceo y snorkel', slug: 'buceo-snorkel', description: null, icon: '🤿', image_url: null, sort_order: 1, is_active: true, created_at: '' }, provider: { id: 'p1', profile_id: 'pr1', company_name: 'Buceo Mediterráneo', slug: 'buceo-mediterraneo', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '2', provider_id: 'p2', title: 'Excursión en catamarán al atardecer con cena', slug: 'catamaran-atardecer', description: 'Navega al atardecer por las aguas de Torrevieja con cena incluida.', short_description: 'Puesta de sol desde el mar con cena.', category_id: 'c2', price_from: 65, duration_minutes: 240, max_participants: 20, min_participants: 4, languages: ['es', 'en', 'de'], meeting_point: 'Puerto de Torrevieja', latitude: 37.9781, longitude: -0.6782, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.8, review_count: 89, booking_count: 215, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i2', activity_id: '2', url: 'https://images.unsplash.com/photo-1559628233-100c798642d8?w=800&q=80', alt: 'Catamarán', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c2', name: 'Excursiones en barco', slug: 'excursiones-barco', description: null, icon: '⛵', image_url: null, sort_order: 2, is_active: true, created_at: '' }, provider: { id: 'p2', profile_id: 'pr2', company_name: 'Nautic Torrevieja', slug: 'nautic-torrevieja', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '3', provider_id: 'p3', title: 'Tour kayak por las lagunas rosas de Torrevieja', slug: 'kayak-lagunas-torrevieja', description: 'Explora las icónicas lagunas de color rosa en kayak.', short_description: 'Laguna rosa y salada en kayak.', category_id: 'c3', price_from: 28, duration_minutes: 150, max_participants: 12, min_participants: 2, languages: ['es', 'en', 'ru'], meeting_point: 'Laguna Rosa', latitude: 37.9600, longitude: -0.6900, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.7, review_count: 64, booking_count: 156, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i3', activity_id: '3', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', alt: 'Kayak', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c3', name: 'Kayak y piragüismo', slug: 'kayak-piraguismo', description: null, icon: '🚣', image_url: null, sort_order: 3, is_active: true, created_at: '' }, provider: { id: 'p3', profile_id: 'pr3', company_name: 'Kayak Adventures', slug: 'kayak-adventures', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' } },
  { id: '4', provider_id: 'p4', title: 'Paddle Surf para principiantes en playa virgen', slug: 'paddle-surf-los-naufragos', description: 'Aprende paddle surf con instructor privado.', short_description: 'Iniciación al SUP en aguas tranquilas.', category_id: 'c4', price_from: 25, duration_minutes: 90, max_participants: 10, min_participants: 1, languages: ['es', 'en'], meeting_point: 'Playa Los Naufragos', latitude: 37.9900, longitude: -0.6600, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.6, review_count: 42, booking_count: 98, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i4', activity_id: '4', url: 'https://images.unsplash.com/photo-1623016570059-c80ee11f7ae5?w=800&q=80', alt: 'Paddle Surf', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c4', name: 'Deportes acuáticos', slug: 'deportes-acuaticos', description: null, icon: '🏄', image_url: null, sort_order: 4, is_active: true, created_at: '' }, provider: { id: 'p4', profile_id: 'pr4', company_name: 'Blue Water Sports', slug: 'blue-water-sports', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '5', provider_id: 'p5', title: 'Tour gastronómico por el mercado municipal', slug: 'tour-gastronomico-mercado', description: 'Descubre los sabores auténticos de la cocina alicantina.', short_description: 'Tapas, vinos y arroces locales.', category_id: 'c5', price_from: 55, duration_minutes: 180, max_participants: 12, min_participants: 4, languages: ['es', 'en', 'fr'], meeting_point: 'Mercado Municipal', latitude: 37.9810, longitude: -0.6830, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.9, review_count: 33, booking_count: 77, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i5', activity_id: '5', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', alt: 'Gastronomía', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c5', name: 'Gastronomía', slug: 'gastronomia', description: null, icon: '🍽️', image_url: null, sort_order: 5, is_active: true, created_at: '' }, provider: { id: 'p5', profile_id: 'pr5', company_name: 'Sabores de la Costa', slug: 'sabores-de-la-costa', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '6', provider_id: 'p6', title: 'Senderismo al amanecer por el Parque Natural La Mata', slug: 'senderismo-parque-mata', description: 'Descubre la flora y fauna mediterránea al amanecer.', short_description: 'Flora y fauna del parque natural.', category_id: 'c6', price_from: 20, duration_minutes: 240, max_participants: 15, min_participants: 3, languages: ['es', 'en'], meeting_point: 'Parque Natural La Mata', latitude: 38.0100, longitude: -0.6500, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.5, review_count: 28, booking_count: 64, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i6', activity_id: '6', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', alt: 'Senderismo', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c6', name: 'Naturaleza', slug: 'naturaleza-senderismo', description: null, icon: '🌿', image_url: null, sort_order: 6, is_active: true, created_at: '' }, provider: { id: 'p6', profile_id: 'pr6', company_name: 'Natura Guides', slug: 'natura-guides', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' } },
  { id: '7', provider_id: 'p7', title: 'Avistamiento de delfines en barco', slug: 'avistamiento-delfines', description: 'Sal a mar abierto a observar delfines en su hábitat natural.', short_description: 'Delfines en libertad frente a la costa.', category_id: 'c2', price_from: 38, duration_minutes: 150, max_participants: 16, min_participants: 4, languages: ['es', 'en', 'de'], meeting_point: 'Puerto de Torrevieja, Dársena Sur', latitude: 37.9750, longitude: -0.6800, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 4.9, review_count: 156, booking_count: 412, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i7', activity_id: '7', url: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80', alt: 'Delfines', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c2', name: 'Excursiones en barco', slug: 'excursiones-barco', description: null, icon: '⛵', image_url: null, sort_order: 2, is_active: true, created_at: '' }, provider: { id: 'p7', profile_id: 'pr7', company_name: 'Mar Azul Trips', slug: 'mar-azul-trips', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '8', provider_id: 'p8', title: 'Clase de flamenco con bailaora profesional', slug: 'clase-flamenco-torrevieja', description: 'Aprende los pasos del flamenco con una bailaora profesional.', short_description: 'Iniciación al flamenco en Torrevieja.', category_id: 'c5', price_from: 30, duration_minutes: 90, max_participants: 10, min_participants: 2, languages: ['es', 'en', 'fr', 'de'], meeting_point: 'Centro Cultural, Plaza Mayor', latitude: 37.9810, longitude: -0.6820, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.8, review_count: 45, booking_count: 88, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i8', activity_id: '8', url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80', alt: 'Flamenco', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c5', name: 'Tours culturales', slug: 'tours-culturales', description: null, icon: '🏛️', image_url: null, sort_order: 5, is_active: true, created_at: '' }, provider: { id: 'p8', profile_id: 'pr8', company_name: 'Arte Flamenco', slug: 'arte-flamenco', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '9', provider_id: 'p9', title: 'Windsurf — curso intensivo de 2 días', slug: 'windsurf-curso-torrevieja', description: 'Aprende windsurf desde cero en 2 días con monitores certificados.', short_description: 'Domina el windsurf en fin de semana.', category_id: 'c4', price_from: 89, duration_minutes: 480, max_participants: 6, min_participants: 1, languages: ['es', 'en'], meeting_point: 'Playa de La Mata', latitude: 38.0050, longitude: -0.6550, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.7, review_count: 19, booking_count: 41, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i9', activity_id: '9', url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80', alt: 'Windsurf', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c4', name: 'Deportes acuáticos', slug: 'deportes-acuaticos', description: null, icon: '🏄', image_url: null, sort_order: 4, is_active: true, created_at: '' }, provider: { id: 'p9', profile_id: 'pr9', company_name: 'Wind & Waves', slug: 'wind-waves', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '10', provider_id: 'p10', title: 'Ruta en bici por el litoral de Torrevieja', slug: 'ruta-bici-litoral', description: 'Recorre el litoral de Torrevieja en bicicleta eléctrica con guía local.', short_description: 'Cicloturismo por la costa mediterránea.', category_id: 'c6', price_from: 22, duration_minutes: 120, max_participants: 12, min_participants: 2, languages: ['es', 'en', 'de', 'pl'], meeting_point: 'Paseo Juan Aparicio, Kiosco Central', latitude: 37.9850, longitude: -0.6750, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.6, review_count: 37, booking_count: 82, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i10', activity_id: '10', url: 'https://images.unsplash.com/photo-1558618047-3c8f17e7c90e?w=800&q=80', alt: 'Bicicleta', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c6', name: 'Naturaleza', slug: 'naturaleza-senderismo', description: null, icon: '🌿', image_url: null, sort_order: 6, is_active: true, created_at: '' }, provider: { id: 'p10', profile_id: 'pr10', company_name: 'Costa Bike Tours', slug: 'costa-bike-tours', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: false, is_active: true, created_at: '', updated_at: '' } },
  { id: '11', provider_id: 'p11', title: 'Snorkel nocturno con luces LED submarinas', slug: 'snorkel-nocturno', description: 'Una experiencia única: snorkel de noche con equipos de iluminación LED.', short_description: 'El fondo marino de noche, iluminado.', category_id: 'c1', price_from: 42, duration_minutes: 120, max_participants: 8, min_participants: 2, languages: ['es', 'en'], meeting_point: 'Cala Los Molinos', latitude: 37.9720, longitude: -0.6810, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 24h antes', included: [], excluded: [], requirements: [], status: 'published', featured: true, rating: 5.0, review_count: 22, booking_count: 48, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i11', activity_id: '11', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', alt: 'Snorkel nocturno', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c1', name: 'Buceo y snorkel', slug: 'buceo-snorkel', description: null, icon: '🤿', image_url: null, sort_order: 1, is_active: true, created_at: '' }, provider: { id: 'p11', profile_id: 'pr11', company_name: 'Night Dive Co.', slug: 'night-dive-co', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
  { id: '12', provider_id: 'p12', title: 'Vela — curso básico de navegación a vela', slug: 'curso-vela-basico', description: 'Aprende a navegar a vela en el Mediterráneo con patrón de barco.', short_description: 'Aprende a gobernar un velero.', category_id: 'c2', price_from: 75, duration_minutes: 300, max_participants: 6, min_participants: 2, languages: ['es', 'en', 'fr'], meeting_point: 'Club Náutico de Torrevieja', latitude: 37.9760, longitude: -0.6790, city: 'Torrevieja', country: 'España', cancellation_policy: 'Cancelación gratuita 48h antes', included: [], excluded: [], requirements: [], status: 'published', featured: false, rating: 4.8, review_count: 31, booking_count: 55, created_at: '2024-01-01', updated_at: '2024-01-01', images: [{ id: 'i12', activity_id: '12', url: 'https://images.unsplash.com/photo-1559087867-ce4c91325525?w=800&q=80', alt: 'Vela', is_cover: true, sort_order: 0, created_at: '' }], category: { id: 'c2', name: 'Excursiones en barco', slug: 'excursiones-barco', description: null, icon: '⛵', image_url: null, sort_order: 2, is_active: true, created_at: '' }, provider: { id: 'p12', profile_id: 'pr12', company_name: 'Club Vela Sur', slug: 'club-vela-sur', description: null, address: '', city: 'Torrevieja', country: 'España', phone: '', tax_id: null, logo_url: null, website: null, commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: '' } },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Más reservados' },
]

export default function ActivitiesPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sort, setSort] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    let result = [...ALL_ACTIVITIES]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category?.name.toLowerCase().includes(q)
      )
    }

    if (activeCategory) {
      result = result.filter(a => a.category?.slug === activeCategory)
    }

    switch (sort) {
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'price_asc': result.sort((a, b) => a.price_from - b.price_from); break
      case 'price_desc': result.sort((a, b) => b.price_from - a.price_from); break
      case 'popular': result.sort((a, b) => b.booking_count - a.booking_count); break
      default: result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating)
    }

    return result
  }, [search, activeCategory, sort])

  return (
    <div className="min-h-screen bg-[#F7F9FC]">

      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-br from-[#0A0F1E] via-[#001A4D] to-[#0066FF] overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 60%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full mb-5">
            Torrevieja · Costa Blanca
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 leading-[1.05]">
            Descubre las mejores<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">actividades</span> cerca del mar
          </h1>
          <p className="text-blue-100/80 text-lg mb-10 max-w-xl mx-auto">
            {ALL_ACTIVITIES.length} experiencias únicas con proveedores locales verificados
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden p-2 gap-2">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buceo, kayak, catamarán, tours..."
                  className="flex-1 text-slate-800 placeholder:text-slate-400 outline-none text-base bg-transparent py-1"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button className="bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shrink-0">
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block h-10">
            <path d="M0 40L1440 40L1440 10C1200 40 960 0 720 20C480 40 240 0 0 10L0 40Z" fill="#F7F9FC" />
          </svg>
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="sticky top-16 z-20 bg-[#F7F9FC]/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                !activeCategory
                  ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF]'
              }`}
            >
              ✨ Todas
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">

          {/* Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-[120px]">
              <ActivityFilters />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {filtered.length}
                  <span className="text-slate-400 font-normal ml-1">
                    {filtered.length === 1 ? 'actividad' : 'actividades'}
                    {activeCategory && ` · ${CATEGORIES.find(c => c.slug === activeCategory)?.name}`}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                </button>

                {/* Sort */}
                <div className="relative">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                    <select
                      value={sort}
                      onChange={e => setSort(e.target.value)}
                      className="appearance-none bg-transparent outline-none cursor-pointer pr-5 text-sm font-medium text-slate-700"
                    >
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>

                {/* View toggle */}
                <div className="hidden sm:flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-[#0066FF] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-[#0066FF] text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid / List */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No encontramos actividades</h3>
                <p className="text-slate-500 text-sm mb-6">Prueba con otros términos o elimina los filtros.</p>
                <button
                  onClick={() => { setSearch(''); setActiveCategory(null) }}
                  className="text-sm font-semibold text-[#0066FF] hover:underline"
                >
                  Ver todas las actividades
                </button>
              </div>
            ) : view === 'list' ? (
              <div className="space-y-4">
                {filtered.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} compact />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto p-6">
            <ActivityFilters onClose={() => setShowFilters(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
