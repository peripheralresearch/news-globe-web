'use client'

import Link from 'next/link'
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
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
            Evidence-first intelligence from global conflicts. Structured, verified, source-linked.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/map"
              className="inline-block bg-blue-600 dark:bg-blue-400 text-white dark:text-black font-medium px-8 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-300 transition-colors"
            >
              Explore Latest Intelligence
            </Link>
            <Link
              href="#"
              className="inline-block border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white font-medium px-8 py-3 rounded-full hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors"
            >
              Developer Tools
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 dark:text-neutral-400">
            <span>{stats.totalStories.toLocaleString()} stories tracked</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{stats.totalNewsItems.toLocaleString()} sources analyzed</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Updated every 15 minutes</span>
          </div>
        </div>
      </div>
    </section>
  )
}
