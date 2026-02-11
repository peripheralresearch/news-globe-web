import type { Metadata } from 'next'
import UkraineClient from './UkraineClient'

// LiveBlogPosting metadata for Ukraine air raid tracker
const COVERAGE_START = '2022-02-24T00:00:00Z' // Start of full-scale invasion
const LAST_UPDATED = new Date().toISOString()

export const metadata: Metadata = {
  title: 'Ukraine-Russia War: Live OSINT Tracker | Peripheral',
  description: 'Real-time intelligence from the Ukraine-Russia war. Track air raids, missile strikes, drone attacks, and regional alerts with interactive map visualization.',
  keywords: ['Ukraine', 'Russia', 'war', 'OSINT', 'air raid', 'missile', 'drone', 'live tracker', 'real-time', 'map', 'intelligence'],
  authors: [{ name: 'Peripheral Intelligence' }],
  openGraph: {
    title: 'Ukraine-Russia War: Live OSINT Tracker',
    description: 'Real-time intelligence from the Ukraine-Russia war with interactive map visualization.',
    type: 'article',
    publishedTime: COVERAGE_START,
    modifiedTime: LAST_UPDATED,
    authors: ['Peripheral Intelligence'],
    tags: ['Ukraine', 'Russia', 'War', 'OSINT', 'Live Updates'],
    images: [
      {
        url: '/images/ukraine-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Ukraine-Russia War - Live OSINT Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ukraine-Russia War: Live OSINT Tracker',
    description: 'Real-time intelligence from the Ukraine-Russia war with interactive map.',
    images: ['/images/ukraine-og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://theperipheral.org'}/stories/ukraine`,
  },
}

export default function UkrainePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theperipheral.org'

  // LiveBlogPosting structured data for Google's LIVE badge
  const liveBlogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    '@id': `${baseUrl}/stories/ukraine`,
    headline: 'Ukraine-Russia War: Live OSINT Tracker',
    description: 'Real-time intelligence from the Ukraine-Russia war. Tracking air raids, missile strikes, drone attacks, and regional alerts across Ukraine.',
    datePublished: COVERAGE_START,
    dateModified: LAST_UPDATED,
    coverageStartTime: COVERAGE_START,
    coverageEndTime: LAST_UPDATED,
    about: {
      '@type': 'Event',
      name: 'Ukraine-Russia War',
      startDate: COVERAGE_START,
      location: {
        '@type': 'Country',
        name: 'Ukraine',
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
      '@id': `${baseUrl}/stories/ukraine`,
    },
    liveBlogUpdate: [
      {
        '@type': 'BlogPosting',
        headline: 'Live air raid alert monitoring active',
        datePublished: LAST_UPDATED,
        articleBody: 'Real-time monitoring of Ukrainian air defense alerts from official sources.',
      },
    ],
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
        name: 'Ukraine',
        item: `${baseUrl}/stories/ukraine`,
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
      {/* Fallback content for crawlers */}
      <noscript>
        <article>
          <h1>Ukraine Air Raid Alerts: Live Tracker</h1>
          <p>This page displays an interactive map with real-time air raid alerts across Ukraine. Enable JavaScript to view the full experience.</p>
        </article>
      </noscript>
      {/* Interactive client component */}
      <UkraineClient />
    </>
  )
}
