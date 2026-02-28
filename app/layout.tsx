import type { Metadata } from 'next'
import './globals.css'
import GlobeWipeOverlay from './components/GlobeWipeOverlay'

export const metadata: Metadata = {
  title: 'The Peripheral',
  description: 'Global message visualization on an interactive 3D globe',
  icons: {
    icon: '/icons/peripheral.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' }}>
        <GlobeWipeOverlay />
        {children}
      </body>
    </html>
  )
}
