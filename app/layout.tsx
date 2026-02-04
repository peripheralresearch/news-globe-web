import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import GlobeWipeOverlay from './components/GlobeWipeOverlay'

const inter = Inter({ subsets: ['latin'] })
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-source-serif-4',
})

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
      <body className={`${inter.className} ${sourceSerif.variable}`}>
        <GlobeWipeOverlay />
        {children}
      </body>
    </html>
  )
}
