import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer()
    const searchParams = request.nextUrl.searchParams

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
    const region = searchParams.get('region') || undefined
    const weaponType = searchParams.get('weapon_type') || undefined
    const signalType = searchParams.get('signal_type') || undefined
    const since = searchParams.get('since') || undefined
    const category = searchParams.get('category') || undefined

    const { data, error } = await supabase.rpc('get_signals_latest', {
      p_limit: limit,
      p_offset: offset,
      p_region: region ?? null,
      p_weapon_type: weaponType ?? null,
      p_signal_type: signalType ?? null,
      p_since: since ?? null,
      p_category: category ?? null,
    })

    if (error) {
      console.error('Signals latest API error:', error)
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch signals', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { status: 'success', data: data || [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Signals latest API error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
