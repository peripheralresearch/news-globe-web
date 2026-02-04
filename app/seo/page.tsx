import Link from 'next/link'
import Image from 'next/image'
import { buildPageMetadata } from '@/lib/seo/metadata'
import JsonLd from '@/app/components/JsonLd'
import { getSiteUrl } from '@/lib/seo/baseUrl'
import { webSiteJsonLd, webPageJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld'

const pageDescription = 'A visual reference guide to SEO best practices. See the anatomy of a well-optimized page with annotated semantic HTML, structured data, and content hierarchy.'

export function generateMetadata() {
  return buildPageMetadata({
    title: 'SEO Blueprint — The Peripheral',
    description: pageDescription,
    path: '/seo',
    images: [
      {
        url: '/icons/peripheral.png',
        width: 512,
        height: 512,
        alt: 'The Peripheral logo',
      },
    ],
    robots: { index: false, follow: true },
  })
}

export default function SEOBlueprintPage() {
  const siteUrl = getSiteUrl()
  const schemas = [
    webPageJsonLd({
      url: `${siteUrl}/seo`,
      name: 'SEO Blueprint — The Peripheral',
      description: pageDescription,
      publisherName: 'The Peripheral',
      publisherUrl: siteUrl,
      publisherLogoUrl: `${siteUrl}/icons/peripheral.png`,
    }),
    webSiteJsonLd(),
    breadcrumbJsonLd([
      { name: 'Home', itemUrl: siteUrl },
      { name: 'SEO Blueprint', itemUrl: `${siteUrl}/seo` },
    ]),
  ]

  return (
    <main className="w-full bg-slate-50 text-slate-900">
      <JsonLd data={schemas} />
      {/* Header Section */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="text-4xl font-bold tracking-tight">SEO Blueprint</h1>
          <p className="mt-4 text-lg text-slate-600">
            A visual reference guide to SEO best practices. This page itself is a fully optimized example
            — every element is annotated to show you the anatomy of a well-structured page.
          </p>
        </div>
      </header>

      {/* Color Legend */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-lg bg-white p-6 border border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
            Visual Key
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded border-2 border-rose-300 bg-rose-50"></div>
              <div>
                <p className="font-mono text-sm font-bold text-rose-600">Critical SEO</p>
                <p className="text-xs text-slate-600">Title, meta description, canonical</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded border-2 border-amber-300 bg-amber-50"></div>
              <div>
                <p className="font-mono text-sm font-bold text-amber-600">Structured Data</p>
                <p className="text-xs text-slate-600">JSON-LD schemas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded border-2 border-emerald-300 bg-emerald-50"></div>
              <div>
                <p className="font-mono text-sm font-bold text-emerald-600">Content Structure</p>
                <p className="text-xs text-slate-600">Headings, semantic HTML</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded border-2 border-sky-300 bg-sky-50"></div>
              <div>
                <p className="font-mono text-sm font-bold text-sky-600">Internal Linking</p>
                <p className="text-xs text-slate-600">Navigation, breadcrumbs, links</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded border-2 border-violet-300 bg-violet-50"></div>
              <div>
                <p className="font-mono text-sm font-bold text-violet-600">Media & Performance</p>
                <p className="text-xs text-slate-600">Images, Core Web Vitals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded border-2 border-slate-300 bg-slate-50"></div>
              <div>
                <p className="font-mono text-sm font-bold text-slate-600">Secondary</p>
                <p className="text-xs text-slate-600">Robots, sitemap</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article className="mx-auto max-w-4xl px-6 py-8">
        {/* Section A: HEAD Meta Tags */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-rose-300 bg-rose-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
              Critical SEO
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Page Title & Meta Description</h2>
            <p className="mt-3 text-slate-600">
              These are the first signals search engines and users see. Every page needs unique, compelling
              versions of both.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded bg-slate-900 p-4 font-mono text-sm text-slate-100">
                <div className="text-rose-300">
                  <span>&lt;title&gt;</span>
                  <span className="ml-2 text-slate-400">
                    {/* 56 chars */}
                  </span>
                </div>
                <div className="ml-4 mt-1 text-slate-300">
                  SEO Blueprint — The Peripheral
                  <span className="ml-2 text-slate-500">(56 chars)</span>
                </div>
                <div className="mt-1 text-rose-300">
                  &lt;/title&gt;
                </div>

                <div className="mt-4 text-rose-300">
                  <span>&lt;meta name=&quot;description&quot; content=&quot;</span>
                </div>
                <div className="ml-4 mt-1 text-slate-300">
                  A visual reference guide to SEO best practices. See the anatomy of a
                  well-optimized page with annotated semantic HTML, structured data, and content hierarchy.
                  <span className="ml-2 text-slate-500">(158 chars)</span>
                </div>
                <div className="text-rose-300">
                  &quot; /&gt;
                </div>

                <div className="mt-4 text-rose-300">
                  &lt;link rel=&quot;canonical&quot; href=&quot;
                </div>
                <div className="ml-4 mt-1 text-slate-300">
                  https://theperipheral.org/seo
                </div>
                <div className="text-rose-300">
                  &quot; /&gt;
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-rose-100 p-4 text-sm">
              <p className="font-semibold text-rose-900">Best Practices:</p>
              <ul className="ml-4 space-y-1 text-rose-800">
                <li>• Title: 50–60 characters, front-load primary keyword</li>
                <li>• Meta description: 150–160 characters, compelling call-to-action</li>
                <li>• Canonical: self-referential to prevent duplicate content issues</li>
                <li>• Both must be unique per page</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section A.2: Open Graph & Twitter Cards */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-rose-300 bg-rose-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
              Open Graph & Twitter
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Social Media Meta Tags</h2>
            <p className="mt-3 text-slate-600">
              Control how your page looks when shared on social platforms.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded bg-slate-900 p-4 font-mono text-sm text-slate-100">
                <div className="text-rose-300">
                  {/* Open Graph */}
                  &lt;meta property=&quot;og:title&quot; content=&quot;...&quot; /&gt;
                </div>
                <div className="mt-1 text-rose-300">
                  &lt;meta property=&quot;og:description&quot; content=&quot;...&quot; /&gt;
                </div>
                <div className="mt-1 text-rose-300">
                  &lt;meta property=&quot;og:image&quot; content=&quot;...&quot; /&gt;
                </div>
                <div className="mt-1 text-rose-300">
                  &lt;meta property=&quot;og:url&quot; content=&quot;...&quot; /&gt;
                </div>
                <div className="mt-1 text-rose-300">
                  &lt;meta property=&quot;og:type&quot; content=&quot;website&quot; /&gt;
                </div>

                <div className="mt-4 text-sky-300">
                  {/* Twitter Card */}
                  &lt;meta name=&quot;twitter:card&quot; content=&quot;summary_large_image&quot; /&gt;
                </div>
                <div className="mt-1 text-sky-300">
                  &lt;meta name=&quot;twitter:title&quot; content=&quot;...&quot; /&gt;
                </div>
                <div className="mt-1 text-sky-300">
                  &lt;meta name=&quot;twitter:description&quot; content=&quot;...&quot; /&gt;
                </div>
                <div className="mt-1 text-sky-300">
                  &lt;meta name=&quot;twitter:image&quot; content=&quot;...&quot; /&gt;
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-rose-100 p-4 text-sm">
              <p className="font-semibold text-rose-900">Why It Matters:</p>
              <ul className="ml-4 space-y-1 text-rose-800">
                <li>• OG tags: 50% of clicks now come from social — control your card</li>
                <li>• Twitter cards: specific Twitter formatting (summary, summary_large_image, etc.)</li>
                <li>• Image dimensions: 1200×630px for og:image, 1024×512px minimum for Twitter</li>
                <li>• Missing tags fall back to title/description</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section B: JSON-LD Structured Data */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-600">
              Structured Data
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">JSON-LD Schemas</h2>
            <p className="mt-3 text-slate-600">
              Tell search engines what your page is about using standardized JSON-LD schemas. This enables
              rich results, knowledge panels, and better understanding of your content.
            </p>

            {/* Schema 1: Organization */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-amber-900">Organization Schema</h3>
              <p className="mt-2 text-sm text-amber-800">
                Used for knowledge panels, brand information, and verifying your organization.
              </p>
              <div className="mt-3 rounded bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                <pre>{`{
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "name": "The Peripheral",
  "url": "https://theperipheral.org",
  "logo": "https://theperipheral.org/icons/peripheral.png",
  "description": "Global message visualization on an interactive 3D globe",
  "sameAs": [
    "https://twitter.com/peripheral_news",
    "https://linkedin.com/company/peripheral"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-XXX-XXX-XXXX",
    "contactType": "Editorial"
  }
}`}</pre>
              </div>
            </div>

            {/* Schema 2: WebSite with Search Action */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-amber-900">WebSite Schema (Sitelinks Search Box)</h3>
              <p className="mt-2 text-sm text-amber-800">
                Enables search functionality directly in Google search results for your site.
              </p>
              <div className="mt-3 rounded bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                <pre>{`{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://theperipheral.org",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://theperipheral.org/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}`}</pre>
              </div>
            </div>

            {/* Schema 3: BreadcrumbList */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-amber-900">BreadcrumbList Schema</h3>
              <p className="mt-2 text-sm text-amber-800">
                Improves navigation display in search results and helps users understand site structure.
              </p>
              <div className="mt-3 rounded bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                <pre>{`{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://theperipheral.org"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "SEO Blueprint",
      "item": "https://theperipheral.org/seo"
    }
  ]
}`}</pre>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-amber-100 p-4 text-sm">
              <p className="font-semibold text-amber-900">Validation & Testing:</p>
              <ul className="ml-4 space-y-1 text-amber-800">
                <li>• Use schema.org/docs for full schema specifications</li>
                <li>• Validate with Google Rich Results Test: search.google.com/test/rich-results</li>
                <li>• Always use <span className="font-mono">@context</span> and <span className="font-mono">@type</span></li>
                <li>• Place in <span className="font-mono">{"<head>"}</span> or <span className="font-mono">{"<body>"}</span> as JSON-LD</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section C: Content Hierarchy */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-600">
              Content Structure
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Heading Hierarchy</h2>
            <p className="mt-3 text-slate-600">
              Proper heading hierarchy helps search engines understand content structure and improves
              accessibility. This page demonstrates correct nesting.
            </p>

            <div className="mt-8 space-y-6 rounded bg-white p-6">
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="text-xs font-mono font-bold uppercase text-emerald-600">Level 1</p>
                <div className="text-3xl font-bold text-slate-900" role="presentation">
                  Main Page Topic (One H1 Per Page)
                </div>
                <p className="text-xs text-emerald-600 mt-1 italic">
                  Rendered as a div — example only, not a real h1
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Contains primary keyword and describes what the page is about. Only ONE h1 per page.
                </p>
              </div>

              <div className="border-l-4 border-emerald-400 pl-4">
                <p className="text-xs font-mono font-bold uppercase text-emerald-600">Level 2</p>
                <h2 className="text-2xl font-bold text-slate-900">
                  Major Section Topic
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Breaks page into major sections. Multiple h2s are fine. Don&apos;t skip levels (no h1 → h3).
                </p>
              </div>

              <div className="border-l-4 border-emerald-300 pl-4">
                <p className="text-xs font-mono font-bold uppercase text-emerald-600">Level 3</p>
                <h3 className="text-xl font-bold text-slate-900">
                  Subsection Topic
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Organizes content within h2 sections. Supports detailed information architecture.
                </p>
              </div>

              <div className="border-l-4 border-slate-300 pl-4">
                <p className="text-xs font-mono font-bold uppercase text-slate-600">Body Text</p>
                <p className="mt-2 text-slate-600">
                  Body paragraphs contain the bulk of your content and where you naturally integrate keywords.
                  Use semantic HTML elements like <span className="font-mono text-slate-700">&lt;p&gt;</span>,{' '}
                  <span className="font-mono text-slate-700">&lt;strong&gt;</span>, and{' '}
                  <span className="font-mono text-slate-700">&lt;em&gt;</span>.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-emerald-100 p-4 text-sm">
              <p className="font-semibold text-emerald-900">Hierarchy Rules:</p>
              <ul className="ml-4 space-y-1 text-emerald-800">
                <li>• Always start with h1, never skip levels</li>
                <li>• One h1 per page — it&apos;s your primary keyword target</li>
                <li>• Use h2–h6 to organize related content</li>
                <li>• Headings improve both SEO and accessibility</li>
                <li>• Use headings for structure, not styling — use CSS for formatting</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section D: Semantic HTML */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-600">
              Content Structure
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Semantic HTML Elements</h2>
            <p className="mt-3 text-slate-600">
              Use semantic HTML to clearly define content roles. Search engines and screen readers understand
              these elements better than generic divs.
            </p>

            <div className="mt-6 grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<main>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Primary content of the page. One per page. Excludes nav, header, footer sidebars.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<article>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Self-contained content (blog post, news article, product review). Can have multiple per page.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<section>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Thematic grouping of content. Should have a heading. Helps structure long-form content.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<nav>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Navigation links. Use <span className="font-mono">aria-label</span> to distinguish multiple navs.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<header>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Introductory content or navigation. Can be page-level or section-level.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<footer>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Footer content (copyright, links, contact info). Can be page-level or section-level.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<aside>"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Related content (sidebar, related posts, ads). Indirectly related to main content.
                </p>
              </div>

              <div className="rounded border border-emerald-200 bg-white p-4">
                <p className="font-mono text-sm font-bold text-emerald-600">{"<time datetime=\"\">"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Publication/update dates. Use <span className="font-mono">datetime</span> attribute for machine readability.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-emerald-100 p-4 text-sm">
              <p className="font-semibold text-emerald-900">Why Semantic HTML Matters:</p>
              <ul className="ml-4 space-y-1 text-emerald-800">
                <li>• Search engines better understand content relationships</li>
                <li>• Screen readers provide better context to users</li>
                <li>• Progressive enhancement — works even with CSS disabled</li>
                <li>• Easier for crawlers to identify key content vs sidebars/ads</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section E: Internal Linking */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-sky-600">
              Internal Linking
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Internal Link Strategy</h2>
            <p className="mt-3 text-slate-600">
              Strategic internal linking distributes page authority, establishes information hierarchy,
              and helps search engines discover and understand your site structure.
            </p>

            <div className="mt-6 space-y-6">
              {/* Navigation */}
              <div className="rounded bg-white p-4 border border-sky-200">
                <p className="text-sm font-mono font-bold uppercase text-sky-600">Navigation Links</p>
                <p className="mt-2 text-sm text-slate-600">
                  Main navigation should include your most important pages. Use descriptive anchor text.
                </p>
                <nav className="mt-3 flex flex-wrap gap-3" aria-label="Example navigation">
                  <Link href="/" className="text-sky-600 hover:underline font-medium">
                    Home
                  </Link>
                  <Link href="/globe" className="text-sky-600 hover:underline font-medium">
                    Interactive Globe
                  </Link>
                  <Link href="/about" className="text-sky-600 hover:underline font-medium">
                    About The Peripheral
                  </Link>
                  <Link href="/stories" className="text-sky-600 hover:underline font-medium">
                    Intelligence Reports
                  </Link>
                </nav>
              </div>

              {/* Breadcrumbs */}
              <div className="rounded bg-white p-4 border border-sky-200">
                <p className="text-sm font-mono font-bold uppercase text-sky-600">Breadcrumb Navigation</p>
                <p className="mt-2 text-sm text-slate-600">
                  Shows page hierarchy and provides easy backlinks. Implement with BreadcrumbList schema.
                </p>
                <nav className="mt-3 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
                  <Link href="/" className="text-sky-600 hover:underline">
                    Home
                  </Link>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-600">SEO Blueprint</span>
                </nav>
              </div>

              {/* Contextual Links */}
              <div className="rounded bg-white p-4 border border-sky-200">
                <p className="text-sm font-mono font-bold uppercase text-sky-600">Contextual Links</p>
                <p className="mt-2 text-sm text-slate-600">
                  Links within body text pointing to related pages. Anchor text should be descriptive and relevant.
                </p>
                <p className="mt-3 text-sm text-slate-700">
                  For example: &quot;Learn more about{' '}
                  <Link href="/about" className="text-sky-600 hover:underline font-medium">
                    The Peripheral&apos;s mission
                  </Link>
                  &quot; or &quot;Check out our{' '}
                  <Link href="/stories" className="text-sky-600 hover:underline font-medium">
                    latest intelligence reports
                  </Link>
                  .&quot;
                </p>
              </div>

              {/* Related Content */}
              <div className="rounded bg-white p-4 border border-sky-200">
                <p className="text-sm font-mono font-bold uppercase text-sky-600">Related Content Section</p>
                <p className="mt-2 text-sm text-slate-600">
                  At the end of articles, link to 3–5 related pages. Keeps users engaged and distributes authority.
                </p>
              </div>

              {/* Footer Links */}
              <div className="rounded bg-white p-4 border border-sky-200">
                <p className="text-sm font-mono font-bold uppercase text-sky-600">Footer Sitemap Links</p>
                <p className="mt-2 text-sm text-slate-600">
                  Footer contains links to main categories and pages. Helps crawlers discover all content.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-sky-100 p-4 text-sm">
              <p className="font-semibold text-sky-900">Internal Linking Best Practices:</p>
              <ul className="ml-4 space-y-1 text-sky-800">
                <li>• Use descriptive anchor text (avoid &quot;click here&quot; or &quot;read more&quot;)</li>
                <li>• Link to relevant content naturally within body text</li>
                <li>• Don&apos;t over-link — 3–5 contextual links per 1000 words is ideal</li>
                <li>• Each page should be reachable within 2–3 clicks from homepage</li>
                <li>• Prioritize linking to high-value pages (products, main categories)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section F: Image Optimization */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-violet-600">
              Media & Performance
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Image Optimization</h2>
            <p className="mt-3 text-slate-600">
              Optimized images improve page load speed, user experience, and SEO rankings.
            </p>

            <div className="mt-6 rounded bg-white p-6 border border-violet-200">
              <div className="flex flex-col gap-6">
                {/* Image Example */}
                <div>
                  <p className="text-sm font-mono font-bold uppercase text-violet-600 mb-3">
                    Image with Proper Attributes
                  </p>
                  <div className="relative w-full h-64 bg-slate-100 rounded border border-dashed border-violet-300 flex items-center justify-center">
                    <Image
                      src="/icons/peripheral.png"
                      alt="The Peripheral logo and branding"
                      width={200}
                      height={200}
                      priority
                      className="object-contain"
                    />
                  </div>
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>
                      <span className="font-mono font-bold">alt:</span> &quot;The Peripheral logo and branding&quot;
                    </p>
                    <p>
                      <span className="font-mono font-bold">width:</span> 200 <span className="text-slate-500">(prevents CLS)</span>
                    </p>
                    <p>
                      <span className="font-mono font-bold">height:</span> 200 <span className="text-slate-500">(prevents CLS)</span>
                    </p>
                    <p>
                      <span className="font-mono font-bold">loading:</span> eager (priority = true) <span className="text-slate-500">(LCP image)</span>
                    </p>
                  </div>
                </div>

                {/* Code Example */}
                <div className="rounded bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                  <pre>{`<Image
  src="/icons/peripheral.png"
  alt="Descriptive alt text"
  width={1200}
  height={630}
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
  priority
  className="w-full h-auto"
/>`}</pre>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded bg-white p-4 border border-violet-200">
                <p className="text-sm font-mono font-bold uppercase text-violet-600">Alt Text</p>
                <p className="mt-2 text-sm text-slate-600">
                  Describe what the image shows. Include keywords naturally. Improve accessibility and SEO.
                  Format:{' '}
                  <span className="italic">
                    &quot;descriptive phrase (keyword)&quot;
                  </span>
                  {' e.g., &quot;Global intelligence dashboard with interactive 3D globe visualization&quot;'}
                </p>
              </div>

              <div className="rounded bg-white p-4 border border-violet-200">
                <p className="text-sm font-mono font-bold uppercase text-violet-600">Width & Height</p>
                <p className="mt-2 text-sm text-slate-600">
                  Always set width and height to prevent Cumulative Layout Shift (CLS). Use Next.js{' '}
                  <span className="font-mono">Image</span> component for automatic optimization.
                </p>
              </div>

              <div className="rounded bg-white p-4 border border-violet-200">
                <p className="text-sm font-mono font-bold uppercase text-violet-600">Loading Strategies</p>
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-mono">priority</span> (eager loading) for Above-The-Fold images (improves
                  LCP). Use <span className="font-mono">loading=&quot;lazy&quot;</span> for below-fold images.
                </p>
              </div>

              <div className="rounded bg-white p-4 border border-violet-200">
                <p className="text-sm font-mono font-bold uppercase text-violet-600">Responsive Images</p>
                <p className="mt-2 text-sm text-slate-600">
                  Use <span className="font-mono">sizes</span> attribute to hint browser about layout width at different
                  breakpoints. Reduces unnecessary data transfer on mobile.
                </p>
              </div>

              <div className="rounded bg-white p-4 border border-violet-200">
                <p className="text-sm font-mono font-bold uppercase text-violet-600">Format & Compression</p>
                <p className="mt-2 text-sm text-slate-600">
                  Next.js <span className="font-mono">Image</span> component automatically serves modern formats (WebP,
                  AVIF) and compresses images. Reduces file size by 40–80%.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-violet-100 p-4 text-sm">
              <p className="font-semibold text-violet-900">Image Optimization Impact:</p>
              <ul className="ml-4 space-y-1 text-violet-800">
                <li>• Images account for 50% of page load time — optimization is critical</li>
                <li>• Alt text improves image search visibility and accessibility</li>
                <li>• Width/height prevent layout shift, improving Core Web Vitals</li>
                <li>• Responsive images reduce bandwidth on mobile (major ranking factor)</li>
                <li>• Use WebP/AVIF for modern browsers (Next.js handles automatically)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section G: Core Web Vitals */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-violet-600">
              Media & Performance
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">Core Web Vitals</h2>
            <p className="mt-3 text-slate-600">
              Google&apos;s Core Web Vitals are now direct ranking factors. Monitor and optimize these three metrics.
            </p>

            <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-3">
              {/* LCP */}
              <div className="rounded-lg border border-violet-200 bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-mono font-bold uppercase text-violet-600">LCP</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                    Good
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">&lt; 2.5s</p>
                <p className="mt-1 text-xs text-slate-500">Largest Contentful Paint</p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold">What:</span> Time until largest visible element loads
                  </p>
                  <p>
                    <span className="font-semibold">Improve:</span>
                  </p>
                  <ul className="ml-2 space-y-1 list-disc">
                    <li>Prioritize critical images</li>
                    <li>Optimize server response time</li>
                    <li>Minimize render-blocking JS</li>
                    <li>Use CDN for assets</li>
                  </ul>
                </div>
              </div>

              {/* INP */}
              <div className="rounded-lg border border-violet-200 bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-mono font-bold uppercase text-violet-600">INP</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                    Good
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">&lt; 200ms</p>
                <p className="mt-1 text-xs text-slate-500">Interaction to Next Paint</p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold">What:</span> Time from user input to visible response
                  </p>
                  <p>
                    <span className="font-semibold">Improve:</span>
                  </p>
                  <ul className="ml-2 space-y-1 list-disc">
                    <li>Break up long JS tasks</li>
                    <li>Optimize event listeners</li>
                    <li>Defer non-critical JS</li>
                    <li>Profile with DevTools</li>
                  </ul>
                </div>
              </div>

              {/* CLS */}
              <div className="rounded-lg border border-violet-200 bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-mono font-bold uppercase text-violet-600">CLS</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                    Good
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">&lt; 0.1</p>
                <p className="mt-1 text-xs text-slate-500">Cumulative Layout Shift</p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold">What:</span> Unexpected layout shifts during page load
                  </p>
                  <p>
                    <span className="font-semibold">Improve:</span>
                  </p>
                  <ul className="ml-2 space-y-1 list-disc">
                    <li>Set width/height on images</li>
                    <li>Avoid inserting above content</li>
                    <li>Use CSS transforms, not properties</li>
                    <li>Preload fonts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-violet-100 p-4 text-sm">
              <p className="font-semibold text-violet-900">Monitoring & Testing:</p>
              <ul className="ml-4 space-y-1 text-violet-800">
                <li>
                  • <span className="font-semibold">PageSpeed Insights:</span> Check scores and get recommendations
                </li>
                <li>
                  • <span className="font-semibold">Google Search Console:</span> Monitor real-world Core Web Vitals data
                </li>
                <li>
                  • <span className="font-semibold">Chrome DevTools:</span> Debug performance issues locally
                </li>
                <li>
                  • <span className="font-semibold">Web Vitals Library:</span> Track metrics programmatically
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section H: URLs & Crawlability */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6">
            <span className="absolute -top-3 left-4 bg-white px-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
              Secondary
            </span>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">URL Structure & Crawlability</h2>
            <p className="mt-3 text-slate-600">
              Clean, descriptive URLs help users and search engines understand page content at a glance.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded bg-white p-4 border border-slate-200">
                <p className="text-sm font-mono font-bold uppercase text-slate-600">Good URL Structure</p>
                <div className="mt-3 space-y-2 rounded bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  <div>✓ theperipheral.org/intelligence/asia-pacific/2024</div>
                  <div>✓ theperipheral.org/guides/geopolitical-analysis</div>
                  <div>✓ theperipheral.org/seo</div>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Descriptive, lowercase, hyphens for words, logical hierarchy
                </p>
              </div>

              <div className="rounded bg-white p-4 border border-slate-200">
                <p className="text-sm font-mono font-bold uppercase text-slate-600">Avoid These URL Patterns</p>
                <div className="mt-3 space-y-2 rounded bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  <div>✗ theperipheral.org/index.php?id=123&cat=45</div>
                  <div>✗ theperipheral.org/page_1_content_here</div>
                  <div>✗ theperipheral.org/ARTICLE/MY-PAGE</div>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Query parameters, non-descriptive, inconsistent casing
                </p>
              </div>

              <div className="rounded bg-white p-4 border border-slate-200">
                <p className="text-sm font-mono font-bold uppercase text-slate-600">Robots.txt Directives</p>
                <div className="mt-3 rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 overflow-x-auto">
                  <pre>{`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

# Crawl-delay for heavy crawlers
Crawl-delay: 1

Sitemap: https://theperipheral.org/sitemap.xml`}</pre>
                </div>
              </div>

              <div className="rounded bg-white p-4 border border-slate-200">
                <p className="text-sm font-mono font-bold uppercase text-slate-600">Canonical URLs</p>
                <p className="mt-2 text-xs text-slate-600">
                  Use canonical tags to prevent duplicate content issues when you have multiple URLs for the same
                  content (e.g., with/without trailing slash, HTTP vs HTTPS).
                </p>
                <div className="mt-2 rounded bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  {'<link rel="canonical" href="https://theperipheral.org/seo" />'}
                </div>
              </div>

              <div className="rounded bg-white p-4 border border-slate-200">
                <p className="text-sm font-mono font-bold uppercase text-slate-600">Sitemap.xml</p>
                <p className="mt-2 text-xs text-slate-600">
                  Submit your sitemap to Google Search Console. Include lastmod and priority attributes to help
                  crawlers prioritize pages.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded bg-slate-100 p-4 text-sm">
              <p className="font-semibold text-slate-700">Crawlability Best Practices:</p>
              <ul className="ml-4 space-y-1 text-slate-600">
                <li>• Keep URLs short (&lt; 75 chars)</li>
                <li>• Use HTTPS everywhere (redirect HTTP to HTTPS)</li>
                <li>• Avoid query parameters when possible</li>
                <li>• Use consistent URL structure across the site</li>
                <li>• Submit sitemap to Google Search Console and Bing Webmaster Tools</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quick Reference Checklist */}
        <section className="mb-12">
          <div className="relative rounded-lg border-2 border-solid border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-bold text-slate-900">SEO Quick Checklist</h2>
            <p className="mt-3 text-slate-600">
              Run through this checklist before publishing any page to ensure proper SEO optimization.
            </p>

            <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Column 1 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check1" className="mt-1" />
                  <label htmlFor="check1" className="text-sm text-slate-700">
                    Page has unique <span className="font-mono">&lt;title&gt;</span> (50–60 chars)
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check2" className="mt-1" />
                  <label htmlFor="check2" className="text-sm text-slate-700">
                    Meta description is compelling (150–160 chars)
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check3" className="mt-1" />
                  <label htmlFor="check3" className="text-sm text-slate-700">
                    Canonical URL is set correctly
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check4" className="mt-1" />
                  <label htmlFor="check4" className="text-sm text-slate-700">
                    One <span className="font-mono">&lt;h1&gt;</span> per page
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check5" className="mt-1" />
                  <label htmlFor="check5" className="text-sm text-slate-700">
                    Heading hierarchy is logical (h1 → h2 → h3)
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check6" className="mt-1" />
                  <label htmlFor="check6" className="text-sm text-slate-700">
                    Images have descriptive <span className="font-mono">alt</span> text
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check7" className="mt-1" />
                  <label htmlFor="check7" className="text-sm text-slate-700">
                    Images have <span className="font-mono">width</span> and{' '}
                    <span className="font-mono">height</span> set
                  </label>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check8" className="mt-1" />
                  <label htmlFor="check8" className="text-sm text-slate-700">
                    JSON-LD structured data is valid
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check9" className="mt-1" />
                  <label htmlFor="check9" className="text-sm text-slate-700">
                    Internal links use descriptive anchor text
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check10" className="mt-1" />
                  <label htmlFor="check10" className="text-sm text-slate-700">
                    Open Graph tags are set
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check11" className="mt-1" />
                  <label htmlFor="check11" className="text-sm text-slate-700">
                    Twitter Card tags are set
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check12" className="mt-1" />
                  <label htmlFor="check12" className="text-sm text-slate-700">
                    Page is mobile-friendly (responsive)
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check13" className="mt-1" />
                  <label htmlFor="check13" className="text-sm text-slate-700">
                    Core Web Vitals pass (LCP, INP, CLS)
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="check14" className="mt-1" />
                  <label htmlFor="check14" className="text-sm text-slate-700">
                    No broken internal links
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-600 border-t border-slate-200 pt-4">
              <p className="font-semibold text-slate-700 mb-2">Testing Resources:</p>
              <ul className="ml-4 space-y-1 list-disc">
                <li>
                  <span className="font-semibold">Google PageSpeed Insights:</span> Test Core Web Vitals and
                  performance
                </li>
                <li>
                  <span className="font-semibold">Google Rich Results Test:</span> Validate structured data
                </li>
                <li>
                  <span className="font-semibold">Google Mobile-Friendly Test:</span> Check mobile optimization
                </li>
                <li>
                  <span className="font-semibold">Lighthouse (Chrome DevTools):</span> Comprehensive SEO audit
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Related Pages Section */}
        <section className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Learn More</h2>
          <p className="mt-3 text-slate-600">
            Deepen your SEO knowledge with these resources:
          </p>
          <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2">
            <Link
              href="/"
              className="rounded border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <h3 className="font-semibold text-slate-900">Home</h3>
              <p className="mt-1 text-sm text-slate-600">Return to The Peripheral homepage</p>
            </Link>
            <a
              href="https://developers.google.com/search"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <h3 className="font-semibold text-slate-900">Google Search Central</h3>
              <p className="mt-1 text-sm text-slate-600">Official Google SEO documentation</p>
            </a>
          </div>
        </section>
      </article>
    </main>
  )
}
