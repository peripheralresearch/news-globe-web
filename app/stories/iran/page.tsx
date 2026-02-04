'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// ISO 3166-1 alpha-3 code for Iran
const IRAN_ISO = 'IRN'

// Bounding box for Iran with expanded padding
const IRAN_BOUNDS: [[number, number], [number, number]] = [
  [37.1, 17.2], // Southwest coordinates [lng, lat]
  [72.0, 47.3]  // Northeast coordinates [lng, lat] - adjusted
]

// Elastic padding factor (how much "stretch" to allow in degrees)
const ELASTIC_PADDING = 0.7 // Further reduced for even tighter boundaries

export default function IranArticlePage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const isDragging = useRef(false)
  const isAnimating = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [stories, setStories] = useState<any[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set())

  // Helper functions for rubber-band effect
  const getBoundsObject = () => {
    return new mapboxgl.LngLatBounds(IRAN_BOUNDS[0] as [number, number], IRAN_BOUNDS[1] as [number, number])
  }

  const isWithinElasticBounds = (lng: number, lat: number): boolean => {
    const bounds = getBoundsObject()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    return (
      lng >= sw.lng - ELASTIC_PADDING &&
      lng <= ne.lng + ELASTIC_PADDING &&
      lat >= sw.lat - ELASTIC_PADDING &&
      lat <= ne.lat + ELASTIC_PADDING
    )
  }

  const constrainToBounds = (lng: number, lat: number): [number, number] => {
    const bounds = getBoundsObject()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    return [
      Math.max(sw.lng, Math.min(ne.lng, lng)),
      Math.max(sw.lat, Math.min(ne.lat, lat))
    ]
  }

  const handleDragEnd = () => {
    if (!map.current || isAnimating.current) return

    const center = map.current.getCenter()
    const bounds = getBoundsObject()

    // Check if center is outside the actual bounds
    if (!bounds.contains(center)) {
      const [constrainedLng, constrainedLat] = constrainToBounds(center.lng, center.lat)

      isAnimating.current = true

      // Animate back to constrained position with spring-like easing
      map.current.easeTo({
        center: [constrainedLng, constrainedLat],
        duration: 500,
        easing: (t) => {
          // Cubic ease-out for smooth deceleration
          return 1 - Math.pow(1 - t, 3)
        }
      })

      setTimeout(() => {
        isAnimating.current = false
      }, 500)
    }

    isDragging.current = false
  }

  // Override global overflow: hidden to enable page scrolling
  useEffect(() => {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'auto'

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  // Helper function to format time ago
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

  // Helper function to detect media type from URL when media_type is null
  const getMediaType = (url: string, mediaType: string | null): 'image' | 'video' | 'unknown' => {
    // If media_type is provided, use it
    if (mediaType) {
      if (mediaType.startsWith('image')) return 'image'
      if (mediaType.startsWith('video')) return 'video'
    }

    // Fallback: detect from URL extension
    const urlLower = url.toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']

    if (imageExtensions.some(ext => urlLower.includes(ext))) return 'image'
    if (videoExtensions.some(ext => urlLower.includes(ext))) return 'video'

    // Default to image for unknown types (most common case)
    return 'image'
  }

  // Toggle story expanded state
  const toggleStoryExpanded = (storyId: string) => {
    setExpandedStories(prev => {
      const next = new Set(prev)
      if (next.has(storyId)) {
        next.delete(storyId)
      } else {
        next.add(storyId)
      }
      return next
    })
  }

  // Fetch Iran-related stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/stories/country/Iran?limit=20')
        const data = await response.json()
        setStories(data.stories || [])
      } catch (error) {
        console.error('Error fetching Iran stories:', error)
      } finally {
        setStoriesLoading(false)
      }
    }

    fetchStories()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    const initMap = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) {
          setMapError('Mapbox token not configured')
          setIsLoading(false)
          return
        }

        mapboxgl.accessToken = token

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [53.688, 32.428], // Center on Iran
          zoom: 4.8, // Zoomed out to show full country territory
          minZoom: 4, // Minimum zoom level
          maxZoom: 10, // Maximum zoom level
          attributionControl: false,
        })

        map.current.on('load', () => {
          if (!map.current) return

          // Remove canvas from tab order to prevent focus lock
          mapContainer.current?.querySelector('canvas')?.setAttribute('tabindex', '-1')

          // Add Mapbox country boundaries source
          map.current.addSource('country-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1'
          })

          // Cover all countries EXCEPT Iran with dark overlay
          map.current.addLayer({
            id: 'non-iran-dark-overlay',
            type: 'fill',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['!=', ['get', 'iso_3166_1_alpha_3'], IRAN_ISO],
            paint: {
              'fill-color': '#0a0a0a',
              'fill-opacity': 0.95
            }
          })

          // Add Iran border outline
          map.current.addLayer({
            id: 'iran-border',
            type: 'line',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['==', ['get', 'iso_3166_1_alpha_3'], IRAN_ISO],
            paint: {
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.9
            }
          })

          setIsLoading(false)
        })

        // Enable scroll zoom when mouse is over the map
        const mapElement = mapContainer.current
        if (mapElement) {
          mapElement.addEventListener('mouseenter', () => {
            if (map.current) {
              map.current.scrollZoom.enable()
            }
          })

          mapElement.addEventListener('mouseleave', () => {
            if (map.current) {
              map.current.scrollZoom.disable()
            }
          })
        }

        // Rubber-band effect event handlers
        map.current.on('dragstart', () => {
          isDragging.current = true
        })

        map.current.on('drag', () => {
          if (!map.current) return

          const center = map.current.getCenter()

          // If outside elastic bounds, apply damping/resistance
          if (!isWithinElasticBounds(center.lng, center.lat)) {
            const [constrainedLng, constrainedLat] = constrainToBounds(center.lng, center.lat)

            // Calculate overpan amount
            const overpanLng = center.lng - constrainedLng
            const overpanLat = center.lat - constrainedLat

            // Apply damping factor (reduce overpan movement)
            const dampingFactor = 0.3

            map.current.setCenter([
              constrainedLng + overpanLng * dampingFactor,
              constrainedLat + overpanLat * dampingFactor
            ])
          }
        })

        map.current.on('dragend', handleDragEnd)

        // Handle moveend for inertial panning
        map.current.on('moveend', (e: any) => {
          if (!isDragging.current && e.originalEvent) {
            handleDragEnd()
          }
        })

        map.current.on('error', (e) => {
          console.error('Map error:', e)
          setMapError('Failed to load map')
          setIsLoading(false)
        })

      } catch (error) {
        console.error('Error initializing map:', error)
        setMapError(error instanceof Error ? error.message : 'Failed to initialize map')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-y-auto" style={{ height: 'auto' }}>
      {/* Article Container */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Iran
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-semibold text-green-600">LIVE</span>
            </div>
          </div>
        </header>

        {/* Map Section */}
        <div className="my-8">
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <div
              ref={mapContainer}
              className="absolute inset-0 w-full h-full"
            />

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-gray-600 text-sm">Loading map...</div>
              </div>
            )}

            {/* Error state */}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-red-600 text-sm">{mapError}</div>
              </div>
            )}
          </div>

        </div>

        {/* Stories Section */}
        <div className="my-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Related Stories</h2>

          {storiesLoading ? (
            <div className="text-gray-600 text-sm">Loading stories...</div>
          ) : stories.length === 0 ? (
            <div className="text-gray-600 text-sm">No stories found</div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => {
                const isExpanded = expandedStories.has(story.id)
                const newsItems = story.newsItems || []
                const firstMediaUrl = newsItems.find((item: any) => item.media_url)?.media_url
                const firstMediaType = newsItems.find((item: any) => item.media_url)?.media_type

                return (
                  <div
                    key={story.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isExpanded
                        ? 'border-gray-300 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Story Header - Clickable */}
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleStoryExpanded(story.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        {firstMediaUrl && (
                          <div className="flex-shrink-0 w-24 h-24">
                            {getMediaType(firstMediaUrl, firstMediaType) === 'image' ? (
                              <img
                                src={firstMediaUrl}
                                alt={story.title}
                                className="w-full h-full object-cover rounded border border-gray-200"
                                loading="lazy"
                                onError={(e) => {
                                  // Hide broken images
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : getMediaType(firstMediaUrl, firstMediaType) === 'video' ? (
                              <video
                                src={firstMediaUrl}
                                className="w-full h-full object-cover rounded border border-gray-200"
                                muted
                                preload="metadata"
                                onError={(e) => {
                                  // Hide broken videos
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : null}
                          </div>
                        )}

                        {/* Story Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                              {story.title}
                            </h3>
                            <svg
                              className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {story.summary && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{story.summary}</p>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{formatTimeAgo(story.created)}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                              {newsItems.length} {newsItems.length === 1 ? 'source' : 'sources'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable News Items */}
                    {isExpanded && newsItems.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-slideDown">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                          News Sources ({newsItems.length})
                        </div>
                        {newsItems.map((newsItem: any) => (
                          <div
                            key={newsItem.id}
                            className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {/* News Item Thumbnail */}
                              {newsItem.media_url && (
                                <div className="flex-shrink-0 w-20 h-20">
                                  {getMediaType(newsItem.media_url, newsItem.media_type) === 'image' ? (
                                    <img
                                      src={newsItem.media_url}
                                      alt={newsItem.title || 'News media'}
                                      className="w-full h-full object-cover rounded border border-gray-200"
                                      loading="lazy"
                                      onError={(e) => {
                                        // Hide broken images
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : getMediaType(newsItem.media_url, newsItem.media_type) === 'video' ? (
                                    <video
                                      src={newsItem.media_url}
                                      className="w-full h-full object-cover rounded border border-gray-200"
                                      muted
                                      preload="metadata"
                                      onError={(e) => {
                                        // Hide broken videos
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : null}
                                </div>
                              )}

                              {/* News Item Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-gray-900 text-sm font-medium leading-tight mb-1">
                                  {newsItem.title || 'Untitled'}
                                </h4>
                                {newsItem.content && (
                                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                                    {newsItem.content}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {newsItem.osint_source && (
                                    <>
                                      <span className="font-medium text-gray-600">
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
                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        View Source
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
