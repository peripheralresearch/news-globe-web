'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface VideoMarker {
  id: string
  title: string
  channelName: string
  date: string
  coordinates: [number, number]
  videoUrl: string
  description?: string
}

export default function ICEPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [videos, setVideos] = useState<VideoMarker[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoMarker | null>(null)

  // Load video data
  useEffect(() => {
    async function loadData() {
      try {
        const videosRes = await fetch('/data/USA/videos.json')
        const videosData = await videosRes.json()
        setVideos(videosData.videos || [])
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading videos:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      console.error('❌ Missing NEXT_PUBLIC_MAPBOX_TOKEN')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-93.2650, 44.9778], // Minneapolis
      zoom: 10,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: false
    })

    map.current.on('load', () => {
      console.log('✅ Map loaded')
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Add video markers to map
  useEffect(() => {
    if (!map.current || videos.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    videos.forEach(video => {
      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #3b82f6;
        border: 3px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        animation: pulse 2s ease-in-out infinite;
      `

      // Add video icon
      el.innerHTML = '▶'

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(video.coordinates)
        .addTo(map.current!)

      // Click handler
      el.addEventListener('click', () => {
        handleVideoClick(video)
      })

      markersRef.current.push(marker)
    })

    // Add pulse animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }
    `
    if (!document.getElementById('marker-pulse-animation')) {
      style.id = 'marker-pulse-animation'
      document.head.appendChild(style)
    }
  }, [videos])

  // Handle video selection
  const handleVideoClick = useCallback((video: VideoMarker) => {
    setCurrentVideo(video)

    // Fly to video location
    if (map.current) {
      map.current.flyTo({
        center: video.coordinates,
        zoom: 14,
        duration: 1500
      })
    }
  }, [])

  // Close video
  const handleClose = useCallback(() => {
    setCurrentVideo(null)

    // Return to overview
    if (map.current) {
      map.current.flyTo({
        center: [-93.2650, 44.9778],
        zoom: 10,
        duration: 1500
      })
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-6 z-10">
        <h1 className="text-4xl font-bold text-white mb-2">
          ICE & Minnesota
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl">
          The shooting of Renée Good and the protests that followed
        </p>
      </div>

      {/* Video Player */}
      {currentVideo && (
        <div className="absolute bottom-6 right-6 w-[600px] bg-black/90 backdrop-blur-md rounded-lg overflow-hidden z-20 border border-white/20">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              ✕
            </button>

            {/* Video */}
            <video
              ref={videoRef}
              src={currentVideo.videoUrl}
              controls
              autoPlay
              className="w-full h-[400px] object-contain bg-black"
            />

            {/* Video info */}
            <div className="p-4">
              <h3 className="text-white font-semibold mb-1">{currentVideo.title}</h3>
              <p className="text-gray-400 text-sm mb-2">
                {currentVideo.channelName} • {new Date(currentVideo.date).toLocaleDateString()}
              </p>
              {currentVideo.description && (
                <p className="text-gray-300 text-sm">{currentVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
