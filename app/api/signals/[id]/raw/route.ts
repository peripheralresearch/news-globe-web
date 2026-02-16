import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/**
 * ADMIN-ONLY OPS BACKDOOR — NOT a product endpoint.
 *
 * Uses service_role key + SIGNALS_RAW_ACCESS_KEY env var to bypass all DB gating.
 * Intended for: debugging signal parser output, spot-checking raw Telegram text,
 * verifying signal collector writes.
 *
 * Product path for raw text access:
 *   1. Add Supabase Auth to the web app
 *   2. Insert user into public.user_tier with tier='pro' or 'admin'
 *   3. Call get_signal_raw(uuid) RPC with authenticated JWT
 *
 * Rate limiting plan:
 *   - When this endpoint is exposed beyond localhost, add Vercel rate limiting
 *     (vercel.json rewrites + edge middleware) or per-IP token bucket in middleware.ts
 *   - Target: 10 req/min per IP for authenticated ops users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessKey = request.headers.get('x-access-key')
    const expectedKey = process.env.SIGNALS_RAW_ACCESS_KEY

    if (!expectedKey || !accessKey || accessKey !== expectedKey) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid signal ID' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('signal')
      .select('id, raw_text, published')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { status: 'error', message: 'Signal not found' },
          { status: 404 }
        )
      }
      console.error('Signal raw API error:', error)
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch signal', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: { raw_text: data.raw_text, published: data.published },
    })
  } catch (error) {
    console.error('Signal raw API error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
