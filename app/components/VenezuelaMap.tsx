'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const VENEZUELA_ISO = 'VEN'

const VENEZUELA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-75.0, -1.0],
  [-58.0, 13.5]
]

interface VenezuelaMapProps {
  onLoadComplete?: () => void
}

export function VenezuelaMap({ onLoadComplete }: VenezuelaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

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
          center: [-66.5, 6.5],
          zoom: 4.2,
          minZoom: 4,
          maxZoom: 10,
          maxBounds: VENEZUELA_BOUNDS,
          maxBoundsViscosity: 0.85, // Rubber-band effect (0.75 = some overpan, 1 = no overpan)
          cooperativeGestures: true, // Require Ctrl/Cmd + scroll to zoom
          scrollZoom: false, // Disable scroll zoom by default
          attributionControl: true, // Keep attribution visible
        } as any)

        // Add attribution in bottom-right
        map.current.addControl(
          new mapboxgl.AttributionControl({ compact: true }),
          'bottom-right'
        )

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
          onLoadComplete?.()
        })

        // Enable scroll zoom only when hovering over map
        const handleMouseEnter = () => {
          map.current?.scrollZoom.enable()
        }

        const handleMouseLeave = () => {
          map.current?.scrollZoom.disable()
        }

        mapContainer.current?.addEventListener('mouseenter', handleMouseEnter)
        mapContainer.current?.addEventListener('mouseleave', handleMouseLeave)

        map.current.on('error', (e) => {
          console.error('Map error:', e)
          setMapError('Failed to load map')
          setIsLoading(false)
        })

        // Cleanup function
        return () => {
          mapContainer.current?.removeEventListener('mouseenter', handleMouseEnter)
          mapContainer.current?.removeEventListener('mouseleave', handleMouseLeave)

          if (map.current) {
            map.current.remove()
            map.current = null
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error)
        setMapError(error instanceof Error ? error.message : 'Failed to initialize map')
        setIsLoading(false)
      }
    }

    const cleanup = initMap()
    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [onLoadComplete])

  return (
    <div
      className="w-full rounded-lg overflow-hidden shadow-lg border border-gray-200"
      style={{
        aspectRatio: '16 / 9',
        minHeight: 'clamp(300px, 50vh, 600px)',
      }}
      role="region"
      aria-label="Venezuela satellite map - interactive map showing Venezuela and surrounding countries"
    >
      <div
        ref={mapContainer}
        className="w-full h-full"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-600 text-sm">Loading map...</div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-red-600 text-sm">{mapError}</div>
        </div>
      )}
    </div>
  )
}
