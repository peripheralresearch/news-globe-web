import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navigation, Footer } from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Inside Sentinel — The Peripheral',
  description:
    "Inside Sentinel: The Peripheral's evidence-first OSINT pipeline for NGOs and researchers. Trace every claim to primary sources, quantify uncertainty, and explore structured intelligence without black-box assertions.",
}

export default function SentinelSystemPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-brand-abyss to-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-5xl font-bold mb-6">Inside Sentinel</h1>
          <p className="text-xl text-brand-warm-200 leading-relaxed">
            Sentinel is The Peripheral&apos;s evidence-first OSINT pipeline: it captures information,
            structures it for reasoning, and preserves provenance so every claim remains auditable.
          </p>
          <p className="mt-6 text-base text-brand-warm-200 leading-relaxed max-w-3xl">
            We build for NGOs and researchers operating in adversarial information environments.
            Our goal is not to become an oracle, but to help humans see the signal, the uncertainty,
            and the evidence underneath.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-6 bg-brand-neutral-50 border-b border-brand-neutral-100 sticky top-20 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex flex-wrap gap-6 text-sm">
            <a href="#overview" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Overview</a>
            <a href="#principles" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Principles</a>
            <a href="#workflow" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Workflow</a>
            <a href="#evidence" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Evidence</a>
            <a href="#uncertainty" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Uncertainty</a>
            <a href="#access" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Access</a>
            <a href="#stack" className="text-brand-warm-600 hover:text-brand-ink transition-colors">Implementation Notes</a>
          </nav>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* Overview */}
        <section id="overview" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">What is Sentinel?</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-brand-warm-600 leading-relaxed mb-4">
              Sentinel sits between raw information and human understanding. It collects open-source material,
              extracts structure (entities, locations, relationships, timelines), and retains provenance so
              analysts can verify claims instead of inheriting them.
            </p>
            <p className="text-lg text-brand-warm-600 leading-relaxed mb-4">
              Our default mode is evidence-first: every output links back to primary sources and makes
              uncertainty explicit. Sentinel is designed to augment human judgment, not replace it.
            </p>
            <p className="text-lg text-brand-warm-600 leading-relaxed">
              For NGOs and researchers, this means faster triage, clearer context, and a reproducible audit
              trail across fragmented coverage.
            </p>
          </div>
        </section>

        {/* Pipeline Diagram */}
        <section className="mb-16">
          <div className="bg-brand-neutral-100 p-8 rounded-lg">
            <Image
              src="/images/sentinel-pipeline.png"
              alt="Sentinel Pipeline Architecture"
              width={2736}
              height={1154}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <p className="text-sm text-brand-warm-600 mt-4 text-center">
              Sentinel, end to end: from raw OSINT to structured, auditable intelligence
            </p>
          </div>
        </section>

        {/* Principles */}
        <section id="principles" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">The Principles Behind Sentinel</h2>
          <p className="text-lg text-brand-warm-600 leading-relaxed mb-6">
            The Peripheral exists to keep truthful, verifiable information accessible. Sentinel is how we
            operationalize that mission.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-lg font-bold text-brand-navy mb-2">Truth Above All Else</h3>
              <p className="text-sm text-brand-warm-600 leading-relaxed">
                We prefer traceable evidence over persuasive narrative. The job is clarity, and the ability
                to hold actors accountable with verifiable records.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-lg font-bold text-brand-navy mb-2">Open-Minded, Not Gullible</h3>
              <p className="text-sm text-brand-warm-600 leading-relaxed">
                We respect the full range of human testimony, and we avoid total dependence on any single
                person, channel, or institution. The whole is who we serve.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-lg font-bold text-brand-navy mb-2">Probability, Not Absolutes</h3>
              <p className="text-sm text-brand-warm-600 leading-relaxed">
                True and false are rarely binary. Sentinel is built to make uncertainty explicit: confidence,
                corroboration, contradictions, and the remaining chance we are wrong.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-lg font-bold text-brand-navy mb-2">Humans Remain in the Loop</h3>
              <p className="text-sm text-brand-warm-600 leading-relaxed">
                Automation scales triage and pattern-finding. Humans make the final calls. Every automated
                output is designed to be auditable, correctable, and contestable.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">Workflow: From Noise to Knowledge</h2>
          <p className="text-lg text-brand-warm-600 leading-relaxed mb-6">
            Sentinel is a pipeline of transformations. Each stage produces artifacts you can inspect,
            reproduce, and challenge.
          </p>

          <div className="bg-brand-neutral-50 p-6 rounded-lg">
            <ol className="space-y-4 text-brand-warm-600">
              <li>
                <strong>1. Collect</strong> — ingest open sources (feeds, channels, publications) with capture
                metadata and media attachments.
              </li>
              <li>
                <strong>2. Normalize</strong> — dedupe, standardize timestamps, resolve source identity, and
                preserve original text/media for audit.
              </li>
              <li>
                <strong>3. Enrich</strong> — extract entities, locations, and candidate signals; generate summaries as
                navigation aids (not ground truth).
              </li>
              <li>
                <strong>4. Link</strong> — connect related items into stories and timelines using multiple signals (content similarity,
                entity overlap, and temporal proximity).
              </li>
              <li>
                <strong>5. Deliver</strong> — expose the structured view via the website and programmatic interfaces with clear provenance.
              </li>
            </ol>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg border border-brand-neutral-100">
              <p className="text-xs font-medium text-brand-warm-400 uppercase tracking-wider">Output</p>
              <p className="mt-1 font-semibold text-brand-navy">Stories</p>
              <p className="mt-2 text-sm text-brand-warm-600 leading-relaxed">
                Clustered narratives backed by multiple sources, with timestamps and linked evidence.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-brand-neutral-100">
              <p className="text-xs font-medium text-brand-warm-400 uppercase tracking-wider">Output</p>
              <p className="mt-1 font-semibold text-brand-navy">Entities</p>
              <p className="mt-2 text-sm text-brand-warm-600 leading-relaxed">
                People, organizations, locations, and objects extracted as structured data for search and analysis.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-brand-neutral-100">
              <p className="text-xs font-medium text-brand-warm-400 uppercase tracking-wider">Output</p>
              <p className="mt-1 font-semibold text-brand-navy">Signals</p>
              <p className="mt-2 text-sm text-brand-warm-600 leading-relaxed">
                High-salience events and alerts for monitoring, triage, and investigative workflows.
              </p>
            </div>
          </div>
        </section>

        {/* Evidence */}
        <section id="evidence" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">Evidence and Auditability</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-brand-warm-600 leading-relaxed mb-6">
              In a post-truth environment, the output matters less than the audit trail. Sentinel is built
              so you can answer: <em>Where did this come from?</em> <em>What supports it?</em> <em>What contradicts it?</em>
            </p>

            <div className="bg-white border border-brand-neutral-100 rounded-lg p-6">
              <h3 className="text-xl font-bold text-brand-navy mb-3">What We Preserve</h3>
              <ul className="space-y-2 text-brand-warm-600">
                <li><strong>Primary sources</strong> — direct links and source identity, not screenshots of screenshots.</li>
                <li><strong>Capture metadata</strong> — when it was observed and when it was collected.</li>
                <li><strong>Media context</strong> — attachments and surrounding text where available.</li>
                <li><strong>Structured extraction</strong> — entities and locations that power analysis and discovery.</li>
                <li><strong>Change visibility</strong> — corrections and updates are treated as first-class events, not silent edits.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Uncertainty */}
        <section id="uncertainty" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">Uncertainty Is a Feature</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-brand-warm-600 leading-relaxed mb-6">
              Sentinel treats truth as a probability, not a proclamation. We show confidence and corroboration so
              analysts can weigh evidence without being pushed into false certainty.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-brand-neutral-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-brand-navy mb-2">Confidence Scoring</h3>
                <p className="text-sm text-brand-warm-600 leading-relaxed">
                  Confidence reflects how strongly the available evidence supports an extraction or linkage. It is
                  not a claim of correctness, and it is always revisable.
                </p>
              </div>
              <div className="bg-brand-neutral-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-brand-navy mb-2">Contradictions and Gaps</h3>
                <p className="text-sm text-brand-warm-600 leading-relaxed">
                  Disagreement between sources, missing context, and low-quality evidence are surfaced as part of the
                  analysis, not hidden behind a single summary.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Access */}
        <section id="access" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">Access and Integrations</h2>
          <p className="text-lg text-brand-warm-600 leading-relaxed mb-6">
            We aim to democratize intelligence without dumbing it down. Access is designed to support real research
            workflows and preserve an audit trail.
          </p>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-xl font-bold text-brand-navy mb-2">Website</h3>
              <p className="text-brand-warm-600">
                Browse structured stories, sources, and geospatial context with direct links back to primary material.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-xl font-bold text-brand-navy mb-2">Programmatic Access</h3>
              <p className="text-brand-warm-600">
                For partners, we provide programmatic access for integration into investigative and research tooling.
                We prioritize transparency, provenance, and rate-limited safety for dual-use concerns.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-brand-neutral-100">
              <h3 className="text-xl font-bold text-brand-navy mb-2">Exports</h3>
              <p className="text-brand-warm-600">
                Structured exports enable reproducible analysis and reporting pipelines.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section id="stack" className="mb-16 scroll-mt-32">
          <h2 className="text-3xl font-bold text-brand-navy mb-6">Implementation Notes (What We Share Publicly)</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-brand-warm-600 leading-relaxed mb-6">
              We believe methodology should be transparent and auditable. At the same time, operational specifics can
              be dual-use. Publicly, we share the shape of the system, not the full blueprint.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-brand-navy mb-3">Infrastructure</h3>
                <ul className="space-y-2 text-brand-warm-600">
                  <li><strong>Incremental ingestion</strong> — continuous collection with dedupe and capture metadata.</li>
                  <li><strong>Structured datastore</strong> — queryable storage for stories, entities, and provenance.</li>
                  <li><strong>Media storage</strong> — durable storage for attachments required for verification.</li>
                  <li><strong>Queue-based processing</strong> — background jobs for enrichment and linking.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-brand-navy mb-3">AI & NLP</h3>
                <ul className="space-y-2 text-brand-warm-600">
                  <li><strong>Extraction</strong> — entities, locations, and candidate signals from text and metadata.</li>
                  <li><strong>Linking</strong> — similarity + overlap heuristics to group related material into stories.</li>
                  <li><strong>Summarization</strong> — navigation aids with explicit auditability and correction paths.</li>
                  <li><strong>Uncertainty modeling</strong> — confidence, corroboration, and contradiction surfacing.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-brand-navy mb-3">Verification</h3>
                <ul className="space-y-2 text-brand-warm-600">
                  <li><strong>Provenance</strong> — preserve source identity and direct URLs wherever possible.</li>
                  <li><strong>Reproducibility</strong> — structured outputs that can be re-queried and re-audited.</li>
                  <li><strong>Human correction</strong> — mechanisms to challenge and improve automated inferences.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-brand-navy mb-3">Frontend</h3>
                <ul className="space-y-2 text-brand-warm-600">
                  <li><strong>Geospatial context</strong> — maps and timelines that stay linked to evidence.</li>
                  <li><strong>Exploration UX</strong> — fast search, filtering, and cross-linking across entities.</li>
                  <li><strong>Readable defaults</strong> — design optimized for understanding, not endless scrolling.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 pt-16 border-t border-brand-neutral-100">
          <div className="bg-gradient-to-r from-brand-abyss to-brand-navy text-white p-12 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Working on Accountability Research?</h2>
            <p className="text-xl text-brand-warm-200 mb-8 max-w-2xl mx-auto">
              If you&apos;re an NGO or researcher, tell us what you&apos;re investigating. We&apos;ll show you how Sentinel can help
              you move from fragmented coverage to structured, source-linked understanding.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-block px-8 py-4 bg-white text-brand-navy rounded-lg hover:bg-brand-neutral-100 transition-colors font-semibold"
              >
                Request Access
              </Link>
              <a
                href="https://github.com/peripheralresearch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/80 transition-colors font-semibold"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </article>

      <Footer />
    </main>
  )
}
