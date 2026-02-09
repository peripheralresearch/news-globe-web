'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createRoot } from 'react-dom/client'
import type { FeatureCollection, Feature, Point, LineString } from 'geojson'


// Theme configuration
type Theme = 'light' | 'dark'

const THEME_CONFIG = {
  light: {
    mapStyle: 'mapbox://styles/mapbox/light-v11',
    dotColor: '#1a1a2e',
    fog: {
      color: '#ffffff',
      highColor: '#f0f0f0',
      spaceColor: '#ffffff',
      starIntensity: 0,
    },
    background: 'bg-white',
    panel: {
      bg: 'bg-white/95',
      border: 'border-gray-200',
      hoverBorder: 'hover:border-gray-400',
      hoverBg: 'hover:bg-white',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      textFaint: 'text-gray-500',
      imagePlaceholder: 'bg-gray-100',
      divider: 'border-gray-200',
      dividerFaint: 'border-gray-100',
      scrollbar: 'rgba(0,0,0,0.2)',
      iconFilter: 'brightness(0)',
    },
    buttonBg: 'bg-white/90',
    buttonBorder: 'border-gray-200',
    buttonText: 'text-gray-700',
    buttonHover: 'hover:bg-gray-100 hover:border-gray-300',
  },
  dark: {
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    dotColor: '#ffffff',
    fog: {
      color: '#0a0a0f',
      highColor: '#1a1a2e',
      spaceColor: '#000000',
      starIntensity: 0.15,
    },
    background: 'bg-black',
    panel: {
      bg: 'bg-black/95',
      border: 'border-white/40',
      hoverBorder: 'hover:border-white/60',
      hoverBg: 'hover:bg-black',
      text: 'text-white',
      textMuted: 'text-gray-300',
      textFaint: 'text-gray-400',
      imagePlaceholder: 'bg-gray-800',
      divider: 'border-white/20',
      dividerFaint: 'border-white/10',
      scrollbar: 'rgba(255,255,255,0.3)',
      iconFilter: 'brightness(0) invert(1)',
    },
    buttonBg: 'bg-black/70',
    buttonBorder: 'border-white/30',
    buttonText: 'text-white',
    buttonHover: 'hover:bg-black/90 hover:border-white/50',
  },
}

// Function to inject theme-specific CSS
function injectThemeStyles(theme: Theme) {
  const config = THEME_CONFIG[theme]
  const dotColor = config.dotColor
  const dotRgb = theme === 'dark' ? '255, 255, 255' : '26, 26, 46'

  const styleId = 'globey-ripple-animation'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = `
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 12px rgba(${dotRgb}, ${theme === 'dark' ? '0.4' : '0.3'}),
                    0 0 24px rgba(${dotRgb}, ${theme === 'dark' ? '0.25' : '0.2'}),
                    0 0 36px rgba(${dotRgb}, ${theme === 'dark' ? '0.15' : '0.1'}),
                    0 0 48px rgba(${dotRgb}, ${theme === 'dark' ? '0.08' : '0.05'});
      }
      50% {
        box-shadow: 0 0 20px rgba(${dotRgb}, ${theme === 'dark' ? '0.6' : '0.4'}),
                    0 0 40px rgba(${dotRgb}, ${theme === 'dark' ? '0.4' : '0.3'}),
                    0 0 60px rgba(${dotRgb}, ${theme === 'dark' ? '0.25' : '0.2'}),
                    0 0 80px rgba(${dotRgb}, ${theme === 'dark' ? '0.15' : '0.1'});
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
      background-color: rgba(${dotRgb}, ${theme === 'dark' ? '0.8' : '0.6'});
      border: 1px solid rgba(${dotRgb}, ${theme === 'dark' ? '0.9' : '0.7'});
      pointer-events: none;
      animation: ripple-expand 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
      z-index: 1000;
    }
  `
}

// Initial style injection
if (typeof document !== 'undefined') {
  injectThemeStyles('dark')
}
interface NewsItem {
    id: string
    title: string | null
    summary: string | null
    created: string
    location: string
    coordinates: [number, number]  // From event_location - where the news event occurred
    newsItemCount?: number
}

interface LocationAggregate {
  name: string
  locationSubtype: string
  coordinates: [number, number]  // From event_location - actual location where events occurred
  defaultZoom?: number
  newsItemCount: number
  eventLocation?: boolean        // Indicates this is an event location (not just mentioned)
  newsItems: Array<{
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

const NEWS_ITEM_SUMMARY_LIMIT = 220
const INITIAL_GLOBE_LIMIT = 35
const FULL_GLOBE_LIMIT = 150

const IDLE_TIMEOUT = 10000 // 10 seconds before rotation starts
const ROTATION_SPEED = 0.015 // degrees per frame (slow rotation)
const ZOOM_OUT_TIMEOUT = 60000 // 1 minute before auto zoom-out when viewing story
const INITIAL_ZOOM = 0.5 // Initial zoom level for globe view

// Entrance animation constants
const ENTRANCE_DURATION = 5500 // 5.5 seconds for entrance animation
const ENTRANCE_SPEED_MULTIPLIER = 12 // Start at 12x the idle speed for dramatic entrance

// Helper function to get source icon based on source name
function getSourceIcon(sourceName: string): JSX.Element {
  if (!sourceName) {
    return (
      <img
        src="/icons/newspaper.png"
        alt="news"
        className="inline-block w-3 h-3 align-middle"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    )
  }

  const source = sourceName.toLowerCase().trim()

  // Telegram sources
  if (source.includes('clash report') || source.includes('telegram')) {
    return (
      <img
        src="/icons/telegram.svg"
        alt="telegram"
        className="inline-block w-3 h-3 align-middle"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    )
  }

  // TV/Broadcasting
  if (
    source.includes('bbc') ||
    source.includes('cnn') ||
    source.includes('al jazeera') ||
    source.includes('fox news') ||
    source.includes('msnbc') ||
    source.includes('sky news') ||
    source.includes('channel') ||
    source.includes('television') ||
    source.includes('broadcast')
  ) {
    return (
      <img
        src="/icons/television.png"
        alt="television"
        className="inline-block w-3 h-3 align-middle"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    )
  }

  // Wire services, social media, and online outlets all use newspaper icon
  return (
    <img
      src="/icons/newspaper.png"
      alt="news"
      className="inline-block w-3 h-3 align-middle"
      style={{ filter: 'brightness(0) invert(1)' }}
    />
  )

}
// Helper function to format date string
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Unknown date'
    }
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    // Check if date is within last 7 days
    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo < 7) {
      return `${daysAgo} days ago`
    }
    
    // Otherwise show month and day
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  } catch {
    return 'Unknown date'
  }
}


export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const eventLocationsRef = useRef<FeatureCollection<Point>>({ type: 'FeatureCollection', features: [] })
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

  // Ring animation ref
  const ringFrameRef = useRef<number | null>(null)
  const ringRadiusRef = useRef(0)
  const ringAnimatingRef = useRef(false)

  // Generate circle coordinates on a sphere given center point and angular radius (in degrees)
  const getCircleCoordinates = useCallback((centerLng: number, centerLat: number, radiusDeg: number) => {
    const points: [number, number][] = []
    const numPoints = 90 // Smoothness of circle

    // Convert to radians
    const centerLatRad = (centerLat * Math.PI) / 180
    const centerLngRad = (centerLng * Math.PI) / 180
    const radiusRad = (radiusDeg * Math.PI) / 180

    for (let i = 0; i <= numPoints; i++) {
      const bearing = (i / numPoints) * 2 * Math.PI // 0 to 2π

      // Spherical geometry: destination point given start, bearing, and angular distance
      const lat2 = Math.asin(
        Math.sin(centerLatRad) * Math.cos(radiusRad) +
        Math.cos(centerLatRad) * Math.sin(radiusRad) * Math.cos(bearing)
      )
      const lng2 = centerLngRad + Math.atan2(
        Math.sin(bearing) * Math.sin(radiusRad) * Math.cos(centerLatRad),
        Math.cos(radiusRad) - Math.sin(centerLatRad) * Math.sin(lat2)
      )

      // Convert back to degrees
      points.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
    }

    return points
  }, [])

  // Trigger a ripple ring animation expanding from a point
  const triggerRingAnimation = useCallback((centerLng: number, centerLat: number) => {
    if (!map.current || ringAnimatingRef.current) return

    ringAnimatingRef.current = true
    ringRadiusRef.current = 0

    const animateRing = () => {
      if (!map.current) {
        ringAnimatingRef.current = false
        return
      }

      // Expand radius outward
      ringRadiusRef.current += 1.5 // Speed of expansion (degrees per frame)

      // Update the ring position
      const source = map.current.getSource('equator-ring') as mapboxgl.GeoJSONSource
      if (source) {
        const coordinates = getCircleCoordinates(centerLng, centerLat, ringRadiusRef.current)
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {},
        })
      }

      // Animation complete when ring reaches other side of globe (180°)
      if (ringRadiusRef.current >= 180) {
        // Hide the ring by making it tiny at origin
        if (source) {
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [0, 0]],
            },
            properties: {},
          })
        }
        ringAnimatingRef.current = false
        ringFrameRef.current = null
        return
      }

      ringFrameRef.current = requestAnimationFrame(animateRing)
    }

    ringFrameRef.current = requestAnimationFrame(animateRing)
  }, [getCircleCoordinates])

  const [globeData, setGlobeData] = useState<GlobeData | null>(null)
  const globeDataRef = useRef<GlobeData | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationAggregate | null>(null)
  const [clickedLocation, setClickedLocation] = useState<LocationAggregate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')
  const [theme, setTheme] = useState<Theme>('dark')

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

  // Toggle theme handler
  const toggleTheme = useCallback(() => {
    if (!map.current) return

    const newTheme = theme === 'dark' ? 'light' : 'dark'
    const config = THEME_CONFIG[newTheme]

    setTheme(newTheme)
    injectThemeStyles(newTheme)

    // Store current data
    const eventLocationsData = eventLocationsRef.current

    // Set new map style
    map.current.setStyle(config.mapStyle)

    // Re-add layers after style loads
    map.current.once('style.load', () => {
      if (!map.current) return

      map.current.setProjection('globe')

      map.current.setFog({
        'horizon-blend': 0.02,
        color: config.fog.color,
        'high-color': config.fog.highColor,
        'space-color': config.fog.spaceColor,
        'star-intensity': config.fog.starIntensity,
      })

      // Re-add event-locations source
      if (!map.current.getSource('event-locations')) {
        map.current.addSource('event-locations', {
          type: 'geojson',
          data: eventLocationsData,
        })
      }

      // Re-add layers with theme colors
      const dotColor = config.dotColor

      if (!map.current.getLayer('event-locations-dots')) {
        map.current.addLayer({
          id: 'event-locations-dots',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 1.5, 25, 4],
            'circle-color': dotColor,
            'circle-opacity': 0.9,
          },
        })
      }

      if (!map.current.getLayer('event-locations-glow-outer')) {
        map.current.addLayer({
          id: 'event-locations-glow-outer',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 12, 25, 18],
            'circle-color': dotColor,
            'circle-opacity': 0.1,
            'circle-blur': 1,
          },
        })
      }

      if (!map.current.getLayer('event-locations-glow-middle')) {
        map.current.addLayer({
          id: 'event-locations-glow-middle',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 8, 25, 12],
            'circle-color': dotColor,
            'circle-opacity': 0.15,
            'circle-blur': 0.8,
          },
        })
      }

      if (!map.current.getLayer('event-locations-glow-inner')) {
        map.current.addLayer({
          id: 'event-locations-glow-inner',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 5, 25, 8],
            'circle-color': dotColor,
            'circle-opacity': 0.25,
            'circle-blur': 0.5,
          },
        })
      }

      // Re-add ring source and layers
      if (!map.current.getSource('equator-ring')) {
        map.current.addSource('equator-ring', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] }, properties: {} },
        })
      }

      if (!map.current.getLayer('equator-ring-glow')) {
        map.current.addLayer({
          id: 'equator-ring-glow',
          type: 'line',
          source: 'equator-ring',
          paint: { 'line-color': dotColor, 'line-width': 8, 'line-opacity': 0.1, 'line-blur': 6 },
        })
      }

      if (!map.current.getLayer('equator-ring-line')) {
        map.current.addLayer({
          id: 'equator-ring-line',
          type: 'line',
          source: 'equator-ring',
          paint: { 'line-color': dotColor, 'line-width': 1.5, 'line-opacity': 0.4 },
        })
      }

      // Re-add border sources and layers
      if (!map.current.getSource('country-border-glow')) {
        map.current.addSource('country-border-glow', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      }

      if (!map.current.getLayer('country-border-glow')) {
        map.current.addLayer({
          id: 'country-border-glow',
          type: 'line',
          source: 'country-border-glow',
          paint: { 'line-color': dotColor, 'line-width': 6, 'line-opacity': 0.3, 'line-blur': 4 },
        })
      }

      if (!map.current.getSource('country-border-line')) {
        map.current.addSource('country-border-line', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      }

      if (!map.current.getLayer('country-border-line')) {
        map.current.addLayer({
          id: 'country-border-line',
          type: 'line',
          source: 'country-border-line',
          paint: { 'line-color': dotColor, 'line-width': 3, 'line-opacity': 0.8 },
        })
      }
    })
  }, [theme])

  // Toggle map style handler
  const toggleMapStyle = useCallback(() => {
    if (!map.current) return

    const newStyle = mapStyle === 'street' ? 'satellite' : 'street'
    const styleUrl = newStyle === 'street'
      ? 'mapbox://styles/mapbox/light-v11'
      : 'mapbox://styles/mapbox/satellite-streets-v12'

    setMapStyle(newStyle)

    // Store current sources and layers data before style change
    const eventLocationsData = eventLocationsRef.current

    // Set new style
    map.current.setStyle(styleUrl)

    // Re-add custom layers and data after style loads
    map.current.once('style.load', () => {
      if (!map.current) return

      // Restore globe projection and atmosphere
      map.current.setProjection('globe')

      // Restore atmosphere
      map.current.setFog({
        'horizon-blend': 0.02,
        color: '#ffffff',
        'high-color': '#f0f0f0',
        'space-color': '#ffffff',
        'star-intensity': 0,
      })

      // Re-add event-locations source (check if it already exists first)
      if (!map.current.getSource('event-locations')) {
        map.current.addSource('event-locations', {
          type: 'geojson',
          data: eventLocationsData,
        })
      }

      // Re-add base GPU-rendered dots layer
      if (!map.current.getLayer('event-locations-dots')) {
        map.current.addLayer({
          id: 'event-locations-dots',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'newsItemCount'], 1],
              1, 1.5,
              25, 4
            ],
            'circle-color': '#1a1a2e',
            'circle-opacity': 0.9,
          },
        })
      }

      // Re-add glow layers (check if they already exist first)
      if (!map.current.getLayer('event-locations-glow-outer')) {
        map.current.addLayer({
          id: 'event-locations-glow-outer',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'newsItemCount'], 1],
              1, 12,
              25, 18
            ],
            'circle-color': '#1a1a2e',
            'circle-opacity': 0.1,
            'circle-blur': 1,
          },
        })
      }

      if (!map.current.getLayer('event-locations-glow-middle')) {
        map.current.addLayer({
          id: 'event-locations-glow-middle',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'newsItemCount'], 1],
              1, 8,
              25, 12
            ],
            'circle-color': '#1a1a2e',
            'circle-opacity': 0.15,
            'circle-blur': 0.8,
          },
        })
      }

      if (!map.current.getLayer('event-locations-glow-inner')) {
        map.current.addLayer({
          id: 'event-locations-glow-inner',
          type: 'circle',
          source: 'event-locations',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'newsItemCount'], 1],
              1, 5,
              25, 8
            ],
            'circle-color': '#1a1a2e',
            'circle-opacity': 0.25,
            'circle-blur': 0.5,
          },
        })
      }

      // Re-add equator ring source first (needed for ring animation)
      if (!map.current.getSource('equator-ring')) {
        map.current.addSource('equator-ring', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [0, 0]], // Hidden initially
            },
            properties: {},
          },
        })
      }

      // Re-add equator ring layers
      if (!map.current.getLayer('equator-ring-glow')) {
        map.current.addLayer({
          id: 'equator-ring-glow',
          type: 'line',
          source: 'equator-ring',
          paint: {
            'line-color': '#1a1a2e',
            'line-width': 8,
            'line-opacity': 0.1,
            'line-blur': 6,
          },
        })
      }

      if (!map.current.getLayer('equator-ring-line')) {
        map.current.addLayer({
          id: 'equator-ring-line',
          type: 'line',
          source: 'equator-ring',
          paint: {
            'line-color': '#1a1a2e',
            'line-width': 1.5,
            'line-opacity': 0.4,
          },
        })
      }

      // Re-add country border sources and layers separately
      if (!map.current.getSource('country-border-glow')) {
        map.current.addSource('country-border-glow', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        })
      }

      if (!map.current.getLayer('country-border-glow')) {
        map.current.addLayer({
          id: 'country-border-glow',
          type: 'line',
          source: 'country-border-glow',
          paint: {
            'line-color': '#1a1a2e',
            'line-width': 6,
            'line-opacity': 0.3,
            'line-blur': 4,
          },
        })
      }

      if (!map.current.getSource('country-border-line')) {
        map.current.addSource('country-border-line', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        })
      }

      if (!map.current.getLayer('country-border-line')) {
        map.current.addLayer({
          id: 'country-border-line',
          type: 'line',
          source: 'country-border-line',
          paint: {
            'line-color': '#1a1a2e',
            'line-width': 3,
            'line-opacity': 0.8,
          },
        })
      }

      console.log('Map style changed to:', newStyle)
    })
  }, [mapStyle])

  // Load globe data
  const fetchGlobePage = useCallback(async (limit: number) => {
    try {
      const response = await fetch(`/api/sentinel/globe?limit=${limit}&hours=0`)
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
        if (!Array.isArray(loc.news_items) || !loc.coordinates) continue

        const mappedNewsItems = loc.news_items.map((s: any) => ({
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

        if (mappedNewsItems.length === 0) continue

        const firstItem = mappedNewsItems[0]
        newsItems.push({
          id: firstItem.id,
          title: firstItem.title,
          summary: firstItem.summary,
          created: firstItem.created,
          location: loc.entity_name,
          coordinates: loc.coordinates,
          newsItemCount: loc.news_item_count,
        })

        locations.push({
          name: loc.entity_name,
          locationSubtype: loc.location_subtype,
          coordinates: loc.coordinates,
          defaultZoom: loc.default_zoom,
          newsItemCount: loc.news_item_count,
          newsItems: mappedNewsItems,
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

      // Signal overlay that data is loaded - trigger wipe-out animation
      window.dispatchEvent(new Event('globe-wipe-arrived'))

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


  // Update map with news item points plotted at event_location coordinates
  const updateMapData = useCallback((data: GlobeData) => {
    if (!map.current) {
      console.warn('Map not initialized, cannot update data')
      return
    }

    console.log('Updating map with', data.newsItems.length, 'news items')

    // Helper function to generate a pseudo-random phase offset (0-1) from coordinates
    // This ensures each dot has a unique but deterministic phase
    const generatePhaseOffset = (lng: number, lat: number, id: string): number => {
      // Use coordinates and ID to create a unique seed
      const seed = Math.abs(Math.sin(lng * 12.9898 + lat * 78.233 + id.charCodeAt(0) * 43758.5453))
      return seed % 1 // Returns value between 0 and 1
    }

    // Create news item features from event_location data
    const newsItemFeatures: Feature<Point>[] = data.newsItems.map((item) => {
      const phaseOffset = generatePhaseOffset(item.coordinates[0], item.coordinates[1], item.id)

      return {
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
          newsItemCount: item.newsItemCount || 1,
          phaseOffset: phaseOffset, // Unique phase offset for each dot (0-1)
        }
      }
    })

    eventLocationsRef.current = { type: 'FeatureCollection', features: newsItemFeatures }

    const source = map.current.getSource('event-locations') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(eventLocationsRef.current)
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
      root.render(
        <MapMarker
          location={location}
          animationDelay={animationDelay}
          isClicked={clickedLocation?.name === location.name}
          theme={theme}
        />
      )

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
        setClickedLocation(location)
        const isCountry = isCountryLocation(location)
        const zoom = location.defaultZoom || 5

        map.current.flyTo({
          center: location.coordinates,
          zoom: zoom,
          pitch: isCountry ? 45 : 0,
          duration: 1500,
        })

        // Trigger ripple ring animation only from globe perspective (zoom < 3)
        const currentZoom = map.current.getZoom()
        if (currentZoom < 3) {
          triggerRingAnimation(location.coordinates[0], location.coordinates[1])
        }
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(marker => marker.remove())
    }
  }, [globeData, isCountryLocation, triggerRingAnimation, clickedLocation, theme])

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

        // Use dark theme by default
        const initialConfig = THEME_CONFIG['dark']

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: initialConfig.mapStyle,
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

          // Set globe atmosphere with dark theme styling
          map.current.setFog({
            'horizon-blend': 0.02,
            color: initialConfig.fog.color,
            'high-color': initialConfig.fog.highColor,
            'space-color': initialConfig.fog.spaceColor,
            'star-intensity': initialConfig.fog.starIntensity,
          })

          const dotColor = initialConfig.dotColor

          // Add ripple ring source (starts hidden, animates on dot click)
          map.current.addSource('equator-ring', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [[0, 0], [0, 0]], // Hidden initially
              },
              properties: {},
            },
          })

          // Outer glow layer for the ring
          map.current.addLayer({
            id: 'equator-ring-glow',
            type: 'line',
            source: 'equator-ring',
            paint: {
              'line-color': dotColor,
              'line-width': 8,
              'line-opacity': 0.1,
              'line-blur': 6,
            },
          })

          // Main ring line
          map.current.addLayer({
            id: 'equator-ring-line',
            type: 'line',
            source: 'equator-ring',
            paint: {
              'line-color': dotColor,
              'line-width': 1.5,
              'line-opacity': 0.4,
            },
          })

          // Add event-locations source
          map.current.addSource('event-locations', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })

          // Base GPU-rendered dots layer for smooth globe tracking
          map.current.addLayer({
            id: 'event-locations-dots',
            type: 'circle',
            source: 'event-locations',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, 1.5,
                25, 4
              ],
              'circle-color': dotColor,
              'circle-opacity': 0.9,
            },
          })

          // Create multiple glow layers for enhanced visual effect
          // Outer glow layer 1 - largest, most diffused
          map.current.addLayer({
            id: 'event-locations-glow-outer',
            type: 'circle',
            source: 'event-locations',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, 12,
                25, 18
              ],
              'circle-color': dotColor,
              'circle-opacity': 0.1,
              'circle-blur': 1,
            },
          })

          // Middle glow layer - medium size
          map.current.addLayer({
            id: 'event-locations-glow-middle',
            type: 'circle',
            source: 'event-locations',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, 8,
                25, 12
              ],
              'circle-color': dotColor,
              'circle-opacity': 0.15,
              'circle-blur': 0.8,
            },
          })

          // Inner glow layer - smallest, brightest
          map.current.addLayer({
            id: 'event-locations-glow-inner',
            type: 'circle',
            source: 'event-locations',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, 5,
                25, 8
              ],
              'circle-color': dotColor,
              'circle-opacity': 0.25,
              'circle-blur': 0.5,
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

          // Animate dot pulsing glow with chaotic, per-dot phase offsets
          // Each dot pulses at its own unique rhythm based on its phaseOffset property
          const animatePulse = () => {
            if (!map.current) return
            const t = Date.now() / 1000

            // Helper to create a smooth wave using interpolation
            // We sample multiple sine wave values and use Mapbox's interpolate
            const createSmoothPulse = (baseValue: number, amplitude: number, frequency: number, phaseMultiplier: number) => {
              // Calculate the phase-shifted time for each dot
              // This creates a smooth sine-like wave using interpolation
              const numSteps = 8 // More steps = smoother wave
              const stops: any[] = []

              for (let i = 0; i <= numSteps; i++) {
                const phaseValue = i / numSteps
                const wavePhase = phaseValue * Math.PI * 2
                // Calculate sine wave value for this phase point
                const waveValue = Math.sin((t * frequency * Math.PI * 2) + wavePhase * phaseMultiplier) * 0.5 + 0.5
                stops.push(phaseValue, baseValue + amplitude * waveValue)
              }

              return [
                'interpolate',
                ['linear'],
                ['get', 'phaseOffset'], // Use phaseOffset (0-1) as the lookup value
                ...stops
              ]
            }

            // Outer glow - slow, large pulse with per-dot phase variation
            if (map.current.getLayer('event-locations-glow-outer')) {
              const outerOpacity = createSmoothPulse(0.08, 0.15, 0.4, 2.0)
              map.current.setPaintProperty('event-locations-glow-outer', 'circle-opacity', outerOpacity)

              const outerScaleBase = createSmoothPulse(1, 0.35, 0.4, 2.0)
              map.current.setPaintProperty('event-locations-glow-outer', 'circle-radius', [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, ['*', 12, outerScaleBase],
                25, ['*', 18, outerScaleBase]
              ])
            }

            // Middle glow - medium speed with different frequency and phase multiplier
            if (map.current.getLayer('event-locations-glow-middle')) {
              const middleOpacity = createSmoothPulse(0.15, 0.2, 0.6, 2.5)
              map.current.setPaintProperty('event-locations-glow-middle', 'circle-opacity', middleOpacity)

              const middleScaleBase = createSmoothPulse(1, 0.3, 0.6, 2.5)
              map.current.setPaintProperty('event-locations-glow-middle', 'circle-radius', [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, ['*', 8, middleScaleBase],
                25, ['*', 12, middleScaleBase]
              ])
            }

            // Inner glow - fast, bright pulse with even different timing
            if (map.current.getLayer('event-locations-glow-inner')) {
              const innerOpacity = createSmoothPulse(0.25, 0.25, 0.9, 3.0)
              map.current.setPaintProperty('event-locations-glow-inner', 'circle-opacity', innerOpacity)

              const innerScaleBase = createSmoothPulse(1, 0.4, 0.9, 3.0)
              map.current.setPaintProperty('event-locations-glow-inner', 'circle-radius', [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'newsItemCount'], 1],
                1, ['*', 5, innerScaleBase],
                25, ['*', 8, innerScaleBase]
              ])
            }

            pulseFrameRef.current = requestAnimationFrame(animatePulse)
          }
          pulseFrameRef.current = requestAnimationFrame(animatePulse)

          // Add country border sources first
          map.current.addSource('country-border-glow', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          map.current.addSource('country-border-line', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          // Then add country border highlight layers
          map.current.addLayer({
            id: 'country-border-glow',
            type: 'line',
            source: 'country-border-glow',
            paint: {
              'line-color': dotColor,
              'line-width': 6,
              'line-opacity': 0.3,
              'line-blur': 4,
            },
          })

          map.current.addLayer({
            id: 'country-border-line',
            type: 'line',
            source: 'country-border-line',
            paint: {
              'line-color': dotColor,
              'line-width': 3,
              'line-opacity': 0.8,
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
      if (ringFrameRef.current) {
        cancelAnimationFrame(ringFrameRef.current)
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
        setClickedLocation(null)
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

  // Close panel when clicking on the map background
  useEffect(() => {
    if (!map.current) return

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Only clear if we didn't click on a marker
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['event-locations-dots']
      })

      if (!features || features.length === 0) {
        setClickedLocation(null)
      }
    }

    map.current.on('click', handleMapClick)

    return () => {
      map.current?.off('click', handleMapClick)
    }
  }, [])

  const themeConfig = THEME_CONFIG[theme]

  return (
    <>
    <div className={`relative w-full h-screen ${themeConfig.background} overflow-hidden transition-colors duration-500`}>
      {/* Map */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      />

      {/* Top Right Controls */}
      {globeData && !isLoading && !selectedLocation && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 backdrop-blur border rounded-lg transition-all shadow-sm ${themeConfig.buttonBg} ${themeConfig.buttonBorder} ${themeConfig.buttonText} ${themeConfig.buttonHover}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Map Style Toggle */}
          <button
            onClick={toggleMapStyle}
            className={`p-2.5 backdrop-blur border rounded-lg transition-all shadow-sm ${themeConfig.buttonBg} ${themeConfig.buttonBorder} ${themeConfig.buttonText} ${themeConfig.buttonHover}`}
            title={`Switch to ${mapStyle === 'street' ? 'satellite' : 'street'} view`}
          >
            {mapStyle === 'street' ? (
              <img
                src="/icons/satellite.png"
                alt=""
                className="h-5 w-5"
                style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
                aria-hidden="true"
              />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
          </button>
        </div>
      )}

    </div>
    </>
  )
}

function MapMarker({
  location,
  animationDelay,
  isClicked = false,
  theme = 'dark'
}: {
  location: LocationAggregate;
  animationDelay: number;
  isClicked?: boolean;
  theme?: Theme;
}) {
  const themeConfig = THEME_CONFIG[theme]
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedNewsItemId, setExpandedNewsItemId] = useState<string | null>(null)

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

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (location.newsItemCount > 1) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleCloseExpanded = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(false)
  }

  const handlePanelWheel = (e: React.WheelEvent) => {
    // Prevent wheel events from propagating to the map
    e.stopPropagation()
  }

  const handlePanelTouchMove = (e: React.TouchEvent) => {
    // Prevent touch scroll events from propagating to the map
    e.stopPropagation()
  }

  const toggleNewsItemExpanded = (e: React.MouseEvent, newsItemId: string) => {
    e.stopPropagation()
    setExpandedNewsItemId(expandedNewsItemId === newsItemId ? null : newsItemId)
  }

  // Size based on news item count (reduced by 50%)
  const baseSize = Math.min(6 + location.newsItemCount * 0.25, 10) * 0.85

  // Get primary news item for the card
  const primaryNewsItem = location.newsItems.find(s => s.mediaUrl) || location.newsItems[0]
  const displayTitle = primaryNewsItem?.title || location.name
  const displaySummary = primaryNewsItem?.summary || `${location.newsItemCount} news items in this location`

  // Show panel if hovered OR clicked
  const showPanel = isHovered || isClicked

  const dotShadow = theme === 'dark'
    ? '0 1px 3px rgba(255,255,255,0.4), inset 0 0 2px rgba(255,255,255,0.2)'
    : '0 1px 3px rgba(26,26,46,0.4), inset 0 0 2px rgba(255,255,255,0.1)'

  return (
    <div className="relative" style={{ zIndex: showPanel ? 1 : 100 }}>
      <div
        className="rounded-full transition-all duration-100 ease-out cursor-pointer"
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          backgroundColor: themeConfig.dotColor,
          animation: `pulse-glow 2.5s ease-in-out infinite`,
          animationDelay: `${animationDelay}s`,
          transform: isPressed ? 'scale(0.75)' : showPanel ? 'scale(1.5)' : 'scale(1)',
          boxShadow: dotShadow,
          position: 'relative',
          zIndex: showPanel ? 200 : 100,
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

      {/* Hover/Click Panel with slide-in fade animation */}
      {showPanel && (
        <div
          className="absolute hover-card-enter"
          style={{
            left: `${baseSize + 20}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: isExpanded ? '400px' : '320px',
            zIndex: 50,
            transition: 'width 0.2s ease-out',
            pointerEvents: 'auto',
          }}
          onWheel={handlePanelWheel}
          onTouchMove={handlePanelTouchMove}
        >
          <div
            className={`${themeConfig.panel.bg} backdrop-blur-3xl backdrop-saturate-0 border ${themeConfig.panel.border} rounded-xl ${themeConfig.panel.text} shadow-2xl transition-all ${
              location.newsItemCount > 1 ? `cursor-pointer ${themeConfig.panel.hoverBorder} ${themeConfig.panel.hoverBg}` : ''
            }`}
            onClick={handlePanelClick}
          >
            {!isExpanded ? (
              // Collapsed view - shows primary story
              <div className="p-3 flex items-start gap-3">
                {/* Thumbnail */}
                {primaryNewsItem?.mediaUrl ? (
                  <div className={`relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden ${themeConfig.panel.imagePlaceholder}`}>
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(primaryNewsItem.mediaUrl)}`}
                      alt={displayTitle.substring(0, 50)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden ${themeConfig.panel.imagePlaceholder} flex items-center justify-center`}>
                    <img
                      src="/icons/newspaper.png"
                      alt="location"
                      className="w-6 h-6"
                      style={{ filter: themeConfig.panel.iconFilter }}
                    />
                  </div>
                )}

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-tight mb-1 line-clamp-2`}>
                    {displayTitle.substring(0, 80)}
                  </h3>
                  <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed line-clamp-3`}>
                    {displaySummary.substring(0, 150)}
                  </p>
                  {(primaryNewsItem?.sourceName || primaryNewsItem?.created) && (
                    <p className={`text-[9px] ${themeConfig.panel.textFaint} mt-1 flex items-center gap-1 flex-wrap`}>
                      {primaryNewsItem?.sourceName && (
                        <>
                          <img src="/icons/newspaper.png" alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                          <span>{primaryNewsItem.sourceName}</span>
                        </>
                      )}
                      {primaryNewsItem?.sourceName && primaryNewsItem?.created && (
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>•</span>
                      )}
                      {primaryNewsItem?.created && (
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>{formatDate(primaryNewsItem.created)}</span>
                      )}
                    </p>
                  )}
                  {location.newsItemCount > 1 && (
                    <div className="flex items-center gap-1 mt-1">
                      <p className={`text-[9px] ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>
                        +{location.newsItemCount - 1} more {location.newsItemCount === 2 ? 'news item' : 'news items'}
                      </p>
                      <svg className={`w-3 h-3 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Expanded view - shows all news items
              <div className="p-3">
                {/* Header with close button */}
                <div className={`flex items-start justify-between mb-3 pb-2 border-b ${themeConfig.panel.divider}`}>
                  <div>
                    <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{location.name}</h3>
                    <p className={`text-[10px] ${themeConfig.panel.textFaint}`}>{location.newsItemCount} {location.newsItemCount === 1 ? 'news item' : 'news items'}</p>
                  </div>
                  <button
                    onClick={handleCloseExpanded}
                    className={`p-1 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded transition-colors`}
                    aria-label="Close expanded view"
                  >
                    <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-white/80' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* News items list with scroll */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${themeConfig.panel.scrollbar} transparent`
                }}>
                  {location.newsItems.map((newsItem, index) => {
                    const isNewsItemExpanded = expandedNewsItemId === newsItem.id
                    return (
                      <div
                        key={newsItem.id || index}
                        className={`pb-3 border-b ${themeConfig.panel.dividerFaint} last:border-0 cursor-pointer transition-colors ${newsItem.summary ? `${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}` : ''}`}
                        onClick={(e) => newsItem.summary && toggleNewsItemExpanded(e, newsItem.id)}
                      >
                        <div className="flex items-start gap-2">
                          {/* News item thumbnail */}
                          {newsItem.mediaUrl ? (
                            <div className={`relative w-20 h-14 flex-shrink-0 rounded overflow-hidden ${themeConfig.panel.imagePlaceholder}`}>
                              <img
                                src={`/api/proxy-image?url=${encodeURIComponent(newsItem.mediaUrl)}`}
                                alt={newsItem.title?.substring(0, 50) || 'News item image'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          ) : (
                            <div className={`w-20 h-14 flex-shrink-0 rounded overflow-hidden ${themeConfig.panel.imagePlaceholder} flex items-center justify-center`}>
                              <img
                                src="/icons/newspaper.png"
                                alt="news"
                                className="w-5 h-5"
                                style={{ filter: themeConfig.panel.iconFilter }}
                              />
                            </div>
                          )}

                          {/* News item content */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-tight mb-1 line-clamp-2`}>
                              {newsItem.title || 'Untitled'}
                            </h4>
                            {newsItem.summary && (
                              <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed ${isNewsItemExpanded ? '' : 'line-clamp-2'}`}>
                                {newsItem.summary}
                              </p>
                            )}
                            {(newsItem.sourceName || newsItem.created) && (
                              <p className={`text-[9px] ${themeConfig.panel.textFaint} mt-1 flex items-center gap-1 flex-wrap`}>
                                {newsItem.sourceName && (
                                  <>
                                    <img src="/icons/newspaper.png" alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                                    <span>{newsItem.sourceName}</span>
                                  </>
                                )}
                                {newsItem.sourceName && newsItem.created && (
                                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>•</span>
                                )}
                                {newsItem.created && (
                                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>{formatDate(newsItem.created)}</span>
                                )}
                              </p>
                            )}
                            {newsItem.summary && (
                              <div className={`text-[9px] ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'} mt-1`}>
                                {isNewsItemExpanded ? '▼ Click to collapse' : '▶ Click to expand'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
