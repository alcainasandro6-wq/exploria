'use client'

import { useState } from 'react'
import { Download, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export'

interface ExportButtonsProps {
  data: Record<string, unknown>[]
  filename: string
  title?: string
}

export function ExportButtons({ data, filename, title = filename }: ExportButtonsProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (format: 'csv' | 'excel' | 'pdf') => {
    setBusy(format)
    setOpen(false)
    try {
      if (format === 'csv') exportToCSV(data, filename)
      if (format === 'excel') await exportToExcel(data, filename)
      if (format === 'pdf') await exportToPDF(data, filename, title)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="relative">
      <Button variant="white" size="sm" onClick={() => setOpen((o) => !o)} disabled={data.length === 0} className="gap-1.5">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Exportar
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20">
            <button onClick={() => run('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">CSV</button>
            <button onClick={() => run('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Excel</button>
            <button onClick={() => run('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">PDF</button>
          </div>
        </>
      )}
    </div>
  )
}
