'use client'

import { useState, useEffect, useMemo } from 'react'

interface Source {
  id: string
  name: string
  source_type: string | null
  country: { name: string; iso_alpha2: string; flag_emoji: string | null } | null
  article_count: number
}

const TYPE_LABELS: Record<string, string> = {
  rss: 'RSS',
  telegram: 'Telegram',
  simple_web: 'Web Scraper',
  manual: 'Manual',
}

export default function SourceDirectory() {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch('/api/sources')
        const data = await res.json()
        if (Array.isArray(data)) {
          setSources(data)
        }
      } catch (err) {
        console.error('Failed to fetch sources:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSources()
  }, [])

  const typeGroups = useMemo(() => {
    const groups: Record<string, number> = {}
    for (const s of sources) {
      const t = s.source_type || 'unknown'
      groups[t] = (groups[t] || 0) + 1
    }
    return groups
  }, [sources])

  const totalArticles = useMemo(
    () => sources.reduce((sum, s) => sum + s.article_count, 0),
    [sources]
  )

  const filtered = activeFilter
    ? sources.filter((s) => s.source_type === activeFilter)
    : sources

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left column — 1/3: title, subtitle, stats, filters */}
          <div className="md:w-1/3">
            <div className="md:sticky md:top-28">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Intelligence Sources
              </h1>
              <p className="mt-3 text-base text-slate-500 leading-relaxed">
                Every channel, feed, and scraper powering our OSINT pipeline — fully transparent.
              </p>

              {/* Stats */}
              {!isLoading && (
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{sources.length}</div>
                    <div className="text-sm text-slate-500">Total Sources</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {totalArticles.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">News Items Collected</div>
                  </div>
                  {Object.entries(typeGroups)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type}>
                        <div className="text-2xl font-bold text-slate-900">{count}</div>
                        <div className="text-sm text-slate-500">
                          {TYPE_LABELS[type] || type}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Filter buttons */}
              <div className="mt-8 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`px-3 py-1 text-sm font-medium border transition-colors ${
                    activeFilter === null
                      ? 'bg-brand-yellow text-black border-brand-yellow'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  All ({sources.length})
                </button>
                {Object.entries(typeGroups)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type)}
                      className={`px-3 py-1 text-sm font-medium border transition-colors ${
                        activeFilter === type
                          ? 'bg-brand-yellow text-black border-brand-yellow'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {TYPE_LABELS[type] || type} ({count})
                    </button>
                  ))}
              </div>

              {/* Request a source */}
              <a
                href="mailto:hello@theperipheral.org?subject=OSINT Source Request"
                className="mt-8 inline-block group/btn relative overflow-hidden bg-black text-white text-sm font-medium px-6 py-2.5"
              >
                <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 group-hover/btn:text-black transition-colors duration-300">Make a Request</span>
              </a>
            </div>
          </div>

          {/* Right column — 2/3: source list */}
          <div className="md:w-2/3">
            {isLoading ? (
              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="py-4 flex items-center gap-4">
                    <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-slate-200 rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No sources found.</p>
            ) : (
              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                {filtered.map((source) => (
                  <div
                    key={source.id}
                    className="group/row relative overflow-hidden py-4 px-2 flex items-center gap-4 transition-colors"
                  >
                    {/* Ink-stroke hover */}
                    <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/row:translate-x-0 transition-transform duration-300 ease-out" />

                    {/* Name */}
                    <span className="relative z-10 font-medium text-slate-900 truncate min-w-0 flex-1">
                      {source.name}
                    </span>

                    {/* Type badge — rectangular, yellow */}
                    <span className="relative z-10 flex-shrink-0 text-xs font-medium px-2 py-0.5 bg-brand-yellow text-black">
                      {TYPE_LABELS[source.source_type || ''] || source.source_type || 'Unknown'}
                    </span>

                    {/* Country */}
                    {source.country && (
                      <span className="relative z-10 flex-shrink-0 text-sm text-slate-500">
                        {source.country.flag_emoji ? `${source.country.flag_emoji} ` : ''}
                        {source.country.name}
                      </span>
                    )}

                    {/* Article count */}
                    <span className="relative z-10 flex-shrink-0 text-sm tabular-nums text-slate-400 w-24 text-right">
                      {source.article_count.toLocaleString()} news items
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
