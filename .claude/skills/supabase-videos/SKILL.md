# Supabase Videos Skill

## Purpose

Manage video data and map pin positions. Query, add, and update video records with proper safety guardrails.

## When to Use / Triggers

- Adding new videos to the database
- Updating video pin positions
- Querying video data by country
- Debugging video display issues
- Validating coordinate data

## Inputs Required

1. For queries: country code (e.g., "VE")
2. For updates: video_id, new coordinates
3. For inserts: full video record (explicit user request required)

## Step-by-Step Workflow

### 1. Understand the Video Schema

```sql
video
├── video_id (text, primary key)
├── title (text)
├── description (text)
├── channel (text)
├── uploader (text)
├── country (text, e.g., "VE")
├── latitude (numeric)
├── longitude (numeric)
├── published_date (timestamp)
├── public_url (text) -- Stored video file URL
├── source_url (text) -- Original source URL
├── created_at (timestamp)
├── updated_at (timestamp)
```

### 2. Query Videos by Country

**Via API**:
```bash
curl "http://localhost:3000/api/videos/VE"
```

**Direct SQL**:
```sql
SELECT video_id, title, latitude, longitude, published_date
FROM video
WHERE country = 'VE'
ORDER BY created_at DESC;
```

### 3. Check Video Exists Before Update (REQUIRED)

```sql
SELECT video_id, latitude, longitude
FROM video
WHERE video_id = 'target-video-id';
```

### 4. Update Position (Only When Explicitly Requested)

**Via API** (preferred):
```bash
curl -X PATCH "http://localhost:3000/api/video/VIDEO_ID/position" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 10.5, "longitude": -66.9}'
```

**Direct SQL** (use service role):
```sql
UPDATE video
SET latitude = 10.5,
    longitude = -66.9,
    updated_at = NOW()
WHERE video_id = 'target-video-id';
```

### 5. Verify After Update

```sql
SELECT video_id, latitude, longitude, updated_at
FROM video
WHERE video_id = 'target-video-id';
```

## Output / Done Criteria

- Query returns expected video data
- Coordinates are valid (not null, within country bounds)
- After updates: positions persist on page refresh
- API returns 200 with success: true

## Pitfalls / Gotchas

### 1. DB Writes ONLY When Explicitly Requested

**NEVER auto-update positions**. The position update API exists for the edit mode UI. Only call it when:
- User explicitly asks to update a position
- Processing a save from the edit mode UI

### 2. Use Service Client for Writes

```typescript
// For reads (anon key is fine):
import { supabaseServer } from '@/lib/supabase/server'

// For writes (need service role):
import { createServiceClient } from '@/lib/supabase/service'
```

### 3. Select Before Update Pattern

The position API implements this:
```typescript
// 1. Check exists
const { data: existing } = await supabase
  .from('video')
  .select('video_id, latitude, longitude')
  .eq('video_id', videoId)

if (!existing || existing.length === 0) {
  return { error: 'Video not found' }
}

// 2. Log before state
console.log(`Before: lat=${existing[0].latitude}, lng=${existing[0].longitude}`)

// 3. Update
const { data } = await supabase
  .from('video')
  .update({ latitude, longitude, updated_at: new Date().toISOString() })
  .eq('video_id', videoId)
  .select()
  .single()

// 4. Verify
const { data: verification } = await supabase
  .from('video')
  .select('latitude, longitude')
  .eq('video_id', videoId)
  .single()
```

### 4. Coordinates Format

- Longitude first in arrays: `[lng, lat]` (Mapbox convention)
- But database stores separately: `latitude`, `longitude`
- API transforms: `coordinates: [parseFloat(video.longitude), parseFloat(video.latitude)]`

### 5. Null Coordinates

Videos without coordinates are filtered out:
```typescript
.filter(v => v.coordinates !== null)
```

### 6. Cache Headers

The videos API disables caching for immediate updates:
```typescript
headers: {
  'Cache-Control': 'no-cache, no-store, must-revalidate'
}
```

## Example Tasks

### Add a new video (user requested)

```bash
curl -X POST "http://localhost:3000/api/admin/add-videos" \
  -H "Content-Type: application/json" \
  -d '[{
    "video_id": "unique-id-123",
    "title": "Video Title",
    "country": "VE",
    "latitude": 10.48,
    "longitude": -66.87,
    "channel": "Channel Name",
    "published_date": "2025-01-20T00:00:00Z"
  }]'
```

### Find videos with missing coordinates

```sql
SELECT video_id, title, country
FROM video
WHERE latitude IS NULL OR longitude IS NULL
ORDER BY created_at DESC;
```

### Get all videos for Venezuela with position info

```sql
SELECT video_id, title, latitude, longitude,
       published_date, updated_at
FROM video
WHERE country = 'VE'
  AND latitude IS NOT NULL
ORDER BY published_date DESC;
```

### Search videos by title

```bash
curl "http://localhost:3000/api/admin/remove-video?search=keyword"
```

### Debug: Check if position update applied

```sql
SELECT video_id, latitude, longitude, updated_at
FROM video
WHERE video_id = 'target-id'
ORDER BY updated_at DESC;
```

## Related Files

- `app/api/videos/[country]/route.ts` - Fetch geolocated videos by country
- `app/api/video/[id]/position/route.ts` - Update video position
- `app/api/admin/add-videos/route.ts` - Bulk insert videos
- `app/api/admin/remove-video/route.ts` - Search/delete videos
- `lib/supabase/service.ts` - Service client for writes
- `scripts/add-fort-tiuna-videos.js` - Example data script
- `OSINT/geovideo/` - Video geolocation CLI

## Safety Checklist

Before any write operation:
- [ ] User explicitly requested the change
- [ ] Using `createServiceClient()` for write
- [ ] Queried record first to verify exists
- [ ] Logged before state
- [ ] Will verify after update
- [ ] Not committing secrets
