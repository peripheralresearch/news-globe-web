'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type mapboxgl from 'mapbox-gl'
import { createPortal } from 'react-dom'
import type { FeatureCollection, Feature, Point, LineString } from 'geojson'
import Navigation from '@/app/components/landing/Navigation'

// Start loading mapbox-gl immediately at module level (960KB) — don't wait for useEffect
const mapboxglPromise = typeof window !== 'undefined'
  // @ts-ignore - CSS import handled by Next.js bundler
  ? import('mapbox-gl').then(m => { import('mapbox-gl/dist/mapbox-gl.css'); return m.default })
  : null

// Theme configuration
type Theme = 'light' | 'dark'

const THEME_CONFIG = {
  light: {
    mapStyle: 'mapbox://styles/mapbox/light-v11',
    dotColor: '#0D0D0D',
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
  const dotRgb = theme === 'dark' ? '255, 255, 255' : '13, 13, 13'

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

    @keyframes loading-ellipsis {
      0%, 20% {
        opacity: 0;
      }
      40% {
        opacity: 0.35;
      }
      60% {
        opacity: 0.65;
      }
      80%, 100% {
        opacity: 1;
      }
    }

    .loading-ellipsis {
      display: inline-block;
      min-width: 1.8em;
      text-align: left;
      animation: loading-ellipsis 1.1s steps(4, end) infinite;
    }

    .hover-card-enter {
      animation: slideInFade 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes armGrow {
      0% {
        opacity: 0;
        stroke-dashoffset: 1;
      }
      15% {
        opacity: 1;
      }
      100% {
        opacity: 1;
        stroke-dashoffset: 0;
      }
    }

    .connector-arm-diag {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: armGrow 0.2s cubic-bezier(0.3, 0.7, 0.2, 1) forwards;
    }

    .connector-arm-horiz {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: armGrow 0.14s cubic-bezier(0.3, 0.7, 0.2, 1) 0.18s forwards;
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
const DEFAULT_GLOBE_HOURS = 24 // Latest 24 hours
const MAX_RENDER_LOCATIONS = 85

const IDLE_TIMEOUT = 10000 // 10 seconds before rotation starts
const ROTATION_SPEED = 0.015 // degrees per frame (slow rotation)
const ZOOM_OUT_TIMEOUT = 60000 // 1 minute before auto zoom-out when viewing story
const INITIAL_ZOOM = 0.5 // Initial zoom level for globe view
const CITY_VIEW_PITCH = 44
const CITY_VIEW_BEARING = -24

// Entrance animation constants
const ENTRANCE_DURATION = 5500 // 5.5 seconds for entrance animation
const ENTRANCE_SPEED_MULTIPLIER = 12 // Start at 12x the idle speed for dramatic entrance
const RING_MAX_RADIUS_DEG = 18 // ~10% of globe-travel feel
const RING_DURATION_MS = 1000
const RING_GLOW_OPACITY_BASE = 0.14
const RING_LINE_OPACITY_BASE = 0.55

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

function sourceIconForUrl(sourceUrl?: string | null): string {
  return sourceUrl?.includes('t.me/') ? '/icons/telegram.svg' : '/icons/newspaper.png'
}

function isTelegramSource(sourceUrl?: string | null): boolean {
  return Boolean(sourceUrl?.includes('t.me/'))
}

function telegramChannelUrl(sourceUrl?: string | null): string | null {
  if (!sourceUrl) return null
  const match = sourceUrl.match(/^https?:\/\/t\.me\/([^/]+)(?:\/\d+)?\/?$/i)
  if (!match?.[1]) return null
  return `https://t.me/${match[1]}`
}

function locationSeparationDeg(locationSubtype?: string): number {
  const subtype = (locationSubtype || '').toLowerCase()
  if (subtype.includes('country')) return 2.4
  if (subtype.includes('capital')) return 1.4
  if (subtype.includes('city') || subtype.includes('town')) return 1.1
  return 1.3
}

function approximateDistanceDeg(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}

function thinLocationsForRender(locations: LocationAggregate[]): LocationAggregate[] {
  const sorted = [...locations].sort((a, b) => {
    if (b.newsItemCount !== a.newsItemCount) return b.newsItemCount - a.newsItemCount
    return b.newsItems.length - a.newsItems.length
  })

  const kept: LocationAggregate[] = []

  for (const candidate of sorted) {
    if (kept.length >= MAX_RENDER_LOCATIONS) break
    const minSeparation = locationSeparationDeg(candidate.locationSubtype)
    const tooClose = kept.some((existing) =>
      approximateDistanceDeg(existing.coordinates, candidate.coordinates) < minSeparation
    )
    if (!tooClose) kept.push(candidate)
  }

  return kept
}
// Helper function to format date string
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Unknown date'
    }

    const today = new Date()
    const year = date.getFullYear() !== today.getFullYear() ? 'numeric' as const : undefined

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Unknown date'
  }
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const mapboxglRef = useRef<typeof mapboxgl | null>(null)
  const eventLocationsRef = useRef<FeatureCollection<Point>>({ type: 'FeatureCollection', features: [] })
  const mediaPostsRef = useRef<FeatureCollection<Point>>({ type: 'FeatureCollection', features: [] })
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const markerDelaysRef = useRef<Map<string, number>>(new Map())
  const [markerKeys, setMarkerKeys] = useState<string[]>([])

  // Idle rotation refs
  const lastInteractionRef = useRef(Date.now())
  const isRotatingRef = useRef(false)
  const rotationFrameRef = useRef<number | null>(null)
  const zoomOutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Idle preview refs
  const [idlePreviewLocation, setIdlePreviewLocation] = useState<LocationAggregate | null>(null)
  const idlePreviewTimerRef = useRef<NodeJS.Timeout | null>(null)
  const startIdlePreviewFnRef = useRef<(() => void) | null>(null)

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
    const start = performance.now()

    const animateRing = () => {
      if (!map.current) {
        ringAnimatingRef.current = false
        return
      }

      // Expand ring and fade within 1s for a short "pressed earth" ripple.
      const elapsed = performance.now() - start
      const progress = Math.min(1, elapsed / RING_DURATION_MS)
      const eased = 1 - Math.pow(1 - progress, 2) // ease-out
      ringRadiusRef.current = RING_MAX_RADIUS_DEG * eased
      const opacity = 1 - progress
      if (map.current.getLayer('equator-ring-glow')) {
        map.current.setPaintProperty('equator-ring-glow', 'line-opacity', RING_GLOW_OPACITY_BASE * opacity)
      }
      if (map.current.getLayer('equator-ring-line')) {
        map.current.setPaintProperty('equator-ring-line', 'line-opacity', RING_LINE_OPACITY_BASE * opacity)
      }

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

      // Animation complete quickly with short travel distance.
      if (progress >= 1) {
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
        if (map.current.getLayer('equator-ring-glow')) {
          map.current.setPaintProperty('equator-ring-glow', 'line-opacity', RING_GLOW_OPACITY_BASE)
        }
        if (map.current.getLayer('equator-ring-line')) {
          map.current.setPaintProperty('equator-ring-line', 'line-opacity', RING_LINE_OPACITY_BASE)
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
  const globeDataPromiseRef = useRef<Promise<GlobeData | null> | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationAggregate | null>(null)
  const [clickedLocation, setClickedLocation] = useState<LocationAggregate | null>(null)
  const isPanelActive = Boolean(clickedLocation)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const postsCacheRef = useRef<Map<string, LocationAggregate['newsItems']>>(new Map())
  const [postsLoadingLocation, setPostsLoadingLocation] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street')
  const [theme, setTheme] = useState<Theme>('dark')
  const [perfDebugEnabled, setPerfDebugEnabled] = useState(false)
  const [perfStats, setPerfStats] = useState({
    fps: 0,
    heapMb: 0,
    inFlight: 0,
    lastGlobeMs: 0,
    lastPostsMs: 0,
  })
  const inFlightRequestsRef = useRef(0)
  const lastGlobeMsRef = useRef(0)
  const lastPostsMsRef = useRef(0)

  const brandingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setPerfDebugEnabled(params.get('debugPerf') === '1')
  }, [])

  useEffect(() => {
    if (!perfDebugEnabled) return

    let frameCount = 0
    let rafId = 0
    let lastTick = performance.now()

    const loop = (now: number) => {
      frameCount += 1
      if (now - lastTick >= 1000) {
        const memory = (performance as any).memory
        const heapMb = memory?.usedJSHeapSize
          ? Math.round(memory.usedJSHeapSize / 1024 / 1024)
          : 0

        setPerfStats({
          fps: frameCount,
          heapMb,
          inFlight: inFlightRequestsRef.current,
          lastGlobeMs: lastGlobeMsRef.current,
          lastPostsMs: lastPostsMsRef.current,
        })

        frameCount = 0
        lastTick = now
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [perfDebugEnabled])

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
    const mediaPostsData = mediaPostsRef.current

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
      if (!map.current.getSource('media-posts')) {
        map.current.addSource('media-posts', {
          type: 'geojson',
          data: mediaPostsData,
        })
      }

      // Re-add layers with theme colors
      const dotColor = config.dotColor
      const innerGlowColor = theme === 'light' ? '#FFFFFF' : dotColor

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

      // DISABLED: Glow layers removed
      // if (!map.current.getLayer('event-locations-glow-outer')) {
      //   map.current.addLayer({
      //     id: 'event-locations-glow-outer',
      //     type: 'circle',
      //     source: 'event-locations',
      //     paint: {
      //       'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 12, 25, 18],
      //       'circle-color': dotColor,
      //       'circle-opacity': 0.1,
      //       'circle-blur': 1,
      //     },
      //   })
      // }

      // if (!map.current.getLayer('event-locations-glow-middle')) {
      //   map.current.addLayer({
      //     id: 'event-locations-glow-middle',
      //     type: 'circle',
      //     source: 'event-locations',
      //     paint: {
      //       'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 8, 25, 12],
      //       'circle-color': dotColor,
      //       'circle-opacity': 0.15,
      //       'circle-blur': 0.8,
      //     },
      //   })
      // }

      // if (!map.current.getLayer('event-locations-glow-inner')) {
      //   map.current.addLayer({
      //     id: 'event-locations-glow-inner',
      //     type: 'circle',
      //     source: 'event-locations',
      //     paint: {
      //       'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'newsItemCount'], 1], 1, 5, 25, 8],
      //       'circle-color': innerGlowColor,
      //       'circle-opacity': 0.25,
      //       'circle-blur': 0.5,
      //     },
      //   })
      // }
      if (!map.current.getLayer('media-posts-dots')) {
        map.current.addLayer({
          id: 'media-posts-dots',
          type: 'circle',
          source: 'media-posts',
          paint: {
            'circle-radius': 3.2,
            'circle-color': '#FAD44D',
            'circle-opacity': 0.95,
            'circle-stroke-color': theme === 'light' ? '#FFFFFF' : 'rgba(0,0,0,0)',
            'circle-stroke-width': theme === 'light' ? 0.8 : 0,
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
          paint: { 'line-color': dotColor, 'line-width': 10, 'line-opacity': RING_GLOW_OPACITY_BASE, 'line-blur': 6 },
        })
      }

      if (!map.current.getLayer('equator-ring-line')) {
        map.current.addLayer({
          id: 'equator-ring-line',
          type: 'line',
          source: 'equator-ring',
          paint: { 'line-color': dotColor, 'line-width': 2.4, 'line-opacity': RING_LINE_OPACITY_BASE },
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
    const nextTheme: Theme = newStyle === 'satellite' ? 'light' : theme
    const styleUrl = newStyle === 'street'
      ? 'mapbox://styles/mapbox/light-v11'
      : 'mapbox://styles/mapbox/satellite-streets-v12'

    setMapStyle(newStyle)
    if (nextTheme !== theme) {
      setTheme(nextTheme)
    }

    // Store current sources and layers data before style change
    const eventLocationsData = eventLocationsRef.current
    const mediaPostsData = mediaPostsRef.current

    // Set new style
    map.current.setStyle(styleUrl)

    // Re-add custom layers and data after style loads
    map.current.once('style.load', () => {
      if (!map.current) return
      const dotColor = nextTheme === 'light' ? '#0D0D0D' : '#FFFFFF'
      const innerGlowColor = nextTheme === 'light' ? '#FFFFFF' : dotColor

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
      if (!map.current.getSource('media-posts')) {
        map.current.addSource('media-posts', {
          type: 'geojson',
          data: mediaPostsData,
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
            'circle-color': dotColor,
            'circle-opacity': 0.9,
          },
        })
      }

      // DISABLED: Glow layers removed
      // Re-add glow layers (check if they already exist first)
      // if (!map.current.getLayer('event-locations-glow-outer')) {
      //   map.current.addLayer({
      //     id: 'event-locations-glow-outer',
      //     type: 'circle',
      //     source: 'event-locations',
      //     paint: {
      //       'circle-radius': [
      //         'interpolate',
      //         ['linear'],
      //         ['coalesce', ['get', 'newsItemCount'], 1],
      //         1, 12,
      //         25, 18
      //       ],
      //       'circle-color': dotColor,
      //       'circle-opacity': 0.1,
      //       'circle-blur': 1,
      //     },
      //   })
      // }

      // if (!map.current.getLayer('event-locations-glow-middle')) {
      //   map.current.addLayer({
      //     id: 'event-locations-glow-middle',
      //     type: 'circle',
      //     source: 'event-locations',
      //     paint: {
      //       'circle-radius': [
      //         'interpolate',
      //         ['linear'],
      //         ['coalesce', ['get', 'newsItemCount'], 1],
      //         1, 8,
      //         25, 12
      //       ],
      //       'circle-color': dotColor,
      //       'circle-opacity': 0.15,
      //       'circle-blur': 0.8,
      //     },
      //   })
      // }

      // if (!map.current.getLayer('event-locations-glow-inner')) {
      //   map.current.addLayer({
      //     id: 'event-locations-glow-inner',
      //     type: 'circle',
      //     source: 'event-locations',
      //     paint: {
      //       'circle-radius': [
      //         'interpolate',
      //         ['linear'],
      //         ['coalesce', ['get', 'newsItemCount'], 1],
      //         1, 5,
      //         25, 8
      //       ],
      //       'circle-color': innerGlowColor,
      //       'circle-opacity': 0.25,
      //       'circle-blur': 0.5,
      //     },
      //   })
      // }
      if (!map.current.getLayer('media-posts-dots')) {
        map.current.addLayer({
          id: 'media-posts-dots',
          type: 'circle',
          source: 'media-posts',
          paint: {
            'circle-radius': 3.2,
            'circle-color': '#FAD44D',
            'circle-opacity': 0.95,
            'circle-stroke-color': nextTheme === 'light' ? '#FFFFFF' : 'rgba(0,0,0,0)',
            'circle-stroke-width': nextTheme === 'light' ? 0.8 : 0,
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
            'line-width': 10,
            'line-opacity': RING_GLOW_OPACITY_BASE,
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
            'line-width': 2.4,
            'line-opacity': RING_LINE_OPACITY_BASE,
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
  }, [mapStyle, theme])

  // Load globe data
  const fetchGlobePage = useCallback(async (limit: number) => {
    const startedAt = performance.now()
    inFlightRequestsRef.current += 1
    try {
      const response = await fetch(`/api/sentinel/globe?limit=${limit}&hours=${DEFAULT_GLOBE_HOURS}&posts_per_location=1`)
      if (!response.ok) {
        console.error(`Globe API (limit=${limit}) responded with ${response.status}`)
        return null
      }

      const result = await response.json()
      if (result.status !== 'success' || !result.data) {
        console.warn(`Globe API (limit=${limit}) returned invalid payload`, result)
        return null
      }

	      const locationsRaw: LocationAggregate[] = []

      for (const loc of result.data.locations || []) {
        if (!Array.isArray(loc.news_items) || !loc.coordinates) continue

        const mappedNewsItemsRaw: LocationAggregate['newsItems'] = loc.news_items.map((s: any) => ({
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
        const mappedNewsItems = mappedNewsItemsRaw.sort((
          a: LocationAggregate['newsItems'][number],
          b: LocationAggregate['newsItems'][number]
        ) => {
          const aTelegram = a.sourceUrl?.includes('t.me/') ? 1 : 0
          const bTelegram = b.sourceUrl?.includes('t.me/') ? 1 : 0
          if (aTelegram !== bTelegram) return bTelegram - aTelegram

          const aHasMedia = a.mediaUrl || a.hasPhoto || a.hasVideo ? 1 : 0
          const bHasMedia = b.mediaUrl || b.hasPhoto || b.hasVideo ? 1 : 0
          if (aHasMedia !== bHasMedia) return bHasMedia - aHasMedia

          return new Date(b.created).getTime() - new Date(a.created).getTime()
        })

	        locationsRaw.push({
	          name: loc.entity_name,
	          locationSubtype: loc.location_subtype,
	          coordinates: loc.coordinates,
          defaultZoom: loc.default_zoom,
          newsItemCount: loc.news_item_count,
          newsItems: mappedNewsItems,
        })
      }

      const locations = thinLocationsForRender(locationsRaw)
      const newsItems: NewsItem[] = locations.flatMap((location) => {
        if (!location.newsItems.length) return []
        const firstItem = location.newsItems[0]
        return [{
          id: firstItem.id,
          title: firstItem.title,
          summary: firstItem.summary,
          created: firstItem.created,
          location: location.name,
          coordinates: location.coordinates,
          newsItemCount: location.newsItemCount,
        }]
      })

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
    } finally {
      inFlightRequestsRef.current = Math.max(0, inFlightRequestsRef.current - 1)
      lastGlobeMsRef.current = Math.round(performance.now() - startedAt)
    }
  }, [])

  const fetchLocationPosts = useCallback(async (locationName: string): Promise<LocationAggregate['newsItems'] | null> => {
    // Return cached posts if available
    const cached = postsCacheRef.current.get(locationName)
    if (cached) return cached

    const startedAt = performance.now()
    inFlightRequestsRef.current += 1
    try {
      setPostsLoadingLocation(locationName)
      const response = await fetch(`/api/sentinel/globe/posts?location=${encodeURIComponent(locationName)}`)
      if (!response.ok) return null

      const result = await response.json()
      if (result.status !== 'success' || !result.data?.posts) return null

      const posts: LocationAggregate['newsItems'] = result.data.posts.map((s: any) => ({
        id: s.id,
        title: s.title,
        summary: s.summary,
        created: s.created,
        sourceName: s.source_name || null,
        sourceUrl: s.source_url || null,
        hasPhoto: s.has_photo || null,
        hasVideo: s.has_video || null,
        mediaUrl: s.media_url || null,
      })).sort((a: LocationAggregate['newsItems'][number], b: LocationAggregate['newsItems'][number]) => {
        const aTelegram = a.sourceUrl?.includes('t.me/') ? 1 : 0
        const bTelegram = b.sourceUrl?.includes('t.me/') ? 1 : 0
        if (aTelegram !== bTelegram) return bTelegram - aTelegram
        const aHasMedia = a.mediaUrl || a.hasPhoto || a.hasVideo ? 1 : 0
        const bHasMedia = b.mediaUrl || b.hasPhoto || b.hasVideo ? 1 : 0
        if (aHasMedia !== bHasMedia) return bHasMedia - aHasMedia
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      })

      postsCacheRef.current.set(locationName, posts)
      return posts
    } catch (error) {
      console.error('Failed to fetch location posts:', error)
      return null
    } finally {
      inFlightRequestsRef.current = Math.max(0, inFlightRequestsRef.current - 1)
      lastPostsMsRef.current = Math.round(performance.now() - startedAt)
      setPostsLoadingLocation(prev => prev === locationName ? null : prev)
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
    const mediaPostFeatures: Feature<Point>[] = []
    for (const loc of data.locations) {
      for (const item of loc.newsItems) {
        const hasMedia = Boolean(item.mediaUrl || item.hasPhoto || item.hasVideo)
        if (!hasMedia) continue
        mediaPostFeatures.push({
          type: 'Feature',
          id: `media-${loc.name}-${item.id}`,
          geometry: {
            type: 'Point',
            coordinates: loc.coordinates,
          },
          properties: {
            id: item.id,
            location: loc.name,
          },
        })
      }
    }
    mediaPostsRef.current = { type: 'FeatureCollection', features: mediaPostFeatures }

    const source = map.current.getSource('event-locations') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(eventLocationsRef.current)
    }
    const mediaSource = map.current.getSource('media-posts') as mapboxgl.GeoJSONSource
    if (mediaSource) {
      mediaSource.setData(mediaPostsRef.current)
    }

    console.log('Map data updated successfully')
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    globeDataRef.current = globeData
  }, [globeData])

  // Create mapbox marker instances (DOM elements only — React content rendered via portals below)
  useEffect(() => {
    if (!map.current || !globeData || !mapboxglRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []
    const newElements = new Map<string, HTMLDivElement>()
    const newDelays = new Map<string, number>()

    // Create DOM container + mapbox Marker for each location
    globeData.locations.forEach((location) => {
      if (!map.current) return

      const el = document.createElement('div')
      el.className = 'custom-marker-container'

      const marker = new mapboxglRef.current!.Marker({
        element: el,
        anchor: 'center',
        offset: [0, 0]
      })
        .setLngLat(location.coordinates)
        .addTo(map.current)

      // Click handler uses refs so it stays stable
      el.addEventListener('click', (event) => {
        event.stopPropagation()
        if (!map.current || !globeDataRef.current) return

        // Stop idle rotation
        if (isRotatingRef.current) {
          isRotatingRef.current = false
          if (rotationFrameRef.current) {
            cancelAnimationFrame(rotationFrameRef.current)
            rotationFrameRef.current = null
          }
        }

        // Stop idle preview
        if (idlePreviewTimerRef.current) {
          clearInterval(idlePreviewTimerRef.current)
          idlePreviewTimerRef.current = null
        }
        setIdlePreviewLocation(null)

        // Reset interaction timer
        lastInteractionRef.current = Date.now()

        setSelectedLocation(location)
        setClickedLocation(location)
        const isCountry = isCountryLocation(location)
        const zoom = location.defaultZoom || 5

        map.current.flyTo({
          center: location.coordinates,
          zoom: zoom,
          pitch: isCountry ? 45 : CITY_VIEW_PITCH,
          bearing: isCountry ? map.current.getBearing() : CITY_VIEW_BEARING,
          duration: 1500,
        })

        // Lazy-load full posts if only 1 post was loaded initially
        if (location.newsItems.length <= 1) {
          fetchLocationPosts(location.name).then(posts => {
            if (!posts || posts.length === 0) return
            // Mutate the location in globeData so MapMarker re-renders with full posts
            const currentData = globeDataRef.current
            if (!currentData) return
            const updatedLocations = currentData.locations.map(loc =>
              loc.name === location.name ? { ...loc, newsItems: posts } : loc
            )
            const updatedData = { ...currentData, locations: updatedLocations }
            setGlobeData(updatedData)
            globeDataRef.current = updatedData
          })
        }

        // Trigger ripple ring animation only from globe perspective (zoom < 3)
        const currentZoom = map.current.getZoom()
        if (currentZoom < 3) {
          triggerRingAnimation(location.coordinates[0], location.coordinates[1])
        }
      })

      newElements.set(location.name, el)
      if (!markerDelaysRef.current.has(location.name)) {
        newDelays.set(location.name, Math.random() * 3)
      } else {
        newDelays.set(location.name, markerDelaysRef.current.get(location.name)!)
      }
      markersRef.current.push(marker)
    })

    markerElementsRef.current = newElements
    markerDelaysRef.current = newDelays
    setMarkerKeys(Array.from(newElements.keys()))

    return () => {
      markersRef.current.forEach(marker => marker.remove())
    }
  }, [globeData, isCountryLocation, triggerRingAnimation])

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

        // Fire API fetch immediately — don't wait for map load
        console.log('🚀 Starting API fetch in parallel with map initialization...')
        globeDataPromiseRef.current = loadGlobeData()

        // Await the module-level mapbox-gl import (already downloading)
        console.log('✅ Loading mapbox-gl...')
        const mapboxglModule = await mapboxglPromise!
        mapboxglRef.current = mapboxglModule

        console.log('✅ Mapbox token found:', token.substring(0, 20) + '...')
        mapboxglModule.accessToken = token

        console.log('✅ Creating map instance...')
        // Random starting longitude for varied entrance animation
        const randomLng = Math.random() * 360 - 180 // -180 to 180
        console.log('🎲 Random starting position:', randomLng)

        // Use dark theme by default
        const initialConfig = THEME_CONFIG['dark']

        map.current = new mapboxglModule.Map({
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

          // Safe helpers to avoid "source/layer already exists" on React Strict Mode double-mount
          const safeAddSource = (id: string, source: mapboxgl.AnySourceData) => {
            if (!map.current!.getSource(id)) map.current!.addSource(id, source)
          }
          const safeAddLayer = (layer: mapboxgl.AnyLayer) => {
            if (!map.current!.getLayer(layer.id)) map.current!.addLayer(layer)
          }

          // Add ripple ring source (starts hidden, animates on dot click)
          safeAddSource('equator-ring', {
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
          safeAddLayer({
            id: 'equator-ring-glow',
            type: 'line',
            source: 'equator-ring',
            paint: {
              'line-color': dotColor,
              'line-width': 10,
              'line-opacity': RING_GLOW_OPACITY_BASE,
              'line-blur': 6,
            },
          })

          // Main ring line
          safeAddLayer({
            id: 'equator-ring-line',
            type: 'line',
            source: 'equator-ring',
            paint: {
              'line-color': dotColor,
              'line-width': 2.4,
              'line-opacity': RING_LINE_OPACITY_BASE,
            },
          })

          // Add event-locations source
          safeAddSource('event-locations', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          safeAddSource('media-posts', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })

          // Base GPU-rendered dots layer for smooth globe tracking
          safeAddLayer({
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
          // DISABLED: Glow layers removed for cleaner look
          // Outer glow layer 1 - largest, most diffused
          // map.current.addLayer({
          //   id: 'event-locations-glow-outer',
          //   type: 'circle',
          //   source: 'event-locations',
          //   paint: {
          //     'circle-radius': [
          //       'interpolate',
          //       ['linear'],
          //       ['coalesce', ['get', 'newsItemCount'], 1],
          //       1, 12,
          //       25, 18
          //     ],
          //     'circle-color': dotColor,
          //     'circle-opacity': 0.1,
          //     'circle-blur': 1,
          //   },
          // })

          // Middle glow layer - medium size
          // map.current.addLayer({
          //   id: 'event-locations-glow-middle',
          //   type: 'circle',
          //   source: 'event-locations',
          //   paint: {
          //     'circle-radius': [
          //       'interpolate',
          //       ['linear'],
          //       ['coalesce', ['get', 'newsItemCount'], 1],
          //       1, 8,
          //       25, 12
          //     ],
          //     'circle-color': dotColor,
          //     'circle-opacity': 0.15,
          //     'circle-blur': 0.8,
          //   },
          // })

          // Inner glow layer - smallest, brightest
          // map.current.addLayer({
          //   id: 'event-locations-glow-inner',
          //   type: 'circle',
          //   source: 'event-locations',
          //   paint: {
          //     'circle-radius': [
          //       'interpolate',
          //       ['linear'],
          //       ['coalesce', ['get', 'newsItemCount'], 1],
          //       1, 5,
          //       25, 8
          //     ],
          //     'circle-color': dotColor,
          //     'circle-opacity': 0.25,
          //     'circle-blur': 0.5,
          //   },
          // })
          safeAddLayer({
            id: 'media-posts-dots',
            type: 'circle',
            source: 'media-posts',
            paint: {
              'circle-radius': 3.2,
              'circle-color': '#FAD44D',
              'circle-opacity': 0.95,
            },
          })

          // Data may already be available — await the in-flight promise
          console.log('Map loaded, awaiting globe data...')
          const data = await globeDataPromiseRef.current
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

            // Start idle preview 3s into the entrance animation
            setTimeout(() => {
              if (!map.current || !globeDataRef.current) return
              // Only start if still in entrance/idle rotation (user hasn't interacted)
              if (!hasPlayedEntranceRef.current || isRotatingRef.current) {
                startIdlePreviewFnRef.current?.()
              }
            }, 3000)
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

            // DISABLED: Glow animations removed
            // Outer glow - slow, large pulse with per-dot phase variation
            // if (map.current.getLayer('event-locations-glow-outer')) {
            //   const outerOpacity = createSmoothPulse(0.08, 0.15, 0.4, 2.0)
            //   map.current.setPaintProperty('event-locations-glow-outer', 'circle-opacity', outerOpacity)

            //   const outerScaleBase = createSmoothPulse(1, 0.35, 0.4, 2.0)
            //   map.current.setPaintProperty('event-locations-glow-outer', 'circle-radius', [
            //     'interpolate',
            //     ['linear'],
            //     ['coalesce', ['get', 'newsItemCount'], 1],
            //     1, ['*', 12, outerScaleBase],
            //     25, ['*', 18, outerScaleBase]
            //   ])
            // }

            // Middle glow - medium speed with different frequency and phase multiplier
            // if (map.current.getLayer('event-locations-glow-middle')) {
            //   const middleOpacity = createSmoothPulse(0.15, 0.2, 0.6, 2.5)
            //   map.current.setPaintProperty('event-locations-glow-middle', 'circle-opacity', middleOpacity)

            //   const middleScaleBase = createSmoothPulse(1, 0.3, 0.6, 2.5)
            //   map.current.setPaintProperty('event-locations-glow-middle', 'circle-radius', [
            //     'interpolate',
            //     ['linear'],
            //     ['coalesce', ['get', 'newsItemCount'], 1],
            //     1, ['*', 8, middleScaleBase],
            //     25, ['*', 12, middleScaleBase]
            //   ])
            // }

            // Inner glow - fast, bright pulse with even different timing
            // if (map.current.getLayer('event-locations-glow-inner')) {
            //   const innerOpacity = createSmoothPulse(0.25, 0.25, 0.9, 3.0)
            //   map.current.setPaintProperty('event-locations-glow-inner', 'circle-opacity', innerOpacity)

            //   const innerScaleBase = createSmoothPulse(1, 0.4, 0.9, 3.0)
            //   map.current.setPaintProperty('event-locations-glow-inner', 'circle-radius', [
            //     'interpolate',
            //     ['linear'],
            //     ['coalesce', ['get', 'newsItemCount'], 1],
            //     1, ['*', 5, innerScaleBase],
            //     25, ['*', 8, innerScaleBase]
            //   ])
            // }

            pulseFrameRef.current = requestAnimationFrame(animatePulse)
          }
          pulseFrameRef.current = requestAnimationFrame(animatePulse)

          // Add country border sources first
          safeAddSource('country-border-glow', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          safeAddSource('country-border-line', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          // Then add country border highlight layers
          safeAddLayer({
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

          safeAddLayer({
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
            // Stop idle preview on any user interaction
            if (idlePreviewTimerRef.current) {
              clearInterval(idlePreviewTimerRef.current)
              idlePreviewTimerRef.current = null
            }
            setIdlePreviewLocation(null)
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
      if (idlePreviewTimerRef.current) {
        clearInterval(idlePreviewTimerRef.current)
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

  // Get locations currently visible in the viewport
  const getVisibleLocations = useCallback((locations: LocationAggregate[]) => {
    if (!map.current) return []
    const canvas = map.current.getCanvas()
    return locations.filter(loc => {
      const point = map.current!.project(loc.coordinates)
      return point.x > 80 && point.x < canvas.width - 400 &&
             point.y > 80 && point.y < canvas.height - 80
    })
  }, [])

  // Start idle preview cycling — picks a random visible location every 8s
  const idlePreviewCurrentNameRef = useRef<string | null>(null)
  const startIdlePreview = useCallback(() => {
    // Don't start if already running
    if (idlePreviewTimerRef.current) return
    const data = globeDataRef.current
    if (!data || !map.current) return

    const pickRandom = () => {
      if (!map.current) return
      const visible = getVisibleLocations(data.locations)
      if (visible.length === 0) return
      // Pick a random location different from current preview
      const candidates = visible.length > 1
        ? visible.filter(loc => loc.name !== idlePreviewCurrentNameRef.current)
        : visible
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      idlePreviewCurrentNameRef.current = pick.name
      setIdlePreviewLocation(pick)
    }

    // Pick immediately
    pickRandom()

    // Then cycle every 8 seconds
    const timer = setInterval(pickRandom, 8000)
    idlePreviewTimerRef.current = timer
  }, [getVisibleLocations])

  // Keep fn ref in sync for use inside effects with stale closures
  useEffect(() => {
    startIdlePreviewFnRef.current = startIdlePreview
  }, [startIdlePreview])

  // Idle rotation animation
  const animateRotation = useCallback(() => {
    if (!map.current || !isRotatingRef.current) return

    // Don't rotate while user is focused on a location/panel.
    if (selectedLocation || isPanelActive) {
      stopRotation()
      return
    }

    // Global rotation
    const center = map.current.getCenter()
    const newLng = center.lng + ROTATION_SPEED
    map.current.setCenter([newLng, center.lat])

    rotationFrameRef.current = requestAnimationFrame(animateRotation)
  }, [selectedLocation, isPanelActive, stopRotation])

  // Check for idle state and start rotation
  const checkIdleState = useCallback(() => {
    // Suspend all idle behaviors while a panel is actively open.
    if (isPanelActive) return

    const timeSinceInteraction = Date.now() - lastInteractionRef.current

    if (timeSinceInteraction >= IDLE_TIMEOUT && !isRotatingRef.current && map.current) {
      isRotatingRef.current = true
      animateRotation()
      // Also restart idle preview when rotation resumes
      startIdlePreviewFnRef.current?.()
    }
  }, [animateRotation, isPanelActive])

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

    // If a location is selected and no panel is open, start the zoom-out timer.
    // Reading an open panel should never auto-zoom the user out.
    if (selectedLocation && !isPanelActive && map.current) {
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
  }, [selectedLocation, isPanelActive])

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
      const clickTarget = e.originalEvent?.target as HTMLElement | null
      if (clickTarget?.closest('.custom-marker-container')) {
        return
      }

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

      {/* Navigation Bar */}
      <Navigation
        variant="transparent"
        theme={theme}
        mapStyle={mapStyle}
        onToggleTheme={toggleTheme}
        onToggleMapStyle={toggleMapStyle}
      />

      {/* Subtle startup loading/error overlay for deployed cold starts */}
      <div
        className={`absolute inset-0 z-[1200] flex items-center justify-center transition-opacity duration-500 ${
          isLoading || mapError ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/35' : 'bg-white/55'} backdrop-blur-[2px]`} />
        <div className="relative text-center">
          {mapError ? (
            <div className="space-y-1">
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-brand-ink'}`}>Globe unavailable</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-brand-warm-600'}`}>{mapError}</p>
            </div>
          ) : (
            <p className={`text-xs tracking-[0.08em] uppercase ${theme === 'dark' ? 'text-white/80' : 'text-brand-warm-600'}`}>
              Loading live globe<span className="loading-ellipsis">...</span>
            </p>
          )}
        </div>
      </div>

      {/* Render marker content via portals — React handles updates without recreating mapbox markers */}
      {globeData && markerKeys.map(name => {
        const el = markerElementsRef.current.get(name)
        const location = globeData.locations.find(l => l.name === name)
        if (!el || !location) return null
        return createPortal(
          <MapMarker
            key={name}
            location={location}
            animationDelay={markerDelaysRef.current.get(name) ?? 0}
            isClicked={clickedLocation?.name === name}
            isIdlePreview={idlePreviewLocation?.name === name}
            postsLoading={postsLoadingLocation === name}
            theme={theme}
            onClosePanel={() => {
              setClickedLocation(null)
              setSelectedLocation(null)
            }}
            onFocusNewsItem={() => {
              if (!map.current) return
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
              const focusOffset: [number, number] = isMobile ? [-120, 36] : [-230, 44]
              map.current.easeTo({
                center: location.coordinates,
                zoom: Math.max(map.current.getZoom(), location.defaultZoom || 5),
                duration: 700,
                offset: focusOffset,
              })
            }}
          />,
          el
        )
      })}
      {perfDebugEnabled && (
        <div className="fixed right-3 bottom-3 z-[5000] rounded-md border border-white/20 bg-black/70 px-3 py-2 font-mono text-[11px] text-white">
          <div>perf debug</div>
          <div>fps: {perfStats.fps}</div>
          <div>markers: {markerKeys.length}</div>
          <div>locations: {globeData?.locations.length ?? 0}</div>
          <div>inflight: {perfStats.inFlight}</div>
          <div>globe ms: {perfStats.lastGlobeMs}</div>
          <div>posts ms: {perfStats.lastPostsMs}</div>
          <div>heap mb: {perfStats.heapMb || 'n/a'}</div>
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
  isIdlePreview = false,
  postsLoading = false,
  theme = 'dark',
  onClosePanel,
  onFocusNewsItem,
}: {
  location: LocationAggregate;
  animationDelay: number;
  isClicked?: boolean;
  isIdlePreview?: boolean;
  postsLoading?: boolean;
  theme?: Theme;
  onClosePanel?: () => void;
  onFocusNewsItem?: () => void;
}) {
  const themeConfig = THEME_CONFIG[theme]
  const markerContentRef = useRef<HTMLDivElement | null>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])
  const [panelView, setPanelView] = useState<'featured' | 'detail' | 'list'>('featured')
  const [detailItem, setDetailItem] = useState<LocationAggregate['newsItems'][number] | null>(null)
  // isExpanded is now derived below showPanel from effectivePanelView
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Entity panel state
  const [entityData, setEntityData] = useState<{
    people: Array<{ name: string; role: string | null; rank: number | null; confidence: number | null }>
    organisations: Array<{ name: string; orgType: string | null; rank: number | null; confidence: number | null }>
  } | null>(null)
  const [entityLoading, setEntityLoading] = useState(false)
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null)
  const articleScrollRef = useRef<HTMLDivElement>(null)

  // Scroll to first highlight when an entity is hovered
  useEffect(() => {
    if (!hoveredEntity || !articleScrollRef.current) return
    const first = articleScrollRef.current.querySelector<HTMLElement>('[data-entity-highlight]')
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [hoveredEntity])

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
  }

  const handleCloseExpanded = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClosePanel?.()
    setPanelView('featured')
    setDetailItem(null)
    setEntityData(null)
    setEntityLoading(false)
    setHoveredEntity(null)
  }

  const handlePanelWheel = (e: React.WheelEvent) => {
    // Prevent wheel events from propagating to the map
    e.stopPropagation()
  }

  const handlePanelTouchMove = (e: React.TouchEvent) => {
    // Prevent touch scroll events from propagating to the map
    e.stopPropagation()
  }

  const handleViewDetail = (e: React.MouseEvent, item: LocationAggregate['newsItems'][number]) => {
    e.stopPropagation()
    setDetailItem(item)
    setPanelView('detail')
    setHoveredEntity(null)

    // Replace truncated globe payload summary with full article content on demand.
    if (item.id) {
      fetch(`/api/sentinel/news-item/content?id=${encodeURIComponent(item.id)}`)
        .then(res => res.json())
        .then(json => {
          if (json.status !== 'success' || !json.data) return
          const fullContent = json.data.content || item.summary
          const fullTitle = json.data.title || item.title
          setDetailItem(prev => {
            if (!prev || prev.id !== item.id) return prev
            return {
              ...prev,
              title: fullTitle,
              summary: fullContent,
            }
          })
        })
        .catch(() => {})
    }

    // Fetch entities for this news item
    if (item.id) {
      setEntityLoading(true)
      setEntityData(null)
      fetch(`/api/sentinel/news-item/entities?id=${encodeURIComponent(item.id)}`)
        .then(res => res.json())
        .then(json => {
          if (json.status === 'success') setEntityData(json.data)
        })
        .catch(() => {})
        .finally(() => setEntityLoading(false))
    }
  }

  // Size based on news item count (reduced by 50%)
  const baseSize = Math.min(6 + location.newsItemCount * 0.25, 10) * 0.85

  // Featured article: prioritise RSS with media, then RSS without, then Telegram with media
  const featuredItem = (() => {
    const rssWithMedia = location.newsItems.find(i => !isTelegramSource(i.sourceUrl) && i.mediaUrl)
    if (rssWithMedia) return rssWithMedia
    const rssAny = location.newsItems.find(i => !isTelegramSource(i.sourceUrl))
    if (rssAny) return rssAny
    const tgWithMedia = location.newsItems.find(i => i.mediaUrl)
    if (tgWithMedia) return tgWithMedia
    return location.newsItems[0] || null
  })()
  const featuredIsTelegram = isTelegramSource(featuredItem?.sourceUrl)
  const mediaPreviews = location.newsItems.filter(item => item.mediaUrl).slice(0, 8)
  const currentSlide = mediaPreviews.length > 0 ? mediaPreviews[slideshowIndex % mediaPreviews.length] : null

  // Auto-cycle slideshow when panel is selected and we have multiple media items
  const restartSlideshowTimer = useCallback(() => {
    if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current)
    if (mediaPreviews.length > 1) {
      slideshowTimerRef.current = setInterval(() => {
        setSlideshowIndex(prev => prev + 1)
      }, 5000)
    }
  }, [mediaPreviews.length])

  useEffect(() => {
    if (isClicked && mediaPreviews.length > 1) {
      restartSlideshowTimer()
      return () => { if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current) }
    } else {
      setSlideshowIndex(0)
      if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current)
    }
  }, [isClicked, mediaPreviews.length, restartSlideshowTimer])

  const handleSlidePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSlideshowIndex(prev => (prev - 1 + mediaPreviews.length) % mediaPreviews.length)
    restartSlideshowTimer()
  }

  const handleSlideNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSlideshowIndex(prev => (prev + 1) % mediaPreviews.length)
    restartSlideshowTimer()
  }

  // Show panel if hovered OR clicked OR idle-previewing
  const showPanel = isHovered || isClicked || isIdlePreview
  // Lock to featured view during idle preview
  const effectivePanelView = isIdlePreview ? 'featured' : panelView
  const isExpanded = effectivePanelView !== 'featured'

  // Promote the active marker's Mapbox container above other marker siblings.
  useEffect(() => {
    const markerContent = markerContentRef.current
    if (!markerContent) return

    const markerContainer = (
      markerContent.closest('.mapboxgl-marker') ||
      markerContent.parentElement
    ) as HTMLDivElement | null

    if (!markerContainer) return

    markerContainer.style.setProperty('z-index', showPanel ? '4000' : '100', 'important')
  }, [showPanel])

  const dotShadow = theme === 'dark'
    ? '0 1px 3px rgba(255,255,255,0.4), inset 0 0 2px rgba(255,255,255,0.2)'
    : '0 0 10px rgba(250,212,77,0.55), 0 0 18px rgba(255,255,255,0.45), inset 0 0 2px rgba(255,255,255,0.2)'

  const armDiagX = 42
  const armDiagY = 66
  const armHoriz = 28
  const armStartX = baseSize / 2
  const armStartY = -armDiagY
  const panelLeft = armStartX + armDiagX + armHoriz - 1
  const panelTop = armStartY - 10
  const panelSurfaceStyle = theme === 'dark'
    ? {
        background: 'linear-gradient(145deg, rgba(6,6,6,0.96) 0%, rgba(0,0,0,0.96) 100%)',
        boxShadow: '0 20px 42px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
      }
    : {
        background: 'linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(250,250,250,0.96) 100%)',
        boxShadow: '0 16px 36px rgba(19,35,92,0.14), 0 0 0 1px rgba(19,35,92,0.08) inset',
      }
  const [lng, lat] = location.coordinates
  const locationCoords = `${lat.toFixed(3)}, ${lng.toFixed(3)}`
  return (
    <div ref={markerContentRef} className="relative" style={{ zIndex: showPanel ? 2000 : 100 }}>
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

      {/* Connector arm from marker to panel with a clean elbow bend (no elbow node) */}
      {showPanel && (() => {
        const armStroke = theme === 'dark' ? 'rgba(255,255,255,0.62)' : 'rgba(13,13,13,0.95)'
        return (
          <svg
            className="absolute pointer-events-none"
            style={{
              left: `${armStartX}px`,
              top: `${armStartY}px`,
              width: `${armDiagX + armHoriz}px`,
              height: `${armDiagY}px`,
              zIndex: 49,
              overflow: 'visible',
            }}
          >
            <line
              className="connector-arm-diag"
              x1="0"
              y1={armDiagY}
              x2={armDiagX}
              y2="0"
              pathLength={1}
              stroke={armStroke}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              className="connector-arm-horiz"
              x1={armDiagX}
              y1="0"
              x2={armDiagX + armHoriz}
              y2="0"
              pathLength={1}
              stroke={armStroke}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      })()}

      {/* Hover/Click Panel with slide-in fade animation */}
      {showPanel && (<>
        <div
          className="absolute hover-card-enter"
          style={{
            left: `${panelLeft}px`,
            top: `${panelTop}px`,
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
            } relative`}
            onClick={handlePanelClick}
            style={panelSurfaceStyle}
          >
            <button
              onClick={handleCloseExpanded}
              className={`absolute top-2 right-2 z-20 p-1 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded transition-colors`}
              aria-label="Close panel"
            >
              <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-white/80' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {(() => {
              // Shared location header — always at very top
              const locationHeader = (
                <div className="px-3 pt-2.5 pb-1.5 flex items-start justify-between">
                  <div>
                    <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{location.name}</h3>
                    <span className={`text-[9px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono`}>
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )

              // Shared slideshow component
              const slideshowBlock = currentSlide && (
                <div
                  className={`relative h-40 overflow-hidden cursor-pointer ${themeConfig.panel.imagePlaceholder}`}
                  onClick={(e) => { if (currentSlide) handleViewDetail(e, currentSlide) }}
                >
                  {mediaPreviews.map((item, i) => (
                    <img
                      key={item.id || i}
                      src={`/api/proxy-image?url=${encodeURIComponent(item.mediaUrl as string)}`}
                      alt={(item.title || location.name).substring(0, 60)}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                      style={{ opacity: (slideshowIndex % mediaPreviews.length) === i ? 1 : 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ))}
                  {mediaPreviews.length > 1 && (<>
                    {/* Left arrow */}
                    <button
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      onClick={handleSlidePrev}
                      aria-label="Previous image"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {/* Right arrow */}
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      onClick={handleSlideNext}
                      aria-label="Next image"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {/* Dot indicators */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {mediaPreviews.map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: (slideshowIndex % mediaPreviews.length) === i ? '12px' : '4px',
                            height: '4px',
                            backgroundColor: (slideshowIndex % mediaPreviews.length) === i
                              ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                          }}
                        />
                      ))}
                    </div>
                  </>)}
                </div>
              )

              return effectivePanelView === 'featured' ? (
              // Featured view — location header + slideshow + synced article info
              <div>
                {locationHeader}
                {slideshowBlock}
                <div className="p-3">
                  {/* Synced article info — crossfades with each slide, clickable to detail */}
                  {currentSlide ? (
                    <div className="relative cursor-pointer" style={{ minHeight: '52px' }}>
                      {mediaPreviews.map((item, i) => (
                        <div
                          key={item.id || i}
                          className={`transition-opacity duration-700 ease-in-out ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'} -mx-3 px-3 py-1 rounded`}
                          style={{
                            opacity: (slideshowIndex % mediaPreviews.length) === i ? 1 : 0,
                            position: (slideshowIndex % mediaPreviews.length) === i ? 'relative' : 'absolute',
                            top: 0, left: 0, right: 0,
                            pointerEvents: (slideshowIndex % mediaPreviews.length) === i ? 'auto' : 'none',
                          }}
                          onClick={(e) => handleViewDetail(e, item)}
                        >
                          {isTelegramSource(item.sourceUrl) ? (
                            <>
                              <div className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} mb-1 flex items-center gap-1.5`}>
                                <img src={sourceIconForUrl(item.sourceUrl)} alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                                <span className="line-clamp-1">{item.sourceName || 'Telegram'}</span>
                              </div>
                              <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed line-clamp-2`}>
                                {item.summary || item.title || 'Untitled'}
                              </p>
                            </>
                          ) : (
                            <>
                              {(() => {
                                const titleIsSnippet = item.title && item.summary && item.summary.startsWith(item.title.replace(/\.{3}$/, ''))
                                return titleIsSnippet ? (
                                  <>
                                    <div className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} mb-1 flex items-center gap-1.5`}>
                                      <img src={sourceIconForUrl(item.sourceUrl)} alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                                      <span className="line-clamp-1">{item.sourceName || 'Unknown source'}</span>
                                    </div>
                                    <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed line-clamp-2`}>
                                      {item.summary}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <h3 className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-snug line-clamp-2`}>
                                      {item.title || 'Untitled'}
                                    </h3>
                                    {item.summary && item.summary !== item.title && (
                                      <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed mt-0.5 line-clamp-2`}>
                                        {item.summary}
                                      </p>
                                    )}
                                  </>
                                )
                              })()}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : featuredItem ? (
                    // No media — show featured news item text only
                    <div
                      className={`${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'} -mx-3 px-3 py-1 rounded cursor-pointer`}
                      onClick={(e) => handleViewDetail(e, featuredItem)}
                    >
                      {isTelegramSource(featuredItem.sourceUrl) ? (
                        <>
                          <div className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} mb-1 flex items-center gap-1.5`}>
                            <img src={sourceIconForUrl(featuredItem.sourceUrl)} alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                            <span className="line-clamp-1">{featuredItem.sourceName || 'Telegram'}</span>
                          </div>
                          <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed line-clamp-2`}>
                            {featuredItem.summary || featuredItem.title || 'Untitled'}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-snug line-clamp-2`}>
                            {featuredItem.title || 'Untitled'}
                          </h3>
                          {featuredItem.summary && featuredItem.summary !== featuredItem.title && (
                            <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed mt-0.5 line-clamp-2`}>
                              {featuredItem.summary}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                  {/* See more button */}
                  {location.newsItemCount > 1 && (
                    <div
                      className={`mt-2 pt-2 border-t ${themeConfig.panel.dividerFaint} flex items-center justify-center cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'} -mx-3 px-3 pb-1 transition-colors`}
                      onClick={(e) => { e.stopPropagation(); setPanelView('list') }}
                    >
                      <span className={`text-[11px] ${themeConfig.panel.textFaint}`}>
                        See all {location.newsItemCount} items
                      </span>
                      <svg className={`w-3.5 h-3.5 ml-1 ${themeConfig.panel.textFaint}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ) : effectivePanelView === 'detail' && detailItem ? (
              // Detail view — full news item
              <div>
                {locationHeader}
                {/* Detail image */}
                {detailItem.mediaUrl && (
                  <div className={`relative h-48 overflow-hidden ${themeConfig.panel.imagePlaceholder}`}>
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(detailItem.mediaUrl)}`}
                      alt={detailItem.title?.substring(0, 60) || location.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="p-3">
                  {/* Back button */}
                  <div className={`flex items-center mb-2 pb-2 border-b ${themeConfig.panel.divider}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPanelView('featured'); setDetailItem(null) }}
                      className={`flex items-center gap-1 text-[10px] ${themeConfig.panel.textFaint} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-800'} transition-colors`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  </div>
                  {/* Scrollable content area */}
                  <div ref={articleScrollRef} className="max-h-[360px] overflow-y-auto pr-1" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${themeConfig.panel.scrollbar} transparent`,
                  }}>
                  {/* Title */}
                  <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-snug ${isTelegramSource(detailItem.sourceUrl) ? 'line-clamp-2' : ''}`}>
                    {detailItem.title || 'Untitled'}
                  </h3>
                  {/* Source + time */}
                  <div className="flex items-center gap-1.5 mt-1.5 mb-2">
                    <img src={sourceIconForUrl(detailItem.sourceUrl)} alt="" className="w-3 h-3" style={{ filter: themeConfig.panel.iconFilter }} />
                    <span className={`text-[10px] ${themeConfig.panel.textFaint}`}>{detailItem.sourceName || 'Unknown source'}</span>
                    {detailItem.created && (
                      <>
                        <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>·</span>
                        <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(detailItem.created)}</span>
                      </>
                    )}
                  </div>
                  {/* Full summary */}
                  {detailItem.summary && (
                    <p className={`text-[11px] ${themeConfig.panel.textMuted} leading-relaxed`}>
                      {(() => {
                        if (!hoveredEntity) return detailItem.summary
                        const escaped = hoveredEntity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                        const parts = detailItem.summary.split(new RegExp(`(${escaped})`, 'gi'))
                        if (parts.length === 1) return detailItem.summary
                        return parts.map((part, i) =>
                          i % 2 === 1 ? (
                            <mark
                              key={i}
                              data-entity-highlight
                              className={theme === 'dark'
                                ? 'bg-amber-500/30 text-amber-200 rounded-sm px-0.5 not-italic'
                                : 'bg-amber-200/80 text-amber-900 rounded-sm px-0.5 not-italic'}
                            >{part}</mark>
                          ) : part
                        )
                      })()}
                    </p>
                  )}
                  {/* Open source link */}
                  {detailItem.sourceUrl && (
                    <a
                      href={detailItem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 mt-3 text-[10px] font-medium ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read full article
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  </div>{/* end scrollable content */}
                  {/* See more items */}
                  {location.newsItemCount > 1 && (
                    <div
                      className={`mt-3 pt-2 border-t ${themeConfig.panel.dividerFaint} flex items-center justify-between cursor-pointer ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'} -mx-3 px-3 pb-1 transition-colors`}
                      onClick={(e) => { e.stopPropagation(); setPanelView('list') }}
                    >
                      <span className={`text-[11px] ${themeConfig.panel.textFaint}`}>
                        See all {location.newsItemCount} items
                      </span>
                      <svg className={`w-3.5 h-3.5 ${themeConfig.panel.textFaint}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // List view — location header + slideshow + scrollable news items
              <div>
                {locationHeader}
                {slideshowBlock}
                {/* Synced article info below slideshow */}
                {currentSlide && (
                  <div className="px-3 pt-2 pb-1">
                    <div className="relative" style={{ minHeight: '36px' }}>
                      {mediaPreviews.map((item, i) => (
                        <div
                          key={item.id || i}
                          className="transition-opacity duration-700 ease-in-out"
                          style={{
                            opacity: (slideshowIndex % mediaPreviews.length) === i ? 1 : 0,
                            position: (slideshowIndex % mediaPreviews.length) === i ? 'relative' : 'absolute',
                            top: 0, left: 0, right: 0,
                          }}
                        >
                          <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-snug line-clamp-1`}>
                            {item.title || 'Untitled'}
                          </h4>
                          {item.summary && item.summary !== item.title && (
                            <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed mt-0.5 line-clamp-1`}>
                              {item.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3 pt-1">
                {/* Divider */}
                <div className={`mb-2 pb-2 border-b ${themeConfig.panel.divider}`} />

                {/* News items list with scroll */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${themeConfig.panel.scrollbar} transparent`
                }}>
                  {postsLoading && location.newsItems.length <= 1 && (
                    <div className="flex items-center justify-center py-6">
                      <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/60' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                        <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/60' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                        <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/60' : 'bg-gray-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  {location.newsItems.map((newsItem, index) => {
                    const newsItemIsTelegram = isTelegramSource(newsItem.sourceUrl)
                    const newsItemTelegramChannelUrl = telegramChannelUrl(newsItem.sourceUrl)
                    return (
                      <div
                        key={newsItem.id || index}
                        className={`pb-3 border-b ${themeConfig.panel.dividerFaint} last:border-0 cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                        onClick={(e) => handleViewDetail(e, newsItem)}
                      >
                        <div className="flex items-start gap-2">
                          {/* News item thumbnail */}
                          {newsItem.mediaUrl && (
                            <div className={`relative w-20 h-14 flex-shrink-0 rounded overflow-hidden ${themeConfig.panel.imagePlaceholder}`}>
                              <img
                                src={`/api/proxy-image?url=${encodeURIComponent(newsItem.mediaUrl)}`}
                                alt={newsItem.title?.substring(0, 50) || 'News item image'}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                          )}

                          {/* News item content */}
                          <div className="flex-1 min-w-0">
                            {newsItemIsTelegram ? (
                              <>
                                <div className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} mb-1 flex items-center gap-1.5`}>
                                  <img src={sourceIconForUrl(newsItem.sourceUrl)} alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                                  <span className="line-clamp-1">{newsItem.sourceName || 'Telegram'}</span>
                                </div>
                                <p className={`text-[10px] ${themeConfig.panel.textMuted} leading-relaxed line-clamp-2`}>
                                  {newsItem.summary || newsItem.title || 'Untitled'}
                                </p>
                              </>
                            ) : (
                              <>
                                <h4 className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} leading-tight mb-1 line-clamp-2`}>
                                  {newsItem.title || 'Untitled'}
                                </h4>
                              </>
                            )}
                            {(newsItem.sourceName || newsItem.created) && (
                              <p className={`text-[9px] ${themeConfig.panel.textFaint} mt-1 flex items-center gap-1 flex-wrap`}>
                                {!newsItemIsTelegram && newsItem.sourceName && (
                                  <>
                                    <img src={sourceIconForUrl(newsItem.sourceUrl)} alt="" className="inline-block w-3 h-3 align-middle" style={{ filter: themeConfig.panel.iconFilter }} />
                                    <span>{newsItem.sourceName}</span>
                                  </>
                                )}
                                {!newsItemIsTelegram && newsItem.sourceName && newsItem.created && (
                                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>•</span>
                                )}
                                {newsItem.created && (
                                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>{formatDate(newsItem.created)}</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              </div>
            )
            })()}
          </div>
        </div>

        {/* Secondary entity panel */}
        {effectivePanelView === 'detail' && detailItem && (entityLoading || entityData) && (
          <div
            className="absolute hover-card-enter"
            style={{
              left: `${panelLeft + 400 + 8}px`,
              top: `${panelTop}px`,
              width: '260px',
              zIndex: 50,
              pointerEvents: 'auto',
            }}
            onWheel={handlePanelWheel}
            onTouchMove={handlePanelTouchMove}
            onClick={handlePanelClick}
          >
            <div
              className={`${themeConfig.panel.bg} backdrop-blur-3xl backdrop-saturate-0 border ${themeConfig.panel.border} rounded-xl ${themeConfig.panel.text} shadow-2xl`}
              style={panelSurfaceStyle}
            >
              <div className="px-3 pt-2.5 pb-1.5">
                <h3 className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Entities</h3>
              </div>

              {entityLoading ? (
                <div className="px-3 pb-3 space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="space-y-1.5">
                      <div className={`h-2.5 w-16 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} animate-pulse`} />
                      <div className={`h-2 w-24 rounded ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} animate-pulse`} />
                      <div className={`h-2 w-20 rounded ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} animate-pulse`} />
                    </div>
                  ))}
                </div>
              ) : entityData ? (
                <div className="px-3 pb-3 space-y-2.5 max-h-[420px] overflow-y-auto" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${themeConfig.panel.scrollbar} transparent`,
                }}>
                  {/* People */}
                  {entityData!.people.length > 0 && (
                    <div>
                      <div className={`flex items-center gap-1.5 mb-1.5 pb-1 border-b ${themeConfig.panel.dividerFaint}`}>
                        <svg className={`w-3 h-3 ${themeConfig.panel.textFaint}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className={`text-[10px] font-semibold ${themeConfig.panel.textFaint} uppercase tracking-wider`}>People</span>
                        <span className={`text-[9px] ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>{entityData!.people.length}</span>
                      </div>
                      <div className="space-y-1">
                        {entityData!.people.map((p, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-1.5 rounded px-1 -mx-1 cursor-default transition-colors ${hoveredEntity === p.name ? (theme === 'dark' ? 'bg-amber-500/15' : 'bg-amber-50') : ''}`}
                            onMouseEnter={() => setHoveredEntity(p.name)}
                            onMouseLeave={() => setHoveredEntity(null)}
                          >
                            {p.rank === 1 && (
                              <span className={`text-[8px] px-1 py-0.5 rounded ${theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'} font-medium`}>#1</span>
                            )}
                            <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{p.name}</span>
                            {p.role && <span className={`text-[9px] ${themeConfig.panel.textFaint}`}>· {p.role}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Organisations */}
                  {entityData!.organisations.length > 0 && (
                    <div>
                      <div className={`flex items-center gap-1.5 mb-1.5 pb-1 border-b ${themeConfig.panel.dividerFaint}`}>
                        <svg className={`w-3 h-3 ${themeConfig.panel.textFaint}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className={`text-[10px] font-semibold ${themeConfig.panel.textFaint} uppercase tracking-wider`}>Organisations</span>
                        <span className={`text-[9px] ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>{entityData!.organisations.length}</span>
                      </div>
                      <div className="space-y-1">
                        {entityData!.organisations.map((o, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-1.5 rounded px-1 -mx-1 cursor-default transition-colors ${hoveredEntity === o.name ? (theme === 'dark' ? 'bg-amber-500/15' : 'bg-amber-50') : ''}`}
                            onMouseEnter={() => setHoveredEntity(o.name)}
                            onMouseLeave={() => setHoveredEntity(null)}
                          >
                            {o.rank === 1 && (
                              <span className={`text-[8px] px-1 py-0.5 rounded ${theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'} font-medium`}>#1</span>
                            )}
                            <span className={`text-[11px] ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{o.name}</span>
                            {o.orgType && <span className={`text-[9px] ${themeConfig.panel.textFaint}`}>· {o.orgType}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {entityData!.people.length === 0 && entityData!.organisations.length === 0 && (
                    <p className={`text-[10px] ${themeConfig.panel.textFaint} py-2`}>No entities extracted for this item.</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </>)}
    </div>
  )
}
