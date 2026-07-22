'use client'

import { useState } from 'react'
import {
  Save, Send, ArrowLeft, Plus, X, Upload, Languages,
  MapPin, Clock, Users, DollarSign, Globe, Shield, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Map, Video, HelpCircle, PlugZap, Trash2, Star
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { LOCALES, LOCALE_NAMES } from '@/lib/constants'
import {
  createActivityAction, updateActivityAction, submitActivityForReviewAction,
  addActivityImageAction, removeActivityImageAction, setActivityCoverImageAction,
  type CreateActivityInput,
} from '@/app/actions/providers'
import { uploadActivityPhoto, uploadActivityVideo } from '@/lib/services/upload'
import type { Category, ExternalBookingPlatform } from '@/types/database'
import type { ActivityDetail } from '@/lib/services/activities'

const CANCELLATION_PRESETS = [
  { label: 'Cancelación gratuita 24h', value: 'Cancelación gratuita hasta 24 horas antes de la actividad. En caso de cancelación tardía se cobrará el 50% del precio.' },
  { label: 'Cancelación gratuita 48h', value: 'Cancelación gratuita hasta 48 horas antes de la actividad. Cancelaciones tardías no reembolsables.' },
  { label: 'No reembolsable', value: 'Esta actividad no admite cancelaciones ni reembolsos una vez confirmada la reserva.' },
]

const PLATFORM_OPTIONS: { value: ExternalBookingPlatform; label: string }[] = [
  { value: 'bokun', label: 'Bokun' },
  { value: 'turitop', label: 'TuriTop' },
  { value: 'civitatis', label: 'Civitatis' },
  { value: 'getyourguide', label: 'GetYourGuide' },
  { value: 'clickandboat', label: 'ClickAndBoat' },
  { value: 'other', label: 'Otro' },
]

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-slate-100 text-slate-600' },
  pending_review: { label: 'En revisión', className: 'bg-amber-100 text-amber-700' },
  published: { label: 'Publicada', className: 'bg-emerald-100 text-emerald-700' },
  suspended: { label: 'Suspendida', className: 'bg-red-100 text-red-700' },
  archived: { label: 'Archivada', className: 'bg-slate-100 text-slate-500' },
}

type Section = 'basic' | 'details' | 'location' | 'template' | 'media' | 'translations'

interface ActivityEditorFormProps {
  providerId: string
  categories: Category[]
  activity: ActivityDetail | null
}

export function ActivityEditorForm({ providerId, categories, activity }: ActivityEditorFormProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('basic')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const [form, setForm] = useState({
    title: activity?.title ?? '',
    short_description: activity?.short_description ?? '',
    description: activity?.description ?? '',
    category_id: activity?.category_id ?? categories[0]?.id ?? '',
    price_from: activity ? String(activity.price_from) : '',
    duration_minutes: activity ? String(activity.duration_minutes) : '',
    min_participants: activity ? String(activity.min_participants) : '1',
    max_participants: activity ? String(activity.max_participants) : '10',
    languages: activity?.languages ?? (['es'] as string[]),
    meeting_point: activity?.meeting_point ?? '',
    city: activity?.city ?? 'Torrevieja',
    country: activity?.country ?? 'España',
    latitude: activity?.latitude != null ? String(activity.latitude) : '',
    longitude: activity?.longitude != null ? String(activity.longitude) : '',
    google_maps_url: activity?.google_maps_url ?? '',
    cancellation_policy: activity?.cancellation_policy ?? CANCELLATION_PRESETS[0].value,
    included: activity?.included ?? ([] as string[]),
    excluded: activity?.excluded ?? ([] as string[]),
    requirements: activity?.requirements ?? ([] as string[]),
    video_url: activity?.video_url ?? '',
    faqs: activity?.faqs ?? ([] as { question: string; answer: string }[]),
    extra_info: activity?.extra_info ?? ([] as { title: string; content: string }[]),
    booking_widget_embed_code: activity?.booking_widget_embed_code ?? '',
    external_booking_platform: activity?.external_booking_platform ?? ('' as ExternalBookingPlatform | ''),
  })

  const [images, setImages] = useState(activity?.images ?? [])
  const [newIncluded, setNewIncluded] = useState('')
  const [newExcluded, setNewExcluded] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [newFaqQ, setNewFaqQ] = useState('')
  const [newFaqA, setNewFaqA] = useState('')
  const [newInfoTitle, setNewInfoTitle] = useState('')
  const [newInfoContent, setNewInfoContent] = useState('')

  const addToList = (field: 'included' | 'excluded' | 'requirements', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return
    setForm((f) => ({ ...f, [field]: [...f[field], value.trim()] }))
    setter('')
  }
  const removeFromList = (field: 'included' | 'excluded' | 'requirements', index: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }))
  }

  const toggleLanguage = (loc: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(loc) ? f.languages.filter((l) => l !== loc) : [...f.languages, loc],
    }))
  }

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return
    setForm((f) => ({ ...f, faqs: [...f.faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }] }))
    setNewFaqQ(''); setNewFaqA('')
  }
  const removeFaq = (i: number) => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) }))

  const addInfo = () => {
    if (!newInfoTitle.trim() || !newInfoContent.trim()) return
    setForm((f) => ({ ...f, extra_info: [...f.extra_info, { title: newInfoTitle.trim(), content: newInfoContent.trim() }] }))
    setNewInfoTitle(''); setNewInfoContent('')
  }
  const removeInfo = (i: number) => setForm((f) => ({ ...f, extra_info: f.extra_info.filter((_, idx) => idx !== i) }))

  const buildInput = (): CreateActivityInput => ({
    title: form.title,
    description: form.description,
    shortDescription: form.short_description || undefined,
    categoryId: form.category_id || undefined,
    priceFrom: Number(form.price_from) || 0,
    durationMinutes: Number(form.duration_minutes) || 0,
    maxParticipants: Number(form.max_participants) || 1,
    minParticipants: Number(form.min_participants) || 1,
    languages: form.languages,
    meetingPoint: form.meeting_point,
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    city: form.city,
    country: form.country,
    cancellationPolicy: form.cancellation_policy,
    included: form.included,
    excluded: form.excluded,
    requirements: form.requirements,
    googleMapsUrl: form.google_maps_url || undefined,
    videoUrl: form.video_url || undefined,
    faqs: form.faqs,
    extraInfo: form.extra_info,
    bookingWidgetEmbedCode: form.booking_widget_embed_code || undefined,
    externalBookingPlatform: form.external_booking_platform || undefined,
  })

  const handleSave = async () => {
    if (!form.title || !form.description || !form.price_from) {
      toast.error('Rellena los campos obligatorios: título, descripción y precio')
      setActiveSection('basic')
      return
    }
    setSaving(true)
    try {
      if (activity) {
        const res = await updateActivityAction(activity.id, buildInput())
        if (!res.success) { toast.error(res.error); return }
        toast.success('Cambios guardados')
        router.refresh()
      } else {
        const res = await createActivityAction(buildInput())
        if (!res.success) { toast.error(res.error); return }
        toast.success('Actividad creada como borrador. Ya puedes añadir fotos.')
        router.push(`/dashboard/provider/activities/${res.activity!.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!activity) return
    setSubmitting(true)
    try {
      const res = await submitActivityForReviewAction(activity.id)
      if (!res.success) { toast.error(res.error); return }
      toast.success('Enviada a revisión. El administrador la publicará tras aprobarla.')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !activity) return
    setUploadingPhoto(true)
    try {
      const uploaded = await uploadActivityPhoto(providerId, activity.id, file)
      if (!uploaded.success || !uploaded.url) { toast.error(uploaded.error || 'Error al subir la foto'); return }
      const res = await addActivityImageAction(activity.id, uploaded.url)
      if (!res.success || !res.image) { toast.error(res.error); return }
      setImages((imgs) => [...imgs, res.image!])
      toast.success('Foto añadida')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !activity) return
    setUploadingVideo(true)
    try {
      const uploaded = await uploadActivityVideo(providerId, activity.id, file)
      if (!uploaded.success || !uploaded.url) { toast.error(uploaded.error || 'Error al subir el vídeo'); return }
      setForm((f) => ({ ...f, video_url: uploaded.url! }))
      toast.success('Vídeo subido. Recuerda guardar los cambios.')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!activity) return
    const res = await removeActivityImageAction(imageId, activity.id)
    if (!res.success) { toast.error(res.error); return }
    setImages((imgs) => imgs.filter((i) => i.id !== imageId))
  }

  const handleSetCover = async (imageId: string) => {
    if (!activity) return
    const res = await setActivityCoverImageAction(imageId, activity.id)
    if (!res.success) { toast.error(res.error); return }
    setImages((imgs) => imgs.map((i) => ({ ...i, is_cover: i.id === imageId })))
  }

  const sections: { key: Section; label: string; icon: typeof Save }[] = [
    { key: 'basic', label: 'Info básica', icon: AlertCircle },
    { key: 'details', label: 'Detalles', icon: CheckCircle2 },
    { key: 'location', label: 'Ubicación', icon: MapPin },
    { key: 'template', label: 'Ficha (FAQ, vídeo, API)', icon: PlugZap },
    { key: 'media', label: 'Fotos', icon: ImageIcon },
    { key: 'translations', label: 'Traducciones', icon: Languages },
  ]

  const status = activity?.status ?? 'draft'
  const statusInfo = STATUS_LABELS[status]
  const canSubmitForReview = activity && (status === 'draft')

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-20 z-10 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/provider/activities" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 shrink-0')}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mis actividades</span>
          </Link>
          <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />
          <h1 className="text-base font-semibold text-slate-900 truncate max-w-[10rem] sm:max-w-sm">{form.title || 'Nueva actividad'}</h1>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', statusInfo.className)}>{statusInfo.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canSubmitForReview && (
            <Button variant="outline" size="sm" onClick={handleSubmitForReview} disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Enviar a revisión
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {activity ? 'Guardar' : 'Crear borrador'}
          </Button>
        </div>
      </div>

      {activity?.admin_feedback && status === 'draft' && (
        <div className="mx-4 sm:mx-8 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Comentario del administrador:</strong> {activity.admin_feedback}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Section nav */}
        <nav className="lg:w-52 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white pt-4 lg:pt-6 pb-3 lg:pb-8 px-3 flex lg:flex-col gap-1 overflow-x-auto">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                'text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                activeSection === key ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-8 max-w-3xl">
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <SectionHeader title="Información básica" desc="Título, descripción y categoría de la actividad." />
              <Field label="Título de la actividad *">
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej: Buceo con instructores certificados en Torrevieja" />
              </Field>
              <Field label="Descripción corta *" hint="Aparece en las tarjetas de búsqueda (máx. 160 car.)">
                <textarea value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} rows={2} maxLength={160} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </Field>
              <Field label="Descripción completa *">
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={8} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </Field>
              <Field label="Categoría *">
                <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-6">
              <SectionHeader title="Detalles de la actividad" desc="Precio, duración, participantes, idiomas y políticas." />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio desde (€/persona) *" icon={<DollarSign className="w-4 h-4" />}><Input type="number" min="1" value={form.price_from} onChange={(e) => setForm((f) => ({ ...f, price_from: e.target.value }))} /></Field>
                <Field label="Duración (minutos) *" icon={<Clock className="w-4 h-4" />}><Input type="number" min="30" step="30" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} /></Field>
                <Field label="Mín. participantes" icon={<Users className="w-4 h-4" />}><Input type="number" min="1" value={form.min_participants} onChange={(e) => setForm((f) => ({ ...f, min_participants: e.target.value }))} /></Field>
                <Field label="Máx. participantes" icon={<Users className="w-4 h-4" />}><Input type="number" min="1" value={form.max_participants} onChange={(e) => setForm((f) => ({ ...f, max_participants: e.target.value }))} /></Field>
              </div>
              <Field label="Idiomas en que se realiza *" icon={<Globe className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LOCALES.map((loc) => (
                    <button key={loc} type="button" onClick={() => toggleLanguage(loc)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors', form.languages.includes(loc) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary')}>
                      {LOCALE_NAMES[loc]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Qué incluye" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}>
                <div className="space-y-2 mb-2">
                  {form.included.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="flex-1">{item}</span>
                      <button onClick={() => removeFromList('included', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newIncluded} onChange={(e) => setNewIncluded(e.target.value)} placeholder="Ej: Instructor certificado PADI" onKeyDown={(e) => e.key === 'Enter' && addToList('included', newIncluded, setNewIncluded)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('included', newIncluded, setNewIncluded)}><Plus className="w-4 h-4" /></Button>
                </div>
              </Field>
              <Field label="Qué NO incluye" icon={<X className="w-4 h-4 text-red-400" />}>
                <div className="space-y-2 mb-2">
                  {form.excluded.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 text-sm">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0" /><span className="flex-1">{item}</span>
                      <button onClick={() => removeFromList('excluded', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newExcluded} onChange={(e) => setNewExcluded(e.target.value)} placeholder="Ej: Traslados" onKeyDown={(e) => e.key === 'Enter' && addToList('excluded', newExcluded, setNewExcluded)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('excluded', newExcluded, setNewExcluded)}><Plus className="w-4 h-4" /></Button>
                </div>
              </Field>
              <Field label="Requisitos" icon={<AlertCircle className="w-4 h-4 text-amber-500" />}>
                <div className="space-y-2 mb-2">
                  {form.requirements.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span className="flex-1">{item}</span>
                      <button onClick={() => removeFromList('requirements', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} placeholder="Ej: Saber nadar" onKeyDown={(e) => e.key === 'Enter' && addToList('requirements', newRequirement, setNewRequirement)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('requirements', newRequirement, setNewRequirement)}><Plus className="w-4 h-4" /></Button>
                </div>
              </Field>
              <Field label="Política de cancelación *" icon={<Shield className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CANCELLATION_PRESETS.map((preset) => (
                    <button key={preset.label} type="button" onClick={() => setForm((f) => ({ ...f, cancellation_policy: preset.value }))} className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors', form.cancellation_policy === preset.value ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary')}>
                      {preset.label}
                    </button>
                  ))}
                </div>
                <textarea value={form.cancellation_policy} onChange={(e) => setForm((f) => ({ ...f, cancellation_policy: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </Field>
            </div>
          )}

          {activeSection === 'location' && (
            <div className="space-y-6">
              <SectionHeader title="Ubicación y mapa" desc="Punto de encuentro, coordenadas y ficha de Google Maps para reseñas." />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ciudad"><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
                <Field label="País"><Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></Field>
              </div>
              <Field label="Punto de encuentro *" icon={<MapPin className="w-4 h-4" />}>
                <Input value={form.meeting_point} onChange={(e) => setForm((f) => ({ ...f, meeting_point: e.target.value }))} placeholder="Ej: Puerto Deportivo, Muelle de Levante" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitud"><Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="37.9781" /></Field>
                <Field label="Longitud"><Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="-0.6782" /></Field>
              </div>
              <Field label="URL de Google Maps" hint="Pega la URL de tu negocio en Google Maps." icon={<Map className="w-4 h-4" />}>
                <Input value={form.google_maps_url} onChange={(e) => setForm((f) => ({ ...f, google_maps_url: e.target.value }))} placeholder="https://www.google.com/maps/place/..." />
              </Field>
              {form.latitude && form.longitude && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <iframe src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`} width="100%" height="240" style={{ border: 0 }} loading="lazy" title="Mapa" />
                </div>
              )}
            </div>
          )}

          {activeSection === 'template' && (
            <div className="space-y-8">
              <SectionHeader title="Ficha de producto" desc="Vídeo, preguntas frecuentes, información extra y calendario de reservas externo." />

              <Field label="Vídeo (URL o sube un archivo)" icon={<Video className="w-4 h-4" />}>
                <Input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://..." />
                {activity ? (
                  <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2 cursor-pointer gap-1.5 w-fit')}>
                    {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Subir vídeo
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                  </label>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Guarda la actividad primero para poder subir un archivo de vídeo.</p>
                )}
              </Field>

              <div>
                <Field label="Calendario de disponibilidad externo" icon={<PlugZap className="w-4 h-4" />} hint="Pega aquí el shortcode/iframe que te da Bokun, TuriTop, Civitatis, GetYourGuide o ClickAndBoat. Se mostrará en la ficha pública como calendario en tiempo real.">
                  <select value={form.external_booking_platform} onChange={(e) => setForm((f) => ({ ...f, external_booking_platform: e.target.value as ExternalBookingPlatform }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white mb-2">
                    <option value="">Sin integración externa</option>
                    {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <textarea value={form.booking_widget_embed_code} onChange={(e) => setForm((f) => ({ ...f, booking_widget_embed_code: e.target.value }))} rows={3} placeholder='<iframe src="https://widgets.bokun.io/..."></iframe>' className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary resize-none" />
                </Field>
              </div>

              <Field label="Preguntas frecuentes" icon={<HelpCircle className="w-4 h-4" />}>
                <div className="space-y-2 mb-3">
                  {form.faqs.map((faq, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800">{faq.question}</span>
                        <button onClick={() => removeFaq(i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 shrink-0" /></button>
                      </div>
                      <p className="text-slate-600 mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Input value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} placeholder="Pregunta" />
                  <div className="flex gap-2">
                    <Input value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} placeholder="Respuesta" onKeyDown={(e) => e.key === 'Enter' && addFaq()} />
                    <Button type="button" variant="outline" size="sm" onClick={addFaq}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Field>

              <Field label="Información adicional">
                <div className="space-y-2 mb-3">
                  {form.extra_info.map((block, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800">{block.title}</span>
                        <button onClick={() => removeInfo(i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 shrink-0" /></button>
                      </div>
                      <p className="text-slate-600 mt-1 whitespace-pre-line">{block.content}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Input value={newInfoTitle} onChange={(e) => setNewInfoTitle(e.target.value)} placeholder="Título (ej: Qué llevar)" />
                  <div className="flex gap-2">
                    <textarea value={newInfoContent} onChange={(e) => setNewInfoContent(e.target.value)} rows={2} placeholder="Contenido" className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
                    <Button type="button" variant="outline" size="sm" onClick={addInfo}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Field>
            </div>
          )}

          {activeSection === 'media' && (
            <div className="space-y-6">
              <SectionHeader title="Fotos de la actividad" desc="Sube fotos atractivas. La primera será la foto de portada." />
              {!activity ? (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">Guarda la actividad como borrador primero para poder subir fotos.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
                        {img.is_cover && <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">Portada</span>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.is_cover && (
                            <button onClick={() => handleSetCover(img.id)} className="bg-white text-slate-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-slate-50 flex items-center gap-1">
                              <Star className="w-3 h-3" /> Portada
                            </button>
                          )}
                          <button onClick={() => handleDeleteImage(img.id)} className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-600 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className={cn(
                      'aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary cursor-pointer',
                      uploadingPhoto && 'opacity-50 pointer-events-none'
                    )}>
                      {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      <span className="text-xs font-medium">Subir foto</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                    <p className="font-medium text-slate-700">Consejos:</p>
                    <p>• Mínimo 4 fotos, máximo 20</p>
                    <p>• Resolución mínima 1200×800px · Formato JPG/PNG · Máx. 5MB</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'translations' && (
            <div className="space-y-6">
              <SectionHeader title="Traducciones" desc="La actividad se traduce automáticamente a todos los idiomas de la plataforma." />
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Languages className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">La traducción automática con DeepL se gestiona desde el panel de administración una vez la actividad está publicada.</p>
              </div>
            </div>
          )}

          <div className="pt-8 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {activity ? 'Guardar cambios' : 'Crear borrador'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>
  )
}

function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
