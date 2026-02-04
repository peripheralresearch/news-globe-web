import { Navigation, Footer } from '@/app/components/landing'
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

      {/* Mission Statement */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 md:pb-24">
        <div className="border-t border-slate-200 dark:border-neutral-800 pt-16">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">
            Planning for the Post-Truth Era and Beyond
          </h2>

          <div className="space-y-6 text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              The Mission
            </h3>

            <p>
              Our mission is to ensure that truthful, verifiable information remains accessible
              to humanity — to build intelligence infrastructure that elevates the signal above
              the noise, and to do so in a way that empowers individuals rather than replacing
              their judgment.
            </p>

            <p>
              If successful, this work could help restore something we&apos;ve lost: the ability
              for people to understand what is actually happening in the world. The Peripheral
              exists because the current information ecosystem is failing at its most fundamental
              purpose.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              The Problem We Face
            </h3>

            <p>
              The information environment has crossed a threshold. For most of human history, the
              limiting factor was access to information. Libraries, newspapers, and broadcast media
              served as filters — imperfect, often biased, but operating with some accountability
              to truth. Today, the problem has inverted. We are drowning in information while
              starving for knowledge.
            </p>

            <p>This inversion creates several compounding crises.</p>

            <p>
              <strong className="text-slate-900 dark:text-white">Algorithmic amplification rewards engagement, not accuracy.</strong>{' '}
              Social platforms and news aggregators are optimized for attention capture.
              Sensationalism, outrage, and tribal signaling spread faster than careful analysis.
              A false claim can circle the globe while the correction is still being drafted.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">AI-generated content is scaling faster than verification.</strong>{' '}
              We are entering an era where synthetic media, automated article generation, and
              sophisticated disinformation can be produced at a cost approaching zero. The
              verification infrastructure that took decades to build cannot keep pace with content
              that can be generated in milliseconds.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Coverage fragmentation obscures systemic patterns.</strong>{' '}
              A crisis in one region might generate thousands of articles, each covering a fragment,
              while the connections between events remain invisible. Context collapses. The forest
              becomes indistinguishable from individual trees.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Professional intelligence remains siloed and expensive.</strong>{' '}
              Governments, corporations, and well-funded research institutions have access to
              comprehensive situational awareness. Independent journalists, civil society
              organizations, and ordinary citizens do not. This asymmetry is corrosive to
              democratic accountability.
            </p>

            <p>
              These problems compound each other. Algorithmic amplification spreads AI-generated
              disinformation across fragmented channels, while those with the resources to understand
              the full picture have little incentive to share their methods.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              What We Believe
            </h3>

            <p>
              We believe the solution is not to restrict information, but to build better
              infrastructure for understanding it.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Evidence should be primary.</strong>{' '}
              Every claim should be traceable to its sources. Every source should be verifiable. The
              default mode of information consumption has become assertion — someone says something,
              and you either believe it or don&apos;t based on tribal affiliation. We want to shift
              this toward evidence — here is what happened, here is how we know, here is what we
              don&apos;t know.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Structured knowledge beats unstructured content.</strong>{' '}
              A thousand articles about the same event contain redundant information scattered across
              disconnected pages. A knowledge graph that extracts entities, relationships, and
              temporal patterns transforms this chaos into something navigable. The same underlying
              reality, represented in a form that supports reasoning rather than just reading.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Source verification is non-negotiable.</strong>{' '}
              In an era of synthetic media and coordinated manipulation, provenance matters more than
              ever. Every piece of information should carry its lineage — where it came from, who
              published it, what corroborating sources exist, what contradictions have been identified.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Intelligence should be democratized, not dumbed down.</strong>{' '}
              Professional analysts use sophisticated tools and frameworks because they work. We
              believe these capabilities should be accessible to journalists working on limited
              budgets, researchers investigating abuses, and citizens trying to understand their
              world. This is not about making everything simple — it&apos;s about making powerful
              tools available to people who need them.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Humans remain in the loop.</strong>{' '}
              AI can process information at scales impossible for humans. But AI can also hallucinate,
              miss context, and encode biases. The Peripheral is designed to augment human analysts,
              not replace them. Every AI-generated summary, entity extraction, or relationship
              inference should be auditable and correctable.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              The Opportunity
            </h3>

            <p>If we succeed in building this infrastructure, several things become possible.</p>

            <p>
              Journalists investigating corruption could follow money and connections across
              jurisdictions in hours rather than months. They could verify whether a source&apos;s
              claim matches the documented record, trace the spread of a narrative across platforms,
              and understand the broader context their story fits into.
            </p>

            <p>
              OSINT analysts monitoring conflicts could maintain real-time situational awareness
              across multiple theaters, with automatic extraction of geographic features, unit
              movements, and equipment sightings — all linked back to primary sources.
            </p>

            <p>
              Researchers studying disinformation could trace how false narratives emerge, mutate,
              and spread, identifying the nodes in the network that amplify them.
            </p>

            <p>
              Ordinary citizens could access the same quality of information analysis that
              governments and corporations take for granted. Not simplified summaries, but the
              actual structured intelligence, with the tools to explore it.
            </p>

            <p>
              This is not utopian. It&apos;s the same capability that already exists within
              classified government systems and expensive commercial intelligence platforms. We
              believe it should be available to anyone who needs to understand what&apos;s happening
              in the world.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              The Risks We Take Seriously
            </h3>

            <p>Building better intelligence tools creates risks we must acknowledge.</p>

            <p>
              <strong className="text-slate-900 dark:text-white">The dual-use problem.</strong>{' '}
              The same tools that help journalists verify information can help propagandists identify
              which narratives are gaining traction. Entity extraction that helps researchers track
              human rights abuses can help authoritarians track dissidents. We cannot build powerful
              tools while pretending they will only be used for good.
            </p>

            <p>
              Our approach to this is not to cripple our tools, but to design for transparency. Tools
              that work by illuminating sources and evidence create an audit trail. They advantage
              those who are seeking truth over those who are manufacturing it — though imperfectly.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">The accuracy burden.</strong>{' '}
              When we structure information and present it as intelligence, we take on responsibility
              for that structure. A misidentified entity, an incorrect relationship inference, or a
              false confidence score can mislead the very people we&apos;re trying to help. The
              failure mode of a search engine is showing bad results. The failure mode of an
              intelligence platform is creating false understanding.
            </p>

            <p>
              We address this through relentless source verification, confidence scoring, and
              transparency about the limitations of automated analysis. Every inference should be
              auditable. Users should always be able to see why the system believes what it believes.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">The attention economy trap.</strong>{' '}
              There is a business model that works by maximizing engagement rather than understanding.
              We could build features that increase time-on-platform by making information addictive
              rather than useful. We will not do this. Our success metric is whether users understand
              their subject better, not whether they scroll longer.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">The centralization risk.</strong>{' '}
              Concentrating intelligence capability in a single platform creates a target — for
              censorship, for hacking, for manipulation. If The Peripheral becomes critical
              infrastructure for independent journalism and research, its compromise would be
              catastrophic.
            </p>

            <p>
              Our response is to build with openness where possible. The knowledge graph structures,
              the verification protocols, the extraction pipelines — these should be public and
              reproducible. We are building infrastructure for an ecosystem, not a walled garden.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              How We Approach the Work
            </h3>

            <p>
              <strong className="text-slate-900 dark:text-white">Ship incrementally, learn continuously.</strong>{' '}
              We do not believe it is possible to design a perfect system in advance. The information
              environment is adversarial and evolving. The only way to build tools that work is to
              deploy them, learn from their failures, and iterate. This means accepting that early
              versions will be imperfect while maintaining commitment to improvement.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Start with the hardest use cases.</strong>{' '}
              Journalists covering active conflicts and OSINT analysts monitoring geopolitical events
              are sophisticated users with high standards. If we can build tools that meet their
              needs, we can serve anyone. Building for casual consumers first would optimize for the
              wrong things.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Maintain human editorial judgment.</strong>{' '}
              Algorithms should do what algorithms do well: process large volumes, extract patterns,
              identify connections. Humans should do what humans do well: assess context, weigh
              evidence, make editorial judgments about significance. The Peripheral is a tool for
              analysts, not a replacement for analysis.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Be transparent about methodology.</strong>{' '}
              How we collect, how we extract, how we verify, how we score confidence — all of this
              should be documented and auditable. Black-box intelligence is not intelligence;
              it&apos;s assertion.
            </p>

            <p>
              <strong className="text-slate-900 dark:text-white">Resist the temptation to become an oracle.</strong>{' '}
              The goal is not to tell people what to think but to give them the structured information
              they need to think well. We will present evidence and relationships. We will not tell
              users which faction is right in a conflict, which policy is correct, or what they should
              believe about contested questions.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white pt-4">
              The Path Forward
            </h3>

            <p>
              We are building something that sits between raw information and human understanding.
              The scope of this problem exceeds what any single team can solve. But it has to start
              somewhere.
            </p>

            <p>
              In the near term, we focus on the core: reliable collection from diverse sources,
              AI-powered extraction and structuring, rigorous source verification, and interfaces
              that make complex information navigable. We work with journalists and OSINT
              professionals who can stress-test our tools against real-world needs.
            </p>

            <p>
              Over time, we aim to build something larger: a knowledge infrastructure that can serve
              as the foundation for others building in this space. APIs for structured intelligence.
              Open protocols for verification. A demonstration that information ecosystems can be
              designed for understanding rather than engagement.
            </p>

            <p>
              We cannot predict exactly how this will unfold. The information environment is changing
              faster than anyone can fully track. New manipulation techniques will emerge. New
              verification challenges will arise. We will need to adapt.
            </p>

            <p>
              But the underlying commitment remains constant: truthful, verifiable, structured
              information should be accessible to everyone who needs to understand what is happening
              in the world. This is not a technical problem alone, nor a business problem alone. It
              is an infrastructure problem for the coming decades.
            </p>

            <p>We intend to help solve it.</p>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
