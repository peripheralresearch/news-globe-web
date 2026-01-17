import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getBaseUrl() {
  return process.env.POLYMARKET_ANALYTICS_BASE_URL || 'https://polymarketanalytics.com'
}

const UPSTREAM_TIMEOUT_MS = 7_000

export async function GET() {
  const upstream = new URL('/api/market-metrics', getBaseUrl())

  // PolymarketAnalytics uses POST with cache-buster headers/body; it’s still safe to call as a simple POST.
  const now = Date.now()
  const cacheBuster = Math.random().toString(36).slice(2, 8)
  const body = JSON.stringify({ timestamp: now, cacheBuster, requestId: `${now}-${cacheBuster}` })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const res = await fetch(upstream.toString(), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'cache-control': 'no-cache, no-store, must-revalidate',
        pragma: 'no-cache',
        'x-timestamp': String(now),
        'x-random': cacheBuster
      },
      body,
      cache: 'no-store',
      signal: controller.signal
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { status: 'error', message: 'Upstream request failed', upstream: upstream.toString(), httpStatus: res.status, body: text.slice(0, 2000) },
        { status: 502 }
      )
    }

    const json = await res.json()
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' }
    })
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? `Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms` : (e?.message || 'fetch failed')
    return NextResponse.json({ status: 'error', message: msg, upstream: upstream.toString() }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}

