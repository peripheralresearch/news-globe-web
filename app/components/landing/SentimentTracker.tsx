'use client'

import { useEffect, useState } from 'react'

interface SentimentDataPoint {
  day: string
  positive: number
  negative: number
  neutral: number
  total: number
  avg_score: number
}

interface SentimentData {
  sentiment: SentimentDataPoint[]
  stats: {
    total_days: number
    total_items: number
    avg_sentiment: string
  }
}

export default function SentimentTracker() {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSentiment() {
      try {
        const response = await fetch('/api/sentinel/sentiment')
        if (!response.ok) throw new Error('Failed to fetch sentiment data')

        const result = await response.json()
        if (result.status === 'success') {
          setData(result.data)
        } else {
          throw new Error(result.message || 'Unknown error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sentiment data')
        console.error('Sentiment data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSentiment()
  }, [])

  if (loading) {
    return (
      <section className="py-6 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Sentiment Analysis</h2>
          <p className="text-xs text-gray-500 mb-4">Over the past 3 months</p>
          <div className="text-center text-gray-500 text-sm">Loading...</div>
        </div>
      </section>
    )
  }

  if (error || !data || data.sentiment.length === 0) {
    return null
  }

  // Interpolate missing/anomalous data points (quick visual fix for dips)
  const interpolatedData = data.sentiment.map((point, i) => {
    // If total count is suspiciously low (< 200), interpolate from neighbors
    if (point.total < 200 && data.sentiment.length > 2) {
      const prev = data.sentiment[i - 1]
      const next = data.sentiment[i + 1]

      if (prev && next) {
        return {
          ...point,
          positive: Math.round((prev.positive + next.positive) / 2),
          negative: Math.round((prev.negative + next.negative) / 2),
          neutral: Math.round((prev.neutral + next.neutral) / 2),
          total: Math.round((prev.total + next.total) / 2),
        }
      }
    }
    return point
  })

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...interpolatedData.map(d => Math.max(d.positive, d.negative, d.neutral))
  )

  // Generate smooth SVG path for each sentiment line using cubic Bezier curves
  const generatePath = (dataPoints: number[]) => {
    if (dataPoints.length === 0) return ''

    const width = 100
    const height = 100
    const points = dataPoints.map((value, i) => {
      const x = (i / (dataPoints.length - 1)) * width
      const y = height - ((value / maxValue) * height)
      return { x, y }
    })

    if (points.length < 2) return `M ${points[0].x} ${points[0].y}`

    // Create smooth curve using cubic Bezier curves
    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      // Calculate control points for smooth curve
      const controlPointX = current.x + (next.x - current.x) / 2
      const controlPointY1 = current.y
      const controlPointY2 = next.y

      path += ` C ${controlPointX} ${controlPointY1}, ${controlPointX} ${controlPointY2}, ${next.x} ${next.y}`
    }

    return path
  }

  const positivePath = generatePath(interpolatedData.map(d => d.positive))
  const negativePath = generatePath(interpolatedData.map(d => d.negative))
  const neutralPath = generatePath(interpolatedData.map(d => d.neutral))

  return (
    <section className="py-6 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Sentiment Analysis</h2>
          <p className="text-xs text-gray-500">Over the past 3 months</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* Legend and Stats Combined */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">Positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Negative</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-600">Neutral</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{data.stats.total_items.toLocaleString()} items</span>
              <span>Avg: {data.stats.avg_sentiment}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-32">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {/* Grid lines */}
              <line x1="0" y1="33" x2="100" y2="33" stroke="#e5e7eb" strokeWidth="0.2" />
              <line x1="0" y1="66" x2="100" y2="66" stroke="#e5e7eb" strokeWidth="0.2" />

              {/* Sentiment lines */}
              <path
                d={positivePath}
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={negativePath}
                fill="none"
                stroke="rgb(239, 68, 68)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={neutralPath}
                fill="none"
                stroke="rgb(156, 163, 175)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
