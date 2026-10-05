import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal_privacy')
  return { title: `${t('meta_title')} | BookActivities` }
}

export default async function PrivacyPage() {
  const t = await getTranslations('legal_privacy')
  const list = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => t(`${prefix}${i + 1}`))

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h1 className="text-3xl font-extrabold mb-2">{t('title')}</h1>
          <p className="text-slate-300 text-sm">{t('updated')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s1_title')}</h2>
          <p>{t('s1_body')}</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s2_title')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {list('s2_i', 5).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s3_title')}</h2>
          <p className="text-sm mb-2">{t('s3_intro')}</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {list('s3_i', 5).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s4_title')}</h2>
          <p className="text-sm">{t('s4_body')}</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s5_title')}</h2>
          <p className="text-sm">{t('s5_body')}</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">{t('s6_title')}</h2>
          <p className="text-sm">{t('s6_body')}</p>
        </section>
      </div>
    </div>
  )
}
