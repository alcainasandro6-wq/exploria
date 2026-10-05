'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '34658062392'

export function WhatsAppButton() {
  const pathname = usePathname()
  const t = useTranslations('a11y')
  // Auth forms are short enough on mobile that this fixed button can sit
  // right on top of the submit button — and a chat bubble isn't useful
  // mid-login/signup anyway, so just skip it there.
  if (pathname.startsWith('/auth') || pathname.startsWith('/dashboard')) return null

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsapp_message'))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp_contact')}
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] shadow-lg shadow-black/20 flex items-center justify-center transition-transform hover:scale-105"
    >
      <MessageCircle className="w-7 h-7 text-white" strokeWidth={2} />
    </a>
  )
}
