import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BookActivities - Actividades turísticas en Torrevieja',
  description: 'Descubre las mejores actividades turísticas en Torrevieja.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
