import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad | Exploria',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h1 className="text-3xl font-extrabold mb-2">Política de privacidad</h1>
          <p className="text-slate-300 text-sm">Última actualización: 24 de junio de 2025 · Conforme al RGPD y LOPDGDD</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Responsable del tratamiento</h2>
          <p>Exploria SL, con CIF B-XXXXXXXX, domicilio en Torrevieja, Alicante. Email de contacto: privacidad@exploria.es</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Datos que recogemos</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Datos de registro: nombre, email, teléfono, rol en la plataforma</li>
            <li>Datos de uso: páginas visitadas, actividades consultadas, reservas realizadas</li>
            <li>Datos técnicos: dirección IP, tipo de navegador, dispositivo</li>
            <li>Proveedores: datos fiscales (NIF, razón social, dirección)</li>
            <li>Cookies: ver nuestra política de cookies</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Finalidades y bases legitimadoras</h2>
          <p className="text-sm mb-2">Tratamos tus datos para:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Gestionar tu cuenta y prestarte los servicios contratados (ejecución de contrato)</li>
            <li>Enviarte comunicaciones sobre tus reservas (ejecución de contrato)</li>
            <li>Enviarte newsletter o comunicaciones comerciales, si nos has dado tu consentimiento</li>
            <li>Cumplir con obligaciones legales (cumplimiento legal)</li>
            <li>Mejorar nuestros servicios mediante análisis estadístico (interés legítimo)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Conservación de datos</h2>
          <p className="text-sm">Conservamos tus datos mientras mantengas una cuenta activa y, una vez cerrada, durante los plazos legalmente exigibles (generalmente 5 años para datos fiscales, 3 años para datos de comunicaciones comerciales tras revocar el consentimiento).</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">5. Tus derechos</h2>
          <p className="text-sm">Tienes derecho a acceder, rectificar, suprimir, oponerte, limitar el tratamiento y portabilidad de tus datos. Puedes ejercerlos escribiendo a privacidad@exploria.es. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">6. Transferencias internacionales</h2>
          <p className="text-sm">Utilizamos Supabase (alojamiento en UE) y Stripe (con garantías adecuadas según Decisión de Adecuación de la Comisión Europea). No realizamos otras transferencias internacionales.</p>
        </section>
      </div>
    </div>
  )
}
