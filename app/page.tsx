'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { FeatureCollection, Feature, Point, LineString } from 'geojson'

interface NewsItem {
    id: string
    title: string | null
    summary: string | null
  created: string
  location: string
  coordinates: [number, number]
  storyCount?: number
}

interface LocationAggregate {
  name: string
  locationSubtype: string
  coordinates: [number, number]
  defaultZoom?: number
  storyCount: number
  stories: Array<{
    id: string
    title: string | null
    summary: string | null
    created: string
    sourceName?: string | null
    sourceUrl?: string | null
    hasPhoto?: boolean | null
    hasVideo?: boolean | null
    mediaUrl?: string | null
  }>
}

interface GlobeData {
  newsItems: NewsItem[]
  locations: LocationAggregate[]
  stats: {
    total_news_items: number
    total_locations: number
  }
}

const STORY_SUMMARY_LIMIT = 220
const INITIAL_GLOBE_LIMIT = 35
const FULL_GLOBE_LIMIT = 150

const IDLE_TIMEOUT = 10000 // 10 seconds before rotation starts
const ROTATION_SPEED = 0.015 // degrees per frame (slow rotation)
const ZOOM_OUT_TIMEOUT = 60000 // 1 minute before auto zoom-out when viewing story
const INITIAL_ZOOM = 0.5 // Initial zoom level for globe view

// Entrance animation constants
const ENTRANCE_DURATION = 5500 // 5.5 seconds for entrance animation
const ENTRANCE_SPEED_MULTIPLIER = 12 // Start at 12x the idle speed for dramatic entrance

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const storiesRef = useRef<FeatureCollection<Point>>({ type: 'FeatureCollection', features: [] })

  // Idle rotation refs
  const lastInteractionRef = useRef(Date.now())
  const isRotatingRef = useRef(false)
  const rotationFrameRef = useRef<number | null>(null)
  const zoomOutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Entrance animation refs
  const entranceAnimationRef = useRef<number | null>(null)
  const entranceStartTimeRef = useRef<number | null>(null)
  const hasPlayedEntranceRef = useRef(false)

  // Dot pulse animation ref
  const pulseFrameRef = useRef<number | null>(null)

  // Border glimmer animation ref
  const glimmerFrameRef = useRef<number | null>(null)
  const glimmerOffsetRef = useRef(0)

  const [globeData, setGlobeData] = useState<GlobeData | null>(null)
  const globeDataRef = useRef<GlobeData | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationAggregate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [expandedStories, setExpandedStories] = useState<Set<string>>(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')
  const [isTrendingCollapsed, setIsTrendingCollapsed] = useState(false)

  const brandingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Toggle map style handler
  const toggleMapStyle = useCallback(() => {
    if (!map.current) return

    const newStyle = mapStyle === 'street' ? 'satellite' : 'street'
    const styleUrl = newStyle === 'street'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/satellite-streets-v12'

    setMapStyle(newStyle)

    // Store current sources and layers data before style change
    const storiesData = storiesRef.current

    // Set new style
    map.current.setStyle(styleUrl)

    // Re-add custom layers and data after style loads
    map.current.once('style.load', () => {
      if (!map.current) return

      // Restore globe projection and atmosphere
      map.current.setProjection('globe')

      // Restore atmosphere
      map.current.setFog({
        'horizon-blend': 0.1,
        color: '#1a1a1a',
        'high-color': '#1a1a1a',
        'space-color': '#000000',
        'star-intensity': 0.4,
      })

      // Re-add stories source (check if it already exists first)
      if (!map.current.getSource('stories')) {
        map.current.addSource('stories', {
          type: 'geojson',
          data: storiesData,
        })
      }

      // Re-add glow layers (check if they already exist first)
      for (let i = 0; i < 3; i++) {
        const layerId = `stories-glow-${i}`
        if (!map.current.getLayer(layerId)) {
          map.current.addLayer({
            id: layerId,
            type: 'circle',
            source: 'stories',
            filter: ['==', ['%', ['to-number', ['get', 'id']], 3], i],
            paint: {
              'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-opacity': 0.3,
              'circle-blur': 1,
            },
          })
        }
      }

      // Re-add core dots layer (check if it already exists first)
      if (!map.current.getLayer('stories-dots')) {
        map.current.addLayer({
          id: 'stories-dots',
          type: 'circle',
          source: 'stories',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'storyCount'], 1],
              1, 1.5,
              25, 4
            ],
            'circle-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        })
      }

      // Re-add country border highlight layers (check if they already exist first)
      if (!map.current.getLayer('country-border-glow')) {
        map.current.addLayer({
          id: 'country-border-glow',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 6,
            'line-opacity': 0.5,
            'line-blur': 4,
          },
        })
      }

      if (!map.current.getLayer('country-border-line')) {
        map.current.addLayer({
          id: 'country-border-line',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 3,
            'line-opacity': 1.0,
          },
        })
      }

      console.log('Map style changed to:', newStyle)
    })
  }, [mapStyle])

  // Load globe data
  const fetchGlobePage = useCallback(async (limit: number) => {
    try {
      const response = await fetch(`/api/sentinel/globe?limit=${limit}&hours=720&postLimit=5000`)
      if (!response.ok) {
        console.error(`Globe API (limit=${limit}) responded with ${response.status}`)
        return null
      }

      const result = await response.json()
      if (result.status !== 'success' || !result.data) {
        console.warn(`Globe API (limit=${limit}) returned invalid payload`, result)
        return null
      }

      const newsItems: NewsItem[] = []
      const locations: LocationAggregate[] = []

      for (const loc of result.data.locations || []) {
        if (!Array.isArray(loc.stories) || !loc.coordinates) continue

        const mappedStories = loc.stories.map((s: any) => ({
          id: s.id,
          title: s.title,
          summary: s.summary,
          created: s.created,
          sourceName: s.source_name || null,
          sourceUrl: s.source_url || null,
          hasPhoto: s.has_photo || null,
          hasVideo: s.has_video || null,
          mediaUrl: s.media_url || null,
        }))

        if (mappedStories.length === 0) continue

        const firstItem = mappedStories[0]
        newsItems.push({
          id: firstItem.id,
          title: firstItem.title,
          summary: firstItem.summary,
          created: firstItem.created,
          location: loc.entity_name,
          coordinates: loc.coordinates,
          storyCount: loc.story_count,
        })

        locations.push({
          name: loc.entity_name,
          locationSubtype: loc.location_subtype,
          coordinates: loc.coordinates,
          defaultZoom: loc.default_zoom,
          storyCount: loc.story_count,
          stories: mappedStories,
        })
      }

      return {
        newsItems,
        locations,
        stats: {
          total_news_items: newsItems.length,
          total_locations: locations.length,
        },
      }
    } catch (error) {
      console.error('Globe API fetch error:', error)
      return null
    }
  }, [])

  const loadGlobeData = useCallback(async () => {
    try {
      setIsLoading(true)
      setMapError(null)
      console.log('Fetching initial globe data...')
      const initialData = await fetchGlobePage(INITIAL_GLOBE_LIMIT)
      if (!initialData) {
        setMapError('Failed to load initial globe data')
        return null
      }

      // Set initial data immediately so UI appears
      setGlobeData(initialData)
      globeDataRef.current = initialData

      fetchGlobePage(FULL_GLOBE_LIMIT)
        .then(fullData => {
          if (fullData) {
            setGlobeData(fullData)
            globeDataRef.current = fullData
            updateMapData(fullData)
          }
        })
        .catch(err => {
          console.warn('Background globe refresh failed', err)
        })

      return initialData
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error loading globe data'
      console.error('Error loading globe data:', error)
      setMapError(`Failed to load globe data: ${errorMsg}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchGlobePage])

  const toggleStoryExpansion = useCallback((storyId: string) => {
    setExpandedStories(prev => {
      const next = new Set(prev)
      if (next.has(storyId)) {
        next.delete(storyId)
      } else {
        next.add(storyId)
      }
      return next
    })
  }, [])

  // Update map with news item points
  const updateMapData = useCallback((data: GlobeData) => {
    if (!map.current) {
      console.warn('Map not initialized, cannot update data')
      return
    }

    console.log('Updating map with', data.newsItems.length, 'news items')

    // Create news item features
    const newsItemFeatures: Feature<Point>[] = data.newsItems.map((item) => ({
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
        storyCount: item.storyCount || 1,
      }
    }))

    storiesRef.current = { type: 'FeatureCollection', features: newsItemFeatures }

    const source = map.current.getSource('stories') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(storiesRef.current)
    }

    console.log('Map data updated successfully')
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    globeDataRef.current = globeData
  }, [globeData])

  // Entrance animation with smooth deceleration (ease-out)
  const animateEntrance = useCallback(() => {
    if (!map.current || !entranceStartTimeRef.current) return

    const elapsed = Date.now() - entranceStartTimeRef.current
    const progress = Math.min(elapsed / ENTRANCE_DURATION, 1)

    if (progress >= 1) {
      // Entrance animation complete - transition to idle rotation
      console.log('✅ Entrance animation complete - starting idle rotation')
      hasPlayedEntranceRef.current = true
      entranceAnimationRef.current = null
      entranceStartTimeRef.current = null

      // Immediately start idle rotation (don't wait for IDLE_TIMEOUT)
      isRotatingRef.current = true
      lastInteractionRef.current = Date.now()

      // Continue with idle speed rotation (global rotation)
      const continueIdleRotation = () => {
        if (!map.current || !isRotatingRef.current) return

        const center = map.current.getCenter()
        const newLng = center.lng + ROTATION_SPEED
        map.current.setCenter([newLng, center.lat])

        rotationFrameRef.current = requestAnimationFrame(continueIdleRotation)
      }

      rotationFrameRef.current = requestAnimationFrame(continueIdleRotation)
      return
    }

    // Ease-out quintic easing: 1 - (1 - t)^5 (very aggressive deceleration)
    const easeOut = 1 - Math.pow(1 - progress, 5)

    // Interpolate from fast speed to idle speed
    const currentSpeed = ROTATION_SPEED * ENTRANCE_SPEED_MULTIPLIER * (1 - easeOut) +
                         ROTATION_SPEED * easeOut

    // Rotate the globe
    const center = map.current.getCenter()
    const newLng = center.lng + currentSpeed
    map.current.setCenter([newLng, center.lat])

    entranceAnimationRef.current = requestAnimationFrame(animateEntrance)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) {
      console.error('❌ Map container ref is null')
      return
    }

    console.log('✅ Map container ref exists')

    const initMap = async () => {
      try {
        console.log('🗺️ Initializing map...')
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) {
          console.error('❌ Mapbox token not found')
          setMapError('Mapbox token not configured')
          setIsLoading(false)
          return
        }

        console.log('✅ Mapbox token found:', token.substring(0, 20) + '...')
        mapboxgl.accessToken = token

        console.log('✅ Creating map instance...')
        // Random starting longitude for varied entrance animation
        const randomLng = Math.random() * 360 - 180 // -180 to 180
        console.log('🎲 Random starting position:', randomLng)

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [randomLng, 30],
          zoom: 0.5,
          projection: 'globe' as unknown as mapboxgl.Projection,
          attributionControl: false,
        })

        console.log('✅ Map instance created successfully')

        map.current.on('load', async () => {
          if (!map.current) return

          // Ensure globe projection is set
            map.current.setProjection('globe')

          // Set globe atmosphere with white glow (10% brightness)
            map.current.setFog({
              'horizon-blend': 0.1,
            color: '#1a1a1a',
              'high-color': '#1a1a1a',
              'space-color': '#000000',
            'star-intensity': 0.4,
          })

          // Add stories source
          map.current.addSource('stories', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })

          // Create multiple glow layers with different phase groups
          // This creates chaotic pulsing by having 3 groups pulse at different times
          for (let i = 0; i < 3; i++) {
            map.current.addLayer({
              id: `stories-glow-${i}`,
              type: 'circle',
              source: 'stories',
              filter: ['==', ['%', ['to-number', ['get', 'id']], 3], i],
              paint: {
                'circle-radius': 4,
                'circle-color': '#ffffff',
                'circle-opacity': 0.3,
                'circle-blur': 1,
              },
            })
          }

          // Core dots
          map.current.addLayer({
            id: 'stories-dots',
            type: 'circle',
            source: 'stories',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'storyCount'], 1],
                1, 1.5,
                25, 4
              ],
              'circle-color': '#ffffff',
              'circle-opacity': 0.9,
            },
          })

          // Load data
          console.log('Map loaded, fetching globe data...')
          const data = await loadGlobeData()
          if (data) {
            console.log('Globe data loaded:', { newsItems: data.newsItems.length, locations: data.stats.total_locations })
            updateMapData(data)
          } else {
            console.warn('No globe data received')
          }

          // Remove Mapbox branding
          brandingTimeoutRef.current = setTimeout(() => {
            document.querySelectorAll('.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib')
              .forEach(el => el.remove())
          }, 100)

          // Start entrance animation
          if (!hasPlayedEntranceRef.current) {
            console.log('🎬 Starting entrance animation')
            entranceStartTimeRef.current = Date.now()
            entranceAnimationRef.current = requestAnimationFrame(animateEntrance)
          }

          // Animate dot pulsing glow with different phase offsets per layer
          const animatePulse = () => {
            if (!map.current) return
            const t = Date.now() / 1000

            // Animate each glow layer with different phase offset for chaotic effect
            for (let i = 0; i < 3; i++) {
              const layerId = `stories-glow-${i}`
              if (!map.current.getLayer(layerId)) continue

              const phaseOffset = (i * Math.PI * 2) / 3 // 0°, 120°, 240° offsets
              const glowOpacity = 0.12 + (Math.sin(t * 1.2 + phaseOffset) + 1) * 0.08 // 0.12..0.28
              const glowRadius = 3 + (Math.sin(t * 1.5 + phaseOffset) + 1) * 0.8 // 3..4.6

              map.current.setPaintProperty(layerId, 'circle-opacity', glowOpacity)
              map.current.setPaintProperty(layerId, 'circle-radius', glowRadius)
            }

            pulseFrameRef.current = requestAnimationFrame(animatePulse)
          }
          pulseFrameRef.current = requestAnimationFrame(animatePulse)

          // Add country border highlight layers (using fill-outline for polygon geometries)
          map.current.addLayer({
            id: 'country-border-glow',
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': 6,
              'line-opacity': 0.5,
              'line-blur': 4,
            },
          })

          map.current.addLayer({
            id: 'country-border-line',
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': 3,
              'line-opacity': 1.0,
            },
          })

          // Animate border glow - simple pulse effect
          const animateGlimmer = () => {
            if (!map.current) return

            glimmerOffsetRef.current += 0.05
            if (glimmerOffsetRef.current > Math.PI * 2) glimmerOffsetRef.current = 0

            // Pulse the glow layer
            if (map.current.getLayer('country-border-glow')) {
              const glowOpacity = 0.3 + Math.sin(glimmerOffsetRef.current) * 0.2
              map.current.setPaintProperty('country-border-glow', 'line-opacity', glowOpacity)
            }

            glimmerFrameRef.current = requestAnimationFrame(animateGlimmer)
          }
          glimmerFrameRef.current = requestAnimationFrame(animateGlimmer)
        })

        // Click handler
        map.current.on('click', 'stories-dots', (e) => {
          if (!e.features || !e.features[0]) return

          const props = e.features[0].properties
          if (props && props.location && globeDataRef.current) {
            console.log('🎯 Clicked location:', props.location)

            // Stop entrance animation if still running
            if (entranceAnimationRef.current) {
              cancelAnimationFrame(entranceAnimationRef.current)
              entranceAnimationRef.current = null
              hasPlayedEntranceRef.current = true
            }

            // Stop any rotation that might be happening
            lastInteractionRef.current = Date.now()
            if (isRotatingRef.current) {
              console.log('🛑 Stopping rotation for flyTo')
              isRotatingRef.current = false
              if (rotationFrameRef.current) {
                cancelAnimationFrame(rotationFrameRef.current)
                rotationFrameRef.current = null
              }
            }

            // Find the location that this dot represents
            const location = globeDataRef.current.locations.find(loc => loc.name === props.location)
            if (location) {
              console.log('✅ Found location data:', location.name, location.storyCount, 'stories')
              setSelectedLocation(location)

              // Fly to location with tilt for countries
              const isCountry = isCountryLocation(location)
              const zoom = location.defaultZoom || 5
              console.log('🌍 Location type:', isCountry ? 'COUNTRY' : 'city', '| Pitch:', isCountry ? 45 : 0)
              console.log('✈️ Flying to:', location.coordinates, 'zoom:', zoom)

              map.current?.flyTo({
                center: location.coordinates,
                zoom: zoom,
                pitch: isCountry ? 45 : 0,
                duration: 1500,
              })
            } else {
              console.warn('❌ Location not found in globeData:', props.location)
            }
          }
        })

        // Hover cursor
        map.current.on('mouseenter', 'stories-dots', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer'
        })
        map.current.on('mouseleave', 'stories-dots', () => {
          if (map.current) map.current.getCanvas().style.cursor = ''
        })

        // Track user interactions to reset idle timer
        // Note: 'move' is excluded because setCenter() during rotation triggers it
        const interactionEvents = ['mousedown', 'touchstart', 'wheel', 'dragstart']
        interactionEvents.forEach(event => {
          map.current?.on(event, () => {
            // Stop entrance animation if still running
            if (entranceAnimationRef.current) {
              cancelAnimationFrame(entranceAnimationRef.current)
              entranceAnimationRef.current = null
              hasPlayedEntranceRef.current = true
            }

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
        console.error('❌ Error initializing map:', error)
        setMapError(error instanceof Error ? error.message : 'Failed to initialize map')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      // Clean up animations
      if (entranceAnimationRef.current) {
        cancelAnimationFrame(entranceAnimationRef.current)
      }
      if (rotationFrameRef.current) {
        cancelAnimationFrame(rotationFrameRef.current)
      }
      if (pulseFrameRef.current) {
        cancelAnimationFrame(pulseFrameRef.current)
      }
      if (glimmerFrameRef.current) {
        cancelAnimationFrame(glimmerFrameRef.current)
      }
      if (brandingTimeoutRef.current) {
        clearTimeout(brandingTimeoutRef.current)
      }
      if (zoomOutTimeoutRef.current) {
        clearTimeout(zoomOutTimeoutRef.current)
      }

      // Clean up map - map.remove() handles all event listener cleanup
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [loadGlobeData, updateMapData, animateEntrance])


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

  // Helper function to determine if location is a country (not a city)
  const isCountryLocation = useCallback((location: LocationAggregate) => {
    const name = location.name.toLowerCase()
    const subtype = location.locationSubtype?.toLowerCase() || ''

    // Check if it's explicitly not a city
    const isCity = subtype.includes('city') ||
                   subtype.includes('town') ||
                   subtype.includes('region') ||
                   name.includes(',') // Cities usually have format "City, Country"

    return !isCity
  }, [])

  // Idle rotation animation
  const animateRotation = useCallback(() => {
    if (!map.current || !isRotatingRef.current) return

    // Don't rotate when viewing a specific location/story
    if (selectedLocation) {
      stopRotation()
      return
    }

    // Global rotation
    const center = map.current.getCenter()
    const newLng = center.lng + ROTATION_SPEED
    map.current.setCenter([newLng, center.lat])

    rotationFrameRef.current = requestAnimationFrame(animateRotation)
  }, [selectedLocation, stopRotation])

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

  // Auto zoom-out after 1 minute when viewing a story
  useEffect(() => {
    // Clear any existing timeout
    if (zoomOutTimeoutRef.current) {
      clearTimeout(zoomOutTimeoutRef.current)
      zoomOutTimeoutRef.current = null
    }

    // If a location is selected, start the zoom-out timer
    if (selectedLocation && map.current) {
      console.log('⏱️ Starting 1-minute auto zoom-out timer')
      zoomOutTimeoutRef.current = setTimeout(() => {
        console.log('⏰ 1 minute elapsed - zooming back out to globe view')
        if (map.current) {
          map.current.flyTo({
            center: [0, 30],
            zoom: INITIAL_ZOOM,
            pitch: 0,
            bearing: 0,
            duration: 2000, // 2 second animation
          })
        }
        // Clear selection to resume rotation
        setSelectedLocation(null)
        // Reset interaction timer so rotation starts after normal idle timeout
        lastInteractionRef.current = Date.now()
      }, ZOOM_OUT_TIMEOUT)
    }

    // Cleanup on unmount or when selectedLocation changes
    return () => {
      if (zoomOutTimeoutRef.current) {
        clearTimeout(zoomOutTimeoutRef.current)
        zoomOutTimeoutRef.current = null
      }
    }
  }, [selectedLocation])

  // Update country border highlight when selection changes
  useEffect(() => {
    if (!map.current) return

    const updateBorderHighlight = async () => {
      if (!map.current) return

      if (selectedLocation && isCountryLocation(selectedLocation)) {
        // Query actual country boundaries from Mapbox vector tiles
        const countryName = selectedLocation.name.trim()
        console.log('🔍 Border Query: Searching for country:', countryName)

        // Wait for map to be fully loaded and styled
        if (map.current && !map.current.isStyleLoaded()) {
          console.log('⏳ Map style not loaded, waiting...')
          await new Promise((resolve) => {
            map.current?.once('idle', resolve)
          })
          console.log('✅ Map style loaded')
        }

        if (!map.current) return

        try {
          // Query rendered features at the country's center point
          const point = map.current.project(selectedLocation.coordinates)

          // Query all visible admin-0 boundary features
          const allFeatures = map.current.queryRenderedFeatures(point, {
            layers: ['admin-0-boundary', 'admin-0-boundary-bg', 'admin-0-boundary-disputed']
          })

          console.log(`📊 Found ${allFeatures.length} features at point`)

          // Match country by name
          const normalizedSearch = countryName.toLowerCase().trim()
          console.log('🔎 Searching for normalized name:', normalizedSearch)

          const matchedFeature = allFeatures.find((feature) => {
            const props = feature.properties
            if (!props) return false

            // Check various name properties that Mapbox uses
            const names = [
              props.name,
              props.name_en,
              props.name_long,
              props.iso_3166_1,
              props.iso_3166_1_alpha_3,
            ].filter(Boolean)

            const found = names.some((name) => {
              const normalized = String(name).toLowerCase().trim()
              return normalized === normalizedSearch ||
                     normalized.includes(normalizedSearch) ||
                     normalizedSearch.includes(normalized)
            })

            if (found) {
              console.log('🎯 Match found with names:', names)
            }

            return found
          })

          if (matchedFeature && matchedFeature.geometry) {
            console.log('✅ Border Match Found!', {
              name: matchedFeature.properties?.name,
              name_en: matchedFeature.properties?.name_en,
              iso: matchedFeature.properties?.iso_3166_1,
              geometryType: matchedFeature.geometry.type,
            })

            // Use the actual geometry (Polygon or MultiPolygon)
            const borderGeoJSON = {
              type: 'FeatureCollection' as const,
              features: [
                {
                  type: 'Feature' as const,
                  geometry: matchedFeature.geometry,
                  properties: {},
                },
              ],
            }

            const glowSource = map.current.getSource('country-border-glow') as mapboxgl.GeoJSONSource
            const lineSource = map.current.getSource('country-border-line') as mapboxgl.GeoJSONSource

            if (glowSource) glowSource.setData(borderGeoJSON)
            if (lineSource) lineSource.setData(borderGeoJSON)
            console.log('🎨 Border layers updated with geometry')
          } else {
            // Fallback: if no match found, clear the borders
            console.warn(`❌ No boundary match found for country: ${countryName}`)

            // Debug: log some sample country names to help matching
            const sampleNames = allFeatures.slice(0, 5).map(f => f.properties?.name || f.properties?.name_en)
            console.log('📝 Sample country names in data:', sampleNames)

            const emptyGeoJSON = {
              type: 'FeatureCollection' as const,
              features: [],
            }

            const glowSource = map.current.getSource('country-border-glow') as mapboxgl.GeoJSONSource
            const lineSource = map.current.getSource('country-border-line') as mapboxgl.GeoJSONSource

            if (glowSource) glowSource.setData(emptyGeoJSON)
            if (lineSource) lineSource.setData(emptyGeoJSON)
          }
        } catch (error) {
          console.error('❌ Error querying country boundaries:', error)
          // Clear on error
          const emptyGeoJSON = {
            type: 'FeatureCollection' as const,
            features: [],
          }

          const glowSource = map.current.getSource('country-border-glow') as mapboxgl.GeoJSONSource
          const lineSource = map.current.getSource('country-border-line') as mapboxgl.GeoJSONSource

          if (glowSource) glowSource.setData(emptyGeoJSON)
          if (lineSource) lineSource.setData(emptyGeoJSON)
        }
      } else {
        // Clear border when no country selected
        console.log('🧹 Clearing border (no country selected or not a country)')
        const emptyGeoJSON = {
          type: 'FeatureCollection' as const,
          features: [],
        }

        const glowSource = map.current.getSource('country-border-glow') as mapboxgl.GeoJSONSource
        const lineSource = map.current.getSource('country-border-line') as mapboxgl.GeoJSONSource

        if (glowSource) glowSource.setData(emptyGeoJSON)
        if (lineSource) lineSource.setData(emptyGeoJSON)
      }
    }

    updateBorderHighlight()
  }, [selectedLocation, isCountryLocation])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Map */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      />

      {/* Top Right Controls - Map Style Toggle & Stories Link */}
      {globeData && !isLoading && !selectedLocation && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <a
            href="/stories"
            className="px-4 py-2.5 bg-black/80 backdrop-blur border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 hover:border-white/40 transition-all flex items-center gap-2"
            title="View stories feed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>Stories</span>
          </a>
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

      {/* Search Bar - Top Center */}
      {globeData && !isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-96 max-w-[90vw] z-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(e.target.value.length > 0)
              }}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              placeholder="Search location..."
              className="w-full px-4 py-2.5 bg-black/80 backdrop-blur border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/40 transition-colors"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery && (() => {
              const filteredLocations = globeData.locations.filter(loc =>
                loc.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 8)

              return filteredLocations.length > 0 ? (
                <div className="absolute top-full mt-2 w-full bg-black/90 backdrop-blur border border-white/20 rounded-lg overflow-hidden">
                  {filteredLocations.map(loc => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setSelectedLocation(loc)
                        setSearchQuery('')
                        setShowSearchResults(false)
                        if (map.current) {
                          const isCountry = isCountryLocation(loc)
                          const zoom = loc.defaultZoom || 4
                          map.current.flyTo({
                            center: loc.coordinates,
                            zoom: zoom,
                            pitch: isCountry ? 45 : 0,
                            duration: 2000,
                          })
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-200">{loc.name}</span>
                        <span className="text-xs text-gray-500">{loc.storyCount} stories</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="absolute top-full mt-2 w-full bg-black/90 backdrop-blur border border-white/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-500">No locations found</p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Trending Section - Top Left */}
      {globeData && !isLoading && (() => {
        // Always show global trending stories (top stories of the day)
        const locationsToScan = globeData.locations

        // Flatten all stories from all locations
        const allStories: Array<{
          story: LocationAggregate['stories'][0]
          location: LocationAggregate
        }> = []

        locationsToScan.forEach(loc => {
          loc.stories.forEach(story => {
            allStories.push({ story, location: loc })
          })
        })

        // Group stories by similar content (using first 100 chars of summary as key)
        const storyGroups = new Map<string, Array<typeof allStories[0]>>()

        allStories.forEach(item => {
          const content = (item.story.summary || item.story.title || '').trim()
          const key = content.substring(0, 100).toLowerCase()

          if (!storyGroups.has(key)) {
            storyGroups.set(key, [])
          }
          storyGroups.get(key)!.push(item)
        })

        // Convert to array and sort by count (most reported stories first)
        const trendingStories = Array.from(storyGroups.entries())
          .map(([key, items]) => ({
            content: (items[0].story.summary || items[0].story.title || 'No content').trim(),
            count: items.length,
            locations: Array.from(new Set(items.map(i => i.location.name))),
            firstItem: items[0],
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)

        return (
          <div className="absolute top-4 left-4 w-96 max-w-[90vw] bg-black/80 backdrop-blur rounded-lg text-white overflow-hidden transition-all duration-300">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    TRENDING
                  </h2>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 uppercase">LIVE</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
                  {isTrendingCollapsed && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({trendingStories.length})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsTrendingCollapsed(!isTrendingCollapsed)}
                  className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title={isTrendingCollapsed ? 'Expand trending' : 'Collapse trending'}
                  aria-label={isTrendingCollapsed ? 'Expand trending panel' : 'Collapse trending panel'}
                >
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                      isTrendingCollapsed ? 'rotate-90' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              {!isTrendingCollapsed && (
                <p className="text-xs text-gray-500 mb-3">
                  Top stories worldwide
                </p>
              )}
            </div>
            <div
              className={`transition-all duration-300 ease-in-out ${
                isTrendingCollapsed ? 'max-h-0 opacity-0' : 'max-h-[70vh] opacity-100'
              }`}
              style={{
                overflow: isTrendingCollapsed ? 'hidden' : 'auto',
              }}
            >
              <div className="px-4 pb-4 space-y-3">
              {trendingStories.map((trending, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const loc = trending.firstItem.location
                    console.log('🔥 Trending story clicked:', loc.name, 'at', loc.coordinates, 'zoom:', loc.defaultZoom)

                    // Cancel any entrance animation
                    if (entranceAnimationRef.current) {
                      cancelAnimationFrame(entranceAnimationRef.current)
                      entranceAnimationRef.current = null
                    }

                    // Stop idle rotation
                    resetInteraction()

                    setSelectedLocation(loc)
                    if (map.current) {
                      const isCountry = isCountryLocation(loc)
                      const zoom = loc.defaultZoom || 4
                      console.log('✈️ Flying to trending location:', loc.coordinates, 'zoom:', zoom, 'pitch:', isCountry ? 45 : 0)
                      map.current.flyTo({
                        center: loc.coordinates,
                        zoom: zoom,
                        pitch: isCountry ? 45 : 0,
                        duration: 1500,
                      })
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 rounded bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-500 font-mono mt-0.5 flex-shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 group-hover:text-white line-clamp-2 mb-1">
                        {trending.content.length > 120
                          ? `${trending.content.substring(0, 120)}...`
                          : trending.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded">
                          {trending.count} {trending.count === 1 ? 'report' : 'reports'}
                        </span>
                        <span className="truncate">
                          {trending.locations.slice(0, 2).join(', ')}
                          {trending.locations.length > 2 && ` +${trending.locations.length - 2}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Location Detail Panel */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 w-96 max-w-[90vw] bg-black/80 backdrop-blur rounded-lg p-4 text-white max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {selectedLocation.name}
              </span>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                {selectedLocation.storyCount} stories
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMapStyle}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title={`Switch to ${mapStyle === 'street' ? 'satellite' : 'street'} view`}
              >
                {mapStyle === 'street' ? (
                  <svg className="h-4 w-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-200 space-y-2">
            {selectedLocation.stories.slice(0, 20).map((s) => {
              const summaryText = (s.summary || s.title || 'No content').trim()
              const isLongSummary = summaryText.length > STORY_SUMMARY_LIMIT
              const isExpanded = expandedStories.has(s.id)
              const displaySummary =
                isLongSummary && !isExpanded
                  ? `${summaryText.slice(0, STORY_SUMMARY_LIMIT).trimEnd()}…`
                  : summaryText

              return (
                <div key={s.id} className="py-2 border-b border-white/10 last:border-b-0">
                  {/* Content left, media right */}
                  <div className="flex gap-3">
                    {/* Left side - text content */}
                    <div className="flex-1 min-w-0">
                      {/* Post text content */}
                      <div className="text-sm text-gray-200 mb-2">{displaySummary}</div>
                      {isLongSummary && (
                        <button
                          type="button"
                          onClick={() => toggleStoryExpansion(s.id)}
                          className="text-xs uppercase tracking-wider text-white/60 hover:text-white focus:outline-none"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}

                      {/* Source and link */}
                      <div className="flex items-center justify-between gap-3 text-[11px] text-gray-400">
                        <div className="flex items-center gap-1.5">
                          {/* Source icon (Telegram or RSS) */}
                          <img
                            src="/telegram-icon.png"
                            alt="Source"
                            className="h-3.5 w-3.5 opacity-60"
                          />
                          <span className="uppercase text-[10px] tracking-wider">{s.sourceName || 'Source unknown'}</span>
                        </div>
                        {s.sourceUrl ? (
                          <a
                            href={s.sourceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex items-center gap-1 text-white/70 hover:text-white"
                            aria-label={`Open ${s.sourceName || 'source'} story`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M7 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                              <polyline points="16 3 21 3 21 8" />
                              <line x1="15" y1="9" x2="21" y2="3" />
                            </svg>
                            <span className="text-[10px]">View</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic">No link available</span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-[11px] text-gray-500 mt-1">
                        {new Date(s.created).toLocaleString()}
                      </div>
                    </div>

                    {/* Right side - media (image or video thumbnail) */}
                    {s.mediaUrl && (
                      <a
                        href={s.mediaUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex-shrink-0 block w-40 h-40 rounded overflow-hidden border border-white/20 hover:border-white/40 transition-colors bg-black/30"
                        title="View media"
                      >
                        {s.hasPhoto ? (
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(s.mediaUrl)}`}
                            alt="Story image"
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error('Image failed to load:', s.mediaUrl)
                              // Hide image container on error
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : s.hasVideo ? (
                          <video
                            src={`/api/proxy-image?url=${encodeURIComponent(s.mediaUrl)}`}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : null}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint */}
      {!selectedLocation && globeData && (
        <div className="absolute bottom-4 right-4 bg-black/50 rounded px-3 py-1.5 text-xs text-gray-400">
          Dot size = story volume
        </div>
      )}
    </div>
  )
}
