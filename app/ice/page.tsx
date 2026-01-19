'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Timeline, type TimelineEvent } from '@/app/components/Timeline'
import { useMapLabelFilter } from '@/app/hooks/useMapLabelFilter'

interface TimelineData {
  title: string
  subtitle: string
  events: TimelineEvent[]
}

interface VideoMarker {
  id: string
  title: string
  channelName: string
  date: string
  coordinates: [number, number]
  videoUrl: string
  description?: string
}

interface LocationGroup {
  coordinates: [number, number]
  events: TimelineEvent[]
}

export default function ICEPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [videos, setVideos] = useState<VideoMarker[]>([])
  const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [currentVideo, setCurrentVideo] = useState<VideoMarker | null>(null)
  const [showTimeline, setShowTimeline] = useState(true)

  // Map label filtering
  const { filterByText, clearFilter } = useMapLabelFilter({
    map: map.current,
    enabled: true
  })

  // Load timeline data
  useEffect(() => {
    async function loadData() {
      try {
        const timelineRes = await fetch('/data/USA/timeline.json')
        const timelineData: TimelineData = await timelineRes.json()
        setTimeline(timelineData)

        // Load video data
        const videosRes = await fetch('/data/USA/videos.json')
        const videosData = await videosRes.json()
        setVideos(videosData.videos || [])

        // Group events by location
        const groups = new Map<string, TimelineEvent[]>()
        timelineData.events.forEach(event => {
          if (event.location) {
            const key = `${event.location.latitude.toFixed(4)},${event.location.longitude.toFixed(4)}`
            if (!groups.has(key)) {
              groups.set(key, [])
            }
            groups.get(key)!.push(event)
          }
        })

        const locationGroups: LocationGroup[] = Array.from(groups.entries()).map(([key, events]) => ({
          coordinates: [events[0].location!.longitude, events[0].location!.latitude],
          events
        }))

        setLocationGroups(locationGroups)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
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

  // Add markers when videos load
  useEffect(() => {
    if (!map.current || locationGroups.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    locationGroups.forEach(group => {
      const eventType = group.events[0].type
      const eventCount = group.events.length

      // Color based on event type
      const colors = {
        incident: '#ef4444',
        protest: '#3b82f6',
        statement: '#a855f7',
        action: '#22c55e',
        response: '#eab308'
      }

      const color = colors[eventType]

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.cssText = `
        width: ${eventCount > 1 ? '40px' : '30px'};
        height: ${eventCount > 1 ? '40px' : '30px'};
        background-color: ${color};
        border: 3px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${eventCount > 1 ? '14px' : '12px'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        animation: pulse 2s ease-in-out infinite;
      `

      if (eventCount > 1) {
        el.textContent = eventCount.toString()
      }

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(group.coordinates)
        .addTo(map.current!)

      // Click handler
      el.addEventListener('click', () => {
        handleEventClick(group.events[0])
      })

      markersRef.current.push(marker)
    })

    // Add pulse animation to CSS
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
  }, [locationGroups])

  // Handle event selection
  const handleEventClick = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event)

    // Fly to location
    if (event.location && map.current) {
      map.current.flyTo({
        center: [event.location.longitude, event.location.latitude],
        zoom: 14,
        duration: 1500
      })
    }

    // Apply label filtering
    if (event.description && event.location) {
      filterByText(event.description, event.location.name)
    }

    // Load first video if available
    if (event.videoIds && event.videoIds.length > 0) {
      const videoId = event.videoIds[0]
      const video = videos.find(v => v.id === videoId)
      if (video) {
        setCurrentVideo(video)
      }
    } else {
      setCurrentVideo(null)
    }
  }, [videos, filterByText])

  // Handle video change
  const handleVideoChange = useCallback((videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (video) {
      setCurrentVideo(video)

      // Fly to video location
      if (map.current) {
        map.current.flyTo({
          center: video.coordinates,
          zoom: 14,
          duration: 1000
        })
      }
    }
  }, [videos])

  // Close event/video
  const handleClose = useCallback(() => {
    setSelectedEvent(null)
    setCurrentVideo(null)
    clearFilter()

    // Return to overview
    if (map.current) {
      map.current.flyTo({
        center: [-93.2650, 44.9778],
        zoom: 10,
        duration: 1500
      })
    }
  }, [clearFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading timeline...</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {timeline?.title || 'ICE & Minnesota'}
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl">
              {timeline?.subtitle || 'The shooting of Renée Good and the protests that followed'}
            </p>
          </div>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur transition-colors"
          >
            {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
          </button>
        </div>
      </div>

      {/* Timeline Sidebar */}
      {showTimeline && timeline && (
        <div className="absolute left-0 top-0 bottom-0 w-[500px] bg-black/80 backdrop-blur-md z-20 border-r border-white/10">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <Timeline
                events={timeline.events}
                onEventClick={handleEventClick}
                selectedEventId={selectedEvent?.id}
              />
            </div>
          </div>
        </div>
      )}

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

              {/* Multiple videos navigation */}
              {selectedEvent && selectedEvent.videoIds && selectedEvent.videoIds.length > 1 && (
                <div className="mt-4 flex gap-2">
                  {selectedEvent.videoIds.map((videoId, idx) => (
                    <button
                      key={videoId}
                      onClick={() => handleVideoChange(videoId)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentVideo.id === videoId
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Video {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
