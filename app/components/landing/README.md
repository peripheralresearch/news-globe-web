# Landing Page Components

Components for The Peripheral landing page, built with Next.js 14, TypeScript, and Tailwind CSS.

## Components

### 1. Navigation.tsx (Client Component)
Sticky navigation bar with mobile hamburger menu.
- Left: Desktop navigation links (Intelligence, Globe, About, Contact)
- Center: Logo with "The Peripheral" branding
- Right: "Join Waitlist" CTA button (mailto link)
- Scroll-based backdrop blur effect
- Yellow ink-stroke hover animation on links
- **Globe link intercepts click** to dispatch `globe-wipe-start` custom event (triggers `GlobeWipeOverlay` wipe transition instead of normal navigation)

### 2. Hero.tsx (Client Component)
Subheading and trust indicators section.
- Subheading: "Open-Source Intelligence from the edge of the world"
- Trust indicators: stories tracked, sources analyzed, update frequency
- Fetches live stats from `/api/stats`
- Yellow ink-stroke hover effect on stat items

### 3. DecorativeGlobe.tsx (Client Component)
Non-interactive 3D globe rendered with Mapbox GL.
- Globe projection with slow auto-rotation (0.03 deg/frame)
- Removes all labels and administrative boundaries
- White fog/atmosphere styling
- Hover scale effect (1.1x)
- Gradient fade on edges
- **Click dispatches `globe-wipe-start`** custom event (triggers wipe transition)
- Requires `NEXT_PUBLIC_MAPBOX_TOKEN`

### 4. StatsBanner.tsx (Client Component)
Full-width dark banner with platform statistics.
- Fetches from `/api/stats`
- Displays: Stories, News Items, Active Sources, Last Updated
- Loading states with pulse animation

### 5. Footer.tsx (Server Component)
Standard footer with links and contact information.
- Three columns: Brand, Links, Contact
- Copyright notice

## Barrel Exports (`index.ts`)

```typescript
export { Navigation, Hero, StatsBanner, Footer, DecorativeGlobe }
```

Some pages also import `NewsTicker` from this barrel (exported separately).

## Design System

### Colors
- **Brand yellow**: `#F2C94C` (`bg-brand-yellow`)
- **Light mode**: white bg, slate-900 text, slate-50 cards, slate-200 borders
- **Dark mode**: black bg, white text, neutral-900 cards, neutral-800 borders

### Typography
- **Body**: Inter (default from layout)
- **Serif**: Source Serif 4 (available via `var(--font-source-serif-4)`)

## API Dependencies

- **GET /api/stats** — used by Hero and StatsBanner for live platform counts

## Globe Wipe Transition

Navigation and DecorativeGlobe both trigger a full-screen yellow wipe animation when the user clicks to go to the Globe page. This is handled by `GlobeWipeOverlay` (in `app/components/`), which listens for `globe-wipe-start` and `globe-wipe-arrived` custom DOM events. See `docs/frontend.md` for the full flow.

## Files

```
app/components/landing/
├── Navigation.tsx
├── Hero.tsx
├── DecorativeGlobe.tsx
├── StatsBanner.tsx
├── Footer.tsx
├── index.ts
└── README.md
```
