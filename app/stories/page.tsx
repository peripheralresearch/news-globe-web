import type { Metadata } from 'next'
import { Navigation, Footer } from '@/app/components/landing'
import SourceDirectory from './SourceDirectory'

export const metadata: Metadata = {
  title: 'Intelligence Sources — The Peripheral',
  description:
    'Open-source intelligence directory. Browse the OSINT channels and sources monitored by The Peripheral — RSS feeds, Telegram channels, and web scrapers covering global conflicts.',
  alternates: {
    canonical: 'https://theperipheral.org/stories',
  },
  openGraph: {
    title: 'Intelligence Sources — The Peripheral',
    description:
      'Browse the OSINT channels and sources monitored by The Peripheral.',
    url: 'https://theperipheral.org/stories',
    siteName: 'The Peripheral',
    type: 'website',
  },
}

export default function IntelligencePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <SourceDirectory />
      <Footer />
    </main>
  )
}
