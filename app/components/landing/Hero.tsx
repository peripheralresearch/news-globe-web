'use client'

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
          {/* Subheading */}
          <p className="text-lg md:text-xl text-brand-warm-600 dark:text-brand-warm-400 mb-10 max-w-2xl mx-auto">
            Open&#8209;Source Intelligence from the edge of the world—where signals surface first.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-brand-warm-600 dark:text-brand-warm-400">
            <span className="bg-brand-yellow px-2 py-0.5">
              <span className={`inline-block transition-opacity duration-700 ${loaded ? 'opacity-100' : 'animate-pulse opacity-40'}`}>
                {loaded ? `${displayStories.toLocaleString()} stories tracked` : '\u2014\u2014\u2014 stories tracked'}
              </span>
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="bg-brand-yellow px-2 py-0.5">
              <span className={`inline-block transition-opacity duration-700 ${loaded ? 'opacity-100' : 'animate-pulse opacity-40'}`}>
                {loaded ? `${displayNewsItems.toLocaleString()} sources analyzed` : '\u2014\u2014\u2014 sources analyzed'}
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
