'use client'

import { useState, useEffect } from 'react'

interface NewsItem {
  id: string
  title: string
  link: string
  osint_source: {
    name: string
  } | null
}

interface TickerEntry {
  id: string
  source: string
  title: string
  link: string
}

export default function NewsTicker() {
  const [items, setItems] = useState<TickerEntry[]>([])

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/stories/trending?limit=15&hours=72')
        const data = await res.json()

        if (data.status === 'success' && data.data?.stories) {
          const entries: TickerEntry[] = []
          for (const story of data.data.stories) {
            if (!story.newsItems) continue
            for (const item of story.newsItems as NewsItem[]) {
              if (!item.title) continue
              entries.push({
                id: item.id,
                source: item.osint_source?.name || '',
                title: item.title,
                link: item.link,
              })
            }
          }
          setItems(entries)
        }
      } catch (error) {
        console.error('Failed to fetch news:', error)
      }
    }

    fetchNews()
  }, [])

  if (items.length === 0) return null

  // Duplicate for seamless loop
  const tickerItems = [...items, ...items]

  return (
    <div className="bg-slate-900 dark:bg-neutral-950 border-b border-slate-800 dark:border-neutral-900 overflow-hidden">
      <div className="flex items-center h-9">
        {/* LIVE label */}
        <div className="flex-shrink-0 bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 h-full flex items-center z-10">
          Live
        </div>

        {/* Scrolling ticker */}
        <div className="relative overflow-hidden flex-1">
          <div className="animate-ticker flex items-center whitespace-nowrap">
            {tickerItems.map((item, i) => (
              <a
                key={`${item.id}-${i}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <span className="text-[10px] text-slate-500 uppercase font-medium whitespace-nowrap">
                  {item.source}
                </span>
                <span className="text-slate-600">|</span>
                <span>{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
