# Hydration & Timezones Skill

## Purpose

Prevent React hydration errors caused by timezone and locale differences between server and client rendering.

## When to Use / Triggers

- Displaying dates or times in the UI
- Building timelines or calendars
- Any `new Date()` usage in components
- Seeing hydration mismatch errors in console
- "Text content did not match" warnings

## Inputs Required

1. The date/time values being rendered
2. Current formatting approach
3. Whether server and client rendering is involved

## Step-by-Step Workflow

### 1. Identify the Problem

**Hydration Error**: Server renders one value, client renders different value.

Common console message:
```
Warning: Text content did not match. Server: "Jan 24" Client: "Jan 25"
```

**Cause**: Server and client in different timezones, or locale-dependent formatting.

### 2. Understand Why It Happens

```javascript
// PROBLEMATIC: Different results on server vs client
const date = new Date('2025-01-25T00:00:00Z')

// Server (UTC): "January 25, 2025"
// Client (PST): "January 24, 2025" (8 hours behind UTC)
date.toLocaleDateString('en-US')
```

### 3. Apply UTC Normalization

**The Venezuela page pattern** (lines 257-312):

```javascript
// Create UTC-normalized date (no timezone drift)
const now = new Date()
const today = new Date(Date.UTC(
  now.getUTCFullYear(),
  now.getUTCMonth(),
  now.getUTCDate()
))

// Parse dates to UTC midnight
const parsed = new Date(dateValue)
const utcDate = new Date(Date.UTC(
  parsed.getUTCFullYear(),
  parsed.getUTCMonth(),
  parsed.getUTCDate()
))

// Use ISO string slice for day key (always consistent)
const key = utcDate.toISOString().slice(0, 10) // "2025-01-25"
```

### 4. Deterministic Formatting

**Bad** (locale-dependent):
```javascript
date.toLocaleDateString() // Varies by system locale
```

**Good** (explicit locale):
```javascript
const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
})
formatter.format(utcDate) // "Jan 25" - consistent
```

### 5. Avoid Problematic Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `new Date().toLocaleString()` | Locale varies | Use explicit locale |
| `date.getDate()` | Local timezone | Use `date.getUTCDate()` |
| `date.getMonth()` | Local timezone | Use `date.getUTCMonth()` |
| `moment().format()` | Depends on system | Use UTC mode |
| `Date.now()` in render | Changes each render | Memoize or lift up |

### 6. Test for Hydration Safety

```bash
# Build and start production server
npm run build
npm run start

# Open in browser, check console for:
# - "Text content did not match"
# - "Hydration failed"
# - Any React hydration warnings
```

## Output / Done Criteria

- No hydration warnings in console
- Dates display consistently in all timezones
- Build passes without SSR errors
- Timeline shows correct day counts

## Pitfalls / Gotchas

### 1. Intl.DateTimeFormat Caching

Create formatter once, not in render:
```javascript
// Good: Created once
const formatDay = useMemo(() =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
  []
)

// Bad: Created every render
<span>{new Intl.DateTimeFormat('en-US').format(date)}</span>
```

### 2. Date Constructor Quirks

```javascript
// These are NOT equivalent:
new Date('2025-01-25')           // Parsed as LOCAL midnight
new Date('2025-01-25T00:00:00Z') // Parsed as UTC midnight
```

Always include timezone in date strings or use `Date.UTC()`.

### 3. useEffect vs useMemo for Dates

```javascript
// For display values: useMemo (runs during render, consistent)
const days = useMemo(() => computeDays(data), [data])

// For side effects: useEffect (runs after mount, client-only)
useEffect(() => {
  setClientTime(new Date()) // OK: client-only state
}, [])
```

### 4. "Mounted" Pattern for Client-Only Content

```javascript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

// Server renders null/placeholder, client renders actual
return mounted ? <ClientOnlyContent /> : <Placeholder />
```

### 5. Don't Trust Date.now() in SSR

```javascript
// Bad: Different on server vs client
const timestamp = Date.now()

// Good: Compute client-side only
const [timestamp, setTimestamp] = useState<number | null>(null)
useEffect(() => {
  setTimestamp(Date.now())
}, [])
```

## Example Tasks

### Fix timeline hydration mismatch

1. Find date rendering code
2. Check if using local timezone methods
3. Convert to UTC pattern:
```javascript
const utcDate = new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate()
))
```
4. Use ISO slice for keys: `utcDate.toISOString().slice(0, 10)`
5. Test with `npm run build && npm run start`

### Add "time ago" display safely

```javascript
// Don't render time-ago during SSR (changes constantly)
const [timeAgo, setTimeAgo] = useState<string>('')

useEffect(() => {
  const update = () => {
    const diff = Date.now() - date.getTime()
    setTimeAgo(formatTimeAgo(diff))
  }
  update()
  const interval = setInterval(update, 60000)
  return () => clearInterval(interval)
}, [date])

// Server renders empty, client renders "5 minutes ago"
return <span>{timeAgo || 'Just now'}</span>
```

### Debug hydration mismatch

1. Check browser console for exact mismatch message
2. Find component rendering that text
3. Identify date formatting code
4. Compare server output (view source) vs client output
5. Apply UTC normalization
6. Test with production build

## Venezuela Page Reference

The timeline in `app/venezuela/page.tsx` (lines 257-312) demonstrates the correct pattern:

```javascript
const timelineDays = useMemo(() => {
  // UTC-normalized "today"
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  // Consistent formatter
  const formatDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

  // UTC bucket keys
  const addItem = (dateValue: string | null, ...) => {
    const parsed = new Date(dateValue)
    const utcDate = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
    const key = utcDate.toISOString().slice(0, 10) // "2025-01-25"
    // ...
  }

  // ...
}, [videos, stories])
```

## Checklist

Before shipping date-related UI:
- [ ] All dates use UTC methods (`getUTCDate()`, etc.)
- [ ] `Intl.DateTimeFormat` has explicit locale
- [ ] No `toLocaleDateString()` without explicit locale
- [ ] No `Date.now()` in render path
- [ ] Tested with production build
- [ ] No hydration warnings in console
