'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ThemeProvider, useTheme } from '@/app/contexts/ThemeContext'

// ISO 3166-1 alpha-3 code for Venezuela
const VENEZUELA_ISO = 'VEN'

// Bounding box for Venezuela with padding
const VENEZUELA_BOUNDS: [[number, number], [number, number]] = [
  [-75.0, -1.0], // Southwest coordinates [lng, lat]
  [-58.0, 13.5]  // Northeast coordinates [lng, lat]
]

// Elastic padding factor (how much "stretch" to allow in degrees)
const ELASTIC_PADDING = 0.7

interface VideoMarker {
  id: string
  title: string
  channelName: string
  date: string
  coordinates: [number, number]
  videoUrl: string | null
  sourceUrl: string | null
  description?: string
}

interface StoryItem {
  id: string
  created: string
  title: string
  summary?: string
}

function VenezuelaArticleContent() {
  const { theme, toggleTheme } = useTheme()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const isDragging = useRef(false)
  const isAnimating = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoMarker[]>([])
  const [stories, setStories] = useState<StoryItem[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoMarker | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [videoFitMode, setVideoFitMode] = useState<'contain' | 'cover'>('contain')
  const [pendingChanges, setPendingChanges] = useState<Map<string, [number, number]>>(new Map())
  const [isSaving, setIsSaving] = useState(false)

  // Load videos from API
  const loadVideos = useCallback(async () => {
    try {
      // Add cache-busting to ensure fresh data after position updates
      const res = await fetch('/api/ice/videos/VE', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await res.json()
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error loading videos:', error)
    }
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  // Load stories for Venezuela
  useEffect(() => {
    const loadStories = async () => {
      try {
        // Use full country name to match location lookup in the API (ilike on "Venezuela")
        const res = await fetch('/api/stories/country/venezuela?limit=200', { cache: 'no-store' })
        const data = await res.json()
        if (Array.isArray(data.stories)) {
          const episodeKeywords = ['venezuela', 'maduro', 'tanker', 'oil', 'blockade', 'naval', 'ship', 'vessel', 'seize', 'capture', 'strike', 'coast', 'fleet']
          const filtered = data.stories
            .filter((s: any) => s.created)
            .filter((s: any) => {
              const haystack = `${s.title || ''} ${s.summary || ''}`.toLowerCase()
              return episodeKeywords.some(k => haystack.includes(k))
            })
            .map((s: any) => ({
              id: s.id,
              created: s.created,
              title: s.title || '',
              summary: s.summary || ''
            }))
          setStories(filtered)
        }
      } catch (err) {
        console.error('Error loading stories:', err)
      }
    }

    loadStories()
  }, [])

  // Save all pending changes to database
  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) return

    setIsSaving(true)
    const results = []

    for (const [videoId, [lng, lat]] of Array.from(pendingChanges)) {
      try {
        const res = await fetch(`/api/video/${videoId}/position`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lng })
        })

        if (res.ok) {
          results.push({ videoId, success: true })
          // Update local state
          setVideos(prev => prev.map(v =>
            v.id === videoId
              ? { ...v, coordinates: [lng, lat] as [number, number] }
              : v
          ))
          console.log(`✅ Saved position for video ${videoId}: [${lng.toFixed(4)}, ${lat.toFixed(4)}]`)
        } else {
          results.push({ videoId, success: false })
          console.error(`❌ Failed to save position for ${videoId}`, await res.text())
        }
      } catch (error) {
        results.push({ videoId, success: false })
        console.error(`Error saving position for ${videoId}:`, error)
      }
    }

    // Clear pending changes after saving
    setPendingChanges(new Map())
    setIsSaving(false)

    const successCount = results.filter(r => r.success).length
    console.log(`Saved ${successCount}/${results.length} position changes`)

    // Refetch videos to ensure we have the latest data from the database
    // This helps catch any discrepancies and ensures consistency
    await loadVideos()
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

  // Helper functions for rubber-band effect
  const getBoundsObject = () => {
    return new mapboxgl.LngLatBounds(VENEZUELA_BOUNDS[0] as [number, number], VENEZUELA_BOUNDS[1] as [number, number])
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

  // Handle video selection
  const handleVideoClick = useCallback((video: VideoMarker) => {
    if (editMode) return // Don't play video when in edit mode

    setCurrentVideo(video)

    // Fly to video location - zoom in close
    if (map.current) {
      map.current.flyTo({
        center: video.coordinates,
        zoom: 14,
        duration: 1000
      })
    }
  }, [editMode])

  // Close video
  const handleClose = useCallback(() => {
    setCurrentVideo(null)

    // Return to overview
    if (map.current) {
      map.current.flyTo({
        center: [-66.5, 6.5],
        zoom: 4.2,
        duration: 1500
      })
    }
  }, [])

  const timelineDays = useMemo(() => {
    // Use UTC-normalized dates to avoid server/client timezone drift during hydration.
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const baseline = new Date(Date.UTC(today.getUTCFullYear(), 0, 1))

    const formatDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

    const byDay = new Map<string, { videos: VideoMarker[]; stories: StoryItem[] }>()
    let earliest: Date | null = null

    const addItem = (dateValue: string | null, type: 'video' | 'story', item: any) => {
      if (!dateValue) return
      const parsed = new Date(dateValue)
      if (Number.isNaN(parsed.getTime())) return
      const utcDate = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
      if (!earliest || utcDate < earliest) earliest = new Date(utcDate)
      const key = utcDate.toISOString().slice(0, 10)
      const existing = byDay.get(key) || { videos: [], stories: [] }
      if (type === 'video') existing.videos.push(item)
      if (type === 'story') existing.stories.push(item)
      byDay.set(key, existing)
    }

    videos.forEach(video => addItem(video.date, 'video', video))
    stories.forEach(story => addItem(story.created, 'story', story))

    const startDate = earliest ? new Date(Math.min((earliest as Date).getTime(), baseline.getTime())) : baseline

    const days: {
      key: string
      label: string
      count: number
      videoCount: number
      storyCount: number
      videos: VideoMarker[]
      stories: StoryItem[]
      date: Date
    }[] = []
    for (let d = new Date(startDate); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const dayKey = d.toISOString().slice(0, 10)
      const bucket = byDay.get(dayKey) || { videos: [], stories: [] }
      days.push({
        key: dayKey,
        label: formatDay.format(d),
        count: bucket.videos.length + bucket.stories.length,
        videoCount: bucket.videos.length,
        storyCount: bucket.stories.length,
        videos: bucket.videos,
        stories: bucket.stories,
        date: new Date(d)
      })
    }

    return days
  }, [videos, stories])

  const maxTimelineCount = useMemo(() => {
    if (timelineDays.length === 0) return 0
    return Math.max(...timelineDays.map(day => day.count))
  }, [timelineDays])

  // Add video markers to map
  useEffect(() => {
    if (!map.current || videos.length === 0) return

    // Wait for map to be loaded
    const addMarkers = () => {
      if (!map.current) return

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()

      videos.forEach(video => {
        // Skip videos without coordinates
        if (!video.coordinates || !video.coordinates[0] || !video.coordinates[1]) return

        // Create custom marker element with pin image
        const el = document.createElement('div')
        el.className = 'video-marker'
        el.dataset.videoId = video.id

        // Create image element for pin
        const img = document.createElement('img')
        // Use yellow pin if this video is currently selected, otherwise use red pin
        img.src = currentVideo?.id === video.id ? '/icons/location-pin-yellow.png' : '/icons/location-pin.png'
        img.style.cssText = `
          width: 32px;
          height: 42px;
          cursor: pointer;
        `

        el.appendChild(img)

        // Create marker with draggable option
        const marker = new mapboxgl.Marker({
          element: el,
          draggable: editMode
        })
          .setLngLat(video.coordinates)
          .addTo(map.current!)

        // Click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          if (!editMode) {
            handleVideoClick(video)
          }
        })

        // Drag end handler (only in edit mode)
        if (editMode) {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat()
            // Track the change as pending
            setPendingChanges(prev => new Map(prev).set(video.id, [lngLat.lng, lngLat.lat]))
            console.log(`📍 Pin dragged - Video ${video.id} new position: [${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}] (pending save)`)
          })
        }

        markersRef.current.set(video.id, marker)
      })
    }

    if (map.current.isStyleLoaded()) {
      addMarkers()
    } else {
      map.current.on('load', addMarkers)
    }
  }, [videos, handleVideoClick, editMode, currentVideo, setPendingChanges])

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
          center: [-66.5, 6.5], // Center on Venezuela
          zoom: 4.2, // More zoomed out to see whole country
          minZoom: 4, // Minimum zoom level
          maxZoom: 14, // Maximum zoom level
          attributionControl: false,
          cooperativeGestures: false, // Disabled to allow hover-based scroll zoom control
          scrollZoom: false, // Start with scroll zoom disabled
        })

        map.current.on('load', () => {
          if (!map.current) return

          // Add Mapbox country boundaries source
          map.current.addSource('country-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1'
          })

          // Cover all countries EXCEPT Venezuela with overlay
          map.current.addLayer({
            id: 'non-venezuela-overlay',
            type: 'fill',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['!=', ['get', 'iso_3166_1_alpha_3'], VENEZUELA_ISO],
            paint: {
              'fill-color': theme === 'dark' ? '#0a0a0a' : '#0a0a0a',
              'fill-opacity': 0.95
            }
          })

          // Add Venezuela border outline
          map.current.addLayer({
            id: 'venezuela-border',
            type: 'line',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['==', ['get', 'iso_3166_1_alpha_3'], VENEZUELA_ISO],
            paint: {
              'line-color': theme === 'dark' ? '#ffffff' : '#1a1a1a',
              'line-width': 2,
              'line-opacity': 0.9
            }
          })

          setIsLoading(false)
        })

        // Enable scroll zoom when mouse is over the map, disable when leaving
        if (mapContainer.current) {
          const enableScrollZoom = () => {
            if (map.current && !map.current.scrollZoom.isEnabled()) {
              map.current.scrollZoom.enable()
            }
          }

          const disableScrollZoom = () => {
            if (map.current && map.current.scrollZoom.isEnabled()) {
              map.current.scrollZoom.disable()
            }
          }

          mapContainer.current.addEventListener('mouseenter', enableScrollZoom)
          mapContainer.current.addEventListener('mouseleave', disableScrollZoom)

          // Cleanup event listeners on map removal
          const originalRemove = map.current?.remove.bind(map.current)
          if (map.current) {
            map.current.remove = function() {
              mapContainer.current?.removeEventListener('mouseenter', enableScrollZoom)
              mapContainer.current?.removeEventListener('mouseleave', disableScrollZoom)
              return originalRemove?.()
            }
          }
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

  // Update map layers when theme changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    try {
      if (map.current.getLayer('non-venezuela-overlay')) {
        map.current.setPaintProperty(
          'non-venezuela-overlay',
          'fill-color',
          theme === 'dark' ? '#0a0a0a' : '#0a0a0a'
        )
      }

      if (map.current.getLayer('venezuela-border')) {
        map.current.setPaintProperty(
          'venezuela-border',
          'line-color',
          theme === 'dark' ? '#ffffff' : '#1a1a1a'
        )
      }
    } catch (error) {
      console.error('Error updating map theme:', error)
    }
  }, [theme])

  const bgColor = theme === 'dark' ? '#0a0a0a' : '#f8f9fa'
  const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a'
  const mutedTextColor = theme === 'dark' ? '#9ca3af' : '#6b7280'

  return (
    <div className="min-h-screen overflow-y-auto" style={{ height: 'auto', backgroundColor: bgColor }}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Article Container */}
      <div
        className="max-w-6xl mx-auto px-6 py-12"
        style={{ fontFamily: 'var(--font-source-serif-4), "Times New Roman", serif' }}
      >

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold" style={{ color: textColor }}>
                Venezuela
              </h1>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm font-semibold text-green-500">LIVE</span>
              </div>
            </div>

            {/* Edit Mode Controls */}
            <div className="flex gap-2">
              {editMode && pendingChanges.size > 0 && (
                <button
                  onClick={saveAllChanges}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors text-green-600"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    borderColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                    borderWidth: '1px',
                    cursor: isSaving ? 'wait' : 'pointer'
                  }}
                  title="Save all position changes"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      {/* Save icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      <span>Save {pendingChanges.size} change{pendingChanges.size !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  if (editMode && pendingChanges.size > 0) {
                    if (confirm('You have unsaved changes. Discard them?')) {
                      setPendingChanges(new Map())
                      setEditMode(false)
                      if (currentVideo) setCurrentVideo(null)
                    }
                  } else {
                    setEditMode(!editMode)
                    if (currentVideo) setCurrentVideo(null)
                  }
                }}
                className="px-3 py-1.5 rounded flex items-center justify-center text-sm transition-colors"
                style={{
                  backgroundColor: theme === 'dark'
                    ? (editMode ? '#374151' : '#1f2937')
                    : (editMode ? '#e5e7eb' : '#f3f4f6'),
                  color: theme === 'dark'
                    ? (editMode ? '#e5e7eb' : '#9ca3af')
                    : (editMode ? '#1f2937' : '#6b7280')
                }}
                title={editMode ? 'Exit edit mode' : 'Edit pin positions'}
              >
                {editMode ? (
                  <>
                    {/* Close icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span className="sr-only">Cancel edit mode</span>
                  </>
                ) : (
                  <>
                    {/* Edit icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="sr-only">Enter edit mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </header>


        {/* Map + Video Section */}
        <div className="my-8">
          {/* Map Container */}
          <div className="relative h-[500px] rounded-lg overflow-hidden">
            <div
              ref={mapContainer}
              className="absolute inset-0 w-full h-full"
            />

            {/* Video Player - Overlay on right third of map */}
            {currentVideo && !editMode && (
              <div
                className="absolute right-4 top-4 bottom-4 w-1/3 backdrop-blur-sm rounded-lg shadow-2xl flex flex-col z-10"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
                }}
              >
                <div className="relative flex-1 bg-black overflow-hidden rounded-t-lg">
                <div className="absolute top-2 right-2 z-20 flex gap-2">
                  <button
                    onClick={() => setVideoFitMode(videoFitMode === 'contain' ? 'cover' : 'contain')}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                    }}
                    title={videoFitMode === 'contain' ? 'Fill screen' : 'Fit to screen'}
                  >
                    {videoFitMode === 'contain' ? '⤢' : '▣'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="text-sm transition-colors"
                    style={{
                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    ✕
                  </button>
                </div>
                {currentVideo.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    controls
                    controlsList="nodownload"
                    autoPlay
                    className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                    style={{
                      backgroundColor: '#000'
                    }}
                  />
                ) : currentVideo.sourceUrl ? (
                  <a
                    href={currentVideo.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-4 p-6 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        color: textColor
                      }}
                    >
                      ▶
                    </div>
                    <span className="text-sm" style={{ color: textColor }}>Open video source</span>
                    <span className="text-xs break-all" style={{ color: mutedTextColor }}>{currentVideo.sourceUrl}</span>
                  </a>
                ) : currentVideo.id === 'maduro-capture-fort-tiuna' ? (
                  // Special content for Maduro capture location
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>Historic Event</h3>
                    <p className="text-sm leading-relaxed px-4" style={{ color: mutedTextColor }}>
                      {currentVideo.description || 'Location where Nicolás Maduro was reportedly captured at Fort Tiuna military base.'}
                    </p>
                    <div className="mt-4 text-xs" style={{ color: mutedTextColor }}>
                      Fort Tiuna, Caracas
                    </div>
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: mutedTextColor }}>No video available</span>
                )}
              </div>
              <div
                className="p-3 border-t"
                style={{
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }}
              >
                <h3 className="text-sm font-medium truncate" style={{ color: textColor }}>
                  {currentVideo.title || 'Untitled'}
                </h3>
                <p className="text-xs mt-1" style={{ color: mutedTextColor }}>
                  {currentVideo.channelName}
                </p>
              </div>
            </div>
            )}

            {/* Vignette Effect - Gradients on all edges (dark mode only) */}
            {theme === 'dark' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Top gradient */}
                <div
                  className="absolute top-0 left-0 right-0 h-20"
                  style={{
                    background: 'linear-gradient(to bottom, #0a0a0a, transparent)'
                  }}
                />
                {/* Bottom gradient */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-20"
                  style={{
                    background: 'linear-gradient(to top, #0a0a0a, transparent)'
                  }}
                />
                {/* Left gradient */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-20"
                  style={{
                    background: 'linear-gradient(to right, #0a0a0a, transparent)'
                  }}
                />
                {/* Right gradient */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-20"
                  style={{
                    background: 'linear-gradient(to left, #0a0a0a, transparent)'
                  }}
                />
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6'
                }}
              >
                <div className="text-sm" style={{ color: mutedTextColor }}>Loading map...</div>
              </div>
            )}

            {/* Error state */}
            {mapError && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6'
                }}
              >
                <div className="text-red-500 text-sm">{mapError}</div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        {timelineDays.length > 0 && (
          <div className="mt-10">
            <div className="rounded-lg p-4 overflow-x-auto">
              <div className="relative min-w-max pb-4">
                <div
                  className="absolute left-0 right-0 bottom-0 h-px"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)'
                  }}
                />
                <div className="flex items-end gap-2">
                  {timelineDays.map((day) => {
                    const ratio = maxTimelineCount > 0 ? day.count / maxTimelineCount : 0
                    const barHeight = Math.max(8, ratio * 120)
                    const firstVideo = day.videos[0]
                    const storyRatio = maxTimelineCount > 0 ? day.storyCount / maxTimelineCount : 0
                    const videoRatio = maxTimelineCount > 0 ? day.videoCount / maxTimelineCount : 0
                    const storyHeight = Math.max(4, storyRatio * 120)
                    const videoHeight = Math.max(0, barHeight - storyHeight)

                    return (
                      <button
                        key={day.key}
                        onClick={() => firstVideo && !editMode && handleVideoClick(firstVideo)}
                        disabled={editMode || !firstVideo}
                        className="relative w-6 rounded-sm transition-colors"
                        style={{
                          height: `${barHeight}px`,
                          backgroundColor: 'transparent',
                          cursor: editMode || !firstVideo ? 'default' : 'pointer'
                        }}
                        title={`${day.label}: ${day.videoCount} video${day.videoCount !== 1 ? 's' : ''}, ${day.storyCount} stor${day.storyCount === 1 ? 'y' : 'ies'}`}
                      >
                        {/* Stories segment */}
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-sm"
                          style={{
                            height: `${storyHeight}px`,
                            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.3)'
                          }}
                        />
                        {/* Videos segment */}
                        {videoHeight > 0 && (
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-sm"
                            style={{
                              height: `${videoHeight}px`,
                              backgroundColor: theme === 'dark'
                                ? currentVideo?.id === firstVideo?.id
                                  ? '#ffffff'
                                  : 'rgba(255, 255, 255, 0.85)'
                                : currentVideo?.id === firstVideo?.id
                                  ? '#1a1a1a'
                                  : 'rgba(0, 0, 0, 0.6)'
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex min-w-max gap-2 mt-1">
                {timelineDays.map((day, idx) => (
                  <div
                    key={`${day.key}-label`}
                    className="w-6 text-[10px] text-center leading-tight"
                    style={{ color: mutedTextColor }}
                  >
                    {(idx === 0 || idx === timelineDays.length - 1 || idx % 5 === 0) ? day.label : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function VenezuelaClient() {
  return (
    <ThemeProvider>
      <VenezuelaArticleContent />
    </ThemeProvider>
  )
}
