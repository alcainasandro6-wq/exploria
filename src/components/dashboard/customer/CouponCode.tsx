'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CouponCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button onClick={handleCopy} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2.5 w-full transition-colors">
      <code className="flex-1 text-left text-sm font-mono font-bold text-slate-800">{code}</code>
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  )
}
