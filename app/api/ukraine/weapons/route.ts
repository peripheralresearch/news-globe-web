import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache the weapon data for 5 minutes
let cachedData: { weapons: { type: string; count: number; label: string }[]; total: number; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Human-readable labels for weapon types
const WEAPON_LABELS: Record<string, string> = {
  'uav': 'UAV / Drones',
  'missile': 'Missiles',
  'ballistic': 'Ballistic Missiles',
  'kab': 'Guided Bombs (KAB)',
  'shaheed': 'Shahed Drones',
  'cruise_missile': 'Cruise Missiles',
  'fast_target': 'Fast Targets',
}

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

    // Query weapon type counts directly via PostgREST RPC or raw query
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_weapon_counts`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })

    let weapons: { type: string; count: number; label: string }[] = []
    let total = 0

    if (response.ok) {
      const data = await response.json()
      weapons = data.map((row: { weapon_type: string; count: number }) => ({
        type: row.weapon_type,
        count: Number(row.count),
        label: WEAPON_LABELS[row.weapon_type] || row.weapon_type
      }))
      total = weapons.reduce((sum, w) => sum + w.count, 0)
    } else {
      // Fallback: return empty if RPC doesn't exist yet
      return NextResponse.json({ weapons: [], total: 0, error: 'RPC not found' })
    }

    // Cache the result
    cachedData = {
      weapons,
      total,
      timestamp: Date.now(),
    }

    return NextResponse.json({ weapons, total })
  } catch (error) {
    console.error('Error in weapons API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
