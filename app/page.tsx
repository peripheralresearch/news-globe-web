import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
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
    <main className="min-h-screen bg-white dark:bg-brand-abyss">
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
              <div className="bg-brand-neutral-100 aspect-[4/3] rounded-lg mb-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-brand-warm-400">Featured</span>
              <h3 className="text-2xl font-bold text-brand-navy mt-1 mb-2 group-hover:underline">
                Headline for the main feature article goes here
              </h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                A brief summary of the lead story. This placeholder represents the primary editorial
                piece that anchors the front page layout.
              </p>
              <span className="text-xs text-brand-warm-400 mt-3 block">12 sources &bull; 2h ago</span>
            </div>

            {/* Secondary Article */}
            <div className="group">
              <div className="bg-brand-neutral-100 aspect-[16/9] rounded-lg mb-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-brand-warm-400">Analysis</span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2 group-hover:underline">
                Secondary story headline sits here
              </h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Supporting context for the second story with a concise summary of verified developments.
              </p>
              <span className="text-xs text-brand-warm-400 mt-3 block">8 sources &bull; 4h ago</span>
            </div>

            {/* Tertiary Article */}
            <div className="group">
              <div className="bg-brand-neutral-100 aspect-[16/9] rounded-lg mb-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-brand-warm-400">Briefing</span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2 group-hover:underline">
                Third story headline placed here
              </h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                A short intelligence briefing summarising key signals from multiple open sources.
              </p>
              <span className="text-xs text-brand-warm-400 mt-3 block">5 sources &bull; 6h ago</span>
            </div>
          </div>
        </div>
      </section>

      <StatsBanner />

      {/* How Sentinel Works Section */}
      <section className="py-24 bg-brand-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-navy mb-4">
              How Sentinel Works
            </h2>
            <p className="text-xl text-brand-warm-600 max-w-3xl mx-auto">
              Our intelligence pipeline transforms raw OSINT data into structured, verified intelligence
            </p>
          </div>

          <div className="mb-12">
            <Image
              src="/images/sentinel-pipeline.png"
              alt="Sentinel OSINT Intelligence Pipeline"
              width={2736}
              height={1154}
              className="w-full h-auto rounded-lg shadow-2xl"
              priority={false}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-brand-navy mb-3">Data Collection</h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Sentinel monitors 100+ OSINT sources including Telegram channels, RSS feeds, and social media.
                Every post is captured, timestamped, and stored with full source attribution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-brand-navy mb-3">NLP Enrichment</h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Our pipeline extracts entities, analyzes sentiment, generates summaries, and identifies military signals
                using state-of-the-art NLP models. Each article is enriched with structured metadata.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-brand-navy mb-3">Story Generation</h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Related articles are automatically clustered into stories with geolocation, entity tags, and confidence scores.
                Everything is source-linked and verifiable.
              </p>
            </div>
          </div>

          <div className="text-center space-x-4">
            <Link
              href="/about"
              className="inline-block px-6 py-3 bg-brand-navy text-white rounded-lg hover:bg-brand-abyss transition-colors"
            >
              Learn More About Us
            </Link>
            <Link
              href="/sentinel-system"
              className="inline-block px-6 py-3 bg-white text-brand-navy border border-brand-neutral-300 rounded-lg hover:bg-brand-neutral-50 transition-colors"
            >
              Deep Dive: Inside Sentinel
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
