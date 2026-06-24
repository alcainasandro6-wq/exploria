import Image from 'next/image'
import { Users, Shield, Star, MapPin, Heart, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre nosotros | Exploria',
  description: 'Conoce el equipo detrás de Exploria, la plataforma líder de actividades turísticas en Torrevieja.',
}

const values = [
  { icon: Shield, title: 'Transparencia total', desc: 'Actuamos como intermediario transparente. Los proveedores gestionan directamente sus actividades y cobros.' },
  { icon: Star, title: 'Calidad verificada', desc: 'Todos nuestros proveedores pasan por un proceso de verificación y mantienen altos estándares de calidad.' },
  { icon: Heart, title: 'Pasión local', desc: 'Somos de Torrevieja y amamos esta tierra. Queremos compartir lo mejor de nuestra costa con el mundo.' },
  { icon: TrendingUp, title: 'Crecimiento mutuo', desc: 'Nuestro éxito depende del éxito de nuestros proveedores. Crecemos juntos.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0066FF] to-[#003d99] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5">Sobre Exploria</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Somos la plataforma tecnológica que conecta a turistas con los mejores proveedores de actividades locales en Torrevieja y la Costa Blanca.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5">Nuestra misión</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Exploria nació con un objetivo claro: hacer que descubrir y reservar actividades turísticas en Torrevieja sea simple, seguro y satisfactorio para todos.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Para los turistas:</strong> una plataforma donde encontrar experiencias auténticas y verificadas, con toda la información necesaria para tomar la mejor decisión.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Para los proveedores:</strong> una herramienta profesional que les ayuda a llegar a más clientes, gestionar sus reservas y hacer crecer su negocio.
            </p>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '150+', label: 'Actividades' },
                { value: '45+', label: 'Proveedores' },
                { value: '8.000+', label: 'Clientes felices' },
                { value: '4.9★', label: 'Valoración media' },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-white rounded-2xl p-4 shadow-sm">
                  <div className="text-2xl font-extrabold text-[#0066FF]">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">Cómo funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Explora actividades', desc: 'Navega por nuestra selección de actividades verificadas en Torrevieja. Filtra por categoría, precio, idioma y más.' },
              { step: '02', title: 'Solicita tu reserva', desc: 'Contacta directamente con el proveedor a través de nuestra plataforma. Sin pago online: el pago se hace al proveedor directamente.' },
              { step: '03', title: 'Vive la experiencia', desc: 'Asiste a tu actividad y vive una experiencia única. Después, comparte tu valoración para ayudar a otros viajeros.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-[#0066FF] rounded-2xl flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">Nuestros valores</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-[#0066FF]/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#0066FF]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legal Notice */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Shield className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
            <strong className="text-slate-300">Aviso legal:</strong> Exploria actúa exclusivamente como intermediario tecnológico y comercial. No organiza ni gestiona actividades turísticas. Los servicios son prestados directamente por los proveedores, quienes son responsables de la gestión, confirmación, cobro y cumplimiento de la normativa turística aplicable.
          </p>
        </div>
      </section>
    </div>
  )
}
