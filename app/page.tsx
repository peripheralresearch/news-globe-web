import type { Metadata } from 'next'
import GlobeView from '@/app/components/GlobeView'

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

export default function RootPage() {
  return (
    <>
      {/* Prefetch globe API data so it's already in-flight before JS hydrates */}
      <link rel="preload" href="/api/sentinel/globe?limit=35&hours=168" as="fetch" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdSchemas),
        }}
      />
      <GlobeView />
    </>
  )
}
