import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getGammaBaseUrl() {
  return process.env.POLYMARKET_GAMMA_BASE_URL || 'https://gamma-api.polymarket.com'
}

type CacheEntry = {
  ts: number
  key: string
  data: unknown
}

declare global {
  // eslint-disable-next-line no-var
  var __polymarketMarketsCache: CacheEntry | undefined
  // eslint-disable-next-line no-var
  var __polymarketMarketsInFlight: Promise<unknown> | undefined
}

const CACHE_TTL_MS = 30_000
const UPSTREAM_TIMEOUT_MS = 7_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const upstream = new URL('/markets', getGammaBaseUrl())

  // Forward basic query params (keep it simple/allow-listed)
  const allowedParams = [
    'limit',
    'offset',
    'page',
    'active',
    'closed',
    'archived',
    'sort',
    'order',
    'search'
  ]
  for (const key of allowedParams) {
    const value = searchParams.get(key)
    if (value != null) upstream.searchParams.set(key, value)
  }

  const cacheKey = upstream.toString()
  const now = Date.now()
  const cached = globalThis.__polymarketMarketsCache
  if (cached && cached.key === cacheKey && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' }
    })
  }

  if (globalThis.__polymarketMarketsInFlight) {
    const data = await globalThis.__polymarketMarketsInFlight
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' }
    })
  }

  globalThis.__polymarketMarketsInFlight = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

    try {
      const res = await fetch(upstream.toString(), {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(
          `Upstream Polymarket request failed (${res.status}): ${text.slice(0, 300)}`
        )
      }

      const json = await res.json()
      globalThis.__polymarketMarketsCache = { ts: Date.now(), key: cacheKey, data: json }
      return json
    } finally {
      clearTimeout(timeout)
    }
  })()

  try {
    const data = await globalThis.__polymarketMarketsInFlight
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' }
    })
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? `Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms` : (e?.message || 'Unknown error')
    return NextResponse.json(
      { status: 'error', message: msg, upstream: upstream.toString() },
      { status: 502 }
    )
  } finally {
    globalThis.__polymarketMarketsInFlight = undefined
  }
}
