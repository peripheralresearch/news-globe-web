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
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Venezuela
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-semibold text-green-500">LIVE</span>
            </div>
          </div>
        </header>

        {/* Map Section */}
        <div className="my-8">
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
            <div
              ref={mapContainer}
              className="absolute inset-0 w-full h-full"
            />

            {/* Gradient overlays for fade effect on edges */}
            {!isLoading && !mapError && (
              <>
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)'
                  }}
                />
                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, #0a0a0a 0%, transparent 100%)'
                  }}
                />
                {/* Left gradient */}
                <div className="absolute top-0 left-0 bottom-0 w-24 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, #0a0a0a 0%, transparent 100%)'
                  }}
                />
                {/* Right gradient */}
                <div className="absolute top-0 right-0 bottom-0 w-24 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to left, #0a0a0a 0%, transparent 100%)'
                  }}
                />
              </>
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

        </div>

      </div>
    </div>
  )
}
