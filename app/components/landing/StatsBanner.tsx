'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalStories: number
  totalNewsItems: number
  totalSources: number
  lastUpdated: string
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default function StatsBanner() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()

        if (data.totalStories !== undefined) {
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = stats
    ? [
        { label: 'Stories Tracked', value: stats.totalStories.toLocaleString() },
        { label: 'News Items Analyzed', value: stats.totalNewsItems.toLocaleString() },
        { label: 'Active Sources', value: stats.totalSources.toLocaleString() },
        { label: 'Last Updated', value: formatRelativeTime(stats.lastUpdated) },
      ]
    : []

  return (
    <section className="py-16 bg-brand-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-10 bg-brand-yellow/70 rounded mb-2 animate-pulse" />
                <div className="h-5 bg-brand-yellow/70 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statItems.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-black mb-1">
                  {item.value}
                </div>
                <div className="text-sm text-black/70">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
