'use client'

// Shared export helpers used by every "Exportar" button across admin/provider/hotel
// tables. Rows are plain objects — keys become column headers.

function toRows(data: Record<string, unknown>[]): { headers: string[]; rows: unknown[][] } {
  const headers = data.length > 0 ? Object.keys(data[0]) : []
  const rows = data.map((row) => headers.map((h) => row[h] ?? ''))
  return { headers, rows }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const { headers, rows } = toRows(data)
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
  downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`)
}

export async function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = 'Datos') {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export async function exportToPDF(data: Record<string, unknown>[], filename: string, title: string) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const { headers, rows } = toRows(data)

  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`BookActivities · ${new Date().toLocaleDateString('es-ES')}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows.map((r) => r.map(String)),
    headStyles: { fillColor: [0, 91, 141] }, // primary #005B8D
    styles: { fontSize: 8 },
  })

  doc.save(`${filename}.pdf`)
}
