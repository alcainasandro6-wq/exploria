'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function HotelQrCard({ url, hotelName }: { url: string; hotelName: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: '#0B1F2A', light: '#FFFFFF' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null))
  }, [url])

  const handleDownload = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${hotelName.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <Card className="max-w-md">
      <CardContent className="p-6 space-y-4">
        <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="Código QR" className="w-56 h-56" />
          ) : (
            <div className="w-56 h-56 animate-pulse bg-slate-200 rounded-xl" />
          )}
        </div>
        <Button onClick={handleDownload} disabled={!dataUrl} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Descargar PNG
        </Button>
        <p className="text-xs text-slate-400 text-center break-all">{url}</p>
      </CardContent>
    </Card>
  )
}
