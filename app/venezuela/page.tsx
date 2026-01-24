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
  const [savingPosition, setSavingPosition] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Load videos from API
  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/ice/videos/VE')
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

  // Save video position to database
  const saveVideoPosition = async (videoId: string, lng: number, lat: number) => {
    setSavingPosition(videoId)
    try {
      const res = await fetch(`/api/video/${videoId}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })

      if (res.ok) {
        // Update local state
        setVideos(prev => prev.map(v =>
          v.id === videoId
            ? { ...v, coordinates: [lng, lat] as [number, number] }
            : v
        ))
        console.log(`✓ Position saved for ${videoId}`)
      } else {
        console.error('Failed to save position')
      }
    } catch (error) {
      console.error('Error saving position:', error)
    } finally {
      setSavingPosition(null)
    }
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
            saveVideoPosition(video.id, lngLat.lng, lngLat.lat)
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
  }, [videos, handleVideoClick, editMode, currentVideo])

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

            {/* Edit Mode Toggle */}
            <button
              onClick={() => {
                setEditMode(!editMode)
                if (currentVideo) setCurrentVideo(null)
              }}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              {editMode ? 'done' : 'edit'}
            </button>
          </div>

          {videos.length > 0 && (
            <p className="text-gray-400 mt-2">
              {videos.length} video{videos.length !== 1 ? 's' : ''} from the ground
              {editMode && <span className="text-gray-500 ml-2">• drag to reposition</span>}
            </p>
          )}
        </header>


        {/* Map + Video Section */}
        <div className="my-8 flex gap-4">
          {/* Map */}
          <div className={`relative h-[500px] rounded-lg overflow-hidden ${currentVideo && !editMode ? 'flex-1' : 'w-full'}`}>
            <div
              ref={mapContainer}
              className="absolute inset-0 w-full h-full"
            />

            {/* Saving indicator */}
            {savingPosition && (
              <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 z-20">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                saving...
              </div>
            )}

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
          </div>

          {/* Video Player - Side Panel */}
          {currentVideo && !editMode && (
            <div className="w-[350px] h-[500px] bg-black rounded-lg overflow-hidden border border-white/10 flex flex-col">
              <div className="relative flex-1 bg-black flex items-center justify-center">
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 z-10 text-white/60 hover:text-white text-sm"
                >
                  ✕
                </button>
                {currentVideo.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : currentVideo.sourceUrl ? (
                  <a
                    href={currentVideo.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-4 p-6 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                      ▶
                    </div>
                    <span className="text-white text-sm">Open video source</span>
                    <span className="text-gray-500 text-xs break-all">{currentVideo.sourceUrl}</span>
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm">No video available</span>
                )}
              </div>
              <div className="p-3 border-t border-white/10">
                <h3 className="text-white text-sm font-medium truncate">{currentVideo.title || 'Untitled'}</h3>
                <p className="text-gray-500 text-xs mt-1">{currentVideo.channelName}</p>
              </div>
            </div>
          )}
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
                        {video.coordinates[1].toFixed(4)}, {video.coordinates[0].toFixed(4)}
                      </p>
                    )}
                  </div>
                  {savingPosition === video.id && (
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
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
