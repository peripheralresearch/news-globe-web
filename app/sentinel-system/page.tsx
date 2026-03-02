import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navigation, Footer } from '@/app/components/landing'

export const metadata: Metadata = {
  title: 'Inside Sentinel — The Peripheral',
  description: 'A deep dive into Sentinel, our OSINT intelligence pipeline that powers The Peripheral. Learn how we collect, enrich, and deliver structured intelligence from global conflicts.',
}

export default function SentinelSystemPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-5xl font-bold mb-6">Inside Sentinel</h1>
          <p className="text-xl text-slate-300 leading-relaxed">
            A deep dive into our OSINT intelligence pipeline — how we transform raw data from 100+ sources 
            into structured, verified intelligence for journalists and researchers worldwide.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex flex-wrap gap-6 text-sm">
            <a href="#overview" className="text-slate-600 hover:text-slate-900 transition-colors">Overview</a>
            <a href="#collection" className="text-slate-600 hover:text-slate-900 transition-colors">Data Collection</a>
            <a href="#enrichment" className="text-slate-600 hover:text-slate-900 transition-colors">Enrichment Pipeline</a>
            <a href="#stories" className="text-slate-600 hover:text-slate-900 transition-colors">Story Generation</a>
            <a href="#delivery" className="text-slate-600 hover:text-slate-900 transition-colors">API & Delivery</a>
            <a href="#stack" className="text-slate-600 hover:text-slate-900 transition-colors">Technical Stack</a>
          </nav>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* Overview */}
        <section id="overview" className="mb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">What is Sentinel?</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed mb-4">
              Sentinel is The Peripheral's OSINT intelligence pipeline — a fully automated system that monitors, 
              enriches, and structures data from global conflict zones. Unlike traditional news aggregators, 
              Sentinel doesn't just collect articles; it understands them.
            </p>
            <p className="text-lg text-slate-700 leading-relaxed mb-4">
              Every 15 minutes, Sentinel processes thousands of posts from Telegram channels, RSS feeds, and 
              social media. Each article is enriched with entity extraction, sentiment analysis, geolocation, 
              and military signal detection. Related articles are automatically clustered into stories with 
              full source attribution and confidence scores.
            </p>
            <p className="text-lg text-slate-700 leading-relaxed">
              The result: structured, verifiable intelligence that journalists can trust and researchers can query programmatically.
            </p>
          </div>
        </section>

        {/* Pipeline Diagram */}
        <section className="mb-16">
          <div className="bg-slate-100 p-8 rounded-lg">
            <Image
              src="/images/sentinel-pipeline.png"
              alt="Sentinel Pipeline Architecture"
              width={2736}
              height={1154}
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <p className="text-sm text-slate-600 mt-4 text-center">
              The Sentinel intelligence pipeline: from raw OSINT to structured stories
            </p>
          </div>
        </section>

        {/* Data Collection Layer */}
        <section id="collection" className="mb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">1. Data Collection Layer</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              Sentinel monitors 100+ OSINT sources around the clock. Every Telegram message, RSS article, 
              and social media post is captured with full metadata: timestamp, author, channel, and media attachments.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mb-4">Source Types</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">📱 Telegram Channels</h4>
                <p className="text-sm text-slate-600">
                  Real-time monitoring of conflict reporting channels. Downloads media files (photos, videos) 
                  and stores them in Oracle Cloud Storage for archival and analysis.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">📰 RSS Feeds</h4>
                <p className="text-sm text-slate-600">
                  Traditional news sources, think tanks, and government briefings. Polled every 15 minutes 
                  for new articles with full-text extraction.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-4">How It Works</h3>
            <div className="bg-slate-50 p-6 rounded-lg mb-6">
              <ol className="space-y-3 text-slate-700">
                <li><strong>1. Collection Workers</strong> — Celery tasks poll sources every 15 minutes</li>
                <li><strong>2. Deduplication</strong> — Check if article already exists (by link/hash)</li>
                <li><strong>3. Media Download</strong> — Videos/images saved to Oracle Cloud Storage</li>
                <li><strong>4. Database Insert</strong> — Article + metadata stored in Supabase PostgreSQL</li>
                <li><strong>5. Queue for Enrichment</strong> — Triggers NLP pipeline via RabbitMQ</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Enrichment Pipeline */}
        <section id="enrichment" className="mb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">2. NLP Enrichment Pipeline</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              Raw articles are processed through a series of NLP bots that extract structured intelligence. 
              Each bot runs independently, adding layers of metadata to the original post.
            </p>

            <div className="space-y-6">
              {/* Sentiment Bot */}
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">😊 Sentiment Analysis Bot</h3>
                <p className="text-slate-700 mb-3">
                  Analyzes tone and emotional valence. Classifies articles as positive, negative, or neutral 
                  with confidence scores. Useful for detecting propaganda, morale indicators, and bias.
                </p>
                <div className="bg-slate-50 p-3 rounded text-sm font-mono text-slate-600">
                  sentiment_score: -0.65, sentiment_category: "negative"
                </div>
              </div>

              {/* Entity Extraction Bot */}
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">🏷️ Entity Extraction Bot</h3>
                <p className="text-slate-700 mb-3">
                  Identifies people, organizations, locations, countries, and weapons mentioned in the text. 
                  Each entity is linked to a global entity database for cross-referencing.
                </p>
                <div className="bg-slate-50 p-3 rounded text-sm font-mono text-slate-600">
                  entities: &#123;"people": ["Ali Khamenei"], "locations": ["Tehran"], "weapons": ["Shahed-136"]&#125;
                </div>
              </div>

              {/* Summary Bot */}
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">📝 Summary Bot</h3>
                <p className="text-slate-700 mb-3">
                  Generates concise 2-3 sentence summaries for quick scanning. Preserves key facts while 
                  removing editorial noise.
                </p>
              </div>

              {/* Signal Extraction Bot */}
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">🎯 Military Signal Extraction</h3>
                <p className="text-slate-700 mb-3">
                  Detects military activity: strikes, drone sightings, troop movements, weapon deployments. 
                  Extracts geolocation (lat/lon) when possible and links to GeoConfirmed KML data.
                </p>
                <div className="bg-slate-50 p-3 rounded text-sm font-mono text-slate-600">
                  signal_type: "air_strike", target_location: "Tehran", weapon_type: "cruise_missile"
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Generation */}
        <section id="stories" className="mb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">3. Story Generation & Clustering</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              Individual articles are great, but stories are better. Sentinel automatically clusters related 
              articles into cohesive narratives using semantic embeddings and entity overlap.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mb-4">How Stories Are Built</h3>
            <div className="bg-slate-50 p-6 rounded-lg mb-6">
              <ol className="space-y-3 text-slate-700">
                <li><strong>1. Semantic Embeddings</strong> — Convert article text to 1536-dimensional vectors (OpenAI)</li>
                <li><strong>2. Similarity Clustering</strong> — Group articles with cosine similarity &gt; 0.80</li>
                <li><strong>3. Entity Overlap</strong> — Boost clustering confidence if entities match</li>
                <li><strong>4. Geolocation Merge</strong> — Aggregate lat/lon from signals into story-level map pins</li>
                <li><strong>5. Generate Story Title</strong> — LLM creates concise headline from cluster</li>
              </ol>
            </div>

            <p className="text-slate-700">
              The result: a story page showing 5-20 source articles, entity timeline, geolocation map, 
              and confidence metadata. Every claim is traceable to its source.
            </p>
          </div>
        </section>

        {/* API & Delivery */}
        <section id="delivery" className="mb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">4. API & Delivery</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              Sentinel's intelligence is accessible via multiple interfaces:
            </p>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">🌐 Public Website</h3>
                <p className="text-slate-700">
                  Browse stories, search by entity/location, view geolocation maps. Designed for journalists 
                  and researchers who want a visual interface.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">🔌 MCP Server</h3>
                <p className="text-slate-700 mb-3">
                  Claude Desktop integration via Model Context Protocol. Query Peripheral data directly 
                  from your AI assistant: "Show me Iran strike videos from the last 48 hours."
                </p>
                <div className="bg-slate-50 p-3 rounded text-sm font-mono text-slate-600">
                  npm install @peripheral/mcp-server
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-3">📡 REST API</h3>
                <p className="text-slate-700">
                  Programmatic access to stories, signals, entities, and raw articles. Full Supabase REST API 
                  with filtering, pagination, and authentication.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section id="stack" className="mb-16 scroll-mt-24">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Technical Stack</h2>
          <div className="prose prose-slate max-w-none">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Infrastructure</h3>
                <ul className="space-y-2 text-slate-700">
                  <li>🐳 <strong>Docker</strong> — Containerized microservices</li>
                  <li>🗄️ <strong>Supabase PostgreSQL</strong> — 95K+ articles, 336K+ signals</li>
                  <li>🐰 <strong>RabbitMQ</strong> — Task queue for workers</li>
                  <li>⚡ <strong>Celery</strong> — Distributed task processing</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">AI & NLP</h3>
                <ul className="space-y-2 text-slate-700">
                  <li>🤖 <strong>OpenAI GPT-4</strong> — Summaries, entity extraction</li>
                  <li>🧠 <strong>OpenAI Embeddings</strong> — Semantic clustering</li>
                  <li>📊 <strong>LangChain</strong> — LLM orchestration</li>
                  <li>🔍 <strong>pgvector</strong> — Vector similarity search</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Data Storage</h3>
                <ul className="space-y-2 text-slate-700">
                  <li>☁️ <strong>Oracle Cloud</strong> — Media file storage</li>
                  <li>🔗 <strong>Supabase Storage</strong> — Backups & exports</li>
                  <li>📦 <strong>LanceDB</strong> — Experimental vector store</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Frontend</h3>
                <ul className="space-y-2 text-slate-700">
                  <li>⚛️ <strong>Next.js 14</strong> — React framework</li>
                  <li>🎨 <strong>Tailwind CSS</strong> — Styling</li>
                  <li>🗺️ <strong>Mapbox</strong> — Geolocation maps</li>
                  <li>📈 <strong>Recharts</strong> — Data visualization</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 pt-16 border-t border-slate-200">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-12 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Want to Build With Sentinel?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Integrate Peripheral intelligence into your tools via our MCP server or REST API
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/about"
                className="inline-block px-8 py-4 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-semibold"
              >
                Contact Us
              </Link>
              <a
                href="https://github.com/peripheralresearch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold"
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
