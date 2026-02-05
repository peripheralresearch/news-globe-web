# The Peripheral — Web App Context

## Project Info

- **Project**: The Peripheral — OSINT intelligence platform
- **Repository**: `peripheralresearch/news-globe-web` (GitHub)
- **Framework**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: Supabase (PostgreSQL) via MCP and @supabase/supabase-js
- **Deployment**: Vercel (peripheral team)
- **Domain**: theperipheral.org

## Git Branching Strategy

- `main` — production branch, deploys to theperipheral.org
- `dev` — current active development branch
- Feature branches automatically deploy to Vercel preview on push
- All branches trigger automatic Vercel deployments

## Deployment Workflow

### Automatic Preview Deployments

- Push to any branch → Vercel auto-builds a preview deployment
- Preview URL pattern: `news-globe-web-git-{branch}-peripheral.vercel.app`
- Preview deployments are protected behind Vercel SSO authentication
- Production deployment: merge to `main` → deploys to theperipheral.org

### Vercel CLI Commands

```bash
# List recent deployments and status
npx vercel ls

# Inspect deployment logs for debugging
npx vercel inspect --logs <deployment-url>
```

### Vercel Project Details

- **Project name**: `news-globe-web`
- **Team**: `peripheral`

## Project Structure

### Key Directories

- `app/` — Next.js App Router pages and API routes
- `app/components/landing/` — Landing page component library (Navigation, Hero, DecorativeGlobe, StatsBanner, Footer)
- `app/components/GlobeWipeOverlay.tsx` — Full-screen yellow wipe transition for Globe navigation
- `app/globe/page.tsx` — Interactive 3D globe visualization
- `app/about/page.tsx` — Mission statement page
- `app/contact/page.tsx` — Contact page
- `app/stories/` — Story pages (Iran, Venezuela, ICE)
- `app/api/` — API routes (stats, stories, polymarket, donations, etc.)
- `lib/` — Shared utilities (Supabase clients, rate-limit, types)
- `public/icons/` — Favicon and logo assets
- `public/images/` — Page illustrations (globe-low-poly.png, letter-lowpoly.png)

## Important Technical Notes

### Gitignore Issue

- `.gitignore` includes `lib/*` — new files in `lib/` must be force-added:
  ```bash
  git add -f lib/new-file.ts
  ```

### Build Blockers

- **TypeScript errors**: VenezuelaClient.tsx had a TS error blocking builds (now fixed)
- **Missing modules**: Files in `lib/` not committed due to gitignore
- **ESLint warnings**: Pre-existing warnings exist (useEffect deps, img elements) but don't block builds
- **Next.js production builds**: ESLint errors are treated as build failures

### Environment Variables

Required environment variables for deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

## Contact Information

- **Domain**: theperipheral.org
- **Email addresses**:
  - hello@theperipheral.org
  - info@theperipheral.org
  - support@theperipheral.org
  - daniel@theperipheral.org
