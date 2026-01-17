import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getBaseUrl() {
  return process.env.POLYMARKET_ANALYTICS_BASE_URL || 'https://polymarketanalytics.com'
}

const UPSTREAM_TIMEOUT_MS = 7_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'newMarkets'

  const upstream = new URL('/api/home-events', getBaseUrl())
  upstream.searchParams.set('type', type)

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
      return NextResponse.json(
        { status: 'error', message: 'Upstream request failed', upstream: upstream.toString(), httpStatus: res.status, body: text.slice(0, 2000) },
        { status: 502 }
      )
    }

    const json = await res.json()
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' }
    })
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? `Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms` : (e?.message || 'fetch failed')
    return NextResponse.json({ status: 'error', message: msg, upstream: upstream.toString() }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}

