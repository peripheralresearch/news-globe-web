import type { Metadata } from 'next'
import VenezuelaClient from './VenezuelaClient'

// LiveBlogPosting metadata for the Venezuela crisis hub
const COVERAGE_START = '2025-01-15T00:00:00Z'
const LAST_UPDATED = new Date().toISOString()

export const metadata: Metadata = {
  title: 'Venezuela Crisis: Live Updates & Verified Footage | Peripheral',
  description: 'Real-time coverage of the Venezuela crisis with interactive maps, geolocated video evidence, and verified OSINT analysis. Updated continuously.',
  keywords: ['Venezuela', 'Venezuela crisis', 'Maduro', 'Venezuela protests', 'OSINT', 'Venezuela live', 'Venezuela news'],
  authors: [{ name: 'Peripheral Intelligence' }],
  openGraph: {
    title: 'Venezuela Crisis: Live Updates & Verified Footage',
    description: 'Interactive map with geolocated videos and real-time timeline of the Venezuela situation.',
    type: 'article',
    publishedTime: COVERAGE_START,
    modifiedTime: LAST_UPDATED,
    authors: ['Peripheral Intelligence'],
    tags: ['Venezuela', 'Crisis', 'OSINT', 'Live Updates'],
    images: [
      {
        url: '/images/venezuela-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Venezuela Crisis Coverage - Interactive Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Venezuela Crisis: Live Updates',
    description: 'Real-time coverage with interactive maps and verified video evidence.',
    images: ['/images/venezuela-og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peripheral.local'}/venezuela`,
  },
}

export default function VenezuelaPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://peripheral.local'

  // LiveBlogPosting structured data for Google's LIVE badge
  const liveBlogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    '@id': `${baseUrl}/venezuela`,
    headline: 'Venezuela Crisis: Live Updates & Verified Footage',
    description: 'Real-time coverage of the Venezuela crisis with interactive maps, geolocated video evidence, and verified OSINT analysis.',
    datePublished: COVERAGE_START,
    dateModified: LAST_UPDATED,
    coverageStartTime: COVERAGE_START,
    coverageEndTime: LAST_UPDATED, // Updates with each modification
    about: {
      '@type': 'Event',
      name: 'Venezuela Political Crisis 2025',
      startDate: COVERAGE_START,
      location: {
        '@type': 'Country',
        name: 'Venezuela',
      },
    },
    author: {
      '@type': 'Organization',
      name: 'Peripheral Intelligence',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Peripheral',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/connections-grey.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/venezuela`,
    },
    // Live blog updates - most recent first
    liveBlogUpdate: [
      {
        '@type': 'BlogPosting',
        headline: 'Fort Tiuna military base activity captured on video',
        datePublished: '2025-01-25T14:30:00Z',
        articleBody: 'Multiple verified videos show significant activity at Fort Tiuna military installation.',
      },
      {
        '@type': 'BlogPosting',
        headline: 'Naval vessels confirmed in position along northern coast',
        datePublished: '2025-01-23T10:00:00Z',
        articleBody: 'Satellite imagery and maritime tracking data confirm naval positioning.',
      },
      {
        '@type': 'BlogPosting',
        headline: 'Oil tanker movements disrupted in Caribbean shipping lanes',
        datePublished: '2025-01-20T08:00:00Z',
        articleBody: 'AIS data shows significant deviation from normal tanker routes.',
      },
      {
        '@type': 'BlogPosting',
        headline: 'Coverage begins: Monitoring Venezuela situation',
        datePublished: COVERAGE_START,
        articleBody: 'Peripheral begins comprehensive OSINT coverage of developing situation in Venezuela.',
      },
    ],
    // Related coverage links
    isPartOf: {
      '@type': 'CreativeWorkSeries',
      name: 'Venezuela Crisis Coverage',
      url: `${baseUrl}/articles/venezuela`,
    },
  }

  // BreadcrumbList for navigation context
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Venezuela',
        item: `${baseUrl}/venezuela`,
      },
    ],
  }

  return (
    <>
      {/* LiveBlogPosting structured data for LIVE badge eligibility */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(liveBlogJsonLd) }}
      />
      {/* Breadcrumb navigation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Fallback content for crawlers (visible before JS hydration) */}
      <noscript>
        <article>
          <h1>Venezuela Crisis: Live Updates</h1>
          <p>This page contains an interactive map with geolocated video evidence from Venezuela. Enable JavaScript to view the full experience.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <p>For a text-based overview, visit <a href="/articles/venezuela">Venezuela Crisis Article</a>.</p>
        </article>
      </noscript>
      {/* Interactive client component */}
      <VenezuelaClient />
    </>
  )
}
