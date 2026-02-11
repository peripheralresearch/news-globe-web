import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface WeeklyWeaponData {
  week: string
  [key: string]: number | string // weapon_type: count
}

interface DashboardRPCResponse {
  frequency: { date: string; count: number }[]
  weapons: { weapon_type: string; count: number }[]
  weaponFrequency: { week: string; weapon_type: string; count: number }[]
  total: number
  firstDate: string
  lastDate: string
}

interface DashboardResponse {
  frequency: { date: string; count: number }[]
  weapons: { type: string; count: number; label: string }[]
  weaponFrequency: {
    data: WeeklyWeaponData[]
    weapons: { key: string; label: string }[]
  }
  total: number
  firstDate: string
  lastDate: string
  timestamp: string
}

const WEAPON_LABELS: Record<string, string> = {
  'uav': 'UAV/Drones',
  'missile': 'Missiles',
  'ballistic': 'Ballistic',
  'kab': 'Guided Bombs',
  'shaheed': 'Shahed',
  'cruise_missile': 'Cruise',
  'fast_target': 'Fast Target',
  'other': 'Other',
  'unknown_weapon': 'Unknown',
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_dashboard_stats`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error('Error fetching dashboard stats:', await response.text())
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 503 }
      )
    }

    const rpcData: DashboardRPCResponse = await response.json()

    // Transform weapons with labels
    const weapons = rpcData.weapons.map(row => ({
      type: row.weapon_type,
      count: Number(row.count),
      label: WEAPON_LABELS[row.weapon_type] || row.weapon_type,
    }))

    // Pivot weaponFrequency: group by week with weapon counts as columns
    const weekMap = new Map<string, WeeklyWeaponData>()
    const weaponSet = new Set<string>()

    rpcData.weaponFrequency.forEach(row => {
      const weapon = row.weapon_type || 'other'
      weaponSet.add(weapon)

      if (!weekMap.has(row.week)) {
        weekMap.set(row.week, { week: row.week })
      }
      const weekData = weekMap.get(row.week)!
      weekData[weapon] = Number(row.count)
    })

    // Sort weapons by total count (most common first)
    const weaponTotals = new Map<string, number>()
    rpcData.weaponFrequency.forEach(row => {
      const weapon = row.weapon_type || 'other'
      weaponTotals.set(weapon, (weaponTotals.get(weapon) || 0) + Number(row.count))
    })
    const sortedWeapons = Array.from(weaponSet).sort((a, b) =>
      (weaponTotals.get(b) || 0) - (weaponTotals.get(a) || 0)
    )

    // Convert to array and sort by week
    const weaponFrequencyData = Array.from(weekMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    )

    // Add labels to weapons
    const weaponsWithLabels = sortedWeapons.map(w => ({
      key: w,
      label: WEAPON_LABELS[w] || w,
    }))

    const result: DashboardResponse = {
      frequency: rpcData.frequency,
      weapons,
      weaponFrequency: {
        data: weaponFrequencyData,
        weapons: weaponsWithLabels,
      },
      total: rpcData.total,
      firstDate: rpcData.firstDate,
      lastDate: rpcData.lastDate,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Dashboard stats request timeout')
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 503 }
      )
    }

    console.error('Error in dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
