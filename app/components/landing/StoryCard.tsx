'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface StoryCardProps {
  title: string
  location: string | null
  sourceCount: number
  timestamp: string
  slug?: string
  mediaUrl?: string | null
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function StoryCard({ title, location, sourceCount, timestamp, slug, mediaUrl }: StoryCardProps) {
  const [imgError, setImgError] = useState(false)

  const card = (
    <div className="bg-slate-50 dark:bg-neutral-900 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      {/* Media */}
      {mediaUrl && !imgError && (
        <div className="relative w-full aspect-video bg-slate-200 dark:bg-neutral-800">
          <Image
            src={mediaUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Location Tag */}
        {location && (
          <div className="text-xs text-slate-500 dark:text-neutral-500 mb-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 line-clamp-2 flex-1">
          {title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-neutral-400">
          <span>From {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
          <span>{formatRelativeTime(timestamp)}</span>
        </div>
      </div>
    </div>
  )

  if (slug) {
    return (
      <Link href={`/stories/${slug}`} className="block">
        {card}
      </Link>
    )
  }

  return card
}
