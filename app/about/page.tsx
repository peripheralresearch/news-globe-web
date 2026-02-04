import { Navigation, NewsTicker, Footer } from '@/app/components/landing'
import { Metadata } from 'next'
import JsonLd from '@/app/components/JsonLd'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { getSiteUrl } from '@/lib/seo/baseUrl'
import { webPageJsonLd, organizationJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld'

export const metadata: Metadata = buildPageMetadata({
  title: 'About — The Peripheral',
  description: 'The Peripheral is an evidence-first intelligence platform that transforms global conflict reporting into structured, verified, source-linked knowledge.',
  path: '/about',
})

export default function AboutPage() {
  const siteUrl = getSiteUrl()

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <JsonLd data={[
        webPageJsonLd({
          url: `${siteUrl}/about`,
          name: 'About — The Peripheral',
          description: 'The Peripheral is an evidence-first intelligence platform that transforms global conflict reporting into structured, verified, source-linked knowledge.',
        }),
        organizationJsonLd({ contactEmail: 'hello@theperipheral.org' }),
        breadcrumbJsonLd([
          { name: 'Home', itemUrl: siteUrl },
          { name: 'About', itemUrl: `${siteUrl}/about` },
        ]),
      ]} />
      <Navigation />
      <NewsTicker />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-8">
          About The Peripheral
        </h1>

        <div className="space-y-6 text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          <p>
            The Peripheral is an evidence-first intelligence platform that transforms the noise of
            global conflict reporting into structured, verified, source-linked knowledge.
          </p>

          <p>
            We monitor over 1,000 sources — news agencies, social media, on-ground footage, and
            government communications — to build a real-time picture of events as they unfold across
            the world.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white pt-4">
            How we work
          </h2>

          <p>
            Every piece of intelligence passes through a multi-stage pipeline. Sources are ingested
            continuously, entities are extracted and cross-referenced using AI, and stories are
            clustered by event — not by headline. The result is a structured knowledge graph where
            every claim links back to its original source.
          </p>

          <p>
            We don&apos;t editorialize. We don&apos;t speculate. We structure what&apos;s reported,
            track who reported it, and surface patterns that emerge from the data.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white pt-4">
            Who it&apos;s for
          </h2>

          <p>
            The Peripheral is built for journalists verifying breaking events, analysts tracking
            geopolitical shifts, researchers studying conflict dynamics, and anyone who needs to
            cut through information noise to find what actually happened.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white pt-4">
            Open source intelligence
          </h2>

          <p>
            OSINT — open source intelligence — is information derived from publicly available
            sources. It&apos;s the foundation of modern investigative journalism and conflict
            monitoring. The Peripheral automates the most time-consuming parts of OSINT work:
            collection, deduplication, entity extraction, and cross-referencing — so investigators
            can focus on analysis and verification.
          </p>
        </div>
      </article>

      <Footer />
    </main>
  )
}
