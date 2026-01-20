'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createRoot } from 'react-dom/client'
import type { FeatureCollection, Feature, Point, LineString } from 'geojson'


// Global styles for ripple effect on click and pulse animation
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

    @keyframes ripple-expand {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.9;
      }
      40% {
        opacity: 0.5;
      }
      100% {
        transform: translate(-50%, -50%) scale(4);
        opacity: 0;
      }
    }

    @keyframes slideInFade {
      0% {
        opacity: 0;
        transform: translateX(-20px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .hover-card-enter {
      animation: slideInFade 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .ripple-effect {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.9);
      pointer-events: none;
      animation: ripple-expand 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
      z-index: 1000;
    }
  `
  if (!document.getElementById('globey-ripple-animation')) {
    style.id = 'globey-ripple-animation'
    document.head.appendChild(style)
  }
}
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
  const markersRef = useRef<mapboxgl.Marker[]>([])

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
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')

  const brandingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      id: item.id, // Feature-level ID required for feature-state
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

  // Create custom markers for dots
  useEffect(() => {
    if (!map.current || !globeData) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Create markers for each location
    globeData.locations.forEach((location, index) => {
      if (!map.current) return

      const el = document.createElement('div')
      el.className = 'custom-marker-container'

      const root = createRoot(el)
      const animationDelay = Math.random() * 3
      root.render(<MapMarker location={location} animationDelay={animationDelay} />)

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        offset: [0, 0] // Keep dots centered on coordinates
      })
        .setLngLat(location.coordinates)
        .addTo(map.current)

      // Pass click handler to the marker component
      el.addEventListener('click', (e) => {
        if (!map.current || !globeDataRef.current) return

        // Stop idle rotation
        if (isRotatingRef.current) {
          isRotatingRef.current = false
          if (rotationFrameRef.current) {
            cancelAnimationFrame(rotationFrameRef.current)
            rotationFrameRef.current = null
          }
        }

        // Reset interaction timer
        lastInteractionRef.current = Date.now()

        setSelectedLocation(location)
        const isCountry = isCountryLocation(location)
        const zoom = location.defaultZoom || 5

        map.current.flyTo({
          center: location.coordinates,
          zoom: zoom,
          pitch: isCountry ? 45 : 0,
          duration: 1500,
        })
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(marker => marker.remove())
    }
  }, [globeData, isCountryLocation])

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
    <>
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Map */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      />


      {/* Top Right Controls - Map Style Toggle */}
      {globeData && !isLoading && !selectedLocation && (
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

    </div>
    </>
  )
}

function MapMarker({ location, animationDelay }: { location: LocationAggregate; animationDelay: number }) {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't stop propagation so click can reach parent
    setIsPressed(true)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Don't stop propagation so click can reach parent
    setIsPressed(false)
    createRipple()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't stop propagation so click can reach parent
    setIsPressed(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Don't stop propagation so click can reach parent
    setIsPressed(false)
    createRipple()
  }

  const createRipple = () => {
    const rippleId = Date.now()
    setRipples(prev => [...prev, rippleId])
    setTimeout(() => {
      setRipples(prev => prev.filter(id => id !== rippleId))
    }, 600)
  }

  const handleMouseLeave = () => {
    setIsPressed(false)
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  // Size based on story count (reduced by 50%)
  const baseSize = Math.min(6 + location.storyCount * 0.25, 10)

  // Get primary story for the card
  const primaryStory = location.stories.find(s => s.mediaUrl) || location.stories[0]
  const displayTitle = primaryStory?.title || location.name
  const displaySummary = primaryStory?.summary || `${location.storyCount} stories in this location`

  return (
    <div className="relative" style={{ zIndex: isHovered ? 1 : 100 }}>
      <div
        className="bg-white rounded-full transition-all duration-100 ease-out cursor-pointer"
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          animation: `pulse-glow 2.5s ease-in-out infinite`,
          animationDelay: `${animationDelay}s`,
          transform: isPressed ? 'scale(0.75)' : isHovered ? 'scale(1.5)' : 'scale(1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.8), inset 0 0 2px rgba(255,255,255,0.3)',
          position: 'relative',
          zIndex: isHovered ? 200 : 100,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {ripples.map(rippleId => (
          <div key={rippleId} className="ripple-effect" />
        ))}
      </div>

      {/* Hover Card with slide-in fade animation */}
      {isHovered && (
        <div
          className="absolute hover-card-enter pointer-events-none"
          style={{
            left: `${baseSize + 20}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '320px',
            zIndex: 50, // Below other dots (100) but above map
          }}
        >
          <div className="bg-black/95 backdrop-blur-3xl backdrop-saturate-0 border border-white/40 rounded-xl p-3 text-white shadow-2xl flex items-start gap-3">
            {/* Thumbnail */}
            {primaryStory?.mediaUrl ? (
              <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                <img
                  src={`/api/proxy-image?url=${encodeURIComponent(primaryStory.mediaUrl)}`}
                  alt={displayTitle.substring(0, 50)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                <div className="text-gray-500 text-xs">📍</div>
              </div>
            )}

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-100 leading-tight mb-1 line-clamp-2">
                {displayTitle.substring(0, 80)}
              </h3>
              <p className="text-[10px] text-gray-300 leading-relaxed line-clamp-3">
                {displaySummary.substring(0, 150)}
              </p>
              {location.storyCount > 1 && (
                <p className="text-[9px] text-white/80 mt-1">
                  +{location.storyCount - 1} more {location.storyCount === 2 ? 'story' : 'stories'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
