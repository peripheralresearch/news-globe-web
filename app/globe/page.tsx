'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createRoot } from 'react-dom/client'
import Image from 'next/image'

// Global styles for pulsing animation - matching landing page glow effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.15),
                    0 0 16px rgba(255, 255, 255, 0.08),
                    0 0 24px rgba(255, 255, 255, 0.04);
      }
      50% {
        box-shadow: 0 0 14px rgba(255, 255, 255, 0.25),
                    0 0 28px rgba(255, 255, 255, 0.15),
                    0 0 42px rgba(255, 255, 255, 0.08);
      }
    }
  `
  if (!document.getElementById('globe-pulse-animation')) {
    style.id = 'globe-pulse-animation'
    document.head.appendChild(style)
  }
}

interface NewsStory {
  id: string
  post_id: number
  title: string | null
  summary: string
  created: string
  source_name: string
  source_url: string
  has_photo: boolean
  has_video: boolean
  media_url: string | null
}

interface NewsLocation {
  entity_name: string
  entity_type: string
  location_subtype: string
  confidence: number
  story_count: number
  coordinates: [number, number]
  default_zoom: number
  stories: NewsStory[]
}

export default function GlobePage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [newsLocations, setNewsLocations] = useState<NewsLocation[]>([])
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')

  // Toggle map style
  const toggleMapStyle = () => {
    if (!map.current) return

    const newStyle = mapStyle === 'street' ? 'satellite' : 'street'
    const styleUrl = newStyle === 'street'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/satellite-streets-v12'

    setMapStyle(newStyle)

    // Preserve current camera position
    const currentCenter = map.current.getCenter()
    const currentZoom = map.current.getZoom()
    const currentBearing = map.current.getBearing()
    const currentPitch = map.current.getPitch()

    // Change the map style
    map.current.setStyle(styleUrl)

    // Restore fog and markers after style loads
    map.current.once('style.load', () => {
      map.current?.setFog({
        'horizon-blend': 0.1,
        color: '#000000',
        'high-color': '#000000',
        'space-color': '#000000',
        'star-intensity': 0.5,
      })

      // Restore camera position
      map.current?.jumpTo({
        center: currentCenter,
        zoom: currentZoom,
        bearing: currentBearing,
        pitch: currentPitch,
      })

      // Re-add markers after style change
      if (newsLocations.length > 0 && map.current) {
        markersRef.current.forEach(marker => {
          if (map.current) {
            marker.addTo(map.current)
          }
        })
      }
    })

    console.log('Map style changed to:', newStyle)
  }

  // Fetch news locations from API
  useEffect(() => {
    const fetchNewsLocations = async () => {
      try {
        const response = await fetch('/api/sentinel/globe?hours=48&limit=30')
        if (!response.ok) {
          throw new Error('Failed to fetch news locations')
        }
        const data = await response.json()
        if (data.status === 'success' && data.data.locations) {
          setNewsLocations(data.data.locations)
          console.log(`Loaded ${data.data.locations.length} news locations`)
        }
      } catch (error) {
        console.error('Error fetching news locations:', error)
      }
    }

    fetchNewsLocations()
  }, [])

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
          style: 'mapbox://styles/mapbox/dark-v11', // Dark street view
          center: [20.0, 30.0], // Center on Europe/Africa/Middle East
          zoom: 2.5,
          projection: 'globe' as unknown as mapboxgl.Projection,
          attributionControl: false,
        })

        map.current.on('style.load', () => {
          map.current?.setFog({
            'horizon-blend': 0.1,
            color: '#000000', // Darker space
            'high-color': '#000000',
            'space-color': '#000000',
            'star-intensity': 0.5,
          })
        })

        map.current.on('load', () => {
          setIsLoading(false)
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

  // Create markers when news locations are loaded and map is ready
  useEffect(() => {
    if (!map.current || newsLocations.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Create markers for each news location
    newsLocations.forEach((location, index) => {
      if (!map.current) return

      // Create a custom marker element
      const el = document.createElement('div')
      el.className = 'custom-marker-container'

      // Create a React root for the marker
      const root = createRoot(el)
      // Pass a random delay for staggered pulsing animation
      const animationDelay = Math.random() * 3 // 0-3 seconds random delay
      root.render(<MapMarker location={location} animationDelay={animationDelay} />)

      // Add marker to map
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat(location.coordinates)
        .addTo(map.current)

      markersRef.current.push(marker)
    })

    console.log(`Created ${markersRef.current.length} markers on globe`)
  }, [newsLocations])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
      />

      {/* Map Style Toggle Button */}
      {!isLoading && !mapError && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleMapStyle}
            className="px-4 py-2.5 bg-black/80 backdrop-blur border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 hover:border-white/40 transition-all flex items-center gap-2"
            title={`Switch to ${mapStyle === 'street' ? 'satellite' : 'street'} view`}
          >
            {mapStyle === 'street' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Satellite</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Street</span>
              </>
            )}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-white text-sm">Loading map...</div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-red-400 text-sm">{mapError}</div>
        </div>
      )}
    </div>
  )
}

function MapMarker({ location, animationDelay }: { location: NewsLocation; animationDelay: number }) {
  // Get the first story with media, or just the first story
  const primaryStory = location.stories.find(s => s.media_url) || location.stories[0]

  // Truncate title/summary for display
  const displayTitle = primaryStory?.title || location.entity_name
  const displaySummary = primaryStory?.summary || `${location.story_count} stories in this location`

  return (
    <div className="group relative flex items-center">
      {/* The Dot - White with subtle pulsing glow matching landing page */}
      <div
        className="relative z-10 w-3 h-3 bg-white rounded-full transition-transform duration-300 ease-out group-hover:scale-[2.5]"
        style={{
          animation: `pulse-glow 2.5s ease-in-out infinite`,
          animationDelay: `${animationDelay}s`
        }}
      />

      {/* Container for Line and Card - anchored to the dot */}
      <div className="absolute left-1.5 bottom-1.5 flex items-end pointer-events-none">

        {/* The Stem Line (SVG) */}
        <svg
          width="200"
          height="100"
          className="overflow-visible pointer-events-none"
          style={{ transform: 'translate(0, 0)' }}
        >
          <path
            d="M 0,0 L 50,-50 L 250,-50"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            className="opacity-0 transition-all duration-500 ease-out group-hover:opacity-100"
            style={{
              strokeDasharray: 300,
              strokeDashoffset: 300,
              animation: 'dash 1s forwards'
            }}
          />
          <style jsx>{`
            .group:hover path {
              stroke-dashoffset: 0 !important;
              opacity: 1;
            }
          `}</style>
        </svg>

        {/* The Card */}
        <div
          className="absolute left-[250px] bottom-[50px] transform -translate-y-1/2 opacity-0 translate-x-[-10px] transition-all duration-500 delay-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto"
          style={{ width: '300px' }}
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white shadow-2xl flex items-start gap-3">
            {/* Thumbnail */}
            {primaryStory?.media_url ? (
              <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                <Image
                  src={primaryStory.media_url}
                  alt={displayTitle.substring(0, 50)}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                <div className="text-gray-500 text-xs">📍</div>
              </div>
            )}

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-100 leading-tight mb-1">
                {displayTitle.substring(0, 80)}
              </h3>
              <p className="text-[10px] text-gray-300 leading-relaxed line-clamp-3">
                {displaySummary.substring(0, 150)}
              </p>
              {location.story_count > 1 && (
                <p className="text-[9px] text-white/80 mt-1">
                  +{location.story_count - 1} more {location.story_count === 2 ? 'story' : 'stories'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
