'use client'

import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Link from 'next/link'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function DecorativeGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'globe' as unknown as mapboxgl.Projection,
      center: [20, 20],
      zoom: 0.5,
      interactive: false,
      attributionControl: false,
      logoPosition: 'bottom-left',
    })

    mapRef.current = map

    // Hide Mapbox logo and disable focus trap
    map.on('load', () => {
      const logo = containerRef.current?.querySelector('.mapboxgl-ctrl-logo')
      if (logo) (logo as HTMLElement).style.display = 'none'
      const attrib = containerRef.current?.querySelector('.mapboxgl-ctrl-attrib')
      if (attrib) (attrib as HTMLElement).style.display = 'none'
      const canvas = containerRef.current?.querySelector('canvas')
      if (canvas) canvas.setAttribute('tabindex', '-1')
    })

    map.on('style.load', () => {
      map.setFog({
        color: '#ffffff',
        'high-color': '#f0f0f0',
        'space-color': '#ffffff',
        'star-intensity': 0,
        'horizon-blend': 0.02,
      })

      // Remove all labels and borders
      const layers = map.getStyle().layers
      if (layers) {
        for (const layer of layers) {
          if (
            layer.type === 'symbol' ||
            layer.id.includes('label') ||
            layer.id.includes('boundary') ||
            layer.id.includes('border') ||
            layer.id.includes('admin')
          ) {
            map.removeLayer(layer.id)
          }
        }
      }
    })

    // Slow rotation
    let animationId: number
    const speed = 0.03
    function rotate() {
      const center = map.getCenter()
      center.lng += speed
      map.setCenter(center)
      animationId = requestAnimationFrame(rotate)
    }
    rotate()

    return () => {
      cancelAnimationFrame(animationId)
      map.remove()
      mapRef.current = null
    }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    window.dispatchEvent(new Event('globe-wipe-start'))
  }, [])

  return (
    <Link href="/globe" className="group block relative overflow-hidden" aria-label="Open interactive globe" onClick={handleClick}>
      <div
        ref={containerRef}
        className="w-full h-[250px] md:h-[300px] transition-transform duration-300 ease-out group-hover:scale-110"
        style={{ cursor: 'pointer' }}
      />
      {/* Fade edges into white background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, white 0%, transparent 15%, transparent 85%, white 100%)',
        }}
      />
    </Link>
  )
}
