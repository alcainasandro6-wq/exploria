import { Shield, Star, Heart, TrendingUp } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Reveal } from '@/components/ui/reveal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre nosotros | BookActivities',
  description: 'Conoce el equipo detrás de BookActivities, la plataforma líder de actividades turísticas en Torrevieja.',
}

export default async function AboutPage() {
  const t = await getTranslations('about_page')

  const values = [
    { icon: Shield, title: t('value1_title'), desc: t('value1_desc') },
    { icon: Star, title: t('value2_title'), desc: t('value2_desc') },
    { icon: Heart, title: t('value3_title'), desc: t('value3_desc') },
    { icon: TrendingUp, title: t('value4_title'), desc: t('value4_desc') },
  ]

  const stats = [
    { value: '150+', label: t('stat_activities') },
    { value: '45+', label: t('stat_providers') },
    { value: '8.000+', label: t('stat_customers') },
    { value: '4.9★', label: t('stat_rating') },
  ]

  const steps = [
    { step: '01', title: t('step1_title'), desc: t('step1_desc') },
    { step: '02', title: t('step2_title'), desc: t('step2_desc') },
    { step: '03', title: t('step3_title'), desc: t('step3_desc') },
  ]

  const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-20">
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5">{t('hero_title')}</h1>
          <p className="text-xl text-blue-100 leading-relaxed">{t('hero_subtitle')}</p>
        </Reveal>
      </section>

      {/* Mission */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5">{t('mission_title')}</h2>
            <p className="text-slate-600 leading-relaxed mb-4">{t('mission_p1')}</p>
            <p className="text-slate-600 leading-relaxed mb-4">{t.rich('mission_p2', { bold })}</p>
            <p className="text-slate-600 leading-relaxed">{t.rich('mission_p3', { bold })}</p>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center bg-white rounded-2xl p-4 shadow-sm">
                  <div className="text-2xl font-extrabold text-primary">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal>
            <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">{t('how_title')}</h2>
          </Reveal>
          <Reveal className="grid md:grid-cols-3 gap-8" delay={100}>
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">{t('values_title')}</h2>
        </Reveal>
        <Reveal className="grid md:grid-cols-2 gap-6" delay={100}>
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Legal Notice */}
      <section className="py-12 bg-slate-900">
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Shield className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto">
            {t.rich('legal_text', { bold: (chunks) => <strong className="text-slate-300">{chunks}</strong> })}
          </p>
        </Reveal>
      </section>
    </div>
  )
}
