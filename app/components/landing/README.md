# Landing Page Components

A complete set of components for The Peripheral landing page, built with Next.js 14, TypeScript, and Tailwind CSS.

## Components Overview

### 1. Navigation.tsx (Client Component)
Sticky navigation bar with mobile hamburger menu.
- Left: Logo linking to home
- Center: Navigation links (Intelligence, Tools, About, Contact)
- Right: "Get Early Access" CTA button
- Responsive mobile dropdown menu
- Scroll-based background blur effect

### 2. Hero.tsx (Server Component)
Main hero section with headline and CTAs.
- Large headline: "From Noise to Knowledge"
- Two CTA buttons: "Explore Latest Intelligence" and "Developer Tools"
- Trust indicators row (accepts stats as props)

**Props:**
```typescript
interface HeroProps {
  totalStories?: number
  totalNewsItems?: number
}
```

### 3. StoryCard.tsx (Server Component)
Individual story card with location, title, source count, and timestamp.

**Props:**
```typescript
interface StoryCardProps {
  title: string
  location: string | null
  sourceCount: number
  timestamp: string
  slug?: string
}
```

### 4. LatestIntelligence.tsx (Client Component)
Fetches and displays latest stories in a 3-column grid.
- Fetches from `/api/stories/latest?limit=6&hours=720`
- Loading skeleton states
- "View All Intelligence" link

### 5. HowItWorks.tsx (Server Component)
3-column explainer section showing the intelligence process.
- Collect: Source monitoring
- Verify: AI-powered verification
- Structure: Knowledge graph transformation

### 6. ForProfessionals.tsx (Server Component)
2-column layout targeting journalists and analysts.
- Feature lists for each audience
- "Request Beta Access" CTA

### 7. StatsBanner.tsx (Client Component)
Full-width dark banner with platform statistics.
- Fetches from `/api/stats`
- Displays: Stories, News Items, Active Sources, Last Updated
- Loading states with pulse animation

### 8. Footer.tsx (Server Component)
Standard footer with links and contact information.
- Three columns: Brand, Links, Contact
- Copyright notice

## Usage Example

```tsx
// app/page.tsx
import {
  Navigation,
  Hero,
  LatestIntelligence,
  HowItWorks,
  ForProfessionals,
  StatsBanner,
  Footer
} from '@/app/components/landing'

// If you need to pass stats to Hero (server-side fetch):
async function getStats() {
  const res = await fetch('http://localhost:3000/api/stats', {
    next: { revalidate: 60 }
  })
  return res.json()
}

export default async function LandingPage() {
  const stats = await getStats()

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <Hero
        totalStories={stats.totalStories}
        totalNewsItems={stats.totalNewsItems}
      />
      <LatestIntelligence />
      <HowItWorks />
      <ForProfessionals />
      <StatsBanner />
      <Footer />
    </main>
  )
}
```

Or simpler version without passing stats to Hero:

```tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <Hero />
      <LatestIntelligence />
      <HowItWorks />
      <ForProfessionals />
      <StatsBanner />
      <Footer />
    </main>
  )
}
```

## Design System

### Colors
- **Light Mode**: white bg, slate-900 text, blue-600 CTAs, slate-50 cards, slate-200 borders
- **Dark Mode**: black bg, white text, blue-400 CTAs, neutral-900 cards, neutral-800 borders

### Typography
- **Body**: Inter (default from layout)
- **Serif**: Source Serif 4 (available via `font-serif` or `var(--font-source-serif-4)`)

### Spacing
- **Section padding**: `py-16 md:py-24`
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6`

## API Dependencies

Components expect these API endpoints:

1. **GET /api/stats**
   ```json
   {
     "totalStories": 1234,
     "totalNewsItems": 5678,
     "totalSources": 90,
     "lastUpdated": "2026-02-03T19:00:00Z"
   }
   ```

2. **GET /api/stories/latest?limit=6&hours=720**
   ```json
   {
     "status": "success",
     "data": {
       "stories": [
         {
           "id": "story-id",
           "title": "Story title",
           "created": "2026-02-03T18:00:00Z",
           "newsItems": [{ "id": "news-1" }],
           "primaryLocation": { "name": "Location Name" }
         }
       ]
     }
   }
   ```

## Accessibility

All components follow WCAG 2.1 AA standards:
- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- ARIA labels on interactive elements
- Color contrast compliance (4.5:1 minimum)
- Focus states on all interactive elements

## TypeScript

All components are fully typed with TypeScript strict mode:
- No implicit any
- Explicit prop interfaces
- Type-safe API responses

## Testing

To test the components:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

## Files Created

```
/Users/duan/Code/GM/application/web-app/app/components/landing/
├── Navigation.tsx          (4.0K)
├── Hero.tsx               (2.0K)
├── StoryCard.tsx          (1.7K)
├── LatestIntelligence.tsx (2.8K)
├── HowItWorks.tsx         (2.5K)
├── ForProfessionals.tsx   (2.8K)
├── StatsBanner.tsx        (2.6K)
├── Footer.tsx             (2.5K)
└── index.ts               (432B)
```

Total: 9 files, ~21KB of clean, production-ready code.
