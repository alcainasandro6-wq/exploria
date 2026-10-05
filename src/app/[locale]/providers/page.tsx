'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, TrendingUp, Users, BarChart3, Clock, Shield, ArrowRight, Loader2, Star, Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Reveal } from '@/components/ui/reveal'
import { toast } from 'sonner'
import { submitProviderApplicationAction } from '@/app/actions/providers'

export default function ProvidersPage() {
  // useSearchParams() (for ?ref=CODE capture below) requires a Suspense
  // boundary around any client component that calls it, or the production
  // build fails — see node_modules/next/dist/docs .../use-search-params.md.
  return (
    <Suspense fallback={<ProvidersPageContent referralCode={null} />}>
      <ProvidersPageInner />
    </Suspense>
  )
}

function ProvidersPageInner() {
  const searchParams = useSearchParams()
  // Referral program: a provider shares {site}/providers?ref=CODE. The code
  // is submitted with the application (provider_applications.referral_code)
  // so admin can see who referred this lead when reviewing it.
  const referralCode = searchParams.get('ref')?.trim().toUpperCase() || null
  return <ProvidersPageContent referralCode={referralCode} />
}

function ProvidersPageContent({ referralCode }: { referralCode: string | null }) {
  const t = useTranslations('providers_page')

  const benefits = [
    { icon: Users, title: t('benefit1_title'), desc: t('benefit1_desc') },
    { icon: TrendingUp, title: t('benefit2_title'), desc: t('benefit2_desc') },
    { icon: BarChart3, title: t('benefit3_title'), desc: t('benefit3_desc') },
    { icon: Shield, title: t('benefit4_title'), desc: t('benefit4_desc') },
    { icon: Clock, title: t('benefit5_title'), desc: t('benefit5_desc') },
    { icon: Star, title: t('benefit6_title'), desc: t('benefit6_desc') },
  ]

  const steps = [
    { num: '01', title: t('step1_title'), desc: t('step1_desc') },
    { num: '02', title: t('step2_title'), desc: t('step2_desc') },
    { num: '03', title: t('step3_title'), desc: t('step3_desc') },
  ]

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
    const res = await submitProviderApplicationAction({
      companyName: formData.company,
      contactName: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      activitiesDescription: formData.activities || undefined,
      website: formData.website || undefined,
      referralCode: referralCode || undefined,
    })
    setLoading(false)
    if (!res.success) {
      toast.error(res.error || t('toast_error'))
      return
    }
    setSubmitted(true)
    toast.success(t('toast_success'))
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-slate-950 pt-24 pb-20">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6 leading-tight">
              {t('hero_title')}
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {t('hero_subtitle')}
            </p>
          </div>
        </Reveal>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">{t('benefits_title')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto">{t('benefits_subtitle')}</p>
          </Reveal>
          <Reveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" delay={100}>
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">{t('how_title')}</h2>
            <p className="text-slate-500">{t('how_subtitle')}</p>
          </Reveal>
          <Reveal className="grid md:grid-cols-3 gap-8" delay={100}>
            {steps.map((step, idx) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-slate-200" />
                )}
                <div className="relative w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-5 text-white font-black text-xl z-10">
                  {step.num}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 bg-slate-50" id="solicitud">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">{t('form_title')}</h2>
            <p className="text-slate-500">{t('form_subtitle')}</p>
          </Reveal>

          <Reveal delay={100}>
            {submitted ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{t('success_title')}</h3>
                <p className="text-slate-500 mb-2">{t('success_desc')}</p>
                {referralCode && (
                  <p className="text-sm text-slate-500 mb-4">
                    {t('success_referral_notice', { code: referralCode })}
                  </p>
                )}
                <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline mt-4">
                  {t('success_back')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
                {referralCode && (
                  <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                    <Gift className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm text-primary font-medium">
                      {t('referral_detected_notice', { code: referralCode })}
                    </p>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="company">{t('form_company')}</Label>
                    <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder={t('form_company_placeholder')} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t('form_name')}</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('form_name_placeholder')} required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t('form_email')}</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="tu@empresa.com" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t('form_phone')}</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="activities">{t('form_activities')}</Label>
                  <textarea
                    id="activities"
                    value={formData.activities}
                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    placeholder={t('form_activities_placeholder')}
                    rows={3}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">{t('form_website')}</Label>
                  <Input id="website" type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://tuempresa.com" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('form_submitting')}</> : <>{t('form_submit')} <ArrowRight className="w-4 h-4" /></>}
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  {t('form_privacy_prefix')}{' '}
                  <Link href="/privacy" className="text-primary hover:underline">{t('form_privacy_link')}</Link>.
                </p>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  )
}
