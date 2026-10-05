'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/ui/reveal'

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-4 text-left gap-4"
      >
        <span className={cn('text-sm font-semibold transition-colors', open ? 'text-primary' : 'text-slate-900')}>
          {question}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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
  const t = useTranslations('faq_page')

  const faqs = [
    {
      category: t('cat_tourists'),
      questions: [
        { q: t('t_q1'), a: t('t_a1') },
        { q: t('t_q2'), a: t('t_a2') },
        { q: t('t_q3'), a: t('t_a3') },
        { q: t('t_q4'), a: t('t_a4') },
      ],
    },
    {
      category: t('cat_providers'),
      questions: [
        { q: t('p_q1'), a: t('p_a1') },
        { q: t('p_q2'), a: t('p_a2') },
        { q: t('p_q3'), a: t('p_a3') },
        { q: t('p_q4'), a: t('p_a4') },
      ],
    },
    {
      category: t('cat_hotels'),
      questions: [
        { q: t('h_q1'), a: t('h_a1') },
        { q: t('h_q2'), a: t('h_a2') },
        { q: t('h_q3'), a: t('h_a3') },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Reveal className="bg-gradient-to-br from-primary to-primary-dark py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold mb-3">{t('title')}</h1>
          <p className="text-blue-100">{t('subtitle')}</p>
        </div>
      </Reveal>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        {faqs.map((section, i) => (
          <Reveal key={section.category} delay={i * 80}>
            <h2 className="text-xl font-bold text-slate-900 mb-6">{section.category}</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
              {section.questions.map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
