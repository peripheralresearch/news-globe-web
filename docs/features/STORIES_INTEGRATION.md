# Stories Integration Documentation

## Overview

This document describes the integration of latest and trending stories from the Supabase database into the Geopolitical Mirror application. The implementation provides real-time story feeds with entity enrichment and intelligent trending algorithms.

## Architecture

### Database Schema

The stories feature leverages the following Supabase tables:

1. **story** - Core stories table with 26,136+ stories
   - Contains title, description, summary, timestamps, topic keywords
   - Created via clustering of related news articles

2. **news_item** - Individual news articles (31,119+ items)
   - Links to stories via `story_id`
   - Contains media URLs, source information, content
   - Links to OSINT sources

3. **Entity Tables** - Enrichment data
   - `story_entity_location` - Geographic locations
   - `story_entity_person` - People mentioned
   - `story_entity_organisation` - Organizations involved
   - `entity_location`, `entity_person`, `entity_organisation` - Master entity tables

## Implementation

### API Routes

#### 1. Latest Stories API (`/api/stories/latest`)

Fetches the most recent stories with full entity enrichment.

**Endpoint**: `GET /api/stories/latest`

**Query Parameters**:
- `limit` (default: 20) - Number of stories to return
- `offset` (default: 0) - Pagination offset
- `hours` (default: 24) - Time window in hours

**Response Structure**:
```typescript
{
  status: 'success',
  data: {
    stories: Story[],
    total: number,
    hasMore: boolean
  }
}
```

**Features**:
- Filters stories by creation timestamp
- Enriches with locations, people, organizations
- Includes primary location for mapping
- Returns associated news items with media

**File**: `/Users/duan/Code/GM/web-app/app/api/stories/latest/route.ts`

#### 2. Trending Stories API (`/api/stories/trending`)

Identifies trending stories using a scoring algorithm.

**Endpoint**: `GET /api/stories/trending`

**Query Parameters**:
- `limit` (default: 10) - Number of trending stories
- `hours` (default: 48) - Time window for analysis

**Trending Score Algorithm**:
```
trendingScore = (newsItemCount × 2) + entityCount + recencyBonus

where:
  newsItemCount = number of news articles covering the story
  entityCount = total unique entities (locations + people + orgs)
  recencyBonus = 5 if < 12 hours old, 2 if < 24 hours old, 0 otherwise
```

**Features**:
- Analyzes 200 recent stories for trending calculation
- Sorts by trending score (most coverage + complexity + recency)
- Returns top N stories with entity breakdown
- Includes trending metrics in response

**File**: `/Users/duan/Code/GM/web-app/app/api/stories/trending/route.ts`

### UI Components

#### StoriesFeed Component

Reusable React component for displaying story feeds.

**File**: `/Users/duan/Code/GM/web-app/app/components/StoriesFeed.tsx`

**Props**:
```typescript
interface StoriesFeedProps {
  mode: 'latest' | 'trending'
  limit?: number
  hours?: number
  onStoryClick?: (story: Story) => void
}
```

**Features**:
- Real-time updates via Supabase subscriptions
- Expandable story summaries
- Entity badges (people, organizations, locations)
- Media preview (images/videos)
- Topic keyword tags
- Loading and error states
- Time-ago formatting

**Real-time Updates**:
```typescript
// Subscribes to new story insertions
const channel = supabase
  .channel('stories-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'story'
  }, (payload) => {
    fetchStories() // Refresh feed
  })
  .subscribe()
```

#### Stories Page

Dedicated page for browsing stories with filtering controls.

**File**: `/Users/duan/Code/GM/web-app/app/stories/page.tsx`

**Features**:
- Tab switching between Latest and Trending
- Time range selector (6h, 12h, 24h, 48h, 1 week)
- Live update indicator
- Responsive layout
- Navigation to globe view

**URL**: `http://localhost:3000/stories`

### Integration Points

#### Main Globe Page

Added navigation button to stories page in top-right controls.

**File**: `/Users/duan/Code/GM/web-app/app/page.tsx` (line 995)

```tsx
<a href="/stories" className="...">
  <svg>...</svg>
  <span>Stories</span>
</a>
```

## Data Flow

```
┌─────────────────┐
│  Supabase DB    │
│  - stories      │
│  - news_items   │
│  - entities     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │
│  /latest        │
│  /trending      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ StoriesFeed     │
│ Component       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stories Page    │
│ /stories        │
└─────────────────┘
```

## Entity Enrichment

Each story includes enriched entity data:

### Locations
- Name, coordinates (lat/lon)
- Location type and subtype
- Default zoom level for map display
- Primary location flag (rank = 1)
- Confidence score

### People
- Name and role
- Rank in story importance
- Confidence score

### Organizations
- Name and organization type
- Rank in story importance
- Confidence score

## Performance Optimizations

1. **Parallel Entity Queries**
   - Locations, people, and organizations fetched simultaneously
   - Uses Promise.all() for concurrent requests

2. **Pagination Support**
   - Configurable limit and offset
   - `hasMore` flag for infinite scroll

3. **Efficient Data Structures**
   - Map-based entity grouping by story_id
   - Single-pass entity association

4. **Caching Strategy**
   - No aggressive caching for real-time freshness
   - Relies on Supabase connection pooling

## Real-time Features

### Supabase Realtime Subscriptions

The StoriesFeed component subscribes to database changes:

```typescript
supabase
  .channel('stories-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'story'
  }, (payload) => {
    console.log('New story detected:', payload)
    fetchStories() // Refresh feed
  })
  .subscribe()
```

**Benefits**:
- Instant updates when new stories are added
- No polling required
- Low latency (< 1 second typically)
- Automatic reconnection on network issues

## Usage Examples

### Fetch Latest Stories

```bash
curl "http://localhost:3000/api/stories/latest?limit=10&hours=24"
```

### Fetch Trending Stories

```bash
curl "http://localhost:3000/api/stories/trending?limit=5&hours=48"
```

### Using the Component

```tsx
import StoriesFeed from '@/app/components/StoriesFeed'

<StoriesFeed
  mode="trending"
  limit={10}
  hours={24}
  onStoryClick={(story) => {
    console.log('Clicked story:', story.title)
  }}
/>
```

## Testing

### Manual Testing Steps

1. **Build Verification**
   ```bash
   npm run build
   ```
   - Build should complete successfully
   - No TypeScript errors

2. **API Testing**
   ```bash
   # Start dev server
   npm run dev

   # Test latest API
   curl "http://localhost:3000/api/stories/latest?limit=5"

   # Test trending API
   curl "http://localhost:3000/api/stories/trending?limit=5"
   ```

3. **UI Testing**
   - Navigate to `http://localhost:3000/stories`
   - Verify stories load
   - Switch between Latest and Trending tabs
   - Change time range filter
   - Click on a story
   - Verify entity badges display
   - Test "Read more" expansion

4. **Real-time Testing**
   - Open stories page
   - Insert a new story into Supabase (via SQL or external process)
   - Verify feed refreshes automatically

## Database Queries

### Get Story Count by Time Range

```sql
SELECT COUNT(*) FROM story
WHERE created >= NOW() - INTERVAL '24 hours';
```

### Get Stories with Entity Counts

```sql
SELECT
  s.id,
  s.title,
  COUNT(DISTINCT sel.location_id) as location_count,
  COUNT(DISTINCT sep.person_id) as person_count,
  COUNT(DISTINCT seo.organisation_id) as org_count
FROM story s
LEFT JOIN story_entity_location sel ON s.id = sel.story_id
LEFT JOIN story_entity_person sep ON s.id = sep.story_id
LEFT JOIN story_entity_organisation seo ON s.id = seo.story_id
WHERE s.created >= NOW() - INTERVAL '48 hours'
GROUP BY s.id, s.title
ORDER BY s.created DESC
LIMIT 10;
```

## Environment Configuration

Required environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zghbrwbfdoalgzpcnbcm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Future Enhancements

### Potential Features

1. **Story Detail Page**
   - Dedicated page for individual stories
   - Full entity relationship graph
   - Timeline of related news items
   - Source credibility indicators

2. **Advanced Filtering**
   - Filter by entity type
   - Filter by location/country
   - Filter by topic keywords
   - Date range picker

3. **Bookmarking**
   - Save stories for later
   - User collections
   - Share functionality

4. **Analytics**
   - Track trending topics over time
   - Entity co-occurrence analysis
   - Geographic heat maps
   - Source diversity metrics

5. **Search**
   - Full-text search across stories
   - Entity-based search
   - Semantic similarity search

6. **Notifications**
   - Alert on trending stories
   - Entity-based alerts
   - Custom keyword alerts

## Troubleshooting

### Stories Not Loading

1. Check Supabase connection:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" \
     "https://zghbrwbfdoalgzpcnbcm.supabase.co/rest/v1/story?select=*&limit=1"
   ```

2. Verify environment variables are set

3. Check browser console for errors

4. Verify API route is accessible:
   ```bash
   curl http://localhost:3000/api/stories/latest
   ```

### Real-time Updates Not Working

1. Check Supabase Realtime is enabled for the project
2. Verify RLS policies allow SELECT on `story` table
3. Check browser console for Supabase subscription errors
4. Ensure WebSocket connections are not blocked

### Trending Scores Seem Off

1. Verify entity counts are correct:
   ```sql
   SELECT story_id, COUNT(*) FROM story_entity_location GROUP BY story_id;
   ```

2. Check news item counts:
   ```sql
   SELECT story_id, COUNT(*) FROM news_item GROUP BY story_id ORDER BY COUNT(*) DESC LIMIT 10;
   ```

3. Adjust trending algorithm weights in `/api/stories/trending/route.ts`

## Files Created/Modified

### New Files
- `/app/api/stories/latest/route.ts` - Latest stories API
- `/app/api/stories/trending/route.ts` - Trending stories API
- `/app/components/StoriesFeed.tsx` - Stories feed component
- `/app/stories/page.tsx` - Stories page
- `/STORIES_INTEGRATION.md` - This documentation

### Modified Files
- `/app/page.tsx` - Added Stories navigation button
- `/app/venezuela/page.tsx` - Fixed TypeScript errors
- `/app/iran/page.tsx` - Fixed TypeScript errors

## Summary

The stories integration provides a comprehensive solution for displaying and exploring geopolitical intelligence from the Supabase database. Key features include:

- Real-time updates via Supabase subscriptions
- Intelligent trending algorithm based on coverage and complexity
- Full entity enrichment (locations, people, organizations)
- Clean, responsive UI with expandable content
- Pagination and time-based filtering
- Production-ready TypeScript implementation

The implementation follows Next.js best practices and integrates seamlessly with the existing Geopolitical Mirror application architecture.
