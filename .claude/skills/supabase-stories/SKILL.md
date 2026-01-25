# Supabase Stories Skill

## Purpose

Query stories and attached news items from Supabase. Find episode-relevant content without modifying the database.

## When to Use / Triggers

- Finding stories for a country/episode
- Validating story counts for a date range
- Looking up news_item attachments
- Understanding entity relationships
- Debugging why certain stories appear/don't appear

## Inputs Required

1. Country name or location filter
2. Date range (if applicable)
3. Episode keywords (for frontend filtering context)

## Step-by-Step Workflow

### 1. Understand the Data Model

```
story
├── id (uuid)
├── title
├── summary
├── created (timestamp)
├── updated (timestamp)
└── topic_keywords[]

story_entity_location (join table)
├── story_id -> story.id
├── location_id -> entity_location.id
├── rank (1 = primary location)
└── confidence

entity_location
├── id (uuid)
├── name (e.g., "Venezuela")
├── location_type (e.g., "Country")
└── lat, lon

news_item
├── id
├── story_id -> story.id
├── title
├── content
├── published
├── media_url
├── link
└── osint_source_id -> osint_source.id
```

### 2. Query Stories by Country

The API at `/api/stories/country/[country]/route.ts` does:

```sql
-- Step 1: Find location IDs
SELECT id FROM entity_location
WHERE name ILIKE 'venezuela'
  AND location_type IN ('Country', 'country');

-- Step 2: Find story IDs with this as PRIMARY location
SELECT story_id FROM story_entity_location
WHERE location_id IN (...)
  AND rank = 1;

-- Step 3: Get stories with news items
SELECT id, title, summary, created, updated,
       news_item(id, title, content, published, media_url, link,
                 osint_source(id, name, source_type))
FROM story
WHERE id IN (...);
```

### 3. Direct SQL Queries (via Supabase MCP or Studio)

**Count stories for a date**:
```sql
SELECT COUNT(*), DATE(created) as day
FROM story
WHERE created >= '2025-01-01'
GROUP BY DATE(created)
ORDER BY day DESC;
```

**Find stories with "tanker" in title**:
```sql
SELECT id, title, created
FROM story
WHERE title ILIKE '%tanker%'
ORDER BY created DESC
LIMIT 20;
```

**Get news items for a story**:
```sql
SELECT ni.id, ni.title, ni.link, os.name as source
FROM news_item ni
LEFT JOIN osint_source os ON ni.osint_source_id = os.id
WHERE ni.story_id = 'uuid-here';
```

### 4. Validate Counts for Frontend

The Venezuela page fetches with limit=200, then filters client-side:

```javascript
const episodeKeywords = ['venezuela', 'maduro', 'tanker', 'oil', 'blockade',
                         'naval', 'ship', 'vessel', 'seize', 'capture',
                         'strike', 'coast', 'fleet']
```

To validate:
```sql
SELECT COUNT(*) as total,
       SUM(CASE WHEN
         title ILIKE '%venezuela%' OR summary ILIKE '%venezuela%' OR
         title ILIKE '%maduro%' OR summary ILIKE '%maduro%' OR
         title ILIKE '%tanker%' OR summary ILIKE '%tanker%'
         -- add more keywords...
       THEN 1 ELSE 0 END) as filtered
FROM story s
JOIN story_entity_location sel ON s.id = sel.story_id
JOIN entity_location el ON sel.location_id = el.id
WHERE el.name ILIKE 'venezuela' AND sel.rank = 1;
```

### 5. Test via API

```bash
# Fetch stories
curl "http://localhost:3000/api/stories/country/venezuela?limit=50"

# Count response
curl -s "http://localhost:3000/api/stories/country/venezuela?limit=200" | jq '.stories | length'
```

## Output / Done Criteria

- Query returns expected data
- Counts match frontend expectations
- Entity relationships are correct
- No N+1 query issues (use joins/selects efficiently)

## Pitfalls / Gotchas

### 1. Don't Modify DB for Filtering

The frontend keyword filter is intentional. Do NOT:
- Add a `is_episode_relevant` column
- Delete non-matching stories
- Modify the API to filter server-side

### 2. Rank = 1 for Primary Location

Stories can have multiple locations. Only `rank = 1` entries are considered primary:
```sql
WHERE sel.rank = 1  -- Important!
```

### 3. Case-Insensitive Matching

Use `ILIKE` not `LIKE` for country names:
```sql
WHERE name ILIKE 'venezuela'  -- Matches "Venezuela", "VENEZUELA", etc.
```

### 4. News Item Can Be Array or Object

The API handles both:
```javascript
const newsItems = Array.isArray(story.news_item)
  ? story.news_item
  : story.news_item ? [story.news_item] : []
```

### 5. Created vs Published

- `story.created` - When the story was clustered
- `news_item.published` - When the source article was published

Use `story.created` for timeline bucketing.

## Example Tasks

### Find all tanker-related stories in January 2025

```sql
SELECT s.id, s.title, s.created, COUNT(ni.id) as news_count
FROM story s
LEFT JOIN news_item ni ON s.story_id = ni.story_id
JOIN story_entity_location sel ON s.id = sel.story_id
JOIN entity_location el ON sel.location_id = el.id
WHERE el.name ILIKE 'venezuela'
  AND sel.rank = 1
  AND s.created >= '2025-01-01'
  AND s.created < '2025-02-01'
  AND (s.title ILIKE '%tanker%' OR s.summary ILIKE '%tanker%')
GROUP BY s.id
ORDER BY s.created DESC;
```

### Check why a story doesn't appear

1. Verify story exists: `SELECT * FROM story WHERE id = 'uuid'`
2. Check location link: `SELECT * FROM story_entity_location WHERE story_id = 'uuid'`
3. Verify rank=1: `AND rank = 1`
4. Check keyword match against episodeKeywords list

### Get most-linked stories (by news item count)

```sql
SELECT s.id, s.title, COUNT(ni.id) as count
FROM story s
JOIN news_item ni ON s.id = ni.story_id
GROUP BY s.id
ORDER BY count DESC
LIMIT 20;
```

## Related Files

- `app/api/stories/country/[country]/route.ts` - Country stories API
- `app/api/stories/latest/route.ts` - Latest stories API
- `app/api/stories/trending/route.ts` - Trending algorithm
- `docs/features/STORIES_INTEGRATION.md` - Full integration docs
