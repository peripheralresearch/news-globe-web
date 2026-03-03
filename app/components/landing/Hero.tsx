'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

function useCountUp(target: number, duration = 2300) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 5)
      setValue(Math.round(eased * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

export default function Hero() {
  const [loaded, setLoaded] = useState(false)
  const [targets, setTargets] = useState({ totalStories: 0, totalNewsItems: 0 })
  const displayStories = useCountUp(targets.totalStories)
  const displayNewsItems = useCountUp(targets.totalNewsItems)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.totalStories !== undefined) {
          setTargets({ totalStories: data.totalStories, totalNewsItems: data.totalNewsItems })
          setLoaded(true)
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
          {/* Headline */}
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-brand-ink dark:text-white">
            Evidence-first OSINT for accountability research.
          </h1>

          {/* Value prop */}
          <p className="mt-6 text-lg md:text-xl text-brand-warm-600 dark:text-brand-warm-400 max-w-3xl mx-auto leading-relaxed">
            Trace every claim to primary sources, explore relationships across fragmented coverage, and quantify uncertainty
            instead of inheriting certainty.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex justify-center px-7 py-3 bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90 transition-colors font-semibold"
            >
              Request Access
            </Link>
            <Link
              href="/sentinel-system"
              className="w-full sm:w-auto inline-flex justify-center px-7 py-3 bg-white dark:bg-transparent text-brand-ink dark:text-white border border-brand-neutral-300 dark:border-brand-neutral-600 rounded-lg hover:bg-brand-neutral-50 dark:hover:bg-white/5 transition-colors font-semibold"
            >
              How Sentinel Works
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-brand-warm-600 dark:text-brand-warm-400">
            <span className="bg-brand-yellow px-2 py-0.5">
              <span className={`inline-block transition-opacity duration-700 ${loaded ? 'opacity-100' : 'animate-pulse opacity-40'}`}>
                {loaded ? `${displayStories.toLocaleString()} stories tracked` : '\u2014\u2014\u2014 stories tracked'}
              </span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="bg-brand-yellow px-2 py-0.5">
              <span className={`inline-block transition-opacity duration-700 ${loaded ? 'opacity-100' : 'animate-pulse opacity-40'}`}>
                {loaded ? `${displayNewsItems.toLocaleString()} news items analyzed` : '\u2014\u2014\u2014 news items analyzed'}
              </span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="bg-brand-yellow px-2 py-0.5">
              Updated every 15 minutes
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
