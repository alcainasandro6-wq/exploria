'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    category: 'Para turistas',
    questions: [
      { q: '¿Cómo funciona la reserva?', a: 'Selecciona la actividad, elige fecha y número de participantes, y envía tu solicitud. El proveedor te contactará para confirmar los detalles y el pago se realiza directamente a él.' },
      { q: '¿Tengo que pagar online?', a: 'No. Exploria no procesa pagos de actividades. El pago lo realizas directamente al proveedor, ya sea en efectivo, transferencia u otros métodos que él ofrezca.' },
      { q: '¿Cómo cancelo una reserva?', a: 'Contacta directamente con el proveedor según su política de cancelación, que se muestra claramente en cada actividad. Desde tu panel puedes ver los datos de contacto del proveedor.' },
      { q: '¿Las actividades están verificadas?', a: 'Todos los proveedores que publican actividades en Exploria pasan por un proceso de verificación. Sin embargo, Exploria actúa como intermediario y no organiza las actividades directamente.' },
    ]
  },
  {
    category: 'Para proveedores',
    questions: [
      { q: '¿Cuánto cuesta publicar actividades?', a: 'Necesitas una suscripción mensual o anual. Los planes van desde €49/mes (Basic) hasta €199/mes (Premium). Tienes 30 días de prueba gratuita al registrarte.' },
      { q: '¿Qué pasa si no pago la suscripción?', a: 'Si tu suscripción vence sin renovar, tus actividades se suspenden automáticamente y dejan de aparecer en el marketplace. Se reactivan al renovar el pago.' },
      { q: '¿Cuáles son las comisiones?', a: 'La comisión de la plataforma es del 5% sobre el precio de cada reserva. Además, si la reserva viene de un hotel colaborador, hay una comisión adicional del 8% para ese hotel, que tú pagas al completar la reserva.' },
      { q: '¿Cómo confirmo reservas?', a: 'Recibirás notificaciones de nuevas reservas en tu panel. Puedes confirmar o rechazar cada reserva desde allí. El cliente recibirá una notificación automática.' },
    ]
  },
  {
    category: 'Para hoteles',
    questions: [
      { q: '¿Cómo funciona el sistema de afiliación?', a: 'Al registrarte como hotel recibes un código y enlace únicos. Cuando tus huéspedes usen ese enlace para reservar, la reserva se atribuye a tu hotel y ganas una comisión del 8%.' },
      { q: '¿Cómo recibo el QR?', a: 'Al registrarte y completar tu perfil, se genera automáticamente un QR personalizado que puedes descargar e imprimir para colocar en recepción.' },
      { q: '¿Cuándo cobro las comisiones?', a: 'Las comisiones se acumulan mensualmente. Puedes solicitar el pago desde tu panel cuando alcances el mínimo establecido o al final de cada mes.' },
    ]
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-4 text-left gap-4"
      >
        <span className={cn('text-sm font-semibold transition-colors', open ? 'text-[#0066FF]' : 'text-slate-900')}>
          {question}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <p className="text-sm text-slate-500 leading-relaxed pb-4">{answer}</p>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#0066FF] to-[#003d99] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold mb-3">Preguntas frecuentes</h1>
          <p className="text-blue-100">Todo lo que necesitas saber sobre Exploria</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-xl font-bold text-slate-900 mb-6">{section.category}</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
              {section.questions.map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
