import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Navigation,
  Hero,
  StatsBanner,
  Footer,
  DecorativeGlobe,
  TrendingLeaderboard,
  SentimentTracker,
  SentinelPipeline,
} from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Home — The Peripheral',
  description: 'Evidence-first intelligence from global conflicts. 30,000+ stories tracked, 1,000+ sources monitored, updated every 15 minutes. Structured, verified, source-linked OSINT.',
  alternates: {
    canonical: 'https://theperipheral.org/home',
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

      <SentimentTracker />
      <TrendingLeaderboard />

      <StatsBanner />

      {/* How Sentinel Works Section */}
      <section className="py-24 bg-brand-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-ink mb-4">
              How Sentinel Works
            </h2>
            <p className="text-xl text-brand-warm-600 max-w-3xl mx-auto">
              Our intelligence pipeline transforms raw OSINT data into structured, verified intelligence
            </p>
          </div>

          <div className="mb-12">
            <SentinelPipeline />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-brand-ink mb-3">Data Collection</h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Sentinel monitors 100+ OSINT sources including Telegram channels, RSS feeds, and social media.
                Every post is captured, timestamped, and stored with full source attribution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-brand-ink mb-3">NLP Enrichment</h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Our pipeline extracts entities, analyzes sentiment, generates summaries, and identifies military signals
                using state-of-the-art NLP models. Each article is enriched with structured metadata.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-brand-ink mb-3">Story Generation</h3>
              <p className="text-brand-warm-600 text-sm leading-relaxed">
                Related articles are automatically clustered into stories with geolocation, entity tags, and confidence scores.
                Everything is source-linked and verifiable.
              </p>
            </div>
          </div>

          <div className="text-center space-x-4">
            <Link
              href="/about"
              className="inline-block px-6 py-3 bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90 transition-colors"
            >
              Learn More About Us
            </Link>
            <Link
              href="/sentinel-system"
              className="inline-block px-6 py-3 bg-white text-brand-ink border border-brand-neutral-300 rounded-lg hover:bg-brand-neutral-50 transition-colors"
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
