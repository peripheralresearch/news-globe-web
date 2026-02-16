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

const SIGNAL_TYPE_COLORS: Record<string, string> = {
  weapon_tracking: 'bg-red-500',
  alert_lifecycle: 'bg-amber-500',
  il_alert: 'bg-orange-500',
  threat_advisory: 'bg-yellow-500',
  air_defense: 'bg-blue-500',
  all_clear: 'bg-green-500',
  other: 'bg-slate-400',
}

const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
  { label: 'All', hours: 0 },
]

const PAGE_SIZE = 20

// ── Helpers ────────────────────────────────────────────────────
function signalCategory(signalType: string): string {
  if (['air_threat_track', 'air_threat_update'].includes(signalType)) return 'weapon_tracking'
  if (['air_raid_start', 'air_raid_end'].includes(signalType)) return 'alert_lifecycle'
  if (signalType.startsWith('il_')) return 'il_alert'
  if (['air_threat_advisory', 'missile_threat'].includes(signalType)) return 'threat_advisory'
  if (['air_defense_active', 'shoot_down'].includes(signalType)) return 'air_defense'
  if (['all_clear', 'partial_clear'].includes(signalType)) return 'all_clear'
  return 'other'
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function signalIcon(category: string): string {
  switch (category) {
    case 'weapon_tracking': return '\u{1F4A5}' // explosion
    case 'alert_lifecycle': return '\u{1F6A8}' // siren
    case 'il_alert': return '\u{1F534}'        // red circle
    case 'threat_advisory': return '\u26A0\uFE0F'  // warning
    case 'air_defense': return '\u{1F6E1}\uFE0F'   // shield
    case 'all_clear': return '\u2705'          // check
    default: return '\u{1F4E1}'                // satellite
  }
}

// ── Component ──────────────────────────────────────────────────
export default function SignalsDashboard() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [intensity, setIntensity] = useState<IntensityDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [timeRange, setTimeRange] = useState(24) // hours, 0 = all

  // Fetch dashboard stats
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/signals/dashboard')
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

  // Fetch signal feed
  const fetchSignals = useCallback(async (offset: number, append: boolean) => {
    if (offset === 0) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })
      if (selectedRegion) params.set('region', selectedRegion)
      if (selectedType) params.set('signal_type', selectedType)
      if (timeRange > 0) {
        const since = new Date(Date.now() - timeRange * 3600 * 1000).toISOString()
        params.set('since', since)
      }

      const res = await fetch(`/api/signals/latest?${params}`)
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
  }, [selectedRegion, selectedType, timeRange])

  // Re-fetch when filters change
  useEffect(() => {
    fetchSignals(0, false)
  }, [fetchSignals])

  // Derived data
  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const s of signals) {
      if (s.target_region) set.add(s.target_region)
    }
    return Array.from(set).sort()
  }, [signals])

  const signalCategories = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of signals) {
      const cat = signalCategory(s.signal_type)
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [signals])

  // Stats bar numbers
  const totalSignals = stats?.total ?? 0
  const last24hCount = useMemo(() => {
    return intensity
      .filter(d => {
        const dayDate = new Date(d.day)
        return dayDate >= new Date(Date.now() - 24 * 3600 * 1000)
      })
      .reduce((sum, d) => sum + Number(d.total_raw_signals), 0)
  }, [intensity])

  const topWeapon = stats?.weapons?.[0]?.weapon_type ?? 'N/A'

  // Weekly sparkline data (last 7 days from intensity)
  const sparklineData = useMemo(() => {
    const last7 = intensity.slice(-7)
    if (last7.length === 0) return []
    const maxVal = Math.max(...last7.map(d => Number(d.total_raw_signals)), 1)
    return last7.map(d => ({
      label: new Date(d.day).toLocaleDateString('en', { weekday: 'short' }),
      value: Number(d.total_raw_signals),
      pct: (Number(d.total_raw_signals) / maxVal) * 100,
    }))
  }, [intensity])

  // Top 5 weapons for horizontal bars
  const topWeapons = useMemo(() => {
    const weapons = stats?.weapons?.slice(0, 5) ?? []
    const maxCount = weapons[0]?.count ?? 1
    return weapons.map(w => ({
      ...w,
      pct: (w.count / maxCount) * 100,
    }))
  }, [stats])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Signals" value={totalSignals.toLocaleString()} />
        <StatCard label="Last 24h" value={last24hCount.toLocaleString()} />
        <StatCard label="Feed Items" value={signals.length.toString()} />
        <StatCard label="Top Weapon" value={topWeapon} small />
      </div>

      {/* ── Mini Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Weekly Sparkline */}
        <div className="border border-slate-200 dark:border-neutral-800 p-4">
          <h3 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-3">
            7-Day Trend
          </h3>
          {sparklineData.length > 0 ? (
            <div className="flex items-end gap-1 h-16">
              {sparklineData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-yellow rounded-sm transition-all"
                    style={{ height: `${Math.max(d.pct, 4)}%` }}
                    title={`${d.label}: ${d.value}`}
                  />
                  <span className="text-[9px] text-slate-400 dark:text-neutral-600">{d.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-neutral-600">No data</p>
          )}
        </div>

        {/* Top Weapons */}
        <div className="border border-slate-200 dark:border-neutral-800 p-4">
          <h3 className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider mb-3">
            Top Weapons
          </h3>
          {topWeapons.length > 0 ? (
            <div className="space-y-2">
              {topWeapons.map(w => (
                <div key={w.weapon_type} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-neutral-400 w-24 truncate" title={w.weapon_type}>
                    {w.weapon_type}
                  </span>
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-neutral-900 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-sm transition-all"
                      style={{ width: `${w.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-neutral-500 w-12 text-right">
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

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Time Range */}
        <div className="flex gap-1">
          {TIME_RANGES.map(tr => (
            <button
              key={tr.label}
              onClick={() => setTimeRange(tr.hours)}
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

        {/* Region */}
        <select
          value={selectedRegion}
          onChange={e => setSelectedRegion(e.target.value)}
          className="text-xs border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black text-slate-700 dark:text-neutral-300 px-3 py-1.5 focus:outline-none focus:border-slate-400 dark:focus:border-neutral-500"
        >
          <option value="">All Regions</option>
          {regions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Signal Type Chips */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedType('')}
            className={`px-2 py-1 text-xs border transition-colors ${
              !selectedType
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'bg-white dark:bg-black text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
            }`}
          >
            All
          </button>
          {Object.entries(signalCategories).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setSelectedType(selectedType === cat ? '' : cat)}
              className={`px-2 py-1 text-xs border transition-colors ${
                selectedType === cat
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-black text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
              }`}
            >
              {signalIcon(cat)} {SIGNAL_TYPE_LABELS[cat] ?? cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* ── Signal Feed ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-neutral-600">
          <p className="text-lg">No signals found</p>
          <p className="text-sm mt-1">Try adjusting your filters or time range</p>
        </div>
      ) : (
        <div className="space-y-2">
          {signals.map(signal => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      {/* ── Load More ── */}
      {hasMore && signals.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchSignals(signals.length, true)}
            disabled={isLoadingMore}
            className="px-6 py-2 text-sm font-medium border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-slate-400 dark:hover:border-neutral-500 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Subcomponents ──────────────────────────────────────────────

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="border border-slate-200 dark:border-neutral-800 p-4">
      <p className="text-xs font-medium text-slate-500 dark:text-neutral-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`mt-1 font-bold text-slate-900 dark:text-white ${small ? 'text-sm truncate' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const category = signalCategory(signal.signal_type)
  const icon = signalIcon(category)
  const categoryLabel = SIGNAL_TYPE_LABELS[category] ?? signal.signal_type
  const colorDot = SIGNAL_TYPE_COLORS[category] ?? 'bg-slate-400'

  return (
    <div className="flex items-start gap-3 border border-slate-200 dark:border-neutral-800 px-4 py-3 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors">
      {/* Icon + dot */}
      <div className="flex-shrink-0 mt-0.5">
        <span className="text-base" aria-hidden="true">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block w-2 h-2 rounded-full ${colorDot}`} />
          <span className="text-xs font-medium text-slate-700 dark:text-neutral-300">
            {categoryLabel}
          </span>
          <span className="text-xs text-slate-400 dark:text-neutral-600 ml-auto flex-shrink-0">
            {relativeTime(signal.published)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
          {signal.target_region && (
            <span className="font-medium text-slate-800 dark:text-neutral-200">{signal.target_region}</span>
          )}
          {signal.target_region && (signal.weapon_type || signal.alert_status) && (
            <span className="text-slate-300 dark:text-neutral-700">&middot;</span>
          )}
          {signal.weapon_type && <span>{signal.weapon_type}</span>}
          {signal.alert_status && <span>{signal.alert_status}</span>}
        </div>
        {signal.direction && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-neutral-600">
            Direction: {signal.direction}
          </p>
        )}
      </div>
    </div>
  )
}
