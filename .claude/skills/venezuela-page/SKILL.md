# Venezuela Page Skill

## Purpose

Safely modify the Venezuela live article page: Mapbox map, video overlay, edit mode, and timeline UI.

## When to Use / Triggers

- Adding/changing map markers or interactions
- Modifying the video player overlay
- Updating timeline bar chart behavior
- Changing edit mode (pin dragging) functionality
- Adjusting theme-aware styling
- Fixing map zoom/bounds behavior

## Inputs Required

1. Clear description of the UI change
2. Whether it affects edit mode, view mode, or both
3. Any new data requirements from APIs

## Step-by-Step Workflow

### 1. Read the Current Implementation

```
app/venezuela/page.tsx  (main component, ~970 lines)
app/contexts/ThemeContext.tsx  (theme state)
```

### 2. Understand Key State

```typescript
// Core state in VenezuelaArticleContent
const [videos, setVideos] = useState<VideoMarker[]>([])
const [stories, setStories] = useState<StoryItem[]>([])
const [currentVideo, setCurrentVideo] = useState<VideoMarker | null>(null)
const [editMode, setEditMode] = useState(false)
const [pendingChanges, setPendingChanges] = useState<Map<string, [number, number]>>(new Map())
```

### 3. Locate the Relevant Section

| Feature | Location (approx lines) |
|---------|------------------------|
| Video loading | 58-78 |
| Story loading + keyword filter | 81-109 |
| Save changes | 112-155 |
| Map initialization | 389-541 |
| Marker creation | 320-387 |
| Video overlay | 719-817 |
| Timeline computation | 257-312 |
| Timeline rendering | 879-955 |

### 4. Make Changes

- Preserve UTC date handling for hydration safety
- Keep edit mode guards (e.g., `if (editMode) return`)
- Maintain theme awareness via `useTheme()`
- Test both light and dark modes

### 5. Test Manually

```bash
cd application/web-app
npm run dev
# Open http://localhost:3000/venezuela
```

**Test Checklist**:
- [ ] Map loads with markers
- [ ] Click marker -> video overlay opens
- [ ] Close video -> returns to overview zoom
- [ ] Toggle edit mode -> pins become draggable
- [ ] Drag pin -> appears in pending changes
- [ ] Save changes -> positions persist after refresh
- [ ] Timeline bars render correctly
- [ ] Click timeline bar -> selects first video
- [ ] Theme toggle works without breaking map layers
- [ ] No hydration errors in console

## Output / Done Criteria

- Feature works as specified
- No console errors (especially hydration mismatches)
- Both edit and view modes function correctly
- Theme toggle doesn't break anything
- Timeline displays correct date range

## Pitfalls / Gotchas

### 1. Hydration Mismatch from Dates

**Bad**:
```javascript
new Date().toLocaleDateString() // Locale differs server vs client
```

**Good**:
```javascript
const utcDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
```

### 2. Map Not Initialized Check

Always guard map operations:
```javascript
if (!map.current || !map.current.isStyleLoaded()) return
```

### 3. Edit Mode Video Click

Video clicks are disabled in edit mode:
```javascript
const handleVideoClick = useCallback((video: VideoMarker) => {
  if (editMode) return // Guard
  // ...
}, [editMode])
```

### 4. Marker Recreation on Video/Edit Change

Markers are recreated when `videos`, `editMode`, or `currentVideo` changes (see useEffect deps at line 387). Avoid unnecessary state changes.

### 5. Pending Changes Not Persisted Until Save

Dragging pins only updates `pendingChanges`. The `saveAllChanges` function must be called to write to DB.

### 6. Theme Layer Updates

Map layers need manual paint property updates on theme change:
```javascript
map.current.setPaintProperty('non-venezuela-overlay', 'fill-color', theme === 'dark' ? '#0a0a0a' : '#0a0a0a')
```

## Example Tasks

### Add a new marker icon for selected state

1. Read marker creation code (lines 320-387)
2. Note `currentVideo?.id === video.id` check for yellow pin
3. Add new icon to `public/icons/`
4. Update img.src conditional

### Change timeline bar colors

1. Find timeline rendering (lines 879-955)
2. Locate `backgroundColor` style properties
3. Update colors while preserving theme conditionals
4. Test both themes

### Add tooltip on marker hover

1. Add mouseenter/mouseleave listeners in marker creation
2. Create tooltip element with video.title
3. Position relative to marker
4. Clean up listeners in marker removal

## Related Files

- `app/api/ice/videos/[country]/route.ts` - Video data source
- `app/api/stories/country/[country]/route.ts` - Story data source
- `app/api/video/[id]/position/route.ts` - Position updates
- `public/icons/location-pin.png` - Red marker icon
- `public/icons/location-pin-yellow.png` - Selected marker icon
