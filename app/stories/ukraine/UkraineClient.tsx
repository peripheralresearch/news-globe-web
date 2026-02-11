'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Brand yellow color and shades
const BRAND_YELLOW = '#F2CE4E'
const YELLOW_SHADES = [
  '#F2CE4E', // Primary yellow
  '#E5B93D', // Darker
  '#D4A32E', // Even darker
  '#C99421', // Dark gold
  '#F5D76E', // Lighter
  '#F8E08E', // Even lighter
  '#FAEBAE', // Very light
]

interface WeaponData {
  type: string
  count: number
  label: string
}

// ISO 3166-1 alpha-3 code for Ukraine
const UKRAINE_ISO = 'UKR'

// Bounding box for Ukraine with padding
const UKRAINE_BOUNDS: [[number, number], [number, number]] = [
  [22.0, 44.0],
  [40.5, 52.5]
]

const ELASTIC_PADDING = 1.0
const POLL_INTERVAL = 15000

const ALERTS_SOURCE = 'alerts-source'
const ALERTS_LAYER = 'alerts-layer'
const ALERTS_PULSE_LAYER = 'alerts-pulse-layer'

interface Alert {
  id: string
  text: string
  published: string
  alertType: string | null
  weaponType: string | null
  location: string | null
  region: string | null
  status: string
  lat: number | null
  lon: number | null
}

interface FrequencyData {
  date: string
  count: number
}

interface FrequencyResponse {
  frequency: FrequencyData[]
  total: number
  firstDate: string
  lastDate: string
}

interface WeaponFrequencyData {
  week: string
  [key: string]: number | string
}

interface WeaponInfo {
  key: string
  label: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// Convert alerts to GeoJSON
function alertsToGeoJSON(alerts: Alert[]): GeoJSON.FeatureCollection {
  const oneHourAgo = Date.now() - 60 * 60 * 1000

  return {
    type: 'FeatureCollection',
    features: alerts
      .filter(alert => alert.lat && alert.lon)
      .map(alert => {
        const isRecentOrActive = alert.status === 'active' ||
          (alert.status === 'unknown' && new Date(alert.published).getTime() > oneHourAgo)

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [alert.lon!, alert.lat!]
          },
          properties: {
            id: alert.id,
            text: alert.text,
            published: alert.published,
            alertType: alert.alertType,
            weaponType: alert.weaponType,
            location: alert.location,
            region: alert.region,
            status: alert.status,
            isActive: isRecentOrActive
          }
        }
      })
  }
}

// Line Chart Component - shows weapon types as separate lines
function WeaponLineChart({
  data,
  weapons,
  total
}: {
  data: WeaponFrequencyData[]
  weapons: WeaponInfo[]
  total: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredWeek, setHoveredWeek] = useState<{ week: string; x: number; counts: Record<string, number> } | null>(null)
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: 280 })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  if (!data || data.length === 0 || !weapons || weapons.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#9ca3af' }}>
        Loading frequency data...
      </div>
    )
  }

  const { width, height } = dimensions
  const padding = { top: 20, right: 10, bottom: 60, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find max value across all weapons for Y scale
  let maxValue = 0
  data.forEach(week => {
    weapons.forEach(w => {
      const count = Number(week[w.key] || 0)
      if (count > maxValue) maxValue = count
    })
  })

  // Calculate x positions for each data point
  const chartData = data.map((week, i) => {
    const counts: Record<string, number> = {}
    weapons.forEach(w => {
      counts[w.key] = Number(week[w.key] || 0)
    })
    return {
      week: week.week,
      counts,
      x: padding.left + (i / (data.length - 1)) * chartWidth
    }
  })

  // Y scale
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight

  // Create line paths for each weapon type
  const linePaths = weapons.map((weapon, weaponIndex) => {
    const points = chartData.map(d => {
      const count = d.counts[weapon.key] || 0
      return `${d.x},${yScale(count)}`
    }).join(' L ')

    return {
      weapon: weapon.key,
      label: weapon.label,
      color: YELLOW_SHADES[weaponIndex % YELLOW_SHADES.length],
      path: `M ${points}`
    }
  })

  // Y-axis ticks
  const yTicks = [0, Math.round(maxValue / 2), maxValue]

  // X-axis labels
  const xLabelIndices: number[] = []
  const step = Math.floor(data.length / 5)
  for (let i = 0; i < data.length; i += step) {
    xLabelIndices.push(i)
  }
  if (xLabelIndices[xLabelIndices.length - 1] !== data.length - 1) {
    xLabelIndices.push(data.length - 1)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    let closest = chartData[0]
    let closestDist = Infinity
    chartData.forEach(d => {
      const dist = Math.abs(d.x - mouseX)
      if (dist < closestDist) {
        closestDist = dist
        closest = d
      }
    })

    if (closestDist < 50) {
      setHoveredWeek({ week: closest.week, x: closest.x, counts: closest.counts })
    } else {
      setHoveredWeek(null)
    }
  }

  const textColor = '#6b7280'
  const gridColor = '#e5e7eb'

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredWeek(null)}
        className="cursor-crosshair"
      >
        {/* Grid lines */}
        {yTicks.map(tick => {
          const y = yScale(tick)
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={gridColor}
                strokeDasharray="4,4"
                strokeWidth={1}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill={textColor}
              >
                {tick.toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Lines for each weapon type */}
        {linePaths.map(line => {
          const isHighlighted = hoveredLegend === null || hoveredLegend === line.weapon
          return (
            <path
              key={line.weapon}
              d={line.path}
              fill="none"
              stroke={isHighlighted ? line.color : '#e5e7eb'}
              strokeWidth={hoveredLegend === line.weapon ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
            />
          )
        })}

        {/* X-axis labels */}
        {xLabelIndices.map(i => {
          const d = chartData[i]
          if (!d) return null
          return (
            <text
              key={i}
              x={d.x}
              y={height - 45}
              textAnchor="middle"
              fontSize={11}
              fill={textColor}
            >
              {formatShortDate(data[i].week)}
            </text>
          )
        })}

        {/* Hover line and dots */}
        {hoveredWeek && (
          <>
            <line
              x1={hoveredWeek.x}
              y1={padding.top}
              x2={hoveredWeek.x}
              y2={padding.top + chartHeight}
              stroke="#1a1a1a"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            {weapons.slice(0, 6).map((w, i) => {
              const count = hoveredWeek.counts[w.key] || 0
              return (
                <circle
                  key={w.key}
                  cx={hoveredWeek.x}
                  cy={yScale(count)}
                  r={4}
                  fill={YELLOW_SHADES[i % YELLOW_SHADES.length]}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              )
            })}
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 px-2 justify-center">
        {weapons.slice(0, 6).map((weapon, i) => {
          const isActive = hoveredLegend === null || hoveredLegend === weapon.key
          return (
            <div
              key={weapon.key}
              className="flex items-center gap-1.5 cursor-pointer select-none"
              onMouseEnter={() => setHoveredLegend(weapon.key)}
              onMouseLeave={() => setHoveredLegend(null)}
              style={{ opacity: isActive ? 1 : 0.4, transition: 'opacity 0.15s' }}
            >
              <div
                className="w-4 h-0.5"
                style={{ backgroundColor: YELLOW_SHADES[i % YELLOW_SHADES.length] }}
              />
              <span className="text-xs" style={{ color: textColor }}>{weapon.label}</span>
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {hoveredWeek && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg shadow-lg text-sm z-10"
          style={{
            left: Math.min(Math.max(hoveredWeek.x, 100), width - 180),
            top: 40,
            backgroundColor: '#ffffff',
            border: `1px solid ${gridColor}`,
            color: '#1a1a1a',
          }}
        >
          <div className="font-semibold mb-1">Week of {formatDate(hoveredWeek.week)}</div>
          {weapons.slice(0, 6).map((w, i) => (
            <div key={w.key} className="flex justify-between gap-4 text-xs">
              <span style={{ color: YELLOW_SHADES[i % YELLOW_SHADES.length] }}>{w.label}</span>
              <span>{(hoveredWeek.counts[w.key] || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <div className="flex justify-between mt-2 px-2 text-sm" style={{ color: textColor }}>
        <div>
          <span className="font-semibold" style={{ color: '#1a1a1a' }}>
            {total.toLocaleString()}
          </span> total signals
        </div>
        <div>
          {data.length > 0 && <>Since {formatDate(data[0].week)}</>}
        </div>
      </div>
    </div>
  )
}

// Weapon Breakdown Chart Component
function WeaponBreakdownChart({ data, total }: { data: WeaponData[]; total: number }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#9ca3af' }}>
        Loading weapon data...
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count))

  return (
    <div className="space-y-3">
      {data.map((weapon, index) => {
        const percentage = (weapon.count / total) * 100
        const barWidth = (weapon.count / maxCount) * 100
        const color = YELLOW_SHADES[index % YELLOW_SHADES.length]

        return (
          <div key={weapon.type} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
                {weapon.label}
              </span>
              <span className="text-sm" style={{ color: '#6b7280' }}>
                {weapon.count.toLocaleString()} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-8 rounded-md overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
              <div
                className="h-full rounded-md transition-all duration-300 group-hover:opacity-80"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}

      {/* Total */}
      <div className="pt-3 mt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
            Total Weapon Alerts
          </span>
          <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// Ukrainian oblast regions layer names
const REGIONS_SOURCE = 'ukraine-regions'
const REGIONS_FILL_LAYER = 'ukraine-regions-fill'
const REGIONS_HOVER_LAYER = 'ukraine-regions-hover'
const REGIONS_LINE_LAYER = 'ukraine-regions-line'

function UkraineContent() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const isDragging = useRef(false)
  const isAnimating = useRef(false)
  const mapLoaded = useRef(false)
  const hoveredRegionId = useRef<string | number | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([])
  const [totalSignals, setTotalSignals] = useState(0)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [weaponData, setWeaponData] = useState<WeaponData[]>([])
  const [weaponTotal, setWeaponTotal] = useState(0)
  const [weaponFrequencyData, setWeaponFrequencyData] = useState<WeaponFrequencyData[]>([])
  const [weaponsList, setWeaponsList] = useState<WeaponInfo[]>([])
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [lastDashboardUpdate, setLastDashboardUpdate] = useState<string | null>(null)

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/ukraine/signals?hours=48&limit=500', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await res.json()
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }, [])

  // Fetch dashboard data from single endpoint
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/ukraine/dashboard', {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()

      if (data.frequency) {
        setFrequencyData(data.frequency)
        setTotalSignals(data.total || 0)
      }
      if (data.weapons) {
        setWeaponData(data.weapons)
        setWeaponTotal(data.weapons.reduce((sum: number, w: { count: number }) => sum + w.count, 0))
      }
      if (data.weaponFrequency) {
        setWeaponFrequencyData(data.weaponFrequency.data)
        setWeaponsList(data.weaponFrequency.weapons)
      }
      if (data.timestamp) {
        setLastDashboardUpdate(data.timestamp)
      }
      setDashboardError(null)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setDashboardError(
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Dashboard data timed out'
          : 'Unable to load dashboard data'
      )
    }
  }, [])

  // Initial load and polling
  useEffect(() => {
    fetchAlerts()
    fetchDashboard()
    const alertInterval = setInterval(fetchAlerts, POLL_INTERVAL)
    const dashboardInterval = setInterval(fetchDashboard, 5 * 60 * 1000) // refresh charts every 5 min
    return () => {
      clearInterval(alertInterval)
      clearInterval(dashboardInterval)
    }
  }, [fetchAlerts, fetchDashboard])

  // Override global overflow
  useEffect(() => {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'auto'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  // Refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboard()
        fetchAlerts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchDashboard, fetchAlerts])

  // Helper functions for rubber-band effect
  const getBoundsObject = () => new mapboxgl.LngLatBounds(UKRAINE_BOUNDS[0], UKRAINE_BOUNDS[1])

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

    if (!bounds.contains(center)) {
      const [constrainedLng, constrainedLat] = constrainToBounds(center.lng, center.lat)
      isAnimating.current = true
      map.current.easeTo({
        center: [constrainedLng, constrainedLat],
        duration: 500,
        easing: (t) => 1 - Math.pow(1 - t, 3)
      })
      setTimeout(() => { isAnimating.current = false }, 500)
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
          style: 'mapbox://styles/mapbox/light-v11',
          center: [31.5, 48.5],
          zoom: 5,
          minZoom: 4,
          maxZoom: 12,
          attributionControl: false,
          scrollZoom: false,
        })

        map.current.on('load', () => {
          if (!map.current) return
          mapLoaded.current = true

          mapContainer.current?.querySelector('canvas')?.setAttribute('tabindex', '-1')

          map.current.addSource('country-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1'
          })

          // Add Ukraine administrative boundaries (oblasts) from public GeoJSON
          // Source: EugeneBorshch/ukraine_geojson - verified accessible
          map.current.addSource(REGIONS_SOURCE, {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/EugeneBorshch/ukraine_geojson/master/UA_FULL_Ukraine.geojson',
            generateId: true
          })

          map.current.addLayer({
            id: 'non-ukraine-overlay',
            type: 'fill',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['!=', ['get', 'iso_3166_1_alpha_3'], UKRAINE_ISO],
            paint: {
              'fill-color': '#e5e5e5',
              'fill-opacity': 0.85
            }
          })

          // Ukrainian regions fill (transparent by default, yellow on hover)
          map.current.addLayer({
            id: REGIONS_FILL_LAYER,
            type: 'fill',
            source: REGIONS_SOURCE,
            paint: {
              'fill-color': BRAND_YELLOW,
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.4,
                0
              ]
            }
          })

          // Ukrainian regions border lines
          map.current.addLayer({
            id: REGIONS_LINE_LAYER,
            type: 'line',
            source: REGIONS_SOURCE,
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                BRAND_YELLOW,
                '#999999'
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2,
                0.5
              ],
              'line-opacity': 0.8
            }
          })

          map.current.addLayer({
            id: 'ukraine-border',
            type: 'line',
            source: 'country-boundaries',
            'source-layer': 'country_boundaries',
            filter: ['==', ['get', 'iso_3166_1_alpha_3'], UKRAINE_ISO],
            paint: {
              'line-color': '#1a1a1a',
              'line-width': 2,
              'line-opacity': 0.7
            }
          })

          // Region hover events
          map.current.on('mousemove', REGIONS_FILL_LAYER, (e) => {
            if (!map.current || !e.features || e.features.length === 0) return

            if (hoveredRegionId.current !== null) {
              map.current.setFeatureState(
                { source: REGIONS_SOURCE, id: hoveredRegionId.current },
                { hover: false }
              )
            }

            hoveredRegionId.current = e.features[0].id ?? null
            if (hoveredRegionId.current !== null) {
              map.current.setFeatureState(
                { source: REGIONS_SOURCE, id: hoveredRegionId.current },
                { hover: true }
              )
            }

            // GeoJSON uses 'name:en' for English, 'name' for Ukrainian
            const props = e.features[0].properties
            const regionName = props?.['name:en'] || props?.name || 'Unknown'
            setHoveredRegion(regionName)
            map.current.getCanvas().style.cursor = 'pointer'
          })

          map.current.on('mouseleave', REGIONS_FILL_LAYER, () => {
            if (!map.current) return

            if (hoveredRegionId.current !== null) {
              map.current.setFeatureState(
                { source: REGIONS_SOURCE, id: hoveredRegionId.current },
                { hover: false }
              )
            }
            hoveredRegionId.current = null
            setHoveredRegion(null)
            map.current.getCanvas().style.cursor = ''
          })

          // Alert markers removed for now

          setIsLoading(false)
        })

        if (mapContainer.current) {
          const enableScrollZoom = () => map.current?.scrollZoom.enable()
          const disableScrollZoom = () => map.current?.scrollZoom.disable()
          mapContainer.current.addEventListener('mouseenter', enableScrollZoom)
          mapContainer.current.addEventListener('mouseleave', disableScrollZoom)
        }

        map.current.on('dragstart', () => { isDragging.current = true })
        map.current.on('drag', () => {
          if (!map.current) return
          const center = map.current.getCenter()
          if (!isWithinElasticBounds(center.lng, center.lat)) {
            const [constrainedLng, constrainedLat] = constrainToBounds(center.lng, center.lat)
            const overpanLng = center.lng - constrainedLng
            const overpanLat = center.lat - constrainedLat
            const dampingFactor = 0.3
            map.current.setCenter([
              constrainedLng + overpanLng * dampingFactor,
              constrainedLat + overpanLat * dampingFactor
            ])
          }
        })
        map.current.on('dragend', handleDragEnd)
        map.current.on('moveend', (e: mapboxgl.MapboxEvent) => {
          if (!isDragging.current && (e as any).originalEvent) handleDragEnd()
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
      if (popupRef.current) popupRef.current.remove()
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])


  // Alert markers removed for now

  // Light mode only
  const bgColor = '#f8f9fa'
  const textColor = '#1a1a1a'
  const mutedTextColor = '#6b7280'
  const cardBg = '#ffffff'
  const borderColor = '#e5e7eb'

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Popup and map styles */}
      <style jsx global>{`
        .mapboxgl-popup-content {
          background: ${cardBg};
          color: ${textColor};
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          padding: 0;
        }
        .mapboxgl-popup-close-button {
          color: ${mutedTextColor};
          font-size: 18px;
          padding: 4px 8px;
        }
        .mapboxgl-popup-tip {
          border-top-color: ${cardBg};
        }
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
        .mapboxgl-ctrl-attrib {
          display: none !important;
        }
      `}</style>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: textColor }}>
            Ukraine Russia Theatre
          </h1>
        </header>

        {/* Map Container - Full Width */}
        <div className="mb-8">
          <div className="relative rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {/* Hovered region indicator */}
            {hoveredRegion && (
              <div
                className="absolute top-4 left-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
                style={{
                  backgroundColor: BRAND_YELLOW,
                  color: '#1a1a1a'
                }}
              >
                {hoveredRegion}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: cardBg }}>
                <div className="text-sm" style={{ color: mutedTextColor }}>Loading map...</div>
              </div>
            )}

            {/* Error state */}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: cardBg }}>
                <div className="text-red-500 text-sm">{mapError}</div>
              </div>
            )}
          </div>

        </div>

        {/* Stacked Weapon Frequency Chart */}
        <div className="px-4 py-6 rounded-lg relative" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-semibold" style={{ color: textColor }}>
              Weekly Signal Frequency by Weapon Type
            </h2>
            {lastDashboardUpdate && (
              <span className="text-xs" style={{ color: mutedTextColor }}>
                Updated {formatTimeAgo(lastDashboardUpdate)}
              </span>
            )}
          </div>
          {dashboardError ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <div className="text-sm" style={{ color: mutedTextColor }}>{dashboardError}</div>
              <button
                onClick={() => fetchDashboard()}
                className="px-4 py-2 text-sm rounded-lg font-medium"
                style={{ backgroundColor: BRAND_YELLOW, color: '#1a1a1a' }}
              >
                Retry
              </button>
            </div>
          ) : (
            <WeaponLineChart
              data={weaponFrequencyData}
              weapons={weaponsList}
              total={totalSignals}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function UkraineClient() {
  return <UkraineContent />
}
