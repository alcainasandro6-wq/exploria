import { MapPin, Mail, Phone, MessageCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Reveal } from '@/components/ui/reveal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto | BookActivities',
  description: 'Ponte en contacto con el equipo de BookActivities.',
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

export default async function ContactPage() {
  const t = await getTranslations('contact_page')

  return (
    <div className="min-h-screen bg-white">
      <Reveal className="bg-gradient-to-br from-[#0A0F1E] via-primary-dark to-primary py-16 px-4 text-center" delay={0}>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{t('title')}</h1>
        <p className="text-blue-100/80 max-w-xl mx-auto">{t('subtitle')}</p>
      </Reveal>

      <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12" delay={100}>
        <div className="grid sm:grid-cols-2 gap-5">
          <a href="mailto:hola@bookactivities.com" className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{t('email_label')}</p>
              <p className="text-sm text-slate-500">hola@bookactivities.com</p>
            </div>
          </a>

          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsapp_message'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{t('whatsapp_label')}</p>
                <p className="text-sm text-slate-500">{t('whatsapp_desc')}</p>
              </div>
            </a>
          )}

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{t('location_label')}</p>
              <p className="text-sm text-slate-500">{t('location_value')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{t('provider_support_label')}</p>
              <p className="text-sm text-slate-500">{t('provider_support_desc')}</p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
