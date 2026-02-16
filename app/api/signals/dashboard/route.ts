import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = supabaseServer()

    const [statsResult, intensityResult] = await Promise.all([
      supabase.rpc('get_dashboard_stats'),
      supabase.rpc('get_daily_alert_intensity', { p_days_back: 30 }),
    ])

    if (statsResult.error) {
      console.error('Dashboard stats error:', statsResult.error)
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch dashboard stats', error: statsResult.error.message },
        { status: 500 }
      )
    }

    if (intensityResult.error) {
      console.error('Dashboard intensity error:', intensityResult.error)
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch alert intensity', error: intensityResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'success',
        data: {
          stats: statsResult.data,
          intensity: intensityResult.data || [],
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
