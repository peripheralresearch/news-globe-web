'use client'

import { useState, useEffect } from 'react'

export default function Hero() {
  const [stats, setStats] = useState({ totalStories: 0, totalNewsItems: 0 })

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.totalStories !== undefined) {
          setStats({ totalStories: data.totalStories, totalNewsItems: data.totalNewsItems })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchStats()
  }, [])

  return (
    <section className="pt-0 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
            Evidence-first intelligence from global conflicts. Structured, verified, source-linked.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 dark:text-neutral-400">
            <span className="group/stat relative overflow-hidden px-1 py-0.5 cursor-default">
              <span className="absolute inset-0 bg-yellow-300 -translate-x-full group-hover/stat:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{stats.totalStories.toLocaleString()} stories tracked</span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="group/stat relative overflow-hidden px-1 py-0.5 cursor-default">
              <span className="absolute inset-0 bg-yellow-300 -translate-x-full group-hover/stat:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{stats.totalNewsItems.toLocaleString()} sources analyzed</span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="group/stat relative overflow-hidden px-1 py-0.5 cursor-default">
              <span className="absolute inset-0 bg-yellow-300 -translate-x-full group-hover/stat:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Updated every 15 minutes</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
