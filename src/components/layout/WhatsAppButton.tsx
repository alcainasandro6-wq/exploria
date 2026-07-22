import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

export function WhatsAppButton() {
  if (!WHATSAPP_NUMBER) return null

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Me gustaría obtener más información.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] shadow-lg shadow-black/20 flex items-center justify-center transition-transform hover:scale-105"
    >
      <MessageCircle className="w-7 h-7 text-white" strokeWidth={2} />
    </a>
  )
}
