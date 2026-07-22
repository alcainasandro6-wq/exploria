import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  Clock, MapPin, Users, Star, Globe, Shield, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, BadgeCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { ActivityGallery } from '@/components/activities/ActivityGallery'
import { BookingEmbed } from '@/components/activities/BookingEmbed'
import { getActivityBySlug, getActivityReviews } from '@/lib/services/activities'
import { formatDuration, getRatingLabel, getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

const LANG_NAMES: Record<string, string> = {
  es: '🇪🇸 Español', en: '🇬🇧 English', de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français', pl: '🇵🇱 Polski', ru: '🇷🇺 Русский',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const activity = await getActivityBySlug(slug)
  if (!activity) return { title: 'Actividad no encontrada | BookActivities' }
  return {
    title: `${activity.title} | BookActivities`,
    description: activity.short_description || activity.description.slice(0, 160),
  }
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const t = await getTranslations('activity')

  const activity = await getActivityBySlug(slug)
  if (!activity) notFound()

  const reviews = await getActivityReviews(activity.id)

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <nav className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
            <span>Inicio</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span>Actividades</span>
            {activity.category && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="text-slate-400">{activity.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-slate-900 font-medium truncate max-w-xs">{activity.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Title Section */}
        <div className="mb-6">
          {activity.category && <Badge className="mb-2">{activity.category.name}</Badge>}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
            {activity.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            {activity.review_count > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-slate-900">{activity.rating}</span>
                <span className="text-slate-400">({activity.review_count} reseñas)</span>
                <span className="font-medium text-slate-600 hidden sm:inline">{getRatingLabel(activity.rating)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{activity.city}, {activity.country}</span>
            </div>
            {activity.provider?.is_verified && (
              <div className="flex items-center gap-1 text-primary">
                <BadgeCheck className="w-4 h-4" />
                <span>{t('verified_provider')}</span>
              </div>
            )}
          </div>
        </div>

        <ActivityGallery images={activity.images} title={activity.title} videoUrl={activity.video_url} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: Clock, label: 'Duración', value: formatDuration(activity.duration_minutes) },
                { icon: Users, label: 'Participantes', value: `Máx. ${activity.max_participants}` },
                { icon: Globe, label: 'Idiomas', value: `${activity.languages.length} idiomas` },
                { icon: Shield, label: 'Cancelación', value: 'Gratuita 24h' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
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
            <div className="grid sm:grid-cols-2 gap-6">
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
                <Globe className="w-5 h-5 text-primary" />
                {t('languages')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {activity.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-sm">
                    {LANG_NAMES[lang] || lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Live availability embed (Bokun/TuriTop/Civitatis/GetYourGuide/ClickAndBoat) */}
            <BookingEmbed embedCode={activity.booking_widget_embed_code} platform={activity.external_booking_platform} />

            {/* Meeting Point */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t('location')}
              </h3>
              <p className="text-slate-600 text-sm mb-3">{activity.meeting_point}</p>
              {activity.latitude && activity.longitude ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <iframe
                    src={`https://maps.google.com/maps?q=${activity.latitude},${activity.longitude}&z=15&output=embed`}
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación de la actividad"
                  />
                  {activity.google_maps_url && (
                    <a
                      href={activity.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 text-xs text-primary font-medium hover:bg-slate-50 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Ver en Google Maps
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100 rounded-2xl h-40 flex items-center justify-center text-slate-400 text-sm px-4 text-center">
                  <MapPin className="w-4 h-4 mr-2 shrink-0" />
                  {activity.meeting_point}
                </div>
              )}
            </div>

            {/* Cancellation */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                {t('cancellation')}
              </h3>
              <p className="text-sm text-slate-600">{activity.cancellation_policy}</p>
            </div>

            {/* Extra info */}
            {activity.extra_info.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Información adicional</h3>
                {activity.extra_info.map((block) => (
                  <div key={block.title}>
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{block.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{block.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* FAQ */}
            {activity.faqs.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Preguntas frecuentes</h3>
                <Accordion type="single" collapsible>
                  {activity.faqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Provider */}
            {activity.provider && (
              <div className="border border-slate-100 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">{t('provider')}</h3>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl shrink-0">
                    {activity.provider.company_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{activity.provider.company_name}</span>
                      {activity.provider.is_verified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{activity.provider.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 shrink-0" />
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
                <strong>{t('legal_notice')}</strong> BookActivities actúa únicamente como intermediario tecnológico. El servicio es prestado directamente por el proveedor, quien es responsable de gestionar la actividad, confirmar reservas y cobrar al cliente.
              </p>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{t('reviews')}</h2>
                {activity.review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{activity.rating}</span>
                    <span className="text-slate-400 text-sm">({activity.review_count})</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-400">Aún no hay reseñas para esta actividad.</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {getInitials(review.author_name || 'Cliente')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">
                              {review.author_name || 'Cliente verificado'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(review.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="text-sm font-semibold text-slate-800 mb-1">{review.title}</p>}
                      {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Widget - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <BookingWidget activity={activity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
