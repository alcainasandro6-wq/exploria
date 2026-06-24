'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import {
  Save, ArrowLeft, Plus, X, Upload, Languages,
  MapPin, Clock, Users, DollarSign, Globe, Shield, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Map
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Link, useRouter } from '@/i18n/navigation'
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

export default function NewActivityPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('basic')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)

  const [form, setForm] = useState({
    title: '',
    short_description: '',
    description: '',
    category_id: 'diving',
    price_from: '',
    duration_minutes: '',
    min_participants: '1',
    max_participants: '10',
    languages: ['es'] as string[],
    meeting_point: '',
    city: 'Torrevieja',
    country: 'España',
    latitude: '',
    longitude: '',
    google_maps_url: '',
    cancellation_policy: 'Cancelación gratuita hasta 24 horas antes de la actividad. En caso de cancelación tardía se cobrará el 50% del precio.',
    included: [] as string[],
    excluded: [] as string[],
    requirements: [] as string[],
    status: 'draft' as 'draft' | 'published',
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
    if (!form.title || !form.description || !form.price_from) {
      toast.error('Rellena los campos obligatorios: título, descripción y precio')
      setActiveSection('basic')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Actividad creada correctamente')
    router.push('/dashboard/provider/activities')
  }

  const handleAutoTranslate = async () => {
    if (!form.title) { toast.error('Añade primero el título de la actividad'); return }
    setTranslating(true)
    await new Promise(r => setTimeout(r, 2000))
    setTranslating(false)
    toast.success('Traducción automática lista. Revísala en el panel de Traducciones.')
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

        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/provider/activities" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
              <ArrowLeft className="w-4 h-4" />
              Mis actividades
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <h1 className="text-base font-semibold text-slate-900">{form.title || 'Nueva actividad'}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Borrador</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoTranslate} disabled={translating} className="gap-1.5">
              {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
              Traducir automáticamente
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Crear actividad
            </Button>
          </div>
        </div>

        <div className="flex gap-0">
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

          <div className="flex-1 p-8 max-w-3xl">

            {activeSection === 'basic' && (
              <div className="space-y-6">
                <SectionHeader title="Información básica" desc="Título, descripción y categoría de la actividad." />
                <Field label="Título de la actividad *">
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Buceo con instructores certificados en Torrevieja" />
                </Field>
                <Field label="Descripción corta *" hint="Aparece en las tarjetas de búsqueda (máx. 160 car.)">
                  <textarea value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} rows={2} maxLength={160} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] resize-none" placeholder="Una frase que enganche al cliente" />
                </Field>
                <Field label="Descripción completa *">
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={8} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] resize-none" placeholder="Describe la actividad en detalle..." />
                </Field>
                <Field label="Categoría *">
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] bg-white">
                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {activeSection === 'details' && (
              <div className="space-y-6">
                <SectionHeader title="Detalles de la actividad" desc="Precio, duración, participantes, idiomas y políticas." />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Precio desde (€/persona) *"><Input type="number" min="1" value={form.price_from} onChange={e => setForm(f => ({ ...f, price_from: e.target.value }))} placeholder="45" /></Field>
                  <Field label="Duración (minutos) *"><Input type="number" min="30" step="30" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="180" /></Field>
                  <Field label="Mín. participantes"><Input type="number" min="1" value={form.min_participants} onChange={e => setForm(f => ({ ...f, min_participants: e.target.value }))} /></Field>
                  <Field label="Máx. participantes"><Input type="number" min="1" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))} /></Field>
                </div>
                <Field label="Idiomas en que se realiza *">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {LOCALES.map(loc => (
                      <button key={loc} type="button" onClick={() => toggleLanguage(loc)}
                        className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                          form.languages.includes(loc) ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF]'
                        )}>
                        {LOCALE_NAMES[loc]}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Qué incluye">
                  <div className="space-y-2 mb-2">
                    {form.included.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeFromList('included', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newIncluded} onChange={e => setNewIncluded(e.target.value)} placeholder="Ej: Instructor certificado PADI" onKeyDown={e => e.key === 'Enter' && addToList('included', newIncluded, setNewIncluded)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => addToList('included', newIncluded, setNewIncluded)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Field>
                <Field label="Qué NO incluye">
                  <div className="space-y-2 mb-2">
                    {form.excluded.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 text-sm">
                        <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeFromList('excluded', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newExcluded} onChange={e => setNewExcluded(e.target.value)} placeholder="Ej: Traslados" onKeyDown={e => e.key === 'Enter' && addToList('excluded', newExcluded, setNewExcluded)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => addToList('excluded', newExcluded, setNewExcluded)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Field>
                <Field label="Requisitos">
                  <div className="space-y-2 mb-2">
                    {form.requirements.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="flex-1">{item}</span>
                        <button onClick={() => removeFromList('requirements', i)}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newRequirement} onChange={e => setNewRequirement(e.target.value)} placeholder="Ej: Saber nadar" onKeyDown={e => e.key === 'Enter' && addToList('requirements', newRequirement, setNewRequirement)} />
                    <Button type="button" variant="outline" size="sm" onClick={() => addToList('requirements', newRequirement, setNewRequirement)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </Field>
                <Field label="Política de cancelación *">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CANCELLATION_PRESETS.map(preset => (
                      <button key={preset.label} type="button" onClick={() => setForm(f => ({ ...f, cancellation_policy: preset.value }))}
                        className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                          form.cancellation_policy === preset.value ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF]'
                        )}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={form.cancellation_policy} onChange={e => setForm(f => ({ ...f, cancellation_policy: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] resize-none" />
                </Field>
              </div>
            )}

            {activeSection === 'location' && (
              <div className="space-y-6">
                <SectionHeader title="Ubicación y mapa" desc="Punto de encuentro, coordenadas y ficha de Google Maps para reseñas." />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ciudad"><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></Field>
                  <Field label="País"><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></Field>
                </div>
                <Field label="Punto de encuentro *">
                  <Input value={form.meeting_point} onChange={e => setForm(f => ({ ...f, meeting_point: e.target.value }))} placeholder="Ej: Puerto Deportivo, Muelle de Levante" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitud"><Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="37.9781" /></Field>
                  <Field label="Longitud"><Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="-0.6782" /></Field>
                </div>
                <Field label="URL de Google Maps" hint="Pega la URL de tu negocio en Google Maps. Las reseñas de Google se mostrarán en tu página.">
                  <Input value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} placeholder="https://www.google.com/maps/place/..." />
                </Field>
                {form.latitude && form.longitude && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Vista previa</p>
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      <iframe src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`} width="100%" height="240" style={{ border: 0 }} loading="lazy" title="Mapa" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'media' && (
              <div className="space-y-6">
                <SectionHeader title="Fotos de la actividad" desc="Sube fotos atractivas. La primera será la foto de portada." />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <button type="button" onClick={() => toast.info('Subida disponible una vez configurado el almacenamiento')}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0066FF] hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#0066FF]">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">Subir fotos</span>
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">Consejos:</p>
                  <p>• Mínimo 4 fotos, máximo 20</p>
                  <p>• Resolución mínima 1200×800px · Formato JPG/PNG · Máx. 5MB</p>
                </div>
              </div>
            )}

            {activeSection === 'translations' && (
              <div className="space-y-6">
                <SectionHeader title="Traducciones" desc="La actividad se traduce automáticamente a todos los idiomas de la plataforma." />
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <Languages className="w-5 h-5 text-[#0066FF] mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600">Primero completa la info básica en español, luego pulsa <strong>Traducir automáticamente</strong> en la barra superior.</p>
                </div>
                {(['en', 'fr', 'de', 'pl', 'ru'] as const).map(loc => (
                  <div key={loc} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <span className="font-semibold text-slate-800">{LOCALE_NAMES[loc]}</span>
                      <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                    </div>
                    <div className="p-5 space-y-4">
                      <Field label="Título"><Input placeholder="Se completará con la traducción automática" className="text-slate-400" /></Field>
                      <Field label="Descripción corta"><textarea rows={2} placeholder="Se completará con la traducción automática" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 outline-none focus:ring-2 focus:ring-[#0066FF] resize-none" /></Field>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-8 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Crear actividad
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
