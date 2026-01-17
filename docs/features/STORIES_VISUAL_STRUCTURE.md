# Stories Page - Visual Structure

## Component Hierarchy

```
StoriesFeed
│
├── Story Card (Collapsed State)
│   ├── Header (Clickable)
│   │   ├── Title + Chevron Icon (rotates when expanded)
│   │   ├── Metadata (time, source count, trending badge)
│   │   └── Primary Location
│   ├── Summary (truncated if >200 chars)
│   ├── Entity Tags (People, Orgs, Locations)
│   └── Keywords
│
└── Story Card (Expanded State) ✨ NEW
    ├── Header (Clickable - same as above)
    ├── Summary (full text shown)
    ├── Entity Tags
    ├── Keywords
    └── News Items Section ✨ NEW
        ├── Section Header "News Sources (N)"
        └── News Item Cards (list)
            ├── News Item (Collapsed)
            │   ├── Title
            │   ├── Source Name + Time + "View Source" link
            │   └── Expand/Collapse Button (chevron)
            │
            └── News Item (Expanded) ✨ NEW
                ├── Title
                ├── Source Name + Time + "View Source" link
                ├── Expand/Collapse Button (chevron rotated)
                ├── Content/Summary (expandable section) ✨ NEW
                └── Media Preview (if available)
```

## Visual States

### Story Card - Collapsed
```
┌─────────────────────────────────────────────────────┐
│ Title ▼                              Location: Syria │
│ 2h ago • 5 sources • Trending 12                     │
│                                                       │
│ Summary text that describes the story and may be     │
│ truncated if it exceeds 200 characters...           │
│                                                       │
│ [Person Tag] [Org Tag] [Location Tag]               │
│ [keyword] [keyword] [keyword]                        │
└─────────────────────────────────────────────────────┘
```

### Story Card - Expanded
```
┌─────────────────────────────────────────────────────┐ ← Enhanced border glow
│ Title ▲                              Location: Syria │
│ 2h ago • 5 sources • Trending 12                     │
│                                                       │
│ Full summary text that describes the story without   │
│ any truncation, showing all the details available.   │
│                                                       │
│ [Person Tag] [Org Tag] [Location Tag]               │
│ [keyword] [keyword] [keyword]                        │
│                                                       │
│ ─────────────────────────────────────────────────── │ ← Separator
│                                                       │
│ NEWS SOURCES (5)                                     │
│                                                       │
│ ┌─────────────────────────────────────────────┐    │
│ │ News Article Title                      ▼   │    │
│ │ Reuters • 1h ago • View Source              │    │
│ └─────────────────────────────────────────────┘    │
│                                                       │
│ ┌─────────────────────────────────────────────┐    │
│ │ Another News Article                    ▲   │    │
│ │ BBC News • 3h ago • View Source             │    │
│ │ ─────────────────────────────────────────── │    │
│ │ Article content or summary appears here     │    │ ← Expandable content
│ │ when the news item is expanded. This can    │    │
│ │ be quite long...                             │    │
│ │                                              │    │
│ │ [Image Preview]                             │    │
│ └─────────────────────────────────────────────┘    │
│                                                       │
│ [More news items...]                                 │
└─────────────────────────────────────────────────────┘
```

## Interaction Flow

### User Clicks Story Header
1. Story card border brightens (white/10 → white/40)
2. Chevron icon rotates 180° (smooth transition)
3. News Items section slides down with fade-in animation
4. All news items are initially collapsed

### User Clicks News Item Expand Button
1. News item chevron rotates 180°
2. Content section slides down with fade-in animation
3. Content displays summary (preferred) or content (fallback)
4. Media preview loads if available

### User Clicks Story Header Again (to collapse)
1. All expanded news items automatically collapse
2. News Items section slides up with fade-out
3. Story border returns to normal state
4. Chevron rotates back to original position

## Color Scheme (Minimal/Bland Aesthetic)

### Story Cards
- Background: `bg-black/60 backdrop-blur`
- Border (normal): `border-white/10`
- Border (expanded): `border-white/40`
- Border (hover): `border-white/30`
- Shadow (expanded): `shadow-lg shadow-white/5`

### News Items
- Background: `bg-white/5`
- Border (normal): `border-white/10`
- Border (hover): `border-white/20`

### Text
- Title: `text-white font-semibold text-lg`
- Summary: `text-gray-300 text-sm`
- Metadata: `text-gray-400 text-xs`
- Source Name: `text-gray-300 text-xs font-medium`
- Links: `text-blue-400 hover:text-blue-300`

### Icons
- Chevron: `text-white/60`
- Entity Icons: Color-coded per entity type
  - People: `text-blue-300` on `bg-blue-500/20`
  - Organizations: `text-purple-300` on `bg-purple-500/20`
  - Locations: `text-green-300` on `bg-green-500/20`

## Animation Timing
- All transitions: `0.2s ease-out`
- Chevron rotation: `transition-transform`
- Border changes: `transition-all`
- Expand/collapse: `animate-[slideDown_0.2s_ease-out]`

## Responsive Behavior
- Mobile: Full width cards with adjusted padding
- Tablet: Same layout, optimized spacing
- Desktop: Max width container (4xl) centered

## Accessibility Features
- Semantic HTML structure
- `aria-label` on expand/collapse buttons
- Keyboard navigable (tab through elements)
- Clear visual focus states
- Sufficient color contrast (WCAG 2.1 AA)
- External links open in new tab with `rel="noopener noreferrer"`
