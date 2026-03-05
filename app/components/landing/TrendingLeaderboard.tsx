'use client'

import { useEffect, useState } from 'react'

interface DailyCount {
  day: string
  count: number
}

interface TrendingEntity {
  id: number
  name: string
  type: 'location' | 'person' | 'organisation'
  total_mentions: number
  daily_counts: DailyCount[]
  trend_direction: 'rising' | 'falling' | 'stable'
  trend_percentage: number
}

interface TrendingData {
  locations: TrendingEntity[]
  persons: TrendingEntity[]
  organisations: TrendingEntity[]
}

interface MiniSparklineProps {
  data: DailyCount[]
  trend: 'rising' | 'falling' | 'stable'
}

function MiniSparkline({ data, trend }: MiniSparklineProps) {
  if (!data || data.length === 0) return null

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.count / maxCount) * 100),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Pale colors - softer versions of red and green
  const strokeColor = trend === 'rising'
    ? 'rgb(134, 239, 172)' // pale green (green-300)
    : trend === 'falling'
    ? 'rgb(252, 165, 165)' // pale red (red-300)
    : 'rgb(209, 213, 219)' // gray

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
      style={{ strokeWidth: 2 }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

interface EntityRowProps {
  entity: TrendingEntity
  rank: number
}

function EntityRow({ entity, rank }: EntityRowProps) {
  const trendColor = entity.trend_direction === 'rising'
    ? 'text-green-500'
    : entity.trend_direction === 'falling'
    ? 'text-red-500'
    : 'text-gray-400'

  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
      {/* Rank */}
      <div className="w-6 text-sm font-medium text-gray-400">
        {rank}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{entity.name}</div>
        <div className="text-xs text-gray-500">{entity.total_mentions.toLocaleString()} mentions</div>
      </div>

      {/* Sparkline */}
      <div className="w-16 h-6">
        <MiniSparkline data={entity.daily_counts} trend={entity.trend_direction} />
      </div>

      {/* Trend */}
      <div className={`text-right w-12 text-xs font-medium ${trendColor}`}>
        {entity.trend_direction === 'rising' ? '+' : entity.trend_direction === 'falling' ? '' : ''}{Math.abs(entity.trend_percentage)}%
      </div>
    </div>
  )
}

export default function TrendingLeaderboard() {
  const [data, setData] = useState<TrendingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch('/api/sentinel/trending')
        if (!response.ok) throw new Error('Failed to fetch trending data')

        const result = await response.json()
        if (result.status === 'success') {
          setData(result.data)
        } else {
          throw new Error(result.message || 'Unknown error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trending data')
        console.error('Trending data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Most Mentioned Entities</h2>
          <p className="text-sm text-gray-500 mb-6">Over the past 3 months</p>
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Most Mentioned Entities</h2>
          <p className="text-sm text-gray-500 mb-6">Over the past 3 months</p>
          <div className="text-center text-red-600">{error || 'No data available'}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Most Mentioned Entities</h2>
          <p className="text-sm text-gray-500">Over the past 3 months</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Locations */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="py-3 px-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</h3>
            </div>
            <div>
              {data.locations.map((location, index) => (
                <EntityRow key={location.id} entity={location} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Persons */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="py-3 px-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Persons</h3>
            </div>
            <div>
              {data.persons.map((person, index) => (
                <EntityRow key={person.id} entity={person} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Organizations */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="py-3 px-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Organizations</h3>
            </div>
            <div>
              {data.organisations.map((org, index) => (
                <EntityRow key={org.id} entity={org} rank={index + 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
