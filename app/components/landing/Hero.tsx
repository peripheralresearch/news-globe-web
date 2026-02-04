'use client'

import { useState, useEffect, useRef } from 'react'

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setValue(Math.round(eased * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

export default function Hero() {
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
            Open&#8209;Source Intelligence from the edge of the world—where signals surface first.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 dark:text-neutral-400">
            <span className="group/stat relative overflow-hidden px-1 py-0.5 cursor-default">
              <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/stat:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{displayStories.toLocaleString()} stories tracked</span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="group/stat relative overflow-hidden px-1 py-0.5 cursor-default">
              <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/stat:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{displayNewsItems.toLocaleString()} sources analyzed</span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="group/stat relative overflow-hidden px-1 py-0.5 cursor-default">
              <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/stat:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Updated every 15 minutes</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
