'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import {
  Save, Eye, ArrowLeft, Plus, X, Upload, Languages,
  MapPin, Clock, Users, DollarSign, Globe, Shield, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Star, Map
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CATEGORIES, LOCALES, LOCALE_NAMES } from '@/lib/constants'

const MOCK_SUBSCRIPTION = { plan: 'Pro', status: 'active' as const, nextBilling: '2025-08-01', price: 99 }

const CANCELLATION_PRESETS = [
  { label: 'Cancelación gratuita 24h', value: 'Cancelación gratuita hasta 24 horas antes de la actividad. En caso de cancelación tardía se cobrará el 50% del precio.' },
  { label: 'Cancelación gratuita 48h', value: 'Cancelación gratuita hasta 48 horas antes de la actividad. Cancelaciones tardías no reembolsables.' },
  { label: 'No reembolsable', value: 'Esta actividad no admite cancelaciones ni reembolsos una vez confirmada la reserva.' },
]

type Section = 'basic' | 'details' | 'location' | 'media' | 'translations'

export default function ActivityEditorPage() {
  const [activeSection, setActiveSection] = useState<Section>('basic')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)

  const [form, setForm] = useState({
    title: 'Buceo con instructores certificados en Torrevieja',
    short_description: 'Sumérgete en las cristalinas aguas del Mediterráneo con instructores certificados PADI.',
    description: `Descubre el fascinante mundo submarino del Mediterráneo con nuestros instructores certificados PADI. Torrevieja es uno de los mejores destinos de buceo en España, con aguas cristalinas, rica biodiversidad marina y pecios históricos.

Durante esta experiencia, nuestros instructores te guiarán por los puntos más espectaculares de la costa torrevejense. Verás coloridos peces, estrellas de mar, pulpos, y si tienes suerte, hasta delfines.`,
    category_id: 'diving',
    price_from: '45',
    duration_minutes: '180',
    min_participants: '2',
    max_participants: '8',
    languages: ['es', 'en', 'de'] as string[],
    meeting_point: 'Puerto Deportivo de Torrevieja, Muelle de Levante',
    city: 'Torrevieja',
    country: 'España',
    latitude: '37.9781',
    longitude: '-0.6782',
    google_maps_url: 'https://www.google.com/maps/place/Puerto+Deportivo+de+Torrevieja/@37.9781,-0.6782,16z',
    cancellation_policy: 'Cancelación gratuita hasta 24 horas antes de la actividad. En caso de cancelación tardía se cobrará el 50% del precio.',
    included: ['Equipo de buceo completo', 'Instructor certificado PADI', 'Seguro de actividad', 'Fotos subacuáticas'],
    excluded: ['Traslados desde/hacia el hotel', 'Comidas y bebidas adicionales'],
    requirements: ['Saber nadar', 'Edad mínima: 10 años', 'Buena condición física general'],
    status: 'published' as 'draft' | 'published',
  })

  const [newIncluded, setNewIncluded] = useState('')
  const [newExcluded, setNewExcluded] = useState('')
  const [newRequirement, setNewRequirement] = useState('')

  const addToList = (field: 'included' | 'excluded' | 'requirements', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return
    setForm(f => ({ ...f, [field]: [...f[field], value.trim()] }))
    setter('')
  }
  const removeFromList = (field: 'included' | 'excluded' | 'requirements', index: number) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }))
  }

  const toggleLanguage = (loc: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(loc)
        ? f.languages.filter(l => l !== loc)
        : [...f.languages, loc],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Actividad guardada correctamente')
  }

  const handleAutoTranslate = async () => {
    setTranslating(true)
    await new Promise(r => setTimeout(r, 2000))
    setTranslating(false)
    toast.success('Traducción automática completada. Revisa cada idioma en el panel de traducciones.')
    setActiveSection('translations')
  }

  const sections: { key: Section; label: string; icon: typeof Save }[] = [
    { key: 'basic', label: 'Info básica', icon: AlertCircle },
    { key: 'details', label: 'Detalles', icon: CheckCircle2 },
    { key: 'location', label: 'Ubicación', icon: MapPin },
    { key: 'media', label: 'Fotos', icon: ImageIcon },
    { key: 'translations', label: 'Traducciones', icon: Languages },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar role="provider" userName="Buceo Mediterráneo" userEmail="info@buceomed.es" />
      <main className="flex-1 overflow-auto">
        <SubscriptionBanner subscription={MOCK_SUBSCRIPTION} />

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/provider/activities" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
              <ArrowLeft className="w-4 h-4" />
              Mis actividades
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <h1 className="text-base font-semibold text-slate-900 truncate max-w-sm">{form.title || 'Nueva actividad'}</h1>
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              form.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            )}>
              {form.status === 'published' ? 'Publicada' : 'Borrador'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoTranslate}
              disabled={translating}
              className="gap-1.5"
            >
              {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
              Traducir automáticamente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForm(f => ({ ...f, status: f.status === 'published' ? 'draft' : 'published' }))}
            >
              {form.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar
            </Button>
          </div>
        </div>

        <div className="flex gap-0">
          {/* Section nav */}
          <nav className="w-48 shrink-0 border-r border-slate-200 bg-white min-h-screen pt-6 pb-8 px-3">
            {sections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors',
                  activeSection === key
                    ? 'bg-[#0066FF]/10 text-[#0066FF]'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 p-8 max-w-3xl">

            {/* ─── BASIC INFO ─── */}
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <SectionHeader title="Información básica" desc="Título, descripción y categoría de la actividad." />

                <Field label="Título de la actividad *">
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ej: Buceo con instructores certificados en Torrevieja"
                  />
                  <p className="text-xs text-slate-400 mt-1">{form.title.length}/80 caracteres</p>
                </Field>

                <Field label="Descripción corta *" hint="Aparece en las tarjetas de búsqueda (máx. 160 car.)">
                  <textarea
                    value={form.short_description}
                    onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                    rows={2}
                    maxLength={160}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] resize-none"
                    placeholder="Una frase que enganche al cliente"
                  />
                </Field>

                <Field label="Descripción completa *">
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={8}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] resize-none"
                    placeholder="Describe la actividad en detalle: qué verá el cliente, qué hará, por qué es especial..."
                  />
                </Field>

                <Field label="Categoría *">
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Estado">
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] bg-white"
                    >
                      <option value="draft">Borrador (no visible)</option>
                      <option value="published">Publicada (visible)</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* ─── DETAILS ─── */}
            {activeSection === 'details' && (
              <div className="space-y-6">
                <SectionHeader title="Detalles de la actividad" desc="Precio, duración, participantes, idiomas y políticas." />

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Precio desde (€/persona) *" icon={<DollarSign className="w-4 h-4" />}>
                    <Input type="number" min="1" value={form.price_from} onChange={e => setForm(f => ({ ...f, price_from: e.target.value }))} placeholder="45" />
                  </Field>
                  <Field label="Duración (minutos) *" icon={<Clock className="w-4 h-4" />}>
                    <Input type="number" min="30" step="30" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="180" />
                  </Field>
                  <Field label="Mín. participantes" icon={<Users className="w-4 h-4" />}>
                    <Input type="number" min="1" value={form.min_participants} onChange={e => setForm(f => ({ ...f, min_participants: e.target.value }))} placeholder="2" />
                  </Field>
                  <Field label="Máx. participantes" icon={<Users className="w-4 h-4" />}>
                    <Input type="number" min="1" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))} placeholder="8" />
                  </Field>
                </div>

                <Field label="Idiomas en que se realiza *" icon={<Globe className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {LOCALES.map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleLanguage(loc)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                          form.languages.includes(loc)
                            ? 'bg-[#0066FF] text-white border-[#0066FF]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF]'
                        )}
                      >
                        {LOCALE_NAMES[loc]}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Qué incluye" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}>
                  <div className="space-y-2 mb-2">
                    {form.included.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeFromList('included', i)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newIncluded} onChange={e => setNewIncluded(e.target.value)} placeholder="Ej: Instructor certificado PADI" onKeyDown={e => e.key === 'Enter' && addToList('included', newIncluded, setNewIncluded)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => addToList('included', newIncluded, setNewIncluded)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Field>

                <Field label="Qué NO incluye" icon={<X className="w-4 h-4 text-red-400" />}>
                  <div className="space-y-2 mb-2">
                    {form.excluded.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 text-sm">
                        <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeFromList('excluded', i)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newExcluded} onChange={e => setNewExcluded(e.target.value)} placeholder="Ej: Traslados al punto de encuentro" onKeyDown={e => e.key === 'Enter' && addToList('excluded', newExcluded, setNewExcluded)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => addToList('excluded', newExcluded, setNewExcluded)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Field>

                <Field label="Requisitos" icon={<AlertCircle className="w-4 h-4 text-amber-500" />}>
                  <div className="space-y-2 mb-2">
                    {form.requirements.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeFromList('requirements', i)} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newRequirement} onChange={e => setNewRequirement(e.target.value)} placeholder="Ej: Saber nadar" onKeyDown={e => e.key === 'Enter' && addToList('requirements', newRequirement, setNewRequirement)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => addToList('requirements', newRequirement, setNewRequirement)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Field>

                <Field label="Política de cancelación *" icon={<Shield className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CANCELLATION_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cancellation_policy: preset.value }))}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-colors',
                          form.cancellation_policy === preset.value
                            ? 'bg-[#0066FF] text-white border-[#0066FF]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF]'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.cancellation_policy}
                    onChange={e => setForm(f => ({ ...f, cancellation_policy: e.target.value }))}
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] resize-none"
                  />
                </Field>
              </div>
            )}

            {/* ─── LOCATION ─── */}
            {activeSection === 'location' && (
              <div className="space-y-6">
                <SectionHeader title="Ubicación y mapa" desc="Punto de encuentro, coordenadas y ficha de Google Maps para reseñas." />

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ciudad">
                    <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Torrevieja" />
                  </Field>
                  <Field label="País">
                    <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="España" />
                  </Field>
                </div>

                <Field label="Punto de encuentro *" icon={<MapPin className="w-4 h-4" />}>
                  <Input value={form.meeting_point} onChange={e => setForm(f => ({ ...f, meeting_point: e.target.value }))} placeholder="Ej: Puerto Deportivo de Torrevieja, Muelle de Levante" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitud" hint="Ej: 37.9781">
                    <Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="37.9781" />
                  </Field>
                  <Field label="Longitud" hint="Ej: -0.6782">
                    <Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="-0.6782" />
                  </Field>
                </div>

                <Field
                  label="URL de Google Maps (para reseñas)"
                  hint="Pega la URL de la ficha de tu negocio en Google Maps. Las reseñas se mostrarán en tu página."
                  icon={<Map className="w-4 h-4" />}
                >
                  <Input
                    value={form.google_maps_url}
                    onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))}
                    placeholder="https://www.google.com/maps/place/Tu+Empresa/@37.97,-0.67,16z"
                  />
                  {form.google_maps_url && (
                    <a href={form.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0066FF] hover:underline mt-1 inline-block">
                      Verificar enlace →
                    </a>
                  )}
                </Field>

                {/* Map preview */}
                {form.latitude && form.longitude && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Vista previa del mapa</p>
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      <iframe
                        src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
                        width="100%"
                        height="240"
                        style={{ border: 0 }}
                        loading="lazy"
                        title="Vista previa del mapa"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── MEDIA ─── */}
            {activeSection === 'media' && (
              <div className="space-y-6">
                <SectionHeader title="Fotos de la actividad" desc="Sube fotos atractivas. La primera será la foto de portada." />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Existing photos */}
                  {[
                    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=70',
                    'https://images.unsplash.com/photo-1560881882-8ffcdb24bbe0?w=400&q=70',
                    'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=400&q=70',
                    'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&q=70',
                  ].map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 bg-[#0066FF] text-white text-xs font-bold px-2 py-0.5 rounded-full">Portada</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {i !== 0 && (
                          <button className="bg-white text-slate-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-slate-50">
                            Hacer portada
                          </button>
                        )}
                        <button className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-600">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => toast.info('Subida de imágenes disponible con almacenamiento configurado')}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0066FF] hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#0066FF]"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">Subir foto</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500">
                  <p className="font-medium text-slate-700 mb-1">Consejos para las fotos:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Mínimo 4 fotos, máximo 20</li>
                    <li>• Resolución mínima 1200×800px</li>
                    <li>• Formato JPG o PNG, máximo 5MB por foto</li>
                    <li>• La primera foto es la portada en el catálogo</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ─── TRANSLATIONS ─── */}
            {activeSection === 'translations' && (
              <div className="space-y-6">
                <SectionHeader title="Traducciones" desc="El contenido de la actividad se traduce automáticamente a todos los idiomas de la plataforma." />

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <Languages className="w-5 h-5 text-[#0066FF] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">Traducción automática con IA</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pulsa "Traducir automáticamente" en la barra superior para traducir el título, descripción y todos los textos a los 6 idiomas de la plataforma (ES, EN, FR, DE, PL, RU).
                      Puedes revisar y editar cada traducción antes de publicar.
                    </p>
                  </div>
                </div>

                {(['en', 'fr', 'de', 'pl', 'ru'] as const).map(loc => (
                  <div key={loc} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{loc === 'en' ? '🇬🇧' : loc === 'fr' ? '🇫🇷' : loc === 'de' ? '🇩🇪' : loc === 'pl' ? '🇵🇱' : '🇷🇺'}</span>
                        <span className="font-semibold text-slate-800">{LOCALE_NAMES[loc]}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">Pendiente de traducción</Badge>
                    </div>
                    <div className="p-5 space-y-4">
                      <Field label="Título">
                        <Input placeholder="Se completará con la traducción automática" className="text-slate-400 placeholder:text-slate-300" />
                      </Field>
                      <Field label="Descripción corta">
                        <textarea rows={2} placeholder="Se completará con la traducción automática" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#0066FF] resize-none" />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Save button at bottom */}
            <div className="pt-8 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </main>
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
