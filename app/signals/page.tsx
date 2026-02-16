import type { Metadata } from 'next'
import { Navigation, Footer } from '@/app/components/landing'
import SignalsDashboard from './SignalsDashboard'

export const metadata: Metadata = {
  title: 'Signals — The Peripheral',
  description:
    'Real-time military signal intelligence. Track weapon detections, air raid alerts, and threat advisories from Ukraine and Israel.',
  alternates: {
    canonical: 'https://theperipheral.org/signals',
  },
  openGraph: {
    title: 'Signals — The Peripheral',
    description:
      'Real-time military signal intelligence from Ukraine and Israel.',
    url: 'https://theperipheral.org/signals',
    siteName: 'The Peripheral',
    type: 'website',
  },
}

export default function SignalsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <SignalsDashboard />
      <Footer />
    </main>
  )
}
