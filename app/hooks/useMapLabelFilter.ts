import { useEffect, useCallback } from 'react'
import type mapboxgl from 'mapbox-gl'
import {
  extractLocations,
  applyLocationLabelFilter,
  clearLocationLabelFilter,
  type ExtractedLocation
} from '@/lib/utils/locationExtractor'

interface UseMapLabelFilterOptions {
  map: mapboxgl.Map | null
  enabled?: boolean
}

interface UseMapLabelFilterReturn {
  filterByText: (text: string, additionalContext?: string) => ExtractedLocation[]
  clearFilter: () => void
  isFiltering: boolean
}

export function useMapLabelFilter({
  map,
  enabled = true
}: UseMapLabelFilterOptions): UseMapLabelFilterReturn {
  const filterByText = useCallback((text: string, additionalContext?: string): ExtractedLocation[] => {
    if (!map || !enabled) return []

    const locations = extractLocations(text, additionalContext)

    if (map.isStyleLoaded()) {
      applyLocationLabelFilter(map, locations)
    } else {
      map.once('styledata', () => {
        applyLocationLabelFilter(map, locations)
      })
    }

    return locations
  }, [map, enabled])

  const clearFilter = useCallback(() => {
    if (!map || !enabled) return

    if (map.isStyleLoaded()) {
      clearLocationLabelFilter(map)
    }
  }, [map, enabled])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (map && enabled) {
        clearLocationLabelFilter(map)
      }
    }
  }, [map, enabled])

  return {
    filterByText,
    clearFilter,
    isFiltering: false // Could be enhanced to track filtering state
  }
}
