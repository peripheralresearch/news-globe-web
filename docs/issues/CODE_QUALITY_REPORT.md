# Code Quality Report

**Date:** 2026-01-17
**Scope:** Main application code (app/, lib/)
**Total Lines of Code:** ~5,257 lines
**Files Analyzed:** 25 TypeScript/TSX files

---

## Executive Summary

This webapp exhibits several concerning architectural patterns that impact maintainability, testability, and scalability. The codebase shows signs of rapid iteration without sufficient refactoring, resulting in significant code duplication, inconsistent patterns, and violation of separation of concerns.

### Key Metrics
- **Massive Components:** 1 component over 1000 lines (app/page.tsx: 1425 lines)
- **Code Duplication:** ~40% duplication across map components and API routes
- **Type Safety Issues:** 39 uses of `any` type across 14 files
- **Console Usage:** 99 console.log/error/warn statements (production code)
- **Supabase Client Duplication:** 3 API routes create their own clients instead of using shared utilities

### Priority Areas
1. **CRITICAL:** Extract and refactor the 1425-line home page component
2. **CRITICAL:** Eliminate massive code duplication in map components (Iran, Venezuela, Globe)
3. **HIGH:** Consolidate Supabase client creation patterns
4. **HIGH:** Extract shared utilities (formatTimeAgo, media type detection)
5. **MEDIUM:** Remove console logging or use proper logging library
6. **MEDIUM:** Improve type safety (reduce `any` usage)

---

## Critical Issues

### 1. Monolithic Component - app/page.tsx (1425 lines) 🚨

**Location:** `/app/page.tsx`
**Lines:** 1425
**Severity:** CRITICAL

**Problems:**
- Single file handles globe visualization, data fetching, entrance animations, rotation logic, user interactions, search, map style toggling, and story display
- 15+ state variables
- Multiple `useEffect` hooks with complex dependencies
- Mixed concerns: UI rendering, animation logic, API calls, event handling
- Extremely difficult to test individual features
- High risk of bugs when modifying any feature

**Recommended Refactoring:**
```
app/page.tsx (orchestration only - ~200 lines)
├── components/Globe/
│   ├── GlobeMap.tsx (map rendering and interactions)
│   ├── GlobeAnimations.tsx (entrance + rotation logic)
│   ├── GlobeControls.tsx (search, style toggle, etc.)
│   └── hooks/
│       ├── useGlobeData.ts (data fetching)
│       ├── useGlobeRotation.ts (rotation state)
│       └── useGlobeInteractions.ts (click handlers)
├── components/Stories/
│   ├── StoriesPanel.tsx
│   └── StoryCard.tsx
└── lib/globe/
    ├── animations.ts (animation logic)
    └── mapConfig.ts (map configuration)
```

**Impact:** HIGH - This file is a single point of failure for the entire home page

---

### 2. Massive Code Duplication - Map Components 🚨

**Location:** `/app/iran/page.tsx`, `/app/venezuela/page.tsx`, `/app/globe/page.tsx`
**Duplication:** ~70% code overlap
**Severity:** CRITICAL

**Duplicated Code Patterns:**

#### A. Identical Mapbox Initialization (~100 lines each)
```typescript
// DUPLICATED in iran/page.tsx, venezuela/page.tsx, globe/page.tsx
mapboxgl.accessToken = token
map.current = new mapboxgl.Map({
  container: mapContainer.current!,
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  // ... configuration
})
```

#### B. Identical Rubber-band/Elastic Bounds Logic (~150 lines each)
```typescript
// DUPLICATED in iran/page.tsx and venezuela/page.tsx
const getBoundsObject = () => { /* ... */ }
const isWithinElasticBounds = (lng, lat) => { /* ... */ }
const constrainToBounds = (lng, lat) => { /* ... */ }
const handleDragEnd = () => { /* ... */ }
```

#### C. Identical Scroll Zoom Handlers (~30 lines each)
```typescript
// DUPLICATED in iran/page.tsx, venezuela/page.tsx
mapElement.addEventListener('mouseenter', () => {
  if (map.current) map.current.scrollZoom.enable()
})
```

#### D. Identical formatTimeAgo Helper (~15 lines)
```typescript
// DUPLICATED in iran/page.tsx and StoriesFeed.tsx
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  // ... same logic
}
```

#### E. Identical Media Type Detection (~30 lines)
```typescript
// DUPLICATED in iran/page.tsx
const getMediaType = (url: string, mediaType: string | null) => {
  if (mediaType) {
    if (mediaType.startsWith('image')) return 'image'
    if (mediaType.startsWith('video')) return 'video'
  }
  // ... extension detection logic
}
```

**Recommended Refactoring:**
```
lib/map/
├── MapboxManager.ts (centralized map creation & lifecycle)
├── boundsConstraints.ts (elastic bounds logic)
├── scrollZoomControls.ts (scroll zoom behavior)
└── mapConfig.ts (shared config constants)

lib/utils/
├── timeFormatters.ts (formatTimeAgo)
└── mediaTypeDetection.ts (getMediaType)

components/Map/
├── CountryMapView.tsx (generic country-focused map)
└── hooks/
    ├── useMapboxInstance.ts
    └── useMapBoundsConstraint.ts
```

**Impact:** CRITICAL - Any bug fix or feature change requires updating 3+ files

---

### 3. Inconsistent Supabase Client Creation 🚨

**Location:** `/app/api/stories/latest/route.ts`, `/app/api/stories/trending/route.ts`, `/app/api/stories/country/[country]/route.ts`
**Severity:** HIGH

**Problem:**
Three API routes manually create Supabase clients instead of using the existing `supabaseServer()` utility:

```typescript
// ANTI-PATTERN - Duplicated in 3 API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  return NextResponse.json({ /* error */ }, { status: 500 })
}

const supabase = createClient(supabaseUrl, supabaseKey)
```

**Correct Pattern (already exists!):**
```typescript
// Good - used in sentinel/globe/route.ts
import { supabaseServer } from '@/lib/supabase/server'

const supabase = supabaseServer()
```

**Why This Matters:**
- Inconsistent error handling across routes
- Harder to add connection pooling or retry logic later
- If environment variable names change, need to update multiple files
- Mixing `NEXT_PUBLIC_*` and non-public env vars inconsistently

**Recommended Fix:**
Replace all manual client creation with `supabaseServer()` import.

**Files to Update:**
- `/app/api/stories/latest/route.ts` (lines 14-24)
- `/app/api/stories/trending/route.ts` (lines 14-23)
- `/app/api/stories/country/[country]/route.ts` (lines 13-23)

---

## High Priority Issues

### 4. Duplicated Entity Fetching Logic

**Location:** `/app/api/stories/latest/route.ts` and `/app/api/stories/trending/route.ts`
**Duplication:** ~120 lines
**Severity:** HIGH

**Problem:**
Both routes have nearly identical code for:
1. Fetching locations, people, organizations in parallel
2. Building entity maps
3. Enriching stories with entity data

**Duplicated Code Block:**
```typescript
// DUPLICATED in both files (lines 84-180 in latest, 82-145 in trending)
const [locationsResult, peopleResult, organisationsResult] = await Promise.all([
  supabase.from('story_entity_location').select(/* ... */),
  supabase.from('story_entity_person').select(/* ... */),
  supabase.from('story_entity_organisation').select(/* ... */)
])

// Build entity maps
const locationsByStory = new Map()
const peopleByStory = new Map()
const organisationsByStory = new Map()
// ... identical mapping logic
```

**Recommended Refactoring:**
```typescript
// lib/api/storyEnrichment.ts
export async function enrichStoriesWithEntities(
  supabase: SupabaseClient,
  storyIds: string[]
): Promise<Map<string, StoryEntities>> {
  // Centralized entity fetching logic
}

// Usage in both routes
const enrichedStories = await enrichStoriesWithEntities(supabase, storyIds)
```

---

### 5. Type Safety - Excessive `any` Usage

**Severity:** HIGH
**Occurrences:** 39 instances across 14 files

**Most Problematic Files:**
1. `/app/page.tsx` - 4 uses of `any`
2. `/app/api/stories/latest/route.ts` - 5 uses of `any`
3. `/app/api/stories/trending/route.ts` - 4 uses of `any`
4. `/app/iran/page.tsx` - 5 uses of `any`
5. `/app/components/StoriesFeed.tsx` - Multiple `any` in entity mapping

**Examples:**
```typescript
// ANTI-PATTERN
const newsItems = Array.isArray(story.news_item)
  ? story.news_item
  : [story.news_item].filter(Boolean)  // any type here

locationsResult.data?.forEach((item: any) => {  // Loses type safety
  // ...
})
```

**Recommended Fix:**
Define proper interfaces:
```typescript
// lib/types/stories.ts
export interface StoryEntityLocation {
  story_id: string
  rank: number
  confidence: number
  entity_location: {
    id: number
    name: string
    lat: number | null
    lon: number | null
    location_type: string
    default_zoom: number
  }
}

// Usage
locationsResult.data?.forEach((item: StoryEntityLocation) => {
  // Type-safe access
})
```

---

### 6. Missing Shared Component - Story Cards

**Location:** `/app/iran/page.tsx` and `/app/components/StoriesFeed.tsx`
**Duplication:** ~100 lines of JSX
**Severity:** HIGH

**Problem:**
Both files render story cards with:
- Expandable/collapsible functionality
- Media thumbnails
- News source display
- Time formatting
- Entity badges

The JSX is nearly identical but exists in two places.

**Recommended Refactoring:**
```typescript
// components/Story/StoryCard.tsx
interface StoryCardProps {
  story: Story
  isExpanded: boolean
  onToggle: (id: string) => void
  showEntities?: boolean
}

export function StoryCard({ story, isExpanded, onToggle, showEntities }: StoryCardProps) {
  // Centralized story card rendering
}
```

---

## Medium Priority Issues

### 7. Console Logging in Production

**Severity:** MEDIUM
**Occurrences:** 99 console.log/error/warn statements

**Problem:**
- Console statements in production code leak implementation details
- No log levels or structured logging
- Makes debugging harder (noise in production logs)
- Performance impact (console.log is slow in some browsers)

**Examples:**
```typescript
// app/page.tsx - 47 console statements!
console.log('✅ Map container ref exists')
console.log('🗺️ Initializing map...')
console.error('❌ Map container ref is null')
console.log('Globe API fetch error:', error)
```

**Recommended Fix:**
```typescript
// lib/logging/logger.ts
export const logger = {
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta)
    }
  },
  error: (message: string, error?: Error) => {
    // Send to error tracking service (Sentry, etc.)
    console.error(`[ERROR] ${message}`, error)
  }
}

// Usage
logger.debug('Map initialized', { zoom, center })
logger.error('Failed to load globe data', error)
```

---

### 8. Inconsistent Error Handling Patterns

**Severity:** MEDIUM
**Location:** API routes

**Problems:**
- Some routes return `{ status: 'error', message: '...' }`
- Others return `{ error: '...' }`
- No standardized error response format
- Inconsistent HTTP status codes

**Examples:**
```typescript
// Pattern A - used in stories/latest, stories/trending
return NextResponse.json({
  status: 'error',
  message: 'Failed to fetch stories',
  error: storiesError.message
}, { status: 500 })

// Pattern B - used in stories/country/[country]
return NextResponse.json(
  { error: 'Failed to fetch locations' },
  { status: 500 }
)
```

**Recommended Fix:**
```typescript
// lib/api/responses.ts
export function errorResponse(message: string, status: number = 500, details?: any) {
  return NextResponse.json({
    status: 'error',
    message,
    details,
    timestamp: new Date().toISOString()
  }, { status })
}

// Usage
if (storiesError) {
  return errorResponse('Failed to fetch stories', 500, storiesError.message)
}
```

---

### 9. Missing Proper TypeScript Configuration

**Severity:** MEDIUM
**Location:** Multiple type definition files

**Problem:**
- Type definitions scattered across components and API routes
- No shared type library for domain models
- Types defined inline instead of in dedicated files
- Same types redefined in multiple places

**Example - NewsItem defined 3+ times:**
```typescript
// app/page.tsx
interface NewsItem {
  id: string
  title: string | null
  summary: string | null
  created: string
  location: string
  coordinates: [number, number]
  storyCount?: number
}

// app/components/StoriesFeed.tsx
interface NewsItem {
  id: string
  title: string | null
  content: string | null
  summary?: string | null
  published: string
  media_url: string | null
  media_type: string | null
  link: string | null
  osint_source?: { /* ... */ }
}
```

**Recommended Structure:**
```
lib/types/
├── database.ts (Supabase generated types)
├── api.ts (API request/response types)
├── stories.ts (Story, NewsItem, etc.)
├── entities.ts (Location, Person, Organisation)
└── index.ts (re-exports)
```

---

### 10. Missing Component Documentation

**Severity:** MEDIUM

**Problem:**
- No JSDoc comments on complex components
- No prop documentation
- Unclear component responsibilities
- Hard for new developers to understand

**Example:**
```typescript
// CURRENT - No documentation
export default function IranArticlePage() {
  // 536 lines of code...
}

// RECOMMENDED
/**
 * Iran country page with satellite map view and news stories.
 *
 * Features:
 * - Satellite map centered on Iran with rubber-band boundary constraints
 * - List of Iran-related stories from the API
 * - Expandable story cards with news sources
 *
 * @remarks
 * This component uses Mapbox GL for map rendering. The map is constrained
 * to Iran's boundaries with elastic panning behavior.
 */
export default function IranArticlePage() {
  // ...
}
```

---

## Low Priority Issues

### 11. Magic Numbers and Strings

**Severity:** LOW
**Examples:**
```typescript
// app/iran/page.tsx
const ELASTIC_PADDING = 0.7  // What does 0.7 represent? Degrees? Percentage?
const dampingFactor = 0.3    // Why 0.3?

// app/page.tsx
const STORY_SUMMARY_LIMIT = 220  // Why 220 characters?
const ROTATION_SPEED = 0.015     // What unit? Degrees per what?
```

**Recommended Fix:**
Add comments or use more descriptive constants:
```typescript
const ELASTIC_PADDING_DEGREES = 0.7  // Allow 0.7° overpan before resistance
const PAN_DAMPING_FACTOR = 0.3       // Reduce overpan movement to 30%
const ROTATION_DEGREES_PER_FRAME = 0.015  // Slow rotation speed
```

---

### 12. Unused or Orphaned Files

**Severity:** LOW

**Files to Review:**
- `/app/components/VenezuelaMap.tsx` - 172 lines, not imported anywhere visible
- `/app/globe/page.tsx` - 150 lines, appears to be old version (not using current API)

**Action:** Confirm these are unused and delete, or document their purpose.

---

### 13. Inconsistent File Naming

**Severity:** LOW

**Mixed Conventions:**
- `page.tsx` (lowercase)
- `StoriesFeed.tsx` (PascalCase)
- `PolyClient.tsx` (PascalCase)
- `route.ts` (lowercase)

**Current Structure:**
```
app/
├── page.tsx (Next.js convention)
├── components/
│   ├── StoriesFeed.tsx (PascalCase - correct for React components)
│   └── VenezuelaMap.tsx
└── poly/
    └── PolyClient.tsx (should be page.tsx or component)
```

**Recommended:**
- Next.js routes: `page.tsx`, `route.ts` (lowercase)
- React components in /components: PascalCase
- Utilities in /lib: camelCase

---

## Architectural Recommendations

### 1. Extract Map Framework

**Priority:** HIGH

Create a reusable map system:
```
lib/map/
├── MapboxManager.ts          # Centralized map lifecycle
├── CountryMapConfig.ts        # Country-specific configs
├── BoundsConstraint.ts        # Elastic bounds logic
└── hooks/
    ├── useMapboxMap.ts        # Map instance hook
    └── useCountryBounds.ts    # Boundary constraint hook

components/Map/
├── CountryMapView.tsx         # Generic country map component
├── GlobeView.tsx              # Globe projection map
└── MapControls.tsx            # Reusable map controls

// Usage
<CountryMapView
  countryCode="IRN"
  bounds={IRAN_BOUNDS}
  enableElasticPan={true}
  onLocationClick={handleClick}
/>
```

---

### 2. Create Shared API Utilities

**Priority:** HIGH

```
lib/api/
├── supabase/
│   ├── storyQueries.ts        # Reusable story queries
│   ├── entityEnrichment.ts    # Entity fetching logic
│   └── clients.ts             # Centralized client creation
├── responses.ts               # Standard response formatters
└── validation.ts              # Request validation helpers
```

---

### 3. Implement Proper State Management

**Priority:** MEDIUM

For the home page (1425 lines), consider:
- Extract state to custom hooks
- Use Zustand or Context for global state (selected location, etc.)
- Separate UI state from data state

---

### 4. Add Testing Infrastructure

**Priority:** MEDIUM

Currently, there's no evidence of tests. Add:
```
app/
└── __tests__/
    ├── components/
    │   └── StoriesFeed.test.tsx
    └── api/
        └── stories-latest.test.ts

lib/
└── __tests__/
    ├── map/
    │   └── boundsConstraints.test.ts
    └── utils/
        └── timeFormatters.test.ts
```

---

## Metrics Summary

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| Largest Component | 1425 lines | <300 lines | CRITICAL |
| Code Duplication | ~40% | <10% | CRITICAL |
| `any` Type Usage | 39 instances | <5 instances | HIGH |
| Console Logging | 99 statements | 0 in production | MEDIUM |
| Manual Supabase Clients | 3 routes | 0 (use utility) | HIGH |
| Shared Type Definitions | 0% | 80% | MEDIUM |
| Test Coverage | 0% | >60% | MEDIUM |

---

## Refactoring Roadmap

### Phase 1: Critical Duplication (Week 1-2)
1. Extract map utilities to `lib/map/`
2. Create shared `CountryMapView` component
3. Replace Iran/Venezuela/Globe pages with shared component
4. Extract `formatTimeAgo` and `getMediaType` to `lib/utils/`

### Phase 2: Home Page Decomposition (Week 2-3)
1. Extract globe data fetching to `useGlobeData` hook
2. Extract rotation logic to `useGlobeRotation` hook
3. Create `GlobeMap`, `GlobeControls`, `StoriesPanel` components
4. Reduce `app/page.tsx` to ~200 lines

### Phase 3: API Standardization (Week 3-4)
1. Consolidate Supabase client usage
2. Extract story enrichment logic to shared utility
3. Standardize error responses
4. Add proper TypeScript types

### Phase 4: Type Safety & Testing (Week 4-5)
1. Create shared type definitions in `lib/types/`
2. Replace all `any` with proper types
3. Add Jest/Vitest configuration
4. Write tests for utilities and critical paths

### Phase 5: Production Readiness (Week 5-6)
1. Replace console.log with proper logger
2. Add error tracking integration
3. Document complex components
4. Performance audit and optimization

---

## Conclusion

This codebase shows promise but suffers from typical rapid-iteration technical debt. The primary issues are:

1. **Massive components** that violate single responsibility
2. **Extensive code duplication** (especially map logic)
3. **Inconsistent patterns** across similar functionality
4. **Weak type safety** with excessive `any` usage

The good news: The architecture is not fundamentally broken. These are refactoring problems, not architectural rewrites. With focused effort over 4-6 weeks, the codebase can reach professional standards.

**Immediate Action Items (This Week):**
1. Extract map utilities to eliminate 70% of duplication
2. Fix Supabase client inconsistency in 3 API routes
3. Extract formatTimeAgo to shared utility
4. Create initial type definitions in lib/types/

**Success Metrics After Refactoring:**
- Largest component: <400 lines (down from 1425)
- Code duplication: <15% (down from ~40%)
- Type safety: <5 uses of `any` (down from 39)
- Test coverage: >60% (up from 0%)
- Build time: 20% faster (less duplicate code to process)

---

**Prepared by:** Claude Code
**Review Date:** 2026-01-17
