import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  Clock, MapPin, Users, Star, Globe, Shield, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, Heart, Share2, BadgeCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { formatPrice, formatDuration, getRatingLabel } from '@/lib/utils'
import type { Metadata } from 'next'
import type { Activity } from '@/types/database'

const MOCK_ACTIVITY: Activity = {
  id: '1',
  provider_id: 'p1',
  title: 'Buceo con instructores certificados en Torrevieja',
  slug: 'buceo-torrevieja',
  description: `Descubre el fascinante mundo submarino del Mediterráneo con nuestros instructores certificados PADI. Torrevieja es uno de los mejores destinos de buceo en España, con aguas cristalinas, rica biodiversidad marina y pecios históricos.

Durante esta experiencia, nuestros instructores te guiarán por los puntos más espectaculares de la costa torrevejense. Verás coloridos peces, estrellas de mar, pulpos, y si tienes suerte, hasta delfines.

La actividad incluye todo el equipo necesario: traje de neopreno, máscara, aletas, regulador y botella. No se requiere experiencia previa; nuestros instructores te enseñarán las técnicas básicas de buceo antes de entrar al agua.`,
  short_description: 'Sumérgete en las cristalinas aguas del Mediterráneo con instructores certificados PADI.',
  category_id: 'c1',
  price_from: 45,
  duration_minutes: 180,
  max_participants: 8,
  min_participants: 2,
  languages: ['es', 'en', 'de'],
  meeting_point: 'Puerto Deportivo de Torrevieja, Muelle de Levante',
  latitude: 37.9781,
  longitude: -0.6782,
  city: 'Torrevieja',
  country: 'España',
  cancellation_policy: 'Cancelación gratuita hasta 24 horas antes de la actividad. En caso de cancelación tardía se cobrará el 50% del precio.',
  included: [
    'Equipo de buceo completo (traje, máscara, aletas, botella, regulador)',
    'Instructor certificado PADI',
    'Seguro de actividad',
    'Fotos subacuáticas',
    'Bebida de bienvenida',
  ],
  excluded: [
    'Traslados desde/hacia el hotel',
    'Comidas y bebidas adicionales',
    'Propinas (opcional)',
  ],
  requirements: [
    'Saber nadar',
    'Edad mínima: 10 años',
    'Buena condición física general',
    'No tener problemas cardíacos ni respiratorios',
  ],
  status: 'published',
  featured: true,
  rating: 4.9,
  review_count: 127,
  booking_count: 342,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  images: [
    { id: 'i1', activity_id: '1', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80', alt: 'Buceo en Torrevieja', is_cover: true, sort_order: 0, created_at: '' },
    { id: 'i2', activity_id: '1', url: 'https://images.unsplash.com/photo-1560881882-8ffcdb24bbe0?w=800&q=80', alt: 'Instructor de buceo', is_cover: false, sort_order: 1, created_at: '' },
    { id: 'i3', activity_id: '1', url: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=800&q=80', alt: 'Vida marina', is_cover: false, sort_order: 2, created_at: '' },
    { id: 'i4', activity_id: '1', url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80', alt: 'Equipo de buceo', is_cover: false, sort_order: 3, created_at: '' },
  ],
  category: { id: 'c1', name: 'Buceo y snorkel', slug: 'buceo-snorkel', description: null, icon: '🤿', image_url: null, sort_order: 1, is_active: true, created_at: '' },
  provider: {
    id: 'p1', profile_id: 'pr1', company_name: 'Buceo Mediterráneo', slug: 'buceo-mediterraneo',
    description: 'Centro de buceo profesional con más de 15 años de experiencia en Torrevieja. Instructores certificados PADI y SSI. Ofrecemos cursos de buceo, excursiones guiadas y alquiler de equipo.',
    address: 'Puerto Deportivo, Muelle de Levante s/n', city: 'Torrevieja', country: 'España',
    phone: '+34 965 123 456', tax_id: 'B12345678', logo_url: null, website: 'https://buceomed.es',
    commission_rate: 0.05, is_verified: true, is_active: true, created_at: '', updated_at: ''
  }
}

const MOCK_REVIEWS = [
  { id: 1, name: 'Carlos M.', rating: 5, comment: 'Experiencia increíble. Los instructores son muy profesionales y el mar estaba precioso. Repetiré sin duda.', date: 'Junio 2025', nationality: '🇪🇸' },
  { id: 2, name: 'Sophie K.', rating: 5, comment: 'Absolutely fantastic experience! The instructor was very patient and the water was crystal clear.', date: 'Mayo 2025', nationality: '🇩🇪' },
  { id: 3, name: 'Aleksandra W.', rating: 4, comment: 'Świetna aktywność! Instruktorzy bardzo pomocni, sprzęt w dobrym stanie. Polecam!', date: 'Julio 2025', nationality: '🇵🇱' },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: `${MOCK_ACTIVITY.title} | Exploria`,
    description: MOCK_ACTIVITY.short_description || MOCK_ACTIVITY.description.slice(0, 160),
  }
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const t = await getTranslations('activity')

  const activity = MOCK_ACTIVITY
  if (!activity) notFound()

  const coverImage = activity.images?.find((i) => i.is_cover)?.url || activity.images?.[0]?.url

  const langNames: Record<string, string> = {
    es: '🇪🇸 Español', en: '🇬🇧 English', de: '🇩🇪 Deutsch',
    fr: '🇫🇷 Français', pl: '🇵🇱 Polski', ru: '🇷🇺 Русский',
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <span>Inicio</span>
            <ChevronRight className="w-3 h-3" />
            <span>Actividades</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-400">{activity.category?.name}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium truncate max-w-xs">{activity.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {activity.category && (
              <Badge className="mb-2">{activity.category.name}</Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              {activity.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-slate-900">{activity.rating}</span>
                <span className="text-slate-400">({activity.review_count} reseñas)</span>
                <span className="font-medium text-slate-600">{getRatingLabel(activity.rating)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{activity.city}, {activity.country}</span>
              </div>
              {activity.provider?.is_verified && (
                <div className="flex items-center gap-1 text-[#0066FF]">
                  <BadgeCheck className="w-4 h-4" />
                  <span>{t('verified_provider')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <Heart className="w-5 h-5 text-slate-400" />
            </button>
            <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <Share2 className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden mb-8 h-80 md:h-96">
          <div className="col-span-2 row-span-2 relative">
            <Image
              src={coverImage || ''}
              alt={activity.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          {activity.images?.filter(i => !i.is_cover).slice(0, 4).map((image, idx) => (
            <div key={image.id} className="relative">
              <Image
                src={image.url}
                alt={image.alt || activity.title}
                fill
                className="object-cover"
              />
              {idx === 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">+{(activity.images?.length || 0) - 5} fotos</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Clock, label: 'Duración', value: formatDuration(activity.duration_minutes) },
                { icon: Users, label: 'Participantes', value: `Máx. ${activity.max_participants}` },
                { icon: Globe, label: 'Idiomas', value: `${activity.languages.length} idiomas` },
                { icon: Shield, label: 'Cancelación', value: 'Gratuita 24h' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center">
                  <Icon className="w-5 h-5 text-[#0066FF] mx-auto mb-1.5" />
                  <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                  <div className="text-sm font-bold text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t('overview')}</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                {activity.description}
              </div>
            </div>

            {/* Included / Excluded */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('includes')}
                </h3>
                <ul className="space-y-2">
                  {activity.included.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  {t('excludes')}
                </h3>
                <ul className="space-y-2">
                  {activity.excluded.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Requirements */}
            {activity.requirements.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  {t('requirements')}
                </h3>
                <ul className="space-y-2">
                  {activity.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0066FF]" />
                {t('languages')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {activity.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-sm">
                    {langNames[lang] || lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Meeting Point */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0066FF]" />
                {t('location')}
              </h3>
              <p className="text-slate-600 text-sm mb-3">{activity.meeting_point}</p>
              <div className="bg-slate-100 rounded-2xl h-40 flex items-center justify-center text-slate-400 text-sm">
                🗺️ Mapa interactivo (integrar Leaflet/Google Maps)
              </div>
            </div>

            {/* Cancellation */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                {t('cancellation')}
              </h3>
              <p className="text-sm text-slate-600">{activity.cancellation_policy}</p>
            </div>

            {/* Provider */}
            {activity.provider && (
              <div className="border border-slate-100 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">{t('provider')}</h3>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[#0066FF]/10 rounded-xl flex items-center justify-center text-[#0066FF] font-bold text-xl">
                    {activity.provider.company_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{activity.provider.company_name}</span>
                      {activity.provider.is_verified && (
                        <BadgeCheck className="w-5 h-5 text-[#0066FF]" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{activity.provider.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4" />
                      {activity.provider.city}, {activity.provider.country}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                <Shield className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                <strong>{t('legal_notice')}</strong> Exploria actúa únicamente como intermediario tecnológico. El servicio es prestado directamente por el proveedor, quien es responsable de gestionar la actividad, confirmar reservas y cobrar al cliente.
              </p>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">{t('reviews')}</h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-lg">{activity.rating}</span>
                  <span className="text-slate-400 text-sm">({activity.review_count})</span>
                </div>
              </div>
              <div className="space-y-5">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF] font-bold text-sm">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                            {review.name} <span>{review.nationality}</span>
                          </div>
                          <div className="text-xs text-slate-400">{review.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Widget - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <BookingWidget activity={activity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
