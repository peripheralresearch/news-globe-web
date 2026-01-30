# Web App Agent Guide

Agent documentation for the Next.js web application (Peripheral).

## How to Run

```bash
npm install
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Jest tests
```

## Environment Variables

Required in `.env.local`:

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL (public) |
| SUPABASE_URL | Supabase URL for server routes |
| SUPABASE_ANON_KEY | Anon/public key for API calls |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Anon key (browser) |
| SUPABASE_SERVICE_ROLE_KEY | Service role key (server only, writes) |
| NEXT_PUBLIC_MAPBOX_TOKEN | Mapbox GL JS access token |

**NEVER** commit secrets. Reference env var names only.

---

## Agent Roles

### 1. Frontend Agent (Next.js / Mapbox / UI)

**Scope**: React components, Mapbox integration, Tailwind styling, ThemeContext.

**Key Files**:
- `app/venezuela/page.tsx` - Live article with map + timeline
- `app/contexts/ThemeContext.tsx` - Light/dark theme toggle
- `app/layout.tsx` - Root layout, Source Serif 4 font via next/font

**Responsibilities**:
- Modify UI components and styling
- Handle Mapbox marker interactions
- Manage edit mode for pin dragging
- Ensure hydration-safe rendering (see hydration-timezones skill)

### 2. Backend/API Agent

**Scope**: Next.js API routes, data shaping, response formatting.

**Key Files**:
- `app/api/videos/[country]/route.ts` - Fetch geolocated videos by country (primary)
- `app/api/ice/videos/[country]/route.ts` - Fetch videos by country (deprecated, backwards compatibility)
- `app/api/stories/country/[country]/route.ts` - Fetch stories by country
- `app/api/video/[id]/position/route.ts` - Update video coordinates
- `app/api/admin/add-videos/route.ts` - Insert videos (service role)
- `app/api/admin/remove-video/route.ts` - Search/delete videos

**Responsibilities**:
- Shape API responses for frontend consumption
- Handle query params (limit, offset, filters)
- Log requests for debugging
- Use appropriate Supabase client (server vs service)

### 3. Data / Supabase Operator

**Scope**: Database queries, migrations, data integrity.

**Key Tables**:
- `video` - Video metadata + coordinates (country, latitude, longitude)
- `story` - Clustered stories with title, summary, timestamps
- `news_item` - Individual news articles linked to stories
- `entity_location` - Location entities
- `story_entity_location` - Story-location join (rank=1 for primary)
- `osint_source` - Source metadata

**Supabase Clients** (`lib/supabase/`):
- `server.ts` - `supabaseServer()` - Uses SUPABASE_URL + SUPABASE_ANON_KEY
- `client.ts` - `supabaseClient()` - Uses NEXT_PUBLIC_* vars (browser)
- `service.ts` - `createServiceClient()` - Uses SERVICE_ROLE_KEY (writes)

**Safety Rules**:
1. **Select before update** - Always query first to verify record exists
2. **DB writes only when explicitly requested** - Never auto-commit changes
3. **Use service client for writes** - Only `createServiceClient()` has write perms
4. **Log before/after** - Log state before and after mutations

### 4. SEO / Editor Agent

**Scope**: Metadata, structured data, crawlability, SSR strategy.

**Responsibilities**:
- Add semantic HTML (article, header, time, etc.)
- Configure metadata in page exports
- Add JSON-LD structured data (NewsArticle/Article)
- Ensure SSR for critical content (client components affect indexing)
- Maintain sitemap.xml and robots.txt

**Reference**: See `skills/seo-article-pages/SKILL.md`

### 5. QA / Debug Agent

**Scope**: Hydration errors, timezone issues, regressions.

**Common Issues**:
- Hydration mismatch from locale-dependent date formatting
- Timezone drift between server/client
- Missing Mapbox token
- Stale video positions after edit mode

**Reference**: See `skills/hydration-timezones/SKILL.md`

---

## Venezuela Episode Runbook

### Video Data Flow

1. **Source**: Videos stored in `video` table with `country='VE'`
2. **API**: `GET /api/videos/VE` queries and transforms to `VideoMarker[]`
3. **Fields**: `video_id`, `title`, `channel`, `published_date`, `latitude`, `longitude`, `public_url`, `source_url`
4. **Display**: Mapbox markers with draggable pins in edit mode

### Story Data Flow

1. **Source**: Stories linked via `entity_location` where name ilike 'venezuela'
2. **API**: `GET /api/stories/country/venezuela?limit=200`
3. **Join Path**: `story` -> `story_entity_location` (rank=1) -> `entity_location`
4. **Frontend Pruning**: Filtered by episode keywords (NOT database filtered)

### Episode Keywords (Client-Side Pruning)

```javascript
const episodeKeywords = [
  'venezuela', 'maduro', 'tanker', 'oil', 'blockade',
  'naval', 'ship', 'vessel', 'seize', 'capture',
  'strike', 'coast', 'fleet'
]
```

Stories are fetched with limit=200, then filtered client-side:
```javascript
const filtered = stories.filter(s => {
  const haystack = `${s.title} ${s.summary}`.toLowerCase()
  return episodeKeywords.some(k => haystack.includes(k))
})
```

**Do NOT modify the database to add pruning** - keep filtering in frontend.

### Timeline Computation

Location: `app/venezuela/page.tsx` lines 257-312

1. **UTC Normalization**: All dates converted to UTC midnight to avoid hydration mismatch
2. **Day Bucketing**: Videos + stories grouped by `YYYY-MM-DD` UTC key
3. **Date Range**: From earliest story/video to today (UTC)
4. **Stacked Segments**: Stories (lighter) stacked under videos (darker)
5. **Click Behavior**: Clicking a bar with videos triggers `handleVideoClick(firstVideo)`

```javascript
const utcDate = new Date(Date.UTC(
  parsed.getUTCFullYear(),
  parsed.getUTCMonth(),
  parsed.getUTCDate()
))
```

### Edit Mode

1. Toggle via edit button in header
2. Markers become draggable when `editMode=true`
3. Drags tracked in `pendingChanges` Map
4. Save button calls `PATCH /api/video/[id]/position` for each
5. After save, videos refetched to verify positions

### Known Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Hydration mismatch | Locale-dependent `toLocaleDateString()` | Use UTC + deterministic Intl config |
| Timeline dates off | Timezone drift | Use `Date.UTC()` for all bucketing |
| Mapbox blank | Missing `NEXT_PUBLIC_MAPBOX_TOKEN` | Check `.env.local` |
| Pins not saving | Wrong Supabase client | Use `createServiceClient()` for writes |
| Stale positions | Browser cache | API returns `Cache-Control: no-store` |

---

## Quick Reference

| Task | File/Command |
|------|--------------|
| Run dev server | `npm run dev` |
| Venezuela page | `app/venezuela/page.tsx` |
| Videos API | `app/api/videos/[country]/route.ts` |
| Stories API | `app/api/stories/country/[country]/route.ts` |
| Position update | `app/api/video/[id]/position/route.ts` |
| Supabase service | `lib/supabase/service.ts` |
| Theme context | `app/contexts/ThemeContext.tsx` |
