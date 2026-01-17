import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getClobBaseUrl() {
  return process.env.POLYMARKET_CLOB_BASE_URL || 'https://clob.polymarket.com'
}

declare global {
  // eslint-disable-next-line no-var
  var __polymarketOrderbookCache:
    | { ts: number; key: string; data: unknown }
    | undefined
}

const CACHE_TTL_MS = 2_000
const UPSTREAM_TIMEOUT_MS = 5_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenId = searchParams.get('tokenId') || searchParams.get('token_id')

  if (!tokenId) {
    return NextResponse.json({ status: 'error', message: 'Missing required query param: tokenId' }, { status: 400 })
  }

  // Commonly-used path in CLOB-style APIs; confirm against official docs.
  const upstream = new URL('/orderbook', getClobBaseUrl())
  upstream.searchParams.set('token_id', tokenId)

  const cacheKey = upstream.toString()
  const now = Date.now()
  const cached = globalThis.__polymarketOrderbookCache
  if (cached && cached.key === cacheKey && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=2, stale-while-revalidate=10' }
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(upstream.toString(), {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    })
  } catch (e: any) {
    const msg =
      e?.name === 'AbortError'
        ? `Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms`
        : (e?.message || 'fetch failed')
    return NextResponse.json(
      { status: 'error', message: msg, upstream: upstream.toString() },
      { status: 502 }
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json(
      { status: 'error', message: 'Upstream Polymarket request failed', upstream: upstream.toString(), httpStatus: res.status, body: text.slice(0, 2000) },
      { status: 502 }
    )
  }

  const json = await res.json()
  globalThis.__polymarketOrderbookCache = { ts: Date.now(), key: cacheKey, data: json }
  return NextResponse.json(json, {
    headers: { 'Cache-Control': 'public, max-age=2, stale-while-revalidate=10' }
  })
}
