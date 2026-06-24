'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, TrendingUp, Users, BarChart3, Clock, Shield, ArrowRight, Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const benefits = [
  { icon: Users, title: 'Acceso a miles de turistas', desc: 'Tu actividad visible para turistas de toda Europa que visitan la zona.' },
  { icon: TrendingUp, title: 'Aumenta tus reservas', desc: 'Nuestros proveedores reportan un incremento medio del 40% en reservas.' },
  { icon: BarChart3, title: 'Panel de gestión completo', desc: 'Gestiona disponibilidad, precios y reservas desde un único panel.' },
  { icon: Shield, title: 'Pagos seguros garantizados', desc: 'Cobras automáticamente. Exploria gestiona los pagos por ti.' },
  { icon: Clock, title: 'Sin compromiso de permanencia', desc: 'Flexibilidad total. Publica y pausa tus actividades cuando quieras.' },
  { icon: Star, title: 'Reseñas verificadas', desc: 'Sistema de valoraciones reales que aumentan tu credibilidad.' },
]

const steps = [
  { num: '01', title: 'Envía tu solicitud', desc: 'Completa el formulario con los datos de tu empresa y actividades.' },
  { num: '02', title: 'Revisamos tu perfil', desc: 'Nuestro equipo verifica tus actividades en un plazo de 48-72 horas.' },
  { num: '03', title: 'Aprobación y activación', desc: 'Recibes acceso a tu panel de proveedor y puedes publicar de inmediato.' },
]

export default function ProvidersPage() {
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    activities: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
    toast.success('Solicitud enviada correctamente. Te contactaremos en 48-72 horas.')
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-slate-950 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block bg-[#0066FF]/20 text-[#60a5fa] text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 mb-6">
              Para proveedores
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Publica tus actividades en Exploria y llega a más turistas
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Únete a la plataforma de referencia para actividades turísticas en Torrevieja.
              Sin costes fijos — solo pagamos juntos cuando tú cobras.
            </p>
            <div className="flex flex-wrap gap-6 text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Proceso de aprobación en 48-72h
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Sin cuota mensual de entrada
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Soporte dedicado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-slate-900 mb-3">¿Por qué Exploria?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Todo lo que necesitas para hacer crecer tu negocio de actividades turísticas.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#0066FF]" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Cómo funciona</h2>
            <p className="text-slate-500">Proceso simple y rápido para empezar a publicar tus actividades.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-slate-200" />
                )}
                <div className="relative w-16 h-16 bg-[#0066FF] rounded-2xl flex items-center justify-center mb-5 text-white font-black text-xl z-10">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 bg-slate-50" id="solicitud">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Solicita unirte</h2>
            <p className="text-slate-500">Completa el formulario y nos pondremos en contacto contigo en 48-72 horas.</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Solicitud recibida!</h3>
              <p className="text-slate-500 mb-6">
                Hemos recibido tu solicitud. Nuestro equipo la revisará y se pondrá en contacto contigo en un plazo de 48-72 horas.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 text-[#0066FF] font-semibold hover:underline">
                Volver al inicio <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="company">Nombre de la empresa *</Label>
                  <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Tu empresa o nombre comercial" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Tu nombre *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre y apellidos" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email de contacto *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="tu@empresa.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+34 600 000 000" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activities">¿Qué actividades ofreces? *</Label>
                <textarea
                  id="activities"
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  placeholder="Describe brevemente las actividades que quieres publicar (buceo, kayak, tours, etc.)"
                  rows={3}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Web o redes sociales (opcional)</Label>
                <Input id="website" type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://tuempresa.com" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando solicitud...</> : <>Enviar solicitud <ArrowRight className="w-4 h-4" /></>}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Al enviar este formulario aceptas nuestra{' '}
                <Link href="/privacy" className="text-[#0066FF] hover:underline">política de privacidad</Link>.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
