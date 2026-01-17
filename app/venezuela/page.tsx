'use client'

import { useEffect, useRef, useState } from 'react'
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
const ELASTIC_PADDING = 0.7 // Further reduced for even tighter boundaries

export default function VenezuelaArticlePage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const isDragging = useRef(false)
  const isAnimating = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

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
          maxZoom: 10, // Maximum zoom level
          attributionControl: false,
          cooperativeGestures: true, // Require Ctrl/Cmd + scroll to zoom, allowing normal page scrolling
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
            Venezuela
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

      </div>
    </div>
  )
}
