import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal_terms')
  return { title: `${t('meta_title')} | BookActivities` }
}

export default async function TermsPage() {
  const t = await getTranslations('legal_terms')

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h1 className="text-3xl font-extrabold mb-2">{t('title')}</h1>
          <p className="text-slate-300 text-sm">{t('updated')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="prose prose-slate max-w-none">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
            <p className="text-sm font-semibold text-amber-800">{t('notice')}</p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s1_title')}</h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s1_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('s1_p2')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s2_title')}</h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s2_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('s2_p2')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s3_title')}</h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t('s3_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('s3_p2')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s4_title')}</h2>
            <p className="text-slate-600 leading-relaxed mb-3">{t.rich('s4_p1', { bold: (chunks) => <strong>{chunks}</strong> })}</p>
            <p className="text-slate-600 leading-relaxed">{t('s4_p2')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s5_title')}</h2>
            <p className="text-slate-600 leading-relaxed">{t('s5_p1')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s6_title')}</h2>
            <p className="text-slate-600 leading-relaxed">{t('s6_p1')}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
