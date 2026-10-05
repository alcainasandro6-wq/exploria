'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Save, Send, Plus, X, Upload, Languages,
  MapPin, Clock, Users, DollarSign, Globe, Shield, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Map, Video, HelpCircle, PlugZap, Trash2, Star, Building2
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { LOCALES, LOCALE_NAMES } from '@/lib/constants'
import {
  createActivityAction, updateActivityAction, submitActivityForReviewAction,
  addActivityImageAction, removeActivityImageAction, setActivityCoverImageAction,
  listTuriTopProductsAction,
  type CreateActivityInput,
} from '@/app/actions/providers'
import type { TuriTopProduct } from '@/lib/services/turitop'
import {
  adminCreateActivityAction, adminUpdateActivityAction, adminUpdateActivityStatusAction,
  adminAddActivityImageAction, adminRemoveActivityImageAction, adminSetActivityCoverImageAction,
} from '@/app/actions/admin'
import { uploadActivityPhoto, uploadActivityVideo } from '@/lib/services/upload'
import type { Category, ExternalBookingPlatform, Provider } from '@/types/database'
import type { ActivityDetail } from '@/lib/services/activities'

type Section = 'basic' | 'details' | 'location' | 'template' | 'media' | 'translations'

// Third-party platform brand names — not UI copy, left untranslated.
const PLATFORM_BRAND_OPTIONS: { value: ExternalBookingPlatform; label: string }[] = [
  { value: 'bokun', label: 'Bokun' },
  { value: 'turitop', label: 'TuriTop' },
  { value: 'civitatis', label: 'Civitatis' },
  { value: 'getyourguide', label: 'GetYourGuide' },
  { value: 'clickandboat', label: 'ClickAndBoat' },
]

interface ActivityEditorFormProps {
  providerId: string
  categories: Category[]
  activity: ActivityDetail | null
  /** Admin mode reuses this same form to create/edit ANY provider's activity
   *  and can publish directly, skipping the provider submit-for-review flow. */
  mode?: 'provider' | 'admin'
  /** Only used in admin mode when creating a brand-new activity (activity===null),
   *  to let the admin pick which provider it belongs to. */
  providers?: Provider[]
  /** The owning provider's one-time global TuriTop company code, if already set —
   *  shown read-only here; actually edited from the provider's own settings page. */
  providerTuritopCode?: string | null
}

export function ActivityEditorForm({ providerId, categories, activity, mode = 'provider', providers = [], providerTuritopCode }: ActivityEditorFormProps) {
  const t = useTranslations('provider_activity_editor_form')
  const isAdmin = mode === 'admin'
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('basic')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState(providerId || providers[0]?.id || '')

  const CANCELLATION_PRESETS = [
    { label: t('cancellation_preset_24h_label'), value: t('cancellation_preset_24h_value') },
    { label: t('cancellation_preset_48h_label'), value: t('cancellation_preset_48h_value') },
    { label: t('cancellation_preset_non_refundable_label'), value: t('cancellation_preset_non_refundable_value') },
  ]

  const PLATFORM_OPTIONS: { value: ExternalBookingPlatform; label: string }[] = [
    ...PLATFORM_BRAND_OPTIONS,
    { value: 'other', label: t('platform_other_label') },
  ]

  const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    draft: { label: t('status_draft'), className: 'bg-slate-100 text-slate-600' },
    pending_review: { label: t('status_pending_review'), className: 'bg-amber-100 text-amber-700' },
    published: { label: t('status_published'), className: 'bg-emerald-100 text-emerald-700' },
    suspended: { label: t('status_suspended'), className: 'bg-red-100 text-red-700' },
    archived: { label: t('status_archived'), className: 'bg-slate-100 text-slate-500' },
  }

  // One indirection point: admin-scoped actions have identical signatures to
  // the provider ones (minus the ownership check) except for create, which
  // needs the admin-picked providerId threaded in separately (see handleSave).
  const api = isAdmin
    ? { update: adminUpdateActivityAction, addImage: adminAddActivityImageAction, setCover: adminSetActivityCoverImageAction, removeImage: adminRemoveActivityImageAction }
    : { update: updateActivityAction, addImage: addActivityImageAction, setCover: setActivityCoverImageAction, removeImage: removeActivityImageAction }

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
    turitop_service_code: activity?.turitop_service_code ?? '',
    turitop_product_id: activity?.turitop_product_id ?? '',
  })

  const [turitopProducts, setTuritopProducts] = useState<TuriTopProduct[]>([])
  useEffect(() => {
    if (form.external_booking_platform !== 'turitop') return
    let cancelled = false
    listTuriTopProductsAction(isAdmin ? selectedProviderId : undefined).then((res) => {
      if (!cancelled) setTuritopProducts(res.products)
    })
    return () => { cancelled = true }
  }, [form.external_booking_platform, isAdmin, selectedProviderId])

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
    turitopServiceCode: form.turitop_service_code || undefined,
    turitopProductId: form.turitop_product_id,
  })

  const handleSave = async () => {
    if (!form.title || !form.description || !form.price_from) {
      toast.error(t('required_fields_error'))
      setActiveSection('basic')
      return
    }
    setSaving(true)
    try {
      if (activity) {
        const res = await api.update(activity.id, buildInput())
        if (!res.success) { toast.error(res.error); return }
        toast.success(t('changes_saved_toast'))
        router.refresh()
      } else if (isAdmin) {
        const res = await adminCreateActivityAction(selectedProviderId, buildInput())
        if (!res.success) { toast.error(res.error); return }
        toast.success(t('activity_created_admin_toast'))
        router.push(`/dashboard/admin/activities/${res.activity!.id}`)
      } else {
        const res = await createActivityAction(buildInput())
        if (!res.success) { toast.error(res.error); return }
        toast.success(t('activity_created_draft_toast'))
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
      toast.success(t('submitted_for_review_toast'))
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminStatusChange = async (newStatus: 'published' | 'suspended' | 'draft') => {
    if (!activity) return
    setSubmitting(true)
    try {
      const res = await adminUpdateActivityStatusAction(activity.id, newStatus)
      if (!res.success) { toast.error(res.error); return }
      toast.success(newStatus === 'published' ? t('activity_published_toast') : newStatus === 'suspended' ? t('activity_suspended_toast') : t('changes_saved_toast'))
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
      const uploaded = await uploadActivityPhoto(activity.provider_id, activity.id, file)
      if (!uploaded.success || !uploaded.url) { toast.error(uploaded.error || t('photo_upload_error')); return }
      const res = await api.addImage(activity.id, uploaded.url)
      if (!res.success || !res.image) { toast.error(res.error); return }
      setImages((imgs) => [...imgs, res.image!])
      toast.success(t('photo_added_toast'))
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
      const uploaded = await uploadActivityVideo(activity.provider_id, activity.id, file)
      if (!uploaded.success || !uploaded.url) { toast.error(uploaded.error || t('video_upload_error')); return }
      setForm((f) => ({ ...f, video_url: uploaded.url! }))
      toast.success(t('video_uploaded_toast'))
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!activity) return
    const res = await api.removeImage(imageId, activity.id)
    if (!res.success) { toast.error(res.error); return }
    setImages((imgs) => imgs.filter((i) => i.id !== imageId))
  }

  const handleSetCover = async (imageId: string) => {
    if (!activity) return
    const res = await api.setCover(imageId, activity.id)
    if (!res.success) { toast.error(res.error); return }
    setImages((imgs) => imgs.map((i) => ({ ...i, is_cover: i.id === imageId })))
  }

  const sections: { key: Section; label: string; icon: typeof Save }[] = [
    { key: 'basic', label: t('section_basic'), icon: AlertCircle },
    { key: 'details', label: t('section_details'), icon: CheckCircle2 },
    { key: 'location', label: t('section_location'), icon: MapPin },
    { key: 'template', label: t('section_template'), icon: PlugZap },
    { key: 'media', label: t('section_media'), icon: ImageIcon },
    { key: 'translations', label: t('section_translations'), icon: Languages },
  ]

  const status = activity?.status ?? 'draft'
  const statusInfo = STATUS_LABELS[status]
  const canSubmitForReview = !isAdmin && activity && (status === 'draft')
  const backHref = isAdmin ? '/dashboard/admin/activities' : '/dashboard/provider/activities'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) router.push(backHref) }}>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[88vh] p-0 gap-0 flex flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-semibold text-slate-900 truncate max-w-[12rem] sm:max-w-sm">{form.title || t('new_activity_title')}</h1>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', statusInfo.className)}>{statusInfo.label}</span>
          </div>
        </div>

        {activity?.admin_feedback && status === 'draft' && (
          <div className="shrink-0 mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <strong>{t('admin_feedback_label')}</strong> {activity.admin_feedback}
          </div>
        )}

        {/* Section tabs */}
        <div className="shrink-0 border-b border-slate-100 px-6 flex gap-1 overflow-x-auto">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-3 -mb-px text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
                activeSection === key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <SectionHeader title={t('basic_section_title')} desc={t('basic_section_desc')} />
              {isAdmin && (
                <Field label={t('field_provider_label')} icon={<Building2 className="w-4 h-4" />}>
                  {activity ? (
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 rounded-xl px-4 py-2.5">{activity.provider?.company_name}</p>
                  ) : (
                    <select value={selectedProviderId} onChange={(e) => setSelectedProviderId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
                      {providers.map((p) => <option key={p.id} value={p.id}>{p.company_name}</option>)}
                    </select>
                  )}
                </Field>
              )}
              <Field label={t('field_title_label')}>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t('field_title_placeholder')} />
              </Field>
              <Field label={t('field_short_description_label')} hint={t('field_short_description_hint')}>
                <textarea value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} rows={2} maxLength={160} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </Field>
              <Field label={t('field_full_description_label')}>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={8} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </Field>
              <Field label={t('field_category_label')}>
                <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white">
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          {activeSection === 'details' && (
            <div className="space-y-6">
              <SectionHeader title={t('details_section_title')} desc={t('details_section_desc')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('field_price_label')} icon={<DollarSign className="w-4 h-4" />}><Input type="number" min="1" value={form.price_from} onChange={(e) => setForm((f) => ({ ...f, price_from: e.target.value }))} /></Field>
                <Field label={t('field_duration_label')} icon={<Clock className="w-4 h-4" />}><Input type="number" min="30" step="30" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} /></Field>
                <Field label={t('field_min_participants_label')} icon={<Users className="w-4 h-4" />}><Input type="number" min="1" value={form.min_participants} onChange={(e) => setForm((f) => ({ ...f, min_participants: e.target.value }))} /></Field>
                <Field label={t('field_max_participants_label')} icon={<Users className="w-4 h-4" />}><Input type="number" min="1" value={form.max_participants} onChange={(e) => setForm((f) => ({ ...f, max_participants: e.target.value }))} /></Field>
              </div>
              <Field label={t('field_languages_label')} icon={<Globe className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LOCALES.map((loc) => (
                    <button key={loc} type="button" onClick={() => toggleLanguage(loc)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors', form.languages.includes(loc) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary')}>
                      {LOCALE_NAMES[loc]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t('field_included_label')} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}>
                <div className="space-y-2 mb-2">
                  {form.included.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="flex-1">{item}</span>
                      <button onClick={() => removeFromList('included', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newIncluded} onChange={(e) => setNewIncluded(e.target.value)} placeholder={t('field_included_placeholder')} onKeyDown={(e) => e.key === 'Enter' && addToList('included', newIncluded, setNewIncluded)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('included', newIncluded, setNewIncluded)}><Plus className="w-4 h-4" /></Button>
                </div>
              </Field>
              <Field label={t('field_excluded_label')} icon={<X className="w-4 h-4 text-red-400" />}>
                <div className="space-y-2 mb-2">
                  {form.excluded.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 text-sm">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0" /><span className="flex-1">{item}</span>
                      <button onClick={() => removeFromList('excluded', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newExcluded} onChange={(e) => setNewExcluded(e.target.value)} placeholder={t('field_excluded_placeholder')} onKeyDown={(e) => e.key === 'Enter' && addToList('excluded', newExcluded, setNewExcluded)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('excluded', newExcluded, setNewExcluded)}><Plus className="w-4 h-4" /></Button>
                </div>
              </Field>
              <Field label={t('field_requirements_label')} icon={<AlertCircle className="w-4 h-4 text-amber-500" />}>
                <div className="space-y-2 mb-2">
                  {form.requirements.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span className="flex-1">{item}</span>
                      <button onClick={() => removeFromList('requirements', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} placeholder={t('field_requirements_placeholder')} onKeyDown={(e) => e.key === 'Enter' && addToList('requirements', newRequirement, setNewRequirement)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('requirements', newRequirement, setNewRequirement)}><Plus className="w-4 h-4" /></Button>
                </div>
              </Field>
              <Field label={t('field_cancellation_policy_label')} icon={<Shield className="w-4 h-4" />}>
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
              <SectionHeader title={t('location_section_title')} desc={t('location_section_desc')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('field_city_label')}><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
                <Field label={t('field_country_label')}><Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></Field>
              </div>
              <Field label={t('field_meeting_point_label')} icon={<MapPin className="w-4 h-4" />}>
                <Input value={form.meeting_point} onChange={(e) => setForm((f) => ({ ...f, meeting_point: e.target.value }))} placeholder={t('field_meeting_point_placeholder')} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('field_latitude_label')}><Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="37.9781" /></Field>
                <Field label={t('field_longitude_label')}><Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="-0.6782" /></Field>
              </div>
              <Field label={t('field_google_maps_url_label')} hint={t('field_google_maps_url_hint')} icon={<Map className="w-4 h-4" />}>
                <Input value={form.google_maps_url} onChange={(e) => setForm((f) => ({ ...f, google_maps_url: e.target.value }))} placeholder="https://www.google.com/maps/place/..." />
              </Field>
              {form.latitude && form.longitude && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <iframe src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`} width="100%" height="240" style={{ border: 0 }} loading="lazy" title={t('map_iframe_title')} />
                </div>
              )}
            </div>
          )}

          {activeSection === 'template' && (
            <div className="space-y-8">
              <SectionHeader title={t('template_section_title')} desc={t('template_section_desc')} />

              <Field label={t('field_video_label')} icon={<Video className="w-4 h-4" />}>
                <Input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://..." />
                {activity ? (
                  <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2 cursor-pointer gap-1.5 w-fit')}>
                    {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {t('upload_video_button')}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                  </label>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">{t('save_activity_first_for_video')}</p>
                )}
              </Field>

              <div>
                <Field label={t('field_external_calendar_label')} icon={<PlugZap className="w-4 h-4" />} hint={t('field_external_calendar_hint')}>
                  <select value={form.external_booking_platform} onChange={(e) => setForm((f) => ({ ...f, external_booking_platform: e.target.value as ExternalBookingPlatform }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white mb-2">
                    <option value="">{t('no_external_integration_option')}</option>
                    {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {form.external_booking_platform === 'turitop' ? (
                    <div className="space-y-2">
                      <Input
                        value={form.turitop_service_code}
                        onChange={(e) => setForm((f) => ({ ...f, turitop_service_code: e.target.value }))}
                        placeholder={t('field_turitop_service_code_placeholder')}
                      />
                      <select
                        value={form.turitop_product_id}
                        onChange={(e) => setForm((f) => ({ ...f, turitop_product_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        <option value="">{t('turitop_product_none')}</option>
                        {turitopProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        {form.turitop_product_id && !turitopProducts.some((p) => p.id === form.turitop_product_id) && (
                          <option value={form.turitop_product_id}>{form.turitop_product_id}</option>
                        )}
                      </select>
                      <p className="text-xs text-slate-400">{t('turitop_product_hint')}</p>
                      <p className="text-xs text-slate-400">
                        {providerTuritopCode
                          ? t('turitop_company_code_label', { code: providerTuritopCode })
                          : t('turitop_company_code_missing')}
                      </p>
                    </div>
                  ) : (
                    <textarea value={form.booking_widget_embed_code} onChange={(e) => setForm((f) => ({ ...f, booking_widget_embed_code: e.target.value }))} rows={3} placeholder='<iframe src="https://widgets.bokun.io/..."></iframe>' className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary resize-none" />
                  )}
                </Field>
              </div>

              <Field label={t('field_faqs_label')} icon={<HelpCircle className="w-4 h-4" />}>
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
                  <Input value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} placeholder={t('field_faq_question_placeholder')} />
                  <div className="flex gap-2">
                    <Input value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} placeholder={t('field_faq_answer_placeholder')} onKeyDown={(e) => e.key === 'Enter' && addFaq()} />
                    <Button type="button" variant="outline" size="sm" onClick={addFaq}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Field>

              <Field label={t('field_extra_info_label')}>
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
                  <Input value={newInfoTitle} onChange={(e) => setNewInfoTitle(e.target.value)} placeholder={t('field_extra_info_title_placeholder')} />
                  <div className="flex gap-2">
                    <textarea value={newInfoContent} onChange={(e) => setNewInfoContent(e.target.value)} rows={2} placeholder={t('field_extra_info_content_placeholder')} className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
                    <Button type="button" variant="outline" size="sm" onClick={addInfo}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Field>
            </div>
          )}

          {activeSection === 'media' && (
            <div className="space-y-6">
              <SectionHeader title={t('media_section_title')} desc={t('media_section_desc')} />
              {!activity ? (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">{t('save_activity_first_for_photos')}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
                        {img.is_cover && <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{t('cover_badge')}</span>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.is_cover && (
                            <button onClick={() => handleSetCover(img.id)} className="bg-white text-slate-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-slate-50 flex items-center gap-1">
                              <Star className="w-3 h-3" /> {t('set_cover_button')}
                            </button>
                          )}
                          <button onClick={() => handleDeleteImage(img.id)} className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-600 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> {t('delete_button')}
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className={cn(
                      'aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary cursor-pointer',
                      uploadingPhoto && 'opacity-50 pointer-events-none'
                    )}>
                      {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      <span className="text-xs font-medium">{t('upload_photo_button')}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                    <p className="font-medium text-slate-700">{t('tips_label')}</p>
                    <p>• {t('tip_min_max_photos')}</p>
                    <p>• {t('tip_resolution')}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'translations' && (
            <div className="space-y-6">
              <SectionHeader title={t('translations_section_title')} desc={t('translations_section_desc')} />
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Languages className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">{t('translations_info_text')}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-2 flex-wrap">
          {canSubmitForReview && (
            <Button variant="outline" size="sm" onClick={handleSubmitForReview} disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {t('submit_for_review_button')}
            </Button>
          )}
          {isAdmin && activity && status !== 'published' && (
            <Button variant="outline" size="sm" onClick={() => handleAdminStatusChange('published')} disabled={submitting} className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {t('publish_button')}
            </Button>
          )}
          {isAdmin && activity && status === 'published' && (
            <Button variant="outline" size="sm" onClick={() => handleAdminStatusChange('suspended')} disabled={submitting} className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {t('suspend_button')}
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {activity ? t('save_button') : t('create_draft_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
