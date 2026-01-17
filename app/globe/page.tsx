'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// ISO 3166-1 alpha-3 code for Venezuela
const VENEZUELA_ISO = 'VEN'

export default function GlobePage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const brandingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

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
          style: 'mapbox://styles/mapbox/satellite-streets-v12', // Start with satellite base
          center: [-66.9, 6.4], // Center on Venezuela
          zoom: 1.5,
          projection: 'globe' as unknown as mapboxgl.Projection,
          attributionControl: false,
        })

        map.current.on('load', () => {
          if (!map.current) return

          map.current.setProjection('globe')
          map.current.setFog({
            'horizon-blend': 0.1,
            color: '#1a1a1a',
            'high-color': '#1a1a1a',
            'space-color': '#000000',
            'star-intensity': 0.4,
          })

          // Now the base is satellite everywhere
          // We need to cover non-Venezuela areas with dark street style

          // 1. Add Mapbox country boundaries source
          map.current.addSource('country-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1'
          })

          // 2. Cover all countries EXCEPT Venezuela with dark fill
          // This masks satellite view outside Venezuela
          map.current.addLayer({
            id: 'non-venezuela-dark-overlay',
            type: 'fill',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['!=', ['get', 'iso_3166_1_alpha_3'], VENEZUELA_ISO],
            paint: {
              'fill-color': '#0a0a0a',
              'fill-opacity': 0.95 // Slightly transparent to see some satellite underneath
            }
          })

          // 3. Add Venezuela border outline
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

          // Remove Mapbox branding
          brandingTimeoutRef.current = setTimeout(() => {
            document.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib')
              .forEach(el => el.remove())
          }, 100)
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
      if (brandingTimeoutRef.current) {
        clearTimeout(brandingTimeoutRef.current)
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Map */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-sm">Loading map...</div>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-red-400 text-sm">{mapError}</div>
        </div>
      )}
    </div>
  )
}
