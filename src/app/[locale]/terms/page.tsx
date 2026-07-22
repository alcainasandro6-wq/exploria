import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y condiciones | BookActivities',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h1 className="text-3xl font-extrabold mb-2">Términos y condiciones</h1>
          <p className="text-slate-300 text-sm">Última actualización: 24 de junio de 2025</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="prose prose-slate max-w-none">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
            <p className="text-sm font-semibold text-amber-800">
              ⚠️ Aviso importante: BookActivities actúa exclusivamente como intermediario tecnológico. No organiza actividades turísticas, no realiza cobros en nombre de los proveedores, ni asume responsabilidad por la prestación de los servicios, que corresponde exclusivamente a los proveedores registrados.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Objeto y naturaleza del servicio</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              BookActivities es una plataforma tecnológica de intermediación que facilita el contacto entre turistas (usuarios) y proveedores de actividades turísticas. La plataforma NO presta servicios turísticos directamente.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Los proveedores son empresas o profesionales independientes que ofrecen y gestionan sus propias actividades. Son los únicos responsables de la calidad, seguridad, legalidad y ejecución de las actividades ofertadas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Registro y uso de la plataforma</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              Para acceder a ciertas funcionalidades de la plataforma es necesario registrarse. El usuario garantiza que los datos proporcionados son verídicos y se compromete a mantenerlos actualizados.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Existen tres tipos de cuentas: cliente (turista), proveedor de actividades y hotel colaborador, cada una con sus propias condiciones de uso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Suscripciones de proveedores</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              Los proveedores deben contratar y mantener activa una suscripción mensual o anual para publicar actividades y recibir reservas. Sin suscripción activa, las actividades del proveedor serán suspendidas automáticamente.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Los pagos de suscripción se procesan mediante Stripe. En caso de impago, BookActivities se reserva el derecho de suspender el acceso a los servicios del proveedor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Reservas y pagos de actividades</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              Las reservas realizadas a través de BookActivities son solicitudes dirigidas directamente al proveedor. <strong>BookActivities no procesa pagos de actividades</strong>. El pago de la actividad se realiza directamente al proveedor según sus propias condiciones.
            </p>
            <p className="text-slate-600 leading-relaxed">
              BookActivities percibe una comisión del 5% del precio de cada reserva confirmada, que es abonada por el proveedor. Los hoteles colaboradores perciben una comisión del 8% por las reservas generadas a través de sus enlaces o QR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Responsabilidad</h2>
            <p className="text-slate-600 leading-relaxed">
              BookActivities no se hace responsable de daños, perjuicios o incidencias que puedan ocurrir durante la realización de actividades. La responsabilidad por la prestación del servicio recae íntegramente en el proveedor. El usuario debe verificar que el proveedor cumple con toda la normativa turística y de seguridad vigente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Ley aplicable y jurisdicción</h2>
            <p className="text-slate-600 leading-relaxed">
              Los presentes términos se rigen por la legislación española. Para la resolución de conflictos, las partes se someten a los Juzgados y Tribunales de Torrevieja, Alicante, salvo que la normativa aplicable establezca un fuero distinto.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
