import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = supabaseServer()

    // Run all 4 queries in parallel
    const [storiesResult, newsItemsResult, sourcesResult, lastStoryUpdatedResult, lastNewsPublishedResult] = await Promise.all([
      supabase.from('story').select('id', { count: 'exact', head: true }),
      supabase.from('news_item').select('id', { count: 'exact', head: true }),
      supabase.from('osint_source').select('id', { count: 'exact', head: true }),
      supabase.from('story').select('updated').order('updated', { ascending: false }).limit(1),
      // "Last updated" should reflect fresh ingestion; news_item.published is the best proxy.
      supabase.from('news_item').select('published').order('published', { ascending: false }).limit(1),
    ])

    const totalStories = storiesResult.count ?? 0
    const totalNewsItems = newsItemsResult.count ?? 0
    const totalSources = sourcesResult.count ?? 0

    const storyUpdated = lastStoryUpdatedResult.data?.[0]?.updated
    const newsPublished = lastNewsPublishedResult.data?.[0]?.published

    const storyUpdatedMs = storyUpdated ? Date.parse(storyUpdated) : NaN
    const newsPublishedMs = newsPublished ? Date.parse(newsPublished) : NaN

    const lastUpdated =
      Number.isFinite(storyUpdatedMs) || Number.isFinite(newsPublishedMs)
        ? new Date(Math.max(storyUpdatedMs || 0, newsPublishedMs || 0)).toISOString()
        : new Date().toISOString()

    return NextResponse.json(
      {
        totalStories,
        totalNewsItems,
        totalSources,
        lastUpdated
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      }
    )
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
