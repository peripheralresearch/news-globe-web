'use client'

import { useState } from 'react'

export interface TimelineEvent {
  id: string
  date: string
  time?: string
  title: string
  description: string
  type: 'incident' | 'protest' | 'statement' | 'action' | 'response'
  location?: {
    name: string
    latitude: number
    longitude: number
  }
  videoIds?: string[]
  sources?: {
    label: string
    url: string
  }[]
  imageUrl?: string
}

interface TimelineProps {
  events: TimelineEvent[]
  onEventClick?: (event: TimelineEvent) => void
  selectedEventId?: string | null
  compact?: boolean
}

const EVENT_COLORS = {
  incident: {
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    label: 'Incident'
  },
  protest: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    label: 'Protest'
  },
  statement: {
    bg: 'bg-purple-500',
    text: 'text-purple-500',
    border: 'border-purple-500',
    label: 'Statement'
  },
  action: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    label: 'Action'
  },
  response: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    label: 'Response'
  }
}

export function Timeline({ events, onEventClick, selectedEventId, compact = false }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSources, setShowSources] = useState<Record<string, boolean>>({})

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleEventClick = (event: TimelineEvent) => {
    if (expandedId === event.id) {
      setExpandedId(null)
    } else {
      setExpandedId(event.id)
    }
    onEventClick?.(event)
  }

  const toggleSources = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowSources(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }))
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/20" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => {
            const colors = EVENT_COLORS[event.type]
            const isSelected = selectedEventId === event.id
            const isExpanded = expandedId === event.id

            return (
              <div key={event.id} className="relative pl-12">
                {/* Timeline dot */}
                <div
                  className={`absolute left-4 top-2 w-4 h-4 rounded-full ${colors.bg} ${
                    isSelected ? 'ring-4 ring-white/30 scale-125' : ''
                  } transition-all duration-200 cursor-pointer`}
                  onClick={() => handleEventClick(event)}
                />

                {/* Event card */}
                <div
                  className={`bg-black/40 backdrop-blur border ${
                    isSelected ? colors.border : 'border-white/10'
                  } rounded-lg p-4 cursor-pointer hover:bg-black/60 transition-all duration-200 ${
                    isSelected ? 'shadow-lg' : ''
                  }`}
                  onClick={() => handleEventClick(event)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${colors.text}`}>
                          {colors.label}
                        </span>
                        {event.videoIds && event.videoIds.length > 0 && (
                          <span className="text-xs text-gray-400">
                            📹 {event.videoIds.length}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-sm leading-tight">
                        {event.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDate(event.date)}
                        {event.time && ` • ${event.time}`}
                      </p>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && !compact && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {event.description}
                      </p>

                      {event.location && (
                        <div className="text-xs text-gray-400">
                          📍 {event.location.name}
                        </div>
                      )}

                      {event.sources && event.sources.length > 0 && (
                        <div>
                          <button
                            onClick={(e) => toggleSources(event.id, e)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {showSources[event.id] ? '▼ Hide Sources' : '▶ Show Sources'}
                          </button>
                          {showSources[event.id] && (
                            <div className="mt-2 space-y-1">
                              {event.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  • {source.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
