'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────────

interface Signal {
  id: string
  published: string
  signal_type: string
  weapon_type: string | null
  target_location: string | null
  target_region: string | null
  direction: string | null
  alert_type: string | null
  alert_status: string | null
  lat: number | null
  lon: number | null
}

interface DashboardStats {
  total: number
  firstDate: string | null
  lastDate: string | null
  weapons: { weapon_type: string; count: number }[]
  frequency: { date: string; count: number }[]
}

interface IntensityDay {
  day: string
  intensity_score: number
  total_raw_signals: number
}

// ── Constants ──────────────────────────────────────────────────

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  weapon_tracking: 'Weapon Tracking',
  alert_lifecycle: 'Alert Lifecycle',
  il_alert: 'Israel Alert',
  threat_advisory: 'Threat Advisory',
  air_defense: 'Air Defense',
  all_clear: 'All Clear',
  other: 'Other',
}

// Category color scheme — bg-[color]/10 tint with matching text color.
// Used for card icon badge and sidebar filter chips.
const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  weapon_tracking: { badge: 'bg-red-500/10 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  alert_lifecycle: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  il_alert:        { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',   dot: 'bg-blue-500'  },
  threat_advisory: { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  air_defense:     { badge: 'bg-green-500/10 text-green-600 dark:text-green-400',  dot: 'bg-green-500' },
  all_clear:       { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  other:           { badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',  dot: 'bg-slate-400' },
}

const TIME_RANGES = [
  { label: '1h',  hours: 1   },
  { label: '24h', hours: 24  },
  { label: '7d',  hours: 168 },
  { label: '30d', hours: 720 },
  { label: 'All', hours: 0   },
]

const PAGE_SIZE = 20

// ── Helpers ────────────────────────────────────────────────────

// Maps raw signal_type strings to one of seven display categories.
// Single source of truth for client-side classification.
function signalCategory(signalType: string): string {
  if (['air_threat_track', 'air_threat_update'].includes(signalType)) return 'weapon_tracking'
  if (['air_raid_start', 'air_raid_end'].includes(signalType))         return 'alert_lifecycle'
  if (signalType.startsWith('il_'))                                     return 'il_alert'
  if (['air_threat_advisory', 'missile_threat'].includes(signalType))   return 'threat_advisory'
  if (['air_defense_active', 'shoot_down'].includes(signalType))        return 'air_defense'
  if (['all_clear', 'partial_clear'].includes(signalType))              return 'all_clear'
  return 'other'
}

function relativeTime(dateStr: string): string {
  const now  = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return 'Unknown'
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60)  return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)   return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function signalIcon(category: string): string {
  switch (category) {
    case 'weapon_tracking': return '\u{1F4A5}'      // explosion
    case 'alert_lifecycle': return '\u{1F6A8}'      // siren
    case 'il_alert':        return '\u{1F534}'      // red circle
    case 'threat_advisory': return '\u26A0\uFE0F'   // warning
    case 'air_defense':     return '\u{1F6E1}\uFE0F'// shield
    case 'all_clear':       return '\u2705'         // check
    default:                return '\u{1F4E1}'      // satellite
  }
}

// Formats a signal_type string for display: underscores to spaces, title case.
function formatSignalType(signalType: string): string {
  return signalType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ── Skeleton loader ─────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="border border-slate-200 dark:border-neutral-800 px-4 py-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded bg-slate-200 dark:bg-neutral-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-neutral-800" />
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-neutral-800 ml-auto" />
          </div>
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-neutral-800" />
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  )
}

// ── StatCard ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  small = false,
  accent = false,
}: {
  label: string
  value: string
  small?: boolean
  accent?: boolean
}) {
  return (
    <div className="border border-slate-200 dark:border-neutral-800 p-4">
      <p className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`mt-1 font-bold text-slate-900 dark:text-white ${
          small ? 'text-sm truncate' : 'text-2xl'
        } ${accent ? 'text-brand-yellow' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

// ── SignalCard ──────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const category      = signalCategory(signal.signal_type)
  const icon          = signalIcon(category)
  const categoryLabel = SIGNAL_TYPE_LABELS[category] ?? formatSignalType(signal.signal_type)
  const styles        = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other
  const location      = signal.target_location || signal.target_region || null
  const detail        = signal.weapon_type || signal.alert_status || null
  const signalLabel   = formatSignalType(signal.signal_type)

  return (
    <article
      className="flex items-start gap-3 border border-slate-200 dark:border-neutral-800 px-4 py-3
                 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
      aria-label={`${categoryLabel} signal${location ? ` in ${location}` : ''}`}
    >
      {/* Category badge / icon */}
      <div className="flex-shrink-0 mt-0.5">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded text-sm ${styles.badge}`}
          aria-hidden="true"
          title={categoryLabel}
        >
          {icon}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top row: signal label + relative time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${styles.badge}`}>
            {signalLabel}
          </span>
          <time
            dateTime={signal.published}
            className="text-xs text-slate-400 dark:text-neutral-600 ml-auto flex-shrink-0 tabular-nums"
          >
            {relativeTime(signal.published)}
          </time>
        </div>

        {/* Location */}
        {location && (
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-neutral-200 truncate">
            {location}
          </p>
        )}

        {/* Detail line: weapon type or alert status */}
        {detail && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
            {signal.weapon_type ? `Weapon: ${signal.weapon_type}` : `Status: ${signal.alert_status}`}
          </p>
        )}

        {/* Direction (Ukrainian signals) */}
        {signal.direction && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-neutral-600">
            Direction: {signal.direction}
          </p>
        )}

        {/* View Original — gated, greyed out */}
        <div className="mt-2">
          <button
            type="button"
            disabled
            aria-label="View original source — requires access"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-600
                       cursor-not-allowed select-none"
          >
            {/* Lock icon */}
            <svg
              className="w-3 h-3 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            View Original
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────

export default function SignalsDashboard() {
  const [signals,       setSignals]       = useState<Signal[]>([])
  const [stats,         setStats]         = useState<DashboardStats | null>(null)
  const [intensity,     setIntensity]     = useState<IntensityDay[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore,       setHasMore]       = useState(true)

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedType,   setSelectedType]   = useState<string>('')
  const [timeRange,      setTimeRange]      = useState(24)   // hours; 0 = all
  const [regionInput,    setRegionInput]    = useState<string>('')

  // Fetch dashboard stats (once on mount)
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res  = await fetch('/api/signals/dashboard')
        const json = await res.json()
        if (json.status === 'success') {
          setStats(json.data.stats)
          setIntensity(json.data.intensity || [])
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err)
      }
    }
    fetchDashboard()
  }, [])

  // Fetch signal feed — refetches whenever filters change
  const fetchSignals = useCallback(
    async (offset: number, append: boolean) => {
      if (offset === 0) setIsLoading(true)
      else              setIsLoadingMore(true)

      try {
        const params = new URLSearchParams({
          limit:  String(PAGE_SIZE),
          offset: String(offset),
        })
        if (selectedRegion) params.set('region',   selectedRegion)
        if (selectedType)   params.set('category', selectedType)
        if (timeRange > 0) {
          const since = new Date(Date.now() - timeRange * 3600 * 1000).toISOString()
          params.set('since', since)
        }

        const res  = await fetch(`/api/signals/latest?${params}`)
        const json = await res.json()

        if (json.status === 'success') {
          const newSignals = json.data as Signal[]
          setSignals(prev => append ? [...prev, ...newSignals] : newSignals)
          setHasMore(newSignals.length === PAGE_SIZE)
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [selectedRegion, selectedType, timeRange],
  )

  // Re-fetch when filters change
  useEffect(() => {
    fetchSignals(0, false)
  }, [fetchSignals])

  // Derived: unique regions from loaded signals for dropdown
  const regionOptions = useMemo(() => {
    const set = new Set<string>()
    for (const s of signals) {
      if (s.target_region) set.add(s.target_region)
    }
    return Array.from(set).sort()
  }, [signals])

  // Derived: category counts for filter chips
  const signalCategoryCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of signals) {
      const cat = signalCategory(s.signal_type)
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [signals])

  // Stats bar values
  const totalSignals = stats?.total ?? 0

  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600 * 1000
    return intensity
      .filter(d => new Date(d.day).getTime() >= cutoff)
      .reduce((sum, d) => sum + Number(d.total_raw_signals), 0)
  }, [intensity])

  const topWeapon = stats?.weapons?.[0]?.weapon_type ?? 'N/A'

  const freshness = stats?.lastDate
    ? relativeTime(stats.lastDate)
    : 'Unknown'

  // Weekly sparkline
  const sparklineData = useMemo(() => {
    const last7  = intensity.slice(-7)
    if (last7.length === 0) return []
    const maxVal = Math.max(...last7.map(d => Number(d.total_raw_signals)), 1)
    return last7.map(d => ({
      label: new Date(d.day).toLocaleDateString('en', { weekday: 'short' }),
      value: Number(d.total_raw_signals),
      pct:   (Number(d.total_raw_signals) / maxVal) * 100,
    }))
  }, [intensity])

  // Top 5 weapons for horizontal bars
  const topWeapons = useMemo(() => {
    const weapons  = stats?.weapons?.slice(0, 5) ?? []
    const maxCount = weapons[0]?.count ?? 1
    return weapons.map(w => ({ ...w, pct: (w.count / maxCount) * 100 }))
  }, [stats])

  // Region text-filter handler (committed on Enter or blur)
  function commitRegionFilter(value: string) {
    setSelectedRegion(value.trim())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Signal Intelligence
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-500">
          Real-time military alerts from Ukraine and Israel.
          Data sourced from official government broadcast channels.
        </p>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Signals"   value={totalSignals.toLocaleString()} />
        <StatCard label="Last 24h"        value={last24hCount.toLocaleString()} />
        <StatCard label="Top Weapon"      value={topWeapon} small />
        <StatCard label="Last Signal"     value={freshness} small />
      </div>

      {/* ── Mini Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* 7-Day Sparkline */}
        <div className="border border-slate-200 dark:border-neutral-800 p-4">
          <h2 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-3">
            7-Day Trend
          </h2>
          {sparklineData.length > 0 ? (
            <div className="flex items-end gap-1 h-16" role="img" aria-label="7-day signal trend bar chart">
              {sparklineData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-yellow rounded-sm transition-all"
                    style={{ height: `${Math.max(d.pct, 4)}%` }}
                    title={`${d.label}: ${d.value} signals`}
                  />
                  <span className="text-[9px] text-slate-400 dark:text-neutral-600 select-none">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-neutral-600">No data</p>
          )}
        </div>

        {/* Top Weapons */}
        <div className="border border-slate-200 dark:border-neutral-800 p-4">
          <h2 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-3">
            Top Weapon Types
          </h2>
          {topWeapons.length > 0 ? (
            <div className="space-y-2">
              {topWeapons.map(w => (
                <div key={w.weapon_type} className="flex items-center gap-2">
                  <span
                    className="text-xs text-slate-600 dark:text-neutral-400 w-28 truncate"
                    title={w.weapon_type}
                  >
                    {w.weapon_type}
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-neutral-900 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-sm transition-all"
                      style={{ width: `${w.pct}%` }}
                      role="presentation"
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-neutral-500 w-12 text-right tabular-nums">
                    {w.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-neutral-600">No data</p>
          )}
        </div>
      </div>

      {/* ── Body: Sidebar + Feed ── */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">

        {/* Sidebar (desktop) / Collapsed controls (mobile) */}
        <aside className="mb-6 md:mb-0">
          <div className="md:sticky md:top-24 space-y-6">

            {/* Time Range */}
            <div>
              <h2 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Time Range
              </h2>
              <div className="flex flex-wrap gap-1">
                {TIME_RANGES.map(tr => (
                  <button
                    key={tr.label}
                    onClick={() => setTimeRange(tr.hours)}
                    aria-pressed={timeRange === tr.hours}
                    className={`px-3 py-1 text-xs font-medium border transition-colors ${
                      timeRange === tr.hours
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-black text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <h2 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Region
              </h2>
              {/* Text input for freeform filter */}
              <input
                type="text"
                value={regionInput}
                onChange={e => setRegionInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRegionFilter(regionInput)
                }}
                onBlur={() => commitRegionFilter(regionInput)}
                placeholder="Filter by region..."
                aria-label="Filter by region"
                className="w-full text-xs border border-slate-200 dark:border-neutral-700
                           bg-white dark:bg-black text-slate-700 dark:text-neutral-300
                           px-3 py-1.5 focus:outline-none focus:border-slate-400
                           dark:focus:border-neutral-500 placeholder:text-slate-400 dark:placeholder:text-neutral-600"
              />
              {/* Quick-select from loaded regions */}
              {regionOptions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedRegion(''); setRegionInput('') }}
                    className={`px-2 py-0.5 text-[10px] border transition-colors ${
                      !selectedRegion
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                        : 'bg-white dark:bg-black text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-700'
                    }`}
                  >
                    All
                  </button>
                  {regionOptions.map(r => (
                    <button
                      key={r}
                      onClick={() => { setSelectedRegion(r); setRegionInput(r) }}
                      className={`px-2 py-0.5 text-[10px] border transition-colors ${
                        selectedRegion === r
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                          : 'bg-white dark:bg-black text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Signal Type Filter */}
            <div>
              <h2 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Signal Type
              </h2>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedType('')}
                  aria-pressed={!selectedType}
                  className={`text-left px-2 py-1 text-xs border transition-colors ${
                    !selectedType
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                      : 'bg-white dark:bg-black text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500'
                  }`}
                >
                  All Types
                </button>
                {Object.entries(signalCategoryCount).map(([cat, count]) => {
                  const styles = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.other
                  const isActive = selectedType === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedType(isActive ? '' : cat)}
                      aria-pressed={isActive}
                      className={`text-left px-2 py-1 text-xs border transition-colors flex items-center gap-2 ${
                        isActive
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                          : 'bg-white dark:bg-black text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white dark:bg-black' : styles.dot}`} />
                      <span className="flex-1 truncate">{SIGNAL_TYPE_LABELS[cat] ?? cat}</span>
                      <span className="ml-auto tabular-nums text-[10px] opacity-70">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active filter summary */}
            {(selectedRegion || selectedType || timeRange !== 24) && (
              <button
                onClick={() => {
                  setSelectedRegion('')
                  setSelectedType('')
                  setRegionInput('')
                  setTimeRange(24)
                }}
                className="text-xs text-slate-400 dark:text-neutral-600 underline hover:text-slate-600 dark:hover:text-neutral-400 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Feed */}
        <section aria-label="Signal feed">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-16 border border-slate-200 dark:border-neutral-800">
              <p className="text-slate-600 dark:text-neutral-400 font-medium">No signals found</p>
              <p className="text-sm mt-1 text-slate-400 dark:text-neutral-600">
                Try adjusting your time range or clearing the region filter.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {signals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => fetchSignals(signals.length, true)}
                    disabled={isLoadingMore}
                    className="px-8 py-2 text-sm font-medium border border-slate-200 dark:border-neutral-700
                               text-slate-600 dark:text-neutral-400
                               hover:border-slate-400 dark:hover:border-neutral-500
                               hover:text-slate-900 dark:hover:text-white
                               transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? 'Loading\u2026' : 'Load More'}
                  </button>
                </div>
              )}

              {!hasMore && signals.length > 0 && (
                <p className="pt-6 text-center text-xs text-slate-400 dark:text-neutral-600">
                  All signals loaded &mdash; {signals.length.toLocaleString()} total
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
