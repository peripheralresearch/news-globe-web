import type { Metadata } from 'next'
import {
  Navigation,
  Hero,
  StatsBanner,
  Footer,
  DecorativeGlobe,
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
      <DecorativeGlobe />
      <Hero />

      {/* Featured Articles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Main Feature Article */}
            <div className="md:row-span-2 group">
              <div className="bg-slate-100 aspect-[4/3] rounded-lg mb-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Featured</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-2 group-hover:underline">
                Headline for the main feature article goes here
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A brief summary of the lead story. This placeholder represents the primary editorial
                piece that anchors the front page layout.
              </p>
              <span className="text-xs text-slate-400 mt-3 block">12 sources &bull; 2h ago</span>
            </div>

            {/* Secondary Article */}
            <div className="group">
              <div className="bg-slate-100 aspect-[16/9] rounded-lg mb-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Analysis</span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:underline">
                Secondary story headline sits here
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Supporting context for the second story with a concise summary of verified developments.
              </p>
              <span className="text-xs text-slate-400 mt-3 block">8 sources &bull; 4h ago</span>
            </div>

            {/* Tertiary Article */}
            <div className="group">
              <div className="bg-slate-100 aspect-[16/9] rounded-lg mb-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Briefing</span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:underline">
                Third story headline placed here
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A short intelligence briefing summarising key signals from multiple open sources.
              </p>
              <span className="text-xs text-slate-400 mt-3 block">5 sources &bull; 6h ago</span>
            </div>
          </div>
        </div>
      </section>

      <StatsBanner />
      <Footer />
    </main>
  )
}
