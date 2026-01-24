# Frontend Development Guide

This project uses **Next.js 14 with App Router**, React 18, and TypeScript for a modern full-stack web application.

## Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.3
- **Map Visualization**: Mapbox GL JS 2.15.0
- **Database**: Supabase Client SDK
- **Testing**: Jest 29.7.0

## Project Structure

```
app/                              # Next.js App Router
├── page.tsx                     # Main globe visualization component
├── layout.tsx                   # Root layout with metadata
├── globals.css                  # Global styles (Tailwind)
├── api/                         # API routes (server-side)
│   ├── sentinel/globe/          # Globe data endpoints
│   ├── stories/                 # Story endpoints
│   └── proxy-image/             # Image proxy service
├── components/                  # Shared React components
│   ├── StoriesFeed.tsx         # Story feed display
│   ├── ErrorBoundary.tsx       # Error handling
│   └── globe/                  # Globe-specific components
└── [feature]/                   # Feature pages
    ├── stories/page.tsx        # Stories feed view
    ├── chat/page.tsx           # Chat interface
    ├── venezuela/page.tsx      # Venezuela tracking
    ├── iran/page.tsx           # Iran tracking
    └── ice/page.tsx            # ICE video tracking

lib/                            # Utilities & configuration
├── supabase/                   # Database clients
│   ├── client.ts              # Browser client
│   ├── server.ts              # Server client
│   └── service.ts             # Service role client
├── config/                     # Configuration
│   └── env.ts                 # Environment validation
├── types/                      # TypeScript types
│   └── relationships.ts       # Data models
└── constants/                  # App constants
```

## Local Development

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp env.example .env.local
   ```

   Required variables:
   - `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox GL access token
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations
   - `STRIPE_SECRET_KEY` - For payment processing

3. **Start development server**:
   ```bash
   npm run dev
   ```

   Access at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests

## Key Components

### Globe Visualization (`app/page.tsx`)

The main globe component (1855 lines) handles:

- **Mapbox GL Integration**: Globe projection with custom layers
- **Animation System**:
  - Pulsing dots (3 layers with different frequencies)
  - Ripple rings expanding from clicks
  - Entrance animation (5.5s spin)
  - Idle rotation
  - Border glimmer effects
- **State Management**:
  ```typescript
  - globeData: GlobeData
  - selectedLocation: LocationAggregate
  - clickedLocation: LocationAggregate
  - mapStyle: 'street' | 'satellite'
  - isLoading: boolean
  ```
- **Performance**: Uses RAF (requestAnimationFrame) for smooth 60fps animations

### Stories Feed (`app/components/StoriesFeed.tsx`)

Displays news stories with:
- Time filtering (6h, 12h, 24h, 48h, week)
- Entity enrichment (locations, people, organizations)
- Expandable news items
- Media thumbnails
- Source attribution

### API Routes

Server-side endpoints in `app/api/`:

| Endpoint | Purpose |
|----------|---------|
| `/api/sentinel/globe` | Fetch location data for globe |
| `/api/stories/latest` | Get latest stories |
| `/api/stories/trending` | Get trending stories |
| `/api/proxy-image` | CORS-safe image proxy |

## Development Guidelines

### TypeScript Best Practices

1. **Use proper types** - Avoid `any`, use interfaces from `lib/types/`
2. **Null safety** - Handle nullable values explicitly
3. **Type imports** - Use `import type` when appropriate

### Component Guidelines

1. **Server vs Client Components**:
   - Use Server Components by default (no `'use client'`)
   - Add `'use client'` only when needed (state, effects, browser APIs)

2. **Performance**:
   - Memoize expensive calculations with `useMemo`
   - Use `React.memo` for pure components
   - Optimize images with Next.js `Image` component

3. **Error Handling**:
   - Wrap components in `ErrorBoundary`
   - Handle async errors properly
   - Show user-friendly error messages

### Styling with Tailwind

1. **Utility-first**: Use Tailwind classes directly
2. **Responsive**: Use breakpoint prefixes (`sm:`, `md:`, `lg:`)
3. **Dark mode**: Use `dark:` prefix for dark mode styles
4. **Custom styles**: Add to `globals.css` when needed

### Data Fetching

1. **Server Components**: Fetch directly in components
   ```typescript
   async function Page() {
     const data = await fetch(...)
     return <div>{data}</div>
   }
   ```

2. **Client Components**: Use hooks
   ```typescript
   'use client'
   const [data, setData] = useState()
   useEffect(() => { fetch(...) }, [])
   ```

3. **API Routes**: Server-side logic
   ```typescript
   export async function GET(request: Request) {
     // Server-side code
     return Response.json(data)
   }
   ```

## Testing

Jest is configured but needs test implementation:

```typescript
// Example test structure
describe('Globe Component', () => {
  it('should render without errors', () => {
    // Test implementation
  })
})
```

Place tests in `__tests__/` directories or as `.test.tsx` files.

## Performance Optimization

1. **Code Splitting**: Next.js handles automatically
2. **Lazy Loading**: Use `dynamic()` for heavy components
3. **Image Optimization**: Use Next.js `Image` component
4. **Caching**: Leverage browser and CDN caching
5. **Bundle Size**: Monitor with `npm run analyze`

## Debugging

1. **Browser DevTools**: Use React DevTools extension
2. **Console Logging**: Remove before committing
3. **Error Boundaries**: Catch and log component errors
4. **Network Tab**: Monitor API calls and performance

## Deployment

The app deploys automatically to Vercel on push to main branch. See [Deployment Guide](deployment.md) for details.

## Common Issues

### Mapbox Token
Ensure `NEXT_PUBLIC_MAPBOX_TOKEN` is set in environment variables.

### Supabase Connection
Check that Supabase URL and keys are correctly configured.

### TypeScript Errors
Run `npm run lint` to catch type errors before building.

### Build Failures
Clear `.next` folder and `node_modules`, then reinstall:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Supabase Docs](https://supabase.com/docs)