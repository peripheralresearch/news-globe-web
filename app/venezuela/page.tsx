'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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

export default function VenezuelaArticlePage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const isDragging = useRef(false)
  const isAnimating = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoMarker[]>([])
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

  // Save all pending changes to database
  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) return

    setIsSaving(true)
    const results = []

    for (const [videoId, [lng, lat]] of pendingChanges) {
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
        img.src = '/icons/pin.png'
        img.style.cssText = `
          width: 24px;
          height: 32px;
          cursor: pointer;
          filter: ${currentVideo?.id === video.id ? 'brightness(0) saturate(100%) invert(35%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(104%) contrast(97%)' : 'none'};
          transition: filter 0.2s ease;
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
          style: 'mapbox://styles/mapbox/satellite-v9',
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

          // Hide all text layers to remove labels and POI markers
          map.current.getStyle().layers.forEach((layer) => {
            if (layer.type === 'symbol') {
              map.current?.setLayerVisibility(layer.id, 'none')
            }
          })

          // Add Mapbox country boundaries source
          map.current.addSource('country-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1'
          })

          // Cover all countries EXCEPT Venezuela with dark overlay
          map.current.addLayer({
            id: 'non-venezuela-dark-overlay',
            type: 'fill',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['!=', ['get', 'iso_3166_1_alpha_3'], VENEZUELA_ISO],
            paint: {
              'fill-color': '#0a0a0a',
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
              'line-color': '#ffffff',
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

  return (
    <div className="min-h-screen overflow-y-auto" style={{ height: 'auto', backgroundColor: '#0a0a0a' }}>
      {/* Article Container */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white">
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
                  className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors ${
                    isSaving
                      ? 'bg-green-500/20 text-green-400 cursor-wait'
                      : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}
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
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors ${
                  editMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                }`}
                title={editMode ? 'Exit edit mode' : 'Edit pin positions'}
              >
                {editMode ? (
                  <>
                    {/* Close icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    {/* Edit icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {videos.length > 0 && (
            <p className="text-gray-400 mt-2">
              {videos.length} video{videos.length !== 1 ? 's' : ''} from the ground
              {editMode && (
                <span className="text-gray-500 ml-2">
                  • drag pins to reposition
                  {pendingChanges.size > 0 && (
                    <span className="text-yellow-500"> ({pendingChanges.size} unsaved)</span>
                  )}
                </span>
              )}
            </p>
          )}
        </header>


        {/* Map + Video Section */}
        <div className="my-8 relative">
          {/* Map - Always Full Width */}
          <div className="relative h-[500px] w-full rounded-lg overflow-hidden">
            <div
              ref={mapContainer}
              className="absolute inset-0 w-full h-full"
            />

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-gray-400 text-sm">Loading map...</div>
              </div>
            )}

            {/* Error state */}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-red-500 text-sm">{mapError}</div>
              </div>
            )}

            {/* Video Player - Overlay */}
            {currentVideo && !editMode && (
              <div
                className="absolute bottom-4 right-4 w-[min(400px,calc(100%-2rem))] bg-black/90 rounded-lg overflow-hidden border border-white/20 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out"
                style={{
                  animation: 'slideInFromBottom 0.3s ease-out'
                }}
              >
                <style jsx>{`
                  @keyframes slideInFromBottom {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>

                <div className="relative bg-black">
                  {/* Control buttons */}
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => setVideoFitMode(videoFitMode === 'contain' ? 'cover' : 'contain')}
                      className="text-white/80 hover:text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm text-xs px-2 py-1.5 rounded transition-colors"
                      title={videoFitMode === 'contain' ? 'Fill screen' : 'Fit to screen'}
                    >
                      {videoFitMode === 'contain' ? '⤢' : '▣'}
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-white/80 hover:text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm px-2 py-1 rounded transition-colors"
                      title="Close video player"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Video content */}
                  <div className="aspect-video bg-black flex items-center justify-center">
                    {currentVideo.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={currentVideo.videoUrl}
                        controls
                        autoPlay
                        className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                        style={{ backgroundColor: '#000' }}
                      />
                    ) : currentVideo.sourceUrl ? (
                      <a
                        href={currentVideo.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-3 p-6 text-center w-full"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl transition-colors">
                          ▶
                        </div>
                        <span className="text-white text-sm">Open video source</span>
                        <span className="text-gray-500 text-xs break-all line-clamp-2">{currentVideo.sourceUrl}</span>
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">No video available</span>
                    )}
                  </div>
                </div>

                {/* Video info footer */}
                <div className="p-3 bg-black/50 backdrop-blur-sm border-t border-white/10">
                  <h3 className="text-white text-sm font-medium truncate" title={currentVideo.title || 'Untitled'}>
                    {currentVideo.title || 'Untitled'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1 truncate" title={currentVideo.channelName}>
                    {currentVideo.channelName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video List */}
        {videos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Videos</h2>
            <div className="grid gap-4">
              {videos.map(video => (
                <div
                  key={video.id}
                  onClick={() => !editMode && handleVideoClick(video)}
                  className={`flex items-center gap-3 p-4 rounded-lg transition-colors border ${
                    editMode
                      ? 'bg-white/5 border-white/10 cursor-default'
                      : currentVideo?.id === video.id
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <img
                      src="/icons/pin.png"
                      alt="Location pin"
                      className="w-5 h-6"
                      style={{
                        filter: currentVideo?.id === video.id
                          ? 'brightness(0) saturate(100%) invert(35%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(104%) contrast(97%)'
                          : 'brightness(0) invert(1)'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{video.title || 'Untitled Video'}</h3>
                    <p className="text-gray-400 text-sm">
                      {video.channelName} {video.date && `• ${new Date(video.date).toLocaleDateString()}`}
                    </p>
                    {editMode && video.coordinates && (
                      <p className="text-gray-500 text-xs mt-1 font-mono">
                        {pendingChanges.has(video.id)
                          ? `${pendingChanges.get(video.id)![1].toFixed(4)}, ${pendingChanges.get(video.id)![0].toFixed(4)} (unsaved)`
                          : `${video.coordinates[1].toFixed(4)}, ${video.coordinates[0].toFixed(4)}`
                        }
                      </p>
                    )}
                  </div>
                  {pendingChanges.has(video.id) && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Position changed" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
