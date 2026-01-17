'use client'

import { useState } from 'react'
import StoriesFeed from '../components/StoriesFeed'
import Link from 'next/link'

export default function StoriesPage() {
  const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('trending')
  const [timeRange, setTimeRange] = useState(24)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white hover:text-gray-300 transition-colors">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-white">Geopolitical Stories</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    activeTab === 'trending'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Trending
                </button>
                <button
                  onClick={() => setActiveTab('latest')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    activeTab === 'latest'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Latest
                </button>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="bg-black/40 text-white border border-white/10 rounded-lg px-3 py-2 text-sm hover:border-white/30 transition-colors"
              >
                <option value={6}>Last 6 hours</option>
                <option value={12}>Last 12 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={48}>Last 48 hours</option>
                <option value={168}>Last week</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats banner */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm text-gray-300 uppercase tracking-wide">Live Updates</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Real-time geopolitical intelligence from global OSINT sources. Stories are automatically
            clustered from news articles and enriched with entity relationships.
          </p>
        </div>

        {/* Stories feed */}
        <StoriesFeed
          mode={activeTab}
          limit={activeTab === 'trending' ? 10 : 20}
          hours={timeRange}
          onStoryClick={(story) => {
            console.log('Story clicked:', story)
            // Could navigate to story detail page or open modal
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Powered by Sentinel OSINT Platform</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-gray-300 transition-colors">
                Globe View
              </Link>
              <a
                href="https://github.com/yourusername/geopolitical-mirror"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
