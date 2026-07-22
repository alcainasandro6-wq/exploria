import { ShieldCheck, Clock, Headset } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const REASONS = [
  {
    num: '01',
    icon: ShieldCheck,
    gradient: 'from-violet-500 to-indigo-500',
    title: 'Garantía de calidad',
    desc: 'Cada proveedor pasa por un proceso de verificación antes de publicar. Experiencias reales, valoradas por viajeros reales.',
  },
  {
    num: '02',
    icon: Clock,
    gradient: 'from-emerald-500 to-teal-500',
    title: 'Cancelación flexible',
    desc: 'La mayoría de actividades admiten cancelación gratuita hasta 24-48h antes. Reserva sin miedo a imprevistos.',
  },
  {
    num: '03',
    icon: Headset,
    gradient: 'from-amber-500 to-orange-500',
    title: 'Atención personalizada',
    desc: 'Sin pago online: hablas directamente con el proveedor para confirmar cada detalle de tu experiencia.',
  },
] as const

export function WhyChooseUs() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">¿Por qué elegirnos?</h2>
          <div className="h-1 w-14 bg-primary rounded-full mx-auto mt-4" />
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {REASONS.map(({ num, icon: Icon, gradient, title, desc }) => (
            <div key={num} className="relative bg-white rounded-2xl border border-slate-100 p-7 pt-9 shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute top-4 right-5 text-xs font-bold text-slate-300 tracking-wide">{num}</span>
              <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-sm', gradient)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/activities" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}>
            Nuestros servicios →
          </Link>
        </div>
      </div>
    </section>
  )
}
