import { getSiteUrl } from './baseUrl'

// ── Schema builder types ──────────────────────────────────────

interface WebSiteOptions {
  siteUrl?: string
  name?: string
}

interface OrganizationOptions {
  siteUrl?: string
  name?: string
  logoUrl?: string
  sameAs?: string[]
  contactEmail?: string
}

interface WebPageOptions {
  url: string
  name: string
  description: string
  publisherName?: string
  publisherUrl?: string
  publisherLogoUrl?: string
}

interface BreadcrumbItem {
  name: string
  itemUrl: string
}

interface NewsArticleOptions {
  url: string
  headline: string
  description: string
  datePublished: string
  dateModified?: string
  image?: string | string[]
  authorName?: string
  publisherName?: string
  publisherLogoUrl?: string
}

// ── Schema builders ───────────────────────────────────────────

export function webSiteJsonLd(opts: WebSiteOptions = {}) {
  const siteUrl = opts.siteUrl ?? getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: opts.name ?? 'The Peripheral',
    url: siteUrl,
  }
}

export function organizationJsonLd(opts: OrganizationOptions = {}) {
  const siteUrl = opts.siteUrl ?? getSiteUrl()
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: opts.name ?? 'The Peripheral',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: opts.logoUrl ?? `${siteUrl}/icons/peripheral.png`,
    },
  }
  if (opts.sameAs && opts.sameAs.length > 0) {
    schema.sameAs = opts.sameAs
  }
  if (opts.contactEmail) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      email: opts.contactEmail,
      contactType: 'editorial',
    }
  }
  return schema
}

export function webPageJsonLd(opts: WebPageOptions) {
  const siteUrl = opts.publisherUrl ?? getSiteUrl()
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.name,
    url: opts.url,
    description: opts.description,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: opts.publisherName ?? 'The Peripheral',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: opts.publisherLogoUrl ?? `${siteUrl}/icons/peripheral.png`,
      },
    },
  }
  return schema
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.itemUrl,
    })),
  }
}

export function newsArticleJsonLd(opts: NewsArticleOptions) {
  const siteUrl = getSiteUrl()
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: opts.publisherName ?? 'The Peripheral',
      logo: {
        '@type': 'ImageObject',
        url: opts.publisherLogoUrl ?? `${siteUrl}/icons/peripheral.png`,
      },
    },
  }
  if (opts.dateModified) schema.dateModified = opts.dateModified
  if (opts.image) schema.image = opts.image
  if (opts.authorName) {
    schema.author = { '@type': 'Person', name: opts.authorName }
  }
  return schema
}
