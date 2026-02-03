import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Navigation,
  NewsTicker,
  Hero,
  HowItWorks,
  ForProfessionals,
  StatsBanner,
  Footer,
  LatestIntelligence,
} from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'The Peripheral — OSINT Intelligence Platform',
  description: 'Evidence-first intelligence from global conflicts. 30,000+ stories tracked, 1,000+ sources monitored, updated every 15 minutes. Structured, verified, source-linked OSINT.',
  alternates: {
    canonical: 'https://theperipheral.org',
  },
  openGraph: {
    title: 'The Peripheral — OSINT Intelligence Platform',
    description: 'Evidence-first intelligence from global conflicts. Structured, verified, source-linked.',
    url: 'https://theperipheral.org',
    siteName: 'The Peripheral',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: 'https://theperipheral.org/icons/peripheral.png',
      width: 512,
      height: 512,
      alt: 'The Peripheral logo',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Peripheral — OSINT Intelligence Platform',
    description: 'Evidence-first intelligence from global conflicts. Structured, verified, source-linked.',
    images: ['https://theperipheral.org/icons/peripheral.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLdSchemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The Peripheral',
    url: 'https://theperipheral.org',
    description: 'Evidence-first intelligence from global conflicts',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'The Peripheral',
    url: 'https://theperipheral.org',
    logo: {
      '@type': 'ImageObject',
      url: 'https://theperipheral.org/icons/peripheral.png',
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@theperipheral.org',
      contactType: 'editorial',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Peripheral — Latest Intelligence',
    url: 'https://theperipheral.org',
    description: 'Evidence-first intelligence from global conflicts',
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'The Peripheral',
    },
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdSchemas),
        }}
      />
      <Navigation />
      <NewsTicker />
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white text-center py-12 md:py-16 max-w-4xl mx-auto px-4">
        The Peripheral
      </h1>
      <Hero />
      <LatestIntelligence />
      <HowItWorks />
      <ForProfessionals />
      <nav aria-label="Site sections" className="py-12 bg-slate-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Explore
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/stories"
              className="p-4 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="font-semibold text-slate-900 dark:text-white">Latest Intelligence</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Browse stories</div>
            </Link>
            <Link
              href="/map"
              className="p-4 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="font-semibold text-slate-900 dark:text-white">Live Globe</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Interactive map</div>
            </Link>
            <Link
              href="/about"
              className="p-4 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="font-semibold text-slate-900 dark:text-white">About Us</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Our mission</div>
            </Link>
            <Link
              href="/contact"
              className="p-4 rounded-lg bg-white dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="font-semibold text-slate-900 dark:text-white">Contact</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Get in touch</div>
            </Link>
          </div>
        </div>
      </nav>
      <StatsBanner />
      <Footer />
    </main>
  )
}
