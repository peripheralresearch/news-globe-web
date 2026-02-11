import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache the frequency data for 5 minutes since historical data doesn't change often
let cachedData: { frequency: { date: string; count: number }[]; total: number; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedData)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Use direct PostgREST API call to fetch aggregated frequency data
    // The function aggregates by week and filters to war-period (Feb 2022 onwards)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_signal_frequency`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Range': '0-499',
        'Prefer': 'return=representation',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({}),
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('Error fetching signal frequency:', await response.text())
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const data = await response.json()

    // Format the response
    const frequency = (data || []).map((row: { date: string; count: number }) => ({
      date: row.date,
      count: Number(row.count)
    }))

    const total = frequency.reduce((sum: number, row: { count: number }) => sum + row.count, 0)

    // Cache the result
    cachedData = {
      frequency,
      total,
      timestamp: Date.now(),
    }

    return NextResponse.json({
      frequency,
      total,
      firstDate: frequency[0]?.date,
      lastDate: frequency[frequency.length - 1]?.date,
    })
  } catch (error) {
    console.error('Error in frequency API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
