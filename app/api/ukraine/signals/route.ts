import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Ukrainian region coordinates (approximate centers)
const REGION_COORDINATES: Record<string, [number, number]> = {
  // Format: 'Region Name': [lat, lon]
  'Харківська': [49.9935, 36.2304],
  'Запорізька': [47.8388, 35.1396],
  'Сумська': [50.9077, 34.7981],
  'Донецька': [48.0159, 37.8028],
  'Дніпропетровська': [48.4647, 35.0462],
  'Полтавська': [49.5883, 34.5514],
  'Миколаївська': [46.9750, 31.9946],
  'Київська': [50.4501, 30.5234],
  'Чернігівська': [51.4982, 31.2893],
  'Херсонська': [46.6354, 32.6169],
  'Кіровоградська': [48.5079, 32.2623],
  'Одеська': [46.4825, 30.7233],
  'Черкаська': [49.4444, 32.0598],
  'Житомирська': [50.2547, 28.6587],
  'Вінницька': [49.2331, 28.4682],
  'Хмельницька': [49.4229, 26.9871],
  'Рівненська': [50.6199, 26.2516],
  'Тернопільська': [49.5535, 25.5948],
  'Львівська': [49.8397, 24.0297],
  'Волинська': [50.7472, 25.3254],
  'Івано-Франківська': [48.9226, 24.7111],
  'Закарпатська': [48.6208, 22.2879],
  'Чернівецька': [48.2920, 25.9358],
  'Луганська': [48.5740, 39.3078],
  'Київ': [50.4501, 30.5234],
  'м. Київ': [50.4501, 30.5234],
}

interface SignalRecord {
  id: string
  raw_text: string
  published: string
  alert_type: string | null
  weapon_type: string | null
  target_location: string | null
  target_region: string | null
  alert_status: string | null
  created_at: string | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '48') // Default to 48 hours
    const limit = parseInt(searchParams.get('limit') || '500')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate time threshold
    const threshold = new Date()
    threshold.setHours(threshold.getHours() - hours)

    // Query recent signals
    let { data: signals, error } = await supabase
      .from('signal')
      .select('id, raw_text, published, alert_type, weapon_type, target_location, target_region, alert_status, created_at')
      .gte('published', threshold.toISOString())
      .order('published', { ascending: false })
      .limit(limit)

    // If no results with time filter, get the most recent signals regardless
    if (!error && (!signals || signals.length === 0)) {
      const fallback = await supabase
        .from('signal')
        .select('id, raw_text, published, alert_type, weapon_type, target_location, target_region, alert_status, created_at')
        .order('published', { ascending: false })
        .limit(limit)

      if (!fallback.error) {
        signals = fallback.data
      }
    }

    if (error) {
      console.error('Error fetching signals:', error)
      return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
    }

    // Transform signals with coordinates
    const alerts = (signals as SignalRecord[] || []).map(signal => {
      const region = signal.target_region
      const coords = region ? REGION_COORDINATES[region] : null

      return {
        id: signal.id,
        text: signal.raw_text,
        published: signal.published,
        alertType: signal.alert_type,
        weaponType: signal.weapon_type,
        location: signal.target_location,
        region: signal.target_region,
        status: signal.alert_status || 'unknown',
        lat: coords ? coords[0] : null,
        lon: coords ? coords[1] : null,
      }
    })

    // Calculate stats
    // Treat alerts from the last hour as "active" if no explicit status
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const activeCount = alerts.filter(a =>
      a.status === 'active' ||
      (a.status === 'unknown' && new Date(a.published) > oneHourAgo)
    ).length
    const clearedCount = alerts.filter(a => a.status === 'cleared').length
    // Count all regions with any alert activity
    const regionsAffected = new Set(alerts.filter(a => a.region).map(a => a.region)).size

    // Group by region for summary
    const byRegion: Record<string, { active: number; cleared: number; total: number }> = {}
    alerts.forEach(alert => {
      if (alert.region) {
        if (!byRegion[alert.region]) {
          byRegion[alert.region] = { active: 0, cleared: 0, total: 0 }
        }
        byRegion[alert.region].total++
        if (alert.status === 'active') byRegion[alert.region].active++
        if (alert.status === 'cleared') byRegion[alert.region].cleared++
      }
    })

    return NextResponse.json({
      alerts,
      stats: {
        total: alerts.length,
        active: activeCount,
        cleared: clearedCount,
        regionsAffected,
      },
      byRegion,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in ukraine signals API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
