'use client'

import { useEffect, useMemo, useState } from 'react'

type HomeEvent = {
  event_id: string
  title: string
  startdate?: string
  icon?: string
  volume?: number
  tags?: string
}

type OverallCounts = {
  trader_count: string
  market_count: string
  position_count: string
}

type MarketMetricsResponse = {
  data?: Array<{
    source: string
    market_count: string
    market_open_interest: number
    market_volume: number
  }>
}

function toNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function formatPct(value: number | null): string {
  if (value == null) return '—'
  const pct = Math.round(value * 1000) / 10
  return `${pct}%`
}

function formatCompactInt(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatUsdCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

function BarChart({
  title,
  items
}: {
  title: string
  items: Array<{ label: string; value: number | null }>
}) {
  const width = 900
  const height = 260
  const padding = 24
  const barGap = 6

  const cleaned = items
    .map(i => ({ ...i, value: i.value != null && Number.isFinite(i.value) ? i.value : null }))
    .slice(0, 12)

  const max = 1
  const barCount = cleaned.length
  const barWidth = barCount > 0 ? (width - padding * 2 - barGap * (barCount - 1)) / barCount : 0

  return (
    <div className="rounded-lg border border-white/10 bg-black/50 p-4">
      <div className="mb-2 text-sm text-white/80">{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.25)" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.25)" />

        {cleaned.map((item, idx) => {
          const x = padding + idx * (barWidth + barGap)
          const v = item.value == null ? 0 : Math.max(0, Math.min(max, item.value))
          const barH = (height - padding * 2) * v
          const y = height - padding - barH
          const label = item.label.length > 18 ? item.label.slice(0, 18) + '…' : item.label
          return (
            <g key={idx}>
              <rect x={x} y={y} width={barWidth} height={barH} fill="rgba(34,197,94,0.75)" />
              <title>{`${item.label}: ${item.value ?? '—'}`}</title>
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.7)">
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 text-xs text-white/50">Hover a bar for the exact value.</div>
    </div>
  )
}

export default function PolyClient() {
  const [overall, setOverall] = useState<OverallCounts | null>(null)
  const [homeEvents, setHomeEvents] = useState<HomeEvent[] | null>(null)
  const [metrics, setMetrics] = useState<MarketMetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setError(null)
        const [countsRes, eventsRes, metricsRes] = await Promise.all([
          fetch('/api/polymarket-analytics/overall-counts'),
          fetch('/api/polymarket-analytics/home-events?type=newMarkets'),
          fetch('/api/polymarket-analytics/market-metrics')
        ])

        if (!countsRes.ok) throw new Error(`overall-counts request failed (${countsRes.status})`)
        if (!eventsRes.ok) throw new Error(`home-events request failed (${eventsRes.status})`)
        if (!metricsRes.ok) throw new Error(`market-metrics request failed (${metricsRes.status})`)

        const [countsJson, eventsJson, metricsJson] = await Promise.all([
          countsRes.json(),
          eventsRes.json(),
          metricsRes.json()
        ])

        if (cancelled) return
        setOverall(countsJson)
        setHomeEvents(Array.isArray(eventsJson) ? eventsJson : [])
        setMetrics(metricsJson)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load Polymarket data')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const topVolumes = useMemo(() => {
    const items = (homeEvents || [])
      .map(e => ({ label: e.title, value: toNumber(e.volume) }))
      .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))
      .slice(0, 10)
    return items
  }, [homeEvents])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Polymarket</h1>
          <p className="mt-1 text-sm text-white/60">
            Read-only demo charts using `polymarketanalytics.com/api/...` via server-side proxy routes.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!overall && !homeEvents && !metrics && !error && (
          <div className="text-sm text-white/60">Loading…</div>
        )}

        {(overall || homeEvents || metrics) && (
          <>
            {overall && (
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/50 p-4">
                  <div className="text-xs text-white/50">Traders</div>
                  <div className="mt-1 text-xl">{formatCompactInt(Number(overall.trader_count))}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/50 p-4">
                  <div className="text-xs text-white/50">Markets</div>
                  <div className="mt-1 text-xl">{formatCompactInt(Number(overall.market_count))}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/50 p-4">
                  <div className="text-xs text-white/50">Positions</div>
                  <div className="mt-1 text-xl">{formatCompactInt(Number(overall.position_count))}</div>
                </div>
              </div>
            )}

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <BarChart title="Newest markets (top by volume)" items={topVolumes} />

              <div className="rounded-lg border border-white/10 bg-black/50 p-4">
                <div className="mb-2 text-sm text-white/80">Market metrics (by source)</div>
                <div className="space-y-2 text-sm">
                  {(metrics?.data || []).map(row => (
                    <div key={row.source} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-white/80">{row.source}</div>
                      <div className="text-xs text-white/60">
                        Vol {formatUsdCompact(row.market_volume)} · OI {formatUsdCompact(row.market_open_interest)} · Markets {formatCompactInt(Number(row.market_count))}
                      </div>
                    </div>
                  ))}
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-white/60">Raw JSON (debug)</summary>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-white/10 bg-black p-3 text-xs text-white/70">
                    {JSON.stringify({ overall, homeEvents: homeEvents?.slice(0, 25), metrics }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/50 p-4 text-xs text-white/60">
              This data is coming from `polymarketanalytics.com` (public endpoints). No API key required for these requests.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
