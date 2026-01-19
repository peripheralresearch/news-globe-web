import type mapboxgl from 'mapbox-gl'

export interface ExtractedLocation {
  name: string
  variations: string[]
}

/**
 * Extract location names from text
 */
export function extractLocations(text: string, additionalContext?: string): ExtractedLocation[] {
  const locations: ExtractedLocation[] = []
  const combinedText = additionalContext ? `${text} ${additionalContext}` : text

  // Common street patterns
  const streetPatterns = [
    /\b(\w+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Place|Pl))\b/gi,
    /\b(\d+(?:st|nd|rd|th)\s+(?:Street|St|Avenue|Ave))\b/gi,
  ]

  // Extract streets
  streetPatterns.forEach(pattern => {
    const matches = combinedText.matchAll(pattern)
    for (const match of matches) {
      const name = match[1].trim()
      locations.push({
        name,
        variations: [name, name.replace(/\s+(Street|Avenue|Road|Drive|Boulevard|Lane)$/i, '')]
      })
    }
  })

  // Common building/landmark patterns
  const buildingPatterns = [
    /\b([\w\s]+(?:Building|Center|Centre|Hall|Park|Plaza|Tower|Complex))\b/gi,
    /\bWhipple Federal Building\b/gi,
    /\bFederal Building\b/gi,
    /\bCity Hall\b/gi,
  ]

  buildingPatterns.forEach(pattern => {
    const matches = combinedText.matchAll(pattern)
    for (const match of matches) {
      const name = match[0].trim()
      locations.push({
        name,
        variations: [name]
      })
    }
  })

  // Deduplicate
  const uniqueLocations = new Map<string, ExtractedLocation>()
  locations.forEach(loc => {
    const key = loc.name.toLowerCase()
    if (!uniqueLocations.has(key)) {
      uniqueLocations.set(key, loc)
    }
  })

  return Array.from(uniqueLocations.values())
}

/**
 * Apply location-based label filtering to map
 */
export function applyLocationLabelFilter(
  map: mapboxgl.Map,
  locations: ExtractedLocation[]
): void {
  if (!map || !map.isStyleLoaded()) return

  const allVariations = locations.flatMap(loc => loc.variations)

  if (allVariations.length === 0) {
    clearLocationLabelFilter(map)
    return
  }

  // Create case-insensitive filter
  const lowerVariations = allVariations.map(v => v.toLowerCase())

  // Get all text layers
  const style = map.getStyle()
  if (!style || !style.layers) return

  style.layers.forEach((layer: any) => {
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      const layerId = layer.id

      // Show only labels that match our locations
      try {
        map.setFilter(layerId, [
          'any',
          ...lowerVariations.map(variation => [
            'in',
            ['downcase', ['get', 'name']],
            ['literal', variation]
          ])
        ])
      } catch (e) {
        // Ignore errors for layers that don't support filtering
        console.debug(`Could not filter layer ${layerId}:`, e)
      }
    }
  })
}

/**
 * Clear location label filtering
 */
export function clearLocationLabelFilter(map: mapboxgl.Map): void {
  if (!map || !map.isStyleLoaded()) return

  const style = map.getStyle()
  if (!style || !style.layers) return

  style.layers.forEach((layer: any) => {
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      const layerId = layer.id
      try {
        map.setFilter(layerId, null)
      } catch (e) {
        console.debug(`Could not clear filter for layer ${layerId}:`, e)
      }
    }
  })
}
