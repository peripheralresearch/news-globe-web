'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createRoot } from 'react-dom/client'
import Image from 'next/image'

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
          style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite base
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
    newsLocations.forEach((location) => {
      if (!map.current) return

      // Create a custom marker element
      const el = document.createElement('div')
      el.className = 'custom-marker-container'

      // Create a React root for the marker
      const root = createRoot(el)
      root.render(<MapMarker location={location} />)

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

function MapMarker({ location }: { location: NewsLocation }) {
  // Get the first story with media, or just the first story
  const primaryStory = location.stories.find(s => s.media_url) || location.stories[0]

  // Truncate title/summary for display
  const displayTitle = primaryStory?.title || location.entity_name
  const displaySummary = primaryStory?.summary || `${location.story_count} stories in this location`

  return (
    <div className="group relative flex items-center">
      {/* The Dot */}
      <div className="relative z-10 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-transform duration-300 ease-out group-hover:scale-[2.5]" />

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
            stroke="#fbbf24"
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
                <p className="text-[9px] text-yellow-400 mt-1">
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
