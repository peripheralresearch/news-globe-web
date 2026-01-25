import type { Metadata } from 'next'
import { ThemeProvider } from '@/app/contexts/ThemeContext'
import ArticleClient from '../[slug]/ArticleClient'

const article = {
  slug: 'venezuela',
  headline: 'Venezuela Crisis: Naval Blockade and the Fall of the Maduro Regime',
  subheadline: 'A comprehensive timeline of events leading to the dramatic conclusion of the Venezuelan political crisis, documented through verified video evidence and open-source intelligence.',
  author: {
    name: 'Peripheral Intelligence',
    url: '/about'
  },
  publishedDate: '2025-01-20T08:00:00Z',
  modifiedDate: '2025-01-26T00:00:00Z',
  category: 'Breaking News',
  tags: ['Venezuela', 'Maduro', 'Naval Blockade', 'OSINT', 'Latin America'],
  heroImage: {
    url: '/images/venezuela-hero.jpg',
    alt: 'Satellite view of Venezuelan coastline showing naval positioning',
    width: 1200,
    height: 630
  },
  sections: [
    {
      id: 'intro',
      content: 'In the early hours of January 2025, a coordinated naval operation encircled the Venezuelan coastline, marking the beginning of what analysts are calling the most significant geopolitical event in Latin America since the Cuban Missile Crisis. This article presents a comprehensive timeline of verified events, compiled through open-source intelligence gathering and geolocated video evidence.'
    },
    {
      id: 'background',
      heading: 'Background: Years of Political Tension',
      content: 'The crisis did not emerge in a vacuum. Venezuela has faced decades of political instability, economic collapse, and humanitarian concerns under the Maduro government. International sanctions, hyperinflation, and mass emigration created conditions that many observers believed would eventually reach a breaking point. The seizure of oil tankers in late 2024 proved to be the catalyst for escalation.'
    },
    {
      id: 'timeline',
      heading: 'Timeline of Events',
      content: 'January 15: First reports of unusual naval activity detected via satellite imagery near Curaçao. January 17: Multiple tanker vessels reported changing course away from Venezuelan ports. January 19: Confirmed visual evidence of naval vessels establishing positions along the northern coastline. January 21: Communications blackout reported in Caracas. January 23: Video evidence emerges from Fort Tiuna military base showing significant activity. January 25: International media confirms regime change.'
    },
    {
      id: 'evidence',
      heading: 'Verified Video Evidence',
      content: 'Our team has geolocated and verified multiple video sources from the ground. Each piece of evidence has been cross-referenced with satellite imagery, metadata analysis, and corroborating witness accounts. The interactive map above displays the precise locations where footage was captured, allowing viewers to understand the geographic scope of events.'
    },
    {
      id: 'analysis',
      heading: 'Strategic Analysis',
      content: 'The operation demonstrated sophisticated coordination between multiple actors. Naval positioning effectively cut off maritime escape routes while maintaining plausible positioning for stated purposes of counter-narcotics operations. The speed of the ground operation once initiated suggests extensive prior intelligence gathering and coordination with elements within the Venezuelan military structure.'
    },
    {
      id: 'implications',
      heading: 'Regional Implications',
      content: 'The resolution of the Venezuelan crisis will have lasting implications for Latin American geopolitics, global oil markets, and the precedent for international intervention. Neighboring Colombia, Brazil, and Caribbean nations have already begun adjusting their diplomatic positions. The return of Venezuelan refugees and the reconstruction of the economy present challenges that will take years to address.'
    },
    {
      id: 'methodology',
      heading: 'Our Methodology',
      content: 'Peripheral employs rigorous OSINT methodologies to verify all reported information. Video evidence is geolocated using landmark identification, shadow analysis, and metadata extraction. Claims are corroborated through multiple independent sources before publication. We maintain transparency about confidence levels and acknowledge when information remains unverified.'
    }
  ],
  pullQuote: {
    text: 'The events of January 2025 will be studied by military strategists and political scientists for decades to come.',
    attribution: 'Regional Security Analyst'
  },
  relatedArticles: [
    {
      slug: 'tanker-seizures-timeline',
      title: 'Oil Tanker Seizures: The Events That Triggered Escalation',
      image: '/images/tanker-thumb.jpg',
      date: '2025-01-10'
    },
    {
      slug: 'venezuela-naval-analysis',
      title: 'Naval Positioning Analysis: What Satellite Data Reveals',
      image: '/images/naval-thumb.jpg',
      date: '2025-01-18'
    },
    {
      slug: 'fort-tiuna-verification',
      title: 'Fort Tiuna Videos: Geolocation and Verification',
      image: '/images/fort-tiuna-thumb.jpg',
      date: '2025-01-24'
    }
  ]
}

export const metadata: Metadata = {
  title: `${article.headline} | Peripheral`,
  description: article.subheadline,
  keywords: article.tags,
  authors: [{ name: article.author.name, url: article.author.url }],
  openGraph: {
    title: article.headline,
    description: article.subheadline,
    type: 'article',
    publishedTime: article.publishedDate,
    modifiedTime: article.modifiedDate,
    authors: [article.author.name],
    tags: article.tags,
    images: [
      {
        url: article.heroImage.url,
        width: article.heroImage.width,
        height: article.heroImage.height,
        alt: article.heroImage.alt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: article.headline,
    description: article.subheadline,
    images: [article.heroImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peripheral.local'}/articles/venezuela`,
  },
}

export default function VenezuelaArticlePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.subheadline,
    image: article.heroImage.url,
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate,
    author: {
      '@type': 'Organization',
      name: article.author.name,
      url: article.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Peripheral',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peripheral.local'}/icons/connections-grey.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peripheral.local'}/articles/venezuela`,
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
  }

  return (
    <ThemeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleClient article={article} />
    </ThemeProvider>
  )
}
