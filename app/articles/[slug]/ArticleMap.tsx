'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/app/contexts/ThemeContext'

export default function ArticleMap() {
  const { theme, mounted } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const bgColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
  const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a'
  const mutedTextColor = theme === 'dark' ? '#9ca3af' : '#6b7280'
  const borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  return (
    <section
      className="rounded-lg overflow-hidden border"
      style={{ backgroundColor: bgColor, borderColor }}
      aria-label="Interactive map showing article location context"
    >
      {/* Map Header */}
      <div className="p-4 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: textColor }}>
              Location Context
            </h3>
            <p className="text-sm" style={{ color: mutedTextColor }}>
              Lorem ipsum dolor sit amet consectetur
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-sm rounded transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: textColor
            }}
            aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        className="relative transition-all duration-300"
        style={{
          height: isExpanded ? '600px' : '400px',
          backgroundColor: theme === 'dark' ? '#111827' : '#e5e7eb'
        }}
      >
        {/* Map Placeholder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke={mutedTextColor}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <p className="mt-4 text-sm" style={{ color: mutedTextColor }}>
            Interactive map placeholder
          </p>
        </div>

        {/* Map Markers Placeholder */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-8 h-8 rounded-full animate-pulse"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.5)',
              boxShadow: `0 0 0 8px ${theme === 'dark' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`
            }}
            aria-label="Location marker"
          />
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${borderColor}`
            }}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${borderColor}`
            }}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Attribution */}
        <div
          className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            color: mutedTextColor
          }}
        >
          Map data placeholder
        </div>
      </div>

      {/* Map Legend/Info */}
      <div className="p-4 border-t" style={{ borderColor }}>
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
            />
            <span className="text-sm" style={{ color: textColor }}>
              Primary Location
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            />
            <span className="text-sm" style={{ color: textColor }}>
              Secondary Locations
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
