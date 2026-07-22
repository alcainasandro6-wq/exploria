import { MapPin, Mail, Phone, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto | BookActivities',
  description: 'Ponte en contacto con el equipo de BookActivities.',
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#0A0F1E] via-primary-dark to-primary py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Ponte en contacto con nosotros</h1>
        <p className="text-blue-100/80 max-w-xl mx-auto">
          ¿Tienes dudas sobre una reserva, quieres publicar tus actividades o simplemente saludar? Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 gap-5">
          <a href="mailto:hola@bookactivities.com" className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Email</p>
              <p className="text-sm text-slate-500">hola@bookactivities.com</p>
            </div>
          </a>

          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Me gustaría obtener más información.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">WhatsApp</p>
                <p className="text-sm text-slate-500">Respuesta rápida en horario de oficina</p>
              </div>
            </a>
          )}

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Ubicación</p>
              <p className="text-sm text-slate-500">Torrevieja, Alicante, España</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Atención al proveedor</p>
              <p className="text-sm text-slate-500">Escríbenos para publicar tus actividades</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
