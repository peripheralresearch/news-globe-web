import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = supabaseServer()

    const [sourcesResult, countsResult] = await Promise.all([
      supabase
        .from('osint_source')
        .select('id, name, source_type, country_id, entity_country(name, iso_alpha2, flag_emoji)')
        .order('name'),
      supabase.rpc('get_source_article_counts'),
    ])

    if (sourcesResult.error) throw sourcesResult.error

    const countMap: Record<string, number> = {}
    if (countsResult.data) {
      for (const row of countsResult.data) {
        countMap[row.osint_source_id] = Number(row.count)
      }
    }

    const result = (sourcesResult.data || []).map((s) => {
      const country = Array.isArray(s.entity_country)
        ? s.entity_country[0]
        : s.entity_country
      return {
        id: s.id,
        name: s.name,
        source_type: s.source_type,
        country: country
          ? { name: country.name, iso_alpha2: country.iso_alpha2, flag_emoji: country.flag_emoji }
          : null,
        article_count: countMap[s.id] || 0,
      }
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Sources API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}
