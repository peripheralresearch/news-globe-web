'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { FeatureCollection, Feature, Point } from 'geojson'

interface NewsItem {
    id: string
    title: string | null
    summary: string | null
  created: string
  location: string
  coordinates: [number, number]
}

interface GlobeData {
  newsItems: NewsItem[]
  stats: {
    total_news_items: number
    total_locations: number
  }
}

const IDLE_TIMEOUT = 10000 // 10 seconds before rotation starts
const ROTATION_SPEED = 0.015 // degrees per frame (slow rotation)

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const storiesRef = useRef<FeatureCollection<Point>>({ type: 'FeatureCollection', features: [] })
  const pulseStart = useRef(Date.now())

  // Idle rotation refs
  const lastInteractionRef = useRef(Date.now())
  const isRotatingRef = useRef(false)
  const rotationFrameRef = useRef<number | null>(null)

  const [globeData, setGlobeData] = useState<GlobeData | null>(null)
  const globeDataRef = useRef<GlobeData | null>(null)
  const loadGlobeDataRef = useRef<(() => Promise<GlobeData | null>) | null>(null)
  const updateMapDataRef = useRef<((data: GlobeData) => void) | null>(null)
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load globe data
  const loadGlobeData = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('Fetching globe data from /api/sentinel/globe...')
      const response = await fetch('/api/sentinel/globe?limit=20')
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText)
        return null
      }
      
      const result = await response.json()
      console.log('API response received:', result)

      if (result.status === 'success' && result.data) {
        // Transform locations into individual news item points
        const newsItems: NewsItem[] = []

        if (result.data.locations && Array.isArray(result.data.locations)) {
          // Limit to first 30 locations to avoid too many points
          const limitedLocations = result.data.locations.slice(0, 30)
          
          limitedLocations.forEach((loc: {
            entity_name: string
            coordinates: [number, number]
            stories: Array<{
              id: string
              title: string | null
              summary: string | null
              created: string
            }>
          }) => {
            if (loc.stories && Array.isArray(loc.stories)) {
              // Only take the first news item per location to reduce points
              const firstItem = loc.stories[0]
              if (firstItem) {
                newsItems.push({
                  id: firstItem.id,
                  title: firstItem.title,
                  summary: firstItem.summary,
                  created: firstItem.created,
                  location: loc.entity_name,
                  coordinates: loc.coordinates,
                })
              }
            }
          })
        }

        const data: GlobeData = {
          newsItems,
          stats: {
            total_news_items: newsItems.length,
            total_locations: result.data.locations?.length || 0,
          }
        }

        console.log('Processed globe data:', { 
          newsItems: data.newsItems.length, 
          locations: data.stats.total_locations,
          limited: true 
        })
        setGlobeData(data)
        globeDataRef.current = data
        return data
      } else {
        console.warn('API returned unsuccessful status:', result)
      }
      return null
    } catch (error) {
      console.error('Error loading globe data:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update map with news item points
  const updateMapData = useCallback((data: GlobeData) => {
    if (!map.current) {
      console.warn('Map not initialized, cannot update data')
      return
    }

    console.log('Updating map with', data.newsItems.length, 'news items')

    // Create news item features - white glowing dots
    const newsItemFeatures: Feature<Point>[] = data.newsItems.map((item, idx) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
        coordinates: item.coordinates,
        },
        properties: {
        id: item.id,
        title: item.title,
        location: item.location,
        created: item.created,
        // Slight offset for multiple items at same location
        offset: idx % 10,
        phase: Math.random() * Math.PI * 2,
          pulse: 1.0,
      }
    }))

    storiesRef.current = { type: 'FeatureCollection', features: newsItemFeatures }

    const source = map.current.getSource('stories') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(storiesRef.current)
      console.log('Map data updated successfully')
    } else {
      console.error('News items source not found')
    }
  }, [])

  // Store refs to functions
  useEffect(() => {
    loadGlobeDataRef.current = loadGlobeData
    updateMapDataRef.current = updateMapData
  }, [loadGlobeData, updateMapData])

  // Keep ref in sync with state
  useEffect(() => {
    globeDataRef.current = globeData
  }, [globeData])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    const initMap = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) {
          console.error('Mapbox token not found')
          return
        }

        mapboxgl.accessToken = token

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [20, 30],
          zoom: 2,
          projection: 'globe' as unknown as mapboxgl.Projection,
          attributionControl: false,
        })

        map.current.on('load', async () => {
          if (!map.current) return

          // Ensure globe projection is set
            map.current.setProjection('globe')

          // Set globe atmosphere with white glow (30% brightness)
            map.current.setFog({
              'horizon-blend': 0.1,
            color: '#4d4d4d',
              'high-color': '#4d4d4d',
              'space-color': '#000000',
            'star-intensity': 0.4,
          })

          // Add stories source
          map.current.addSource('stories', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })

          // Outer glow layer
          map.current.addLayer({
            id: 'stories-glow',
            type: 'circle',
            source: 'stories',
            paint: {
              'circle-radius': 20,
              'circle-color': '#ffffff',
              'circle-opacity': ['*', 0.15, ['get', 'pulse']],
              'circle-blur': 1,
            },
          })

          // Middle glow
          map.current.addLayer({
            id: 'stories-glow-inner',
            type: 'circle',
            source: 'stories',
            paint: {
              'circle-radius': 10,
              'circle-color': '#ffffff',
              'circle-opacity': ['*', 0.3, ['get', 'pulse']],
              'circle-blur': 0.5,
            },
          })

          // Core dot
          map.current.addLayer({
            id: 'stories-core',
            type: 'circle',
            source: 'stories',
            paint: {
              'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-opacity': ['*', 0.9, ['get', 'pulse']],
            },
          })

          // Load data
          console.log('Map loaded, fetching globe data...')
          if (loadGlobeDataRef.current) {
            const data = await loadGlobeDataRef.current()
            if (data && updateMapDataRef.current) {
              console.log('Globe data loaded:', { newsItems: data.newsItems.length, locations: data.stats.total_locations })
              updateMapDataRef.current(data)
            animatePulse()
          } else {
              console.warn('No globe data received')
            }
          }

          // Remove Mapbox branding
          setTimeout(() => {
            document.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib')
              .forEach(el => el.remove())
          }, 100)
        })

        // Click handler
        map.current.on('click', 'stories-core', (e) => {
          if (!e.features || !e.features[0]) return

          const props = e.features[0].properties
          if (props && globeDataRef.current) {
            const newsItem = globeDataRef.current.newsItems.find(item => item.id === props.id)
            if (newsItem) {
              setSelectedNewsItem(newsItem)

          // Fly to location
              map.current?.flyTo({
                center: newsItem.coordinates,
                zoom: 5,
                duration: 1500,
              })
            }
          }
        })

        // Hover cursor
        map.current.on('mouseenter', 'stories-core', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer'
        })
        map.current.on('mouseleave', 'stories-core', () => {
          if (map.current) map.current.getCanvas().style.cursor = ''
        })

        // Track user interactions to reset idle timer
        // Note: 'move' is excluded because setCenter() during rotation triggers it
        const interactionEvents = ['mousedown', 'touchstart', 'wheel', 'dragstart']
        interactionEvents.forEach(event => {
          map.current?.on(event, () => {
            lastInteractionRef.current = Date.now()
            if (isRotatingRef.current) {
              isRotatingRef.current = false
              if (rotationFrameRef.current) {
                cancelAnimationFrame(rotationFrameRef.current)
                rotationFrameRef.current = null
              }
            }
          })
        })

      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    return () => {
      // Clean up rotation animation
      if (rotationFrameRef.current) {
        cancelAnimationFrame(rotationFrameRef.current)
      }
      if (map.current) map.current.remove()
    }
  }, [])

  // Pulse animation
  const animatePulse = useCallback(() => {
    if (!map.current || !map.current.getSource('stories')) return

    const geojson = storiesRef.current
    if (!geojson.features.length) {
      requestAnimationFrame(animatePulse)
      return
    }

    const now = Date.now()
    const t = ((now - pulseStart.current) / 1000) % 3

    geojson.features.forEach((f: Feature<Point>) => {
      if (f.properties) {
        const phase = f.properties.phase || 0
        f.properties.pulse = 0.4 + 0.6 * (1 + Math.sin(2 * Math.PI * t / 3 + phase)) / 2
      }
    })

    try {
      const source = map.current.getSource('stories') as mapboxgl.GeoJSONSource
      if (source) source.setData(geojson)
      requestAnimationFrame(animatePulse)
    } catch {
      // Map might be removed
    }
  }, [])

  // Stop idle rotation
  const stopRotation = useCallback(() => {
    isRotatingRef.current = false
    if (rotationFrameRef.current) {
      cancelAnimationFrame(rotationFrameRef.current)
      rotationFrameRef.current = null
    }
  }, [])

  // Reset interaction timer (called on user activity)
  const resetInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
    if (isRotatingRef.current) {
      stopRotation()
    }
  }, [stopRotation])

  // Idle rotation animation
  const animateRotation = useCallback(() => {
    if (!map.current || !isRotatingRef.current) return

    const center = map.current.getCenter()
    const newLng = center.lng + ROTATION_SPEED

    map.current.setCenter([newLng, center.lat])

    rotationFrameRef.current = requestAnimationFrame(animateRotation)
  }, [])

  // Check for idle state and start rotation
  const checkIdleState = useCallback(() => {
    const timeSinceInteraction = Date.now() - lastInteractionRef.current

    if (timeSinceInteraction >= IDLE_TIMEOUT && !isRotatingRef.current && map.current) {
      isRotatingRef.current = true
      animateRotation()
    }
  }, [animateRotation])

  // Set up idle check interval
  useEffect(() => {
    const idleCheckInterval = setInterval(checkIdleState, 1000)
    return () => clearInterval(idleCheckInterval)
  }, [checkIdleState])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Map */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      />

      {/* Header */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur rounded-lg p-4 text-white">
        <h1 className="text-lg font-semibold">Geopolitical Mirror</h1>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : globeData && (
          <p className="text-sm text-gray-400">
            {globeData.stats.total_news_items} news items across {globeData.stats.total_locations} locations
          </p>
        )}
      </div>

      {/* News Item Detail Panel */}
      {selectedNewsItem && (
        <div className="absolute top-4 right-4 w-80 bg-black/80 backdrop-blur rounded-lg p-4 text-white">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {selectedNewsItem.location}
            </span>
            <button
              onClick={() => setSelectedNewsItem(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <h3 className="font-medium mb-2">{selectedNewsItem.title || 'Untitled'}</h3>
          {selectedNewsItem.summary && (
            <p className="text-sm text-gray-300 mb-3">{selectedNewsItem.summary}</p>
          )}
          <p className="text-xs text-gray-500">
            {new Date(selectedNewsItem.created).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-xs text-gray-600 mt-2 font-mono">{selectedNewsItem.id}</p>
        </div>
      )}

      {/* Hint */}
      {!selectedNewsItem && globeData && (
        <div className="absolute bottom-4 right-4 bg-black/50 rounded px-3 py-1.5 text-xs text-gray-400">
          Click on a dot to view news item
        </div>
      )}
    </div>
  )
}
