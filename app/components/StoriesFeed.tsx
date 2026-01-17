'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Location {
  id: number
  name: string
  lat: number | null
  lon: number | null
  type: string | null
  defaultZoom?: number
  rank?: number
  confidence?: number
  isPrimary?: boolean
}

interface Person {
  id: number
  name: string
  role: string | null
  rank?: number
  confidence?: number
}

interface Organisation {
  id: number
  name: string
  type: string | null
  rank?: number
  confidence?: number
}

interface NewsItem {
  id: string
  title: string | null
  content: string | null
  summary?: string | null
  published: string
  media_url: string | null
  media_type: string | null
  link: string | null
  osint_source?: {
    id: string
    name: string
    source_type: string | null
  }
}

interface Story {
  id: string
  title: string
  description: string | null
  summary: string | null
  created: string
  updated: string
  topicKeywords: string[]
  newsItems: NewsItem[]
  entities: {
    locations: Location[]
    people: Person[]
    organisations: Organisation[]
  }
  primaryLocation: Location | null
  trendingScore?: number
  newsItemCount?: number
  entityCount?: number
}

interface StoriesFeedProps {
  mode: 'latest' | 'trending'
  limit?: number
  hours?: number
  onStoryClick?: (story: Story) => void
}

export default function StoriesFeed({
  mode = 'latest',
  limit = 20,
  hours = 24,
  onStoryClick
}: StoriesFeedProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set())
  const [expandedNewsItems, setExpandedNewsItems] = useState<Set<string>>(new Set())

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = mode === 'latest'
        ? `/api/stories/latest?limit=${limit}&hours=${hours}`
        : `/api/stories/trending?limit=${limit}&hours=${hours}`

      const response = await fetch(endpoint)
      const result = await response.json()

      if (result.status === 'success') {
        setStories(result.data.stories || [])
      } else {
        setError(result.message || 'Failed to load stories')
      }
    } catch (err) {
      console.error('Error fetching stories:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [mode, limit, hours])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  // Real-time subscription
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Subscribe to story changes
    const channel = supabase
      .channel('stories-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story'
        },
        (payload) => {
          console.log('New story detected:', payload)
          // Refetch stories when new story is added
          fetchStories()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchStories])

  const toggleStoryExpanded = (storyId: string) => {
    setExpandedStories(prev => {
      const next = new Set(prev)
      if (next.has(storyId)) {
        next.delete(storyId)
        // Also collapse all news items when collapsing the story
        setExpandedNewsItems(prevNews => {
          const nextNews = new Set(prevNews)
          stories.find(s => s.id === storyId)?.newsItems.forEach(item => {
            nextNews.delete(item.id)
          })
          return nextNews
        })
      } else {
        next.add(storyId)
      }
      return next
    })
  }

  const toggleNewsItemExpanded = (newsItemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedNewsItems(prev => {
      const next = new Set(prev)
      if (next.has(newsItemId)) {
        next.delete(newsItemId)
      } else {
        next.add(newsItemId)
      }
      return next
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-white rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-200">
        <p className="font-semibold">Error loading stories</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No stories found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => {
        const isExpanded = expandedStories.has(story.id)
        const displaySummary = story.summary || story.description || 'No summary available'
        const truncatedSummary = displaySummary.length > 200
          ? `${displaySummary.substring(0, 200)}...`
          : displaySummary

        return (
          <div
            key={story.id}
            className={`bg-black/60 backdrop-blur border rounded-lg p-4 transition-all ${
              isExpanded
                ? 'border-white/40 shadow-lg shadow-white/5'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            {/* Header - Clickable to expand/collapse story */}
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                toggleStoryExpanded(story.id)
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-lg leading-tight mb-1">
                      {story.title}
                    </h3>
                    <svg
                      className={`h-5 w-5 text-white/60 flex-shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{formatTimeAgo(story.created)}</span>
                    <span>•</span>
                    <span>{story.newsItems.length} sources</span>
                    {mode === 'trending' && story.trendingScore && (
                      <>
                        <span>•</span>
                        <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">
                          Trending {story.trendingScore.toFixed(0)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Primary location indicator */}
                {story.primaryLocation && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-400 mb-1">Location</div>
                    <div className="text-sm text-white font-medium">
                      {story.primaryLocation.name}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                {displaySummary.length > 200 && !isExpanded ? truncatedSummary : displaySummary}
              </p>
            </div>

            {/* Entities */}
            <div className="flex flex-wrap gap-2 mb-3">
              {story.entities.people.slice(0, 3).map((person) => (
                <span
                  key={person.id}
                  className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {person.name}
                </span>
              ))}
              {story.entities.organisations.slice(0, 3).map((org) => (
                <span
                  key={org.id}
                  className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  {org.name}
                </span>
              ))}
              {story.entities.locations.slice(0, 2).map((loc) => (
                <span
                  key={loc.id}
                  className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {loc.name}
                </span>
              ))}
            </div>

            {/* Keywords */}
            {story.topicKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {story.topicKeywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Expandable News Items Section */}
            {isExpanded && (
              <div className="mt-4 border-t border-white/10 pt-4 space-y-3 animate-[slideDown_0.2s_ease-out]">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  News Sources ({story.newsItems.length})
                </div>
                {story.newsItems.map((newsItem) => {
                  const isNewsExpanded = expandedNewsItems.has(newsItem.id)
                  const displayContent = newsItem.summary || newsItem.content || ''
                  const hasContent = displayContent.length > 0

                  return (
                    <div
                      key={newsItem.id}
                      className="bg-white/5 border border-white/10 rounded p-3 transition-all hover:border-white/20"
                    >
                      {/* News Item Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium leading-tight mb-1">
                            {newsItem.title || 'Untitled'}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {newsItem.osint_source && (
                              <>
                                <span className="font-medium text-gray-300">
                                  {newsItem.osint_source.name}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span>{formatTimeAgo(newsItem.published)}</span>
                            {newsItem.link && (
                              <>
                                <span>•</span>
                                <a
                                  href={newsItem.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Source
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expand/Collapse Button for News Item */}
                        {hasContent && (
                          <button
                            onClick={(e) => toggleNewsItemExpanded(newsItem.id, e)}
                            className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1"
                            aria-label={isNewsExpanded ? 'Collapse' : 'Expand'}
                          >
                            <svg
                              className={`h-4 w-4 transition-transform ${
                                isNewsExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Expandable Content */}
                      {hasContent && isNewsExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/10 animate-[slideDown_0.2s_ease-out]">
                          <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                            {displayContent}
                          </p>
                        </div>
                      )}

                      {/* Media preview for news item */}
                      {newsItem.media_url && (
                        <div className="mt-3">
                          {newsItem.media_type?.startsWith('image') ? (
                            <img
                              src={newsItem.media_url}
                              alt={newsItem.title || 'News media'}
                              className="w-full h-32 object-cover rounded border border-white/10"
                              loading="lazy"
                            />
                          ) : newsItem.media_type?.startsWith('video') ? (
                            <video
                              src={newsItem.media_url}
                              className="w-full h-32 object-cover rounded border border-white/10"
                              controls
                              preload="metadata"
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
