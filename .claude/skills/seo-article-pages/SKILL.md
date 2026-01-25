# SEO Article Pages Skill

## Purpose

Implement white-hat SEO structure for article pages in this Next.js app. Handle semantic HTML, metadata, structured data, and SSR considerations for Mapbox client components.

## When to Use / Triggers

- Creating new article/country pages
- Adding metadata to existing pages
- Implementing JSON-LD structured data
- Optimizing for search indexing
- Addressing SSR/client component tradeoffs

## Inputs Required

1. Page content (title, description, dates)
2. Author/publisher info
3. Image URLs (if any)
4. Whether page has client components (Mapbox, etc.)

## Step-by-Step Workflow

### 1. Page Metadata Export

For App Router pages, export metadata:

```typescript
// app/venezuela/page.tsx (if converted to have metadata)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Venezuela Crisis - Live Updates | Site Name',
  description: 'Real-time coverage of the Venezuela situation with interactive maps and verified video evidence.',
  openGraph: {
    title: 'Venezuela Crisis - Live Updates',
    description: 'Real-time coverage with interactive maps',
    type: 'article',
    publishedTime: '2025-01-20T00:00:00Z',
    modifiedTime: '2025-01-25T00:00:00Z',
    authors: ['Site Name'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Venezuela Crisis - Live Updates',
    description: 'Real-time coverage with interactive maps',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://example.com/venezuela',
  },
}
```

### 2. Semantic HTML Structure

```tsx
<article>
  <header>
    <h1>Venezuela</h1>
    <time dateTime="2025-01-25T00:00:00Z">January 25, 2025</time>
  </header>

  <section aria-label="Interactive map">
    {/* Mapbox component */}
  </section>

  <section aria-label="Timeline">
    {/* Timeline component */}
  </section>

  <footer>
    <p>Sources: ...</p>
  </footer>
</article>
```

### 3. JSON-LD Structured Data

Add to page head:

```tsx
export default function VenezuelaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: 'Venezuela Crisis - Live Updates',
    description: 'Real-time coverage of the Venezuela situation',
    datePublished: '2025-01-20T00:00:00Z',
    dateModified: '2025-01-25T00:00:00Z',
    author: {
      '@type': 'Organization',
      name: 'Site Name',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Site Name',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://example.com/venezuela',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page content */}
    </>
  )
}
```

### 4. Handle Client Components for SEO

The Venezuela page uses `'use client'` for Mapbox. This affects SEO:

**Problem**: Client components don't render on server -> search bots see empty content.

**Solutions**:

**A. Critical content as server component**:
```tsx
// app/venezuela/page.tsx (server component)
export const metadata = { ... }

export default function VenezuelaPage() {
  return (
    <article>
      {/* Static content rendered on server */}
      <h1>Venezuela Crisis</h1>
      <p>Overview content that bots can read...</p>

      {/* Client component for interactivity */}
      <VenezuelaMap />
    </article>
  )
}
```

**B. SSR-safe client component**:
```tsx
'use client'

import dynamic from 'next/dynamic'

const MapboxMap = dynamic(() => import('./MapboxMap'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
})
```

### 5. Sitemap Configuration

Create `app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://example.com/venezuela',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ]
}
```

### 6. Robots Configuration

Create `app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

## Output / Done Criteria

- Page has proper `<title>` and `<meta description>`
- Structured data validates at https://validator.schema.org/
- Critical content visible without JavaScript (for bots)
- Canonical URL set
- Open Graph tags present
- Page appears in sitemap

## Pitfalls / Gotchas

### 1. Client Components Don't SSR

`'use client'` at top of file means no server rendering. Bots may see empty content. Split into server wrapper + client child.

### 2. Mapbox Token Exposure

`NEXT_PUBLIC_MAPBOX_TOKEN` is visible in client JS. This is expected - restrict token by domain in Mapbox dashboard.

### 3. Dynamic Metadata from Client State

You cannot use client state in metadata export. For dynamic titles, use generateMetadata:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch data server-side
  const data = await fetchData(params.id)
  return {
    title: data.title,
  }
}
```

### 4. JSON-LD Date Formats

Use ISO 8601: `2025-01-25T00:00:00Z`

### 5. Don't Over-Optimize

- No keyword stuffing
- Natural language in descriptions
- Accurate, helpful content
- Follow Google Search Central guidelines

### 6. Current Page is 'use client'

The Venezuela page (`app/venezuela/page.tsx`) is entirely client-rendered. To add SEO:
1. Create server component wrapper
2. Export metadata from wrapper
3. Import existing client component

## Example Tasks

### Add metadata to Venezuela page

1. Create server component wrapper:
```typescript
// app/venezuela/page.tsx
import type { Metadata } from 'next'
import VenezuelaArticle from './VenezuelaArticle'

export const metadata: Metadata = { ... }

export default function VenezuelaPage() {
  return <VenezuelaArticle />
}
```

2. Move client code to `VenezuelaArticle.tsx`

### Add JSON-LD NewsArticle

1. Define structured data object
2. Add script tag with `type="application/ld+json"`
3. Validate at schema.org validator

### Create sitemap for all article pages

1. Create `app/sitemap.ts`
2. List all static routes
3. Optionally fetch dynamic routes from database
4. Set appropriate changeFrequency and priority

## Reference: Google Search Central

- Titles: https://developers.google.com/search/docs/appearance/title-link
- Structured data: https://developers.google.com/search/docs/appearance/structured-data
- JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps
- Robots: https://developers.google.com/search/docs/crawling-indexing/robots

## Related Files

- `app/layout.tsx` - Root metadata, fonts
- `app/venezuela/page.tsx` - Current article page
- `app/sitemap.ts` - (to create)
- `app/robots.ts` - (to create)
