# API Reference

Complete API documentation for the Peripheral web application.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Authentication

Most endpoints use Supabase anonymous authentication. Service role authentication is used server-side for privileged operations.

## Endpoints

### Globe Data

#### GET `/api/sentinel/globe`

Fetches aggregated location data with associated posts for globe visualization.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 35 | Maximum locations to return (1-50) |
| `hours` | number | 48 | Time window in hours (1-720) |
| `postLimit` | number | 100 | Maximum posts per location |

**Response:**
```typescript
{
  locations: Array<{
    latitude: number
    longitude: number
    location_name: string
    total_posts: number
    latest_created: string
    posts: Array<{
      id: string
      title: string
      description: string
      summary: string
      created: string
      updated: string
      topic_keywords: string[]
      news_items: Array<{
        id: string
        title: string
        published: string
        media_url?: string
        link?: string
        osint_source?: {
          name: string
          source_type: string
          country?: string
        }
      }>
      entities?: {
        locations: Array<{
          name: string
          lat: number
          lon: number
          location_type: string
          default_zoom: number
          rank: number
          confidence: number
        }>
        people: Array<{
          name: string
          role?: string
          rank: number
          confidence: number
        }>
        organisations: Array<{
          name: string
          org_type?: string
          rank: number
          confidence: number
        }>
      }
    }>
  }>
}
```

**Example:**
```bash
curl "https://your-domain.vercel.app/api/sentinel/globe?limit=20&hours=24"
```

### Stories

#### GET `/api/stories/latest`

Fetches the most recent stories.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of stories to return |
| `offset` | number | 0 | Pagination offset |
| `hours` | number | 48 | Time window in hours |

**Response:**
```typescript
{
  stories: Array<Story>
  total: number
  hasMore: boolean
}
```

#### GET `/api/stories/trending`

Fetches trending stories based on engagement metrics.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of stories to return |
| `offset` | number | 0 | Pagination offset |
| `hours` | number | 24 | Time window in hours |

**Response:**
```typescript
{
  stories: Array<Story>
  total: number
  hasMore: boolean
}
```

#### GET `/api/stories/country/[country]`

Fetches stories specific to a country.

**URL Parameters:**
- `country` - Country code or name (e.g., "venezuela", "iran")

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of stories to return |
| `offset` | number | 0 | Pagination offset |

**Response:**
```typescript
{
  stories: Array<Story>
  country: string
  total: number
}
```

### Image Proxy

#### GET `/api/proxy-image`

Secure server-side image proxy to bypass CORS restrictions.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL of the image to proxy |

**Security Features:**
- HTTPS-only URLs
- Private IP range blocking
- Content-type validation (image/* only)
- 10MB size limit
- 15-second timeout

**Headers:**
- `Cache-Control: public, max-age=86400` (24 hours)
- `Content-Type: [original-image-type]`

**Example:**
```html
<img src="/api/proxy-image?url=https://example.com/image.jpg" />
```

### Feed

#### GET `/api/feed`

Aggregated feed combining multiple content types.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "all" | Feed type: "all", "stories", "messages" |
| `limit` | number | 20 | Number of items to return |
| `offset` | number | 0 | Pagination offset |

**Response:**
```typescript
{
  items: Array<FeedItem>
  total: number
  nextOffset: number
}
```

### Messages

#### GET `/api/messages`

Fetches system messages and announcements.

**Response:**
```typescript
{
  messages: Array<{
    id: string
    content: string
    type: "info" | "warning" | "success"
    created: string
  }>
}
```

### ICE Videos

#### GET `/api/ice/videos/[country]`

Fetches ICE-related videos for a specific country.

**URL Parameters:**
- `country` - Country code (e.g., "us", "mx")

**Response:**
```typescript
{
  videos: Array<{
    id: string
    title: string
    url: string
    thumbnail: string
    duration: number
    published: string
  }>
}
```

### Donations (Stripe)

#### POST `/api/donations/create-checkout`

Creates a Stripe checkout session for donations.

**Request Body:**
```typescript
{
  amount: number // In cents
  currency: string // e.g., "usd"
  description?: string
}
```

**Response:**
```typescript
{
  checkoutUrl: string
  sessionId: string
}
```

#### GET `/api/donations/payment-links`

Fetches available Stripe payment links.

**Response:**
```typescript
{
  links: Array<{
    id: string
    url: string
    amount: number
    currency: string
    description: string
  }>
}
```

## Error Handling

All endpoints follow a consistent error format:

```typescript
{
  error: {
    code: string
    message: string
    details?: any
  }
  status: number
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Anonymous users**: 100 requests per minute
- **Authenticated users**: 1000 requests per minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Data Types

### Story

```typescript
interface Story {
  id: string
  title: string
  description?: string
  summary?: string
  created: string
  updated: string
  topic_keywords?: string[]
  news_items: NewsItem[]
  entities?: {
    locations: EntityLocation[]
    people: EntityPerson[]
    organisations: EntityOrganisation[]
  }
}
```

### NewsItem

```typescript
interface NewsItem {
  id: string
  title: string
  content?: string
  published: string
  media_url?: string
  link?: string
  osint_source?: OSINTSource
}
```

### EntityLocation

```typescript
interface EntityLocation {
  id: string
  name: string
  lat: number
  lon: number
  location_type: string
  default_zoom: number
  rank: number
  confidence: number
}
```

### EntityPerson

```typescript
interface EntityPerson {
  id: string
  name: string
  role?: string
  rank: number
  confidence: number
}
```

### EntityOrganisation

```typescript
interface EntityOrganisation {
  id: string
  name: string
  org_type?: string
  rank: number
  confidence: number
}
```

### OSINTSource

```typescript
interface OSINTSource {
  id: string
  name: string
  source_type: "telegram" | "news" | "tv" | "social"
  country?: string
}
```

## Database Functions (Supabase RPC)

These functions are called internally by API endpoints:

### get_location_aggregates_v2

Returns top locations with post counts.

**Parameters:**
- `hours_ago`: number (1-720)
- `max_locations`: number (1-50)

### get_location_posts

Returns posts grouped by location.

**Parameters:**
- `location_ids`: string[]
- `hours_ago`: number
- `posts_per_location`: number

## Caching

Responses include appropriate cache headers:

- **Static data**: `Cache-Control: public, max-age=3600` (1 hour)
- **Dynamic data**: `Cache-Control: public, max-age=60` (1 minute)
- **Real-time data**: `Cache-Control: no-cache`

## CORS

CORS is configured for:
- **Development**: `http://localhost:3000`
- **Production**: Your configured domain

## WebSocket Support

Real-time updates via Supabase Realtime:

```javascript
const supabase = createClient(url, key)
const channel = supabase
  .channel('stories')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'story' },
    (payload) => console.log('New story:', payload)
  )
  .subscribe()
```

## Examples

### Fetch Globe Data

```javascript
const response = await fetch('/api/sentinel/globe?limit=20&hours=48')
const data = await response.json()

data.locations.forEach(location => {
  console.log(`${location.location_name}: ${location.total_posts} posts`)
})
```

### Get Trending Stories

```javascript
const response = await fetch('/api/stories/trending?limit=5&hours=24')
const { stories } = await response.json()

stories.forEach(story => {
  console.log(story.title)
})
```

### Proxy an Image

```html
<img
  src="/api/proxy-image?url=https://external-site.com/image.jpg"
  alt="Proxied image"
  loading="lazy"
/>
```

## Support

For API issues or questions:
- GitHub Issues: [Project Repository](https://github.com/danielsunyuan/peripheral-webapp/issues)
- Documentation: [Full Documentation](./README.md)