import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache for 5 minutes
let cachedData: { data: WeeklyWeaponData[]; weapons: string[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

interface WeeklyWeaponData {
  week: string
  [key: string]: number | string // weapon_type: count
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
}

export async function GET() {
  try {
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedData)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_weekly_weapon_frequency`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Range': '0-9999',
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    const rawData: { week: string; weapon_type: string; count: number }[] = await response.json()

    // Pivot data: group by week with weapon counts as columns
    const weekMap = new Map<string, WeeklyWeaponData>()
    const weaponSet = new Set<string>()

    rawData.forEach(row => {
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
    rawData.forEach(row => {
      const weapon = row.weapon_type || 'other'
      weaponTotals.set(weapon, (weaponTotals.get(weapon) || 0) + Number(row.count))
    })
    const weapons = Array.from(weaponSet).sort((a, b) =>
      (weaponTotals.get(b) || 0) - (weaponTotals.get(a) || 0)
    )

    // Convert to array and sort by week
    const data = Array.from(weekMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    )

    // Add labels
    const weaponsWithLabels = weapons.map(w => ({
      key: w,
      label: WEAPON_LABELS[w] || w
    }))

    cachedData = { data, weapons: weaponsWithLabels as any, timestamp: Date.now() }

    return NextResponse.json({ data, weapons: weaponsWithLabels })
  } catch (error) {
    console.error('Error in frequency-by-weapon API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
