'use client'

import { useState, useEffect } from 'react'
import StoryCard from './StoryCard'

interface NewsItem {
  id: string
  media_url: string | null
}

interface Story {
  id: string
  title: string
  created: string
  newsItems: NewsItem[]
  primaryLocation: {
    name: string
  } | null
}

export default function LatestIntelligence() {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch('/api/stories/trending?limit=6&hours=720')
        const result = await response.json()

        if (result.status === 'success' && result.data?.stories) {
          setStories(result.data.stories)
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [])

  // Find the first media_url from a story's news items
  function getMediaUrl(story: Story): string | null {
    for (const item of story.newsItems) {
      if (item.media_url) return item.media_url
    }
    return null
  }

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-50 dark:bg-neutral-900 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 animate-pulse"
              >
                <div className="w-full aspect-video bg-slate-200 dark:bg-neutral-800" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-1/4" />
                  <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded w-full" />
                  <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-1/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                title={story.title}
                location={story.primaryLocation?.name || null}
                sourceCount={story.newsItems?.length || 0}
                timestamp={story.created}
                slug={story.id}
                mediaUrl={getMediaUrl(story)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
