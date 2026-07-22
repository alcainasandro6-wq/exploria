'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CopyableCode({ value, truncate = false }: { value: string; truncate?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button onClick={handleCopy} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-3 w-full transition-colors">
      <code className={cn('flex-1 text-left text-sm font-mono font-bold text-primary', truncate && 'text-xs font-normal text-slate-600 truncate')}>
        {value}
      </code>
      {copied ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 shrink-0" />}
    </button>
  )
}
