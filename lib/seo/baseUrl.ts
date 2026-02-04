/**
 * Single source of truth for the site's base URL.
 * Uses NEXT_PUBLIC_SITE_URL in production, falls back to localhost in dev.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://theperipheral.org'
    : 'http://localhost:3000'
}
