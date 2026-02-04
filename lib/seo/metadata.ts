import type { Metadata } from 'next'
import { getSiteUrl } from './baseUrl'

interface PageMetadataOptions {
  title: string
  description: string
  path: string
  images?: { url: string; width?: number; height?: number; alt?: string }[]
  robots?: { index: boolean; follow: boolean }
  type?: 'website' | 'article'
}

/**
 * Build a complete Metadata object for any page.
 * Derives canonical, OG, and Twitter tags from a single set of inputs.
 */
export function buildPageMetadata(opts: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl()
  const fullUrl = `${siteUrl}${opts.path}`
  const defaultImage = {
    url: `${siteUrl}/icons/peripheral.png`,
    width: 512,
    height: 512,
    alt: 'The Peripheral logo',
  }
  const images = opts.images ?? [defaultImage]

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: fullUrl,
      siteName: 'The Peripheral',
      type: opts.type ?? 'website',
      locale: 'en_US',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: images.map((img) => (typeof img === 'string' ? img : img.url)),
    },
    ...(opts.robots && { robots: opts.robots }),
  }
}
