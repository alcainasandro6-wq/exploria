'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  const t = useTranslations('admin_search_box')
  const resolvedPlaceholder = placeholder ?? t('default_placeholder')
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="w-full sm:max-w-xs pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}
