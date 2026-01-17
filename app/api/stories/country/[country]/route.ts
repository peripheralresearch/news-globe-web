import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { country: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const country = params.country

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, get locations that match the country name
    const { data: locations, error: locError } = await supabase
      .from('entity_location')
      .select('id, name')
      .ilike('name', country)
      .in('location_type', ['Country', 'country'])
      .limit(50)

    if (locError) {
      console.error('Error fetching locations:', locError)
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ stories: [] })
    }

    const locationIds = locations.map(l => l.id)

    // Get story IDs where these locations are PRIMARY (rank = 1)
    const { data: storyLocations, error: storyLocError } = await supabase
      .from('story_entity_location')
      .select('story_id')
      .in('location_id', locationIds)
      .eq('rank', 1)

    if (storyLocError) {
      console.error('Error fetching story locations:', storyLocError)
      return NextResponse.json({ error: 'Failed to fetch story locations' }, { status: 500 })
    }

    if (!storyLocations || storyLocations.length === 0) {
      return NextResponse.json({ stories: [] })
    }

    const storyIds = Array.from(new Set(storyLocations.map(sl => sl.story_id)))

    // Get the stories with news items and media
    const { data: stories, error: storiesError } = await supabase
      .from('story')
      .select(`
        id,
        title,
        summary,
        created,
        updated,
        news_item(
          id,
          title,
          content,
          published,
          media_url,
          media_type,
          link,
          osint_source(
            id,
            name,
            source_type
          )
        )
      `)
      .in('id', storyIds)

    if (storiesError) {
      console.error('Error fetching stories:', storiesError)
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }

    // Transform and enrich stories with news item count
    const enrichedStories = (stories || []).map((story: any) => {
      const newsItems = Array.isArray(story.news_item)
        ? story.news_item
        : story.news_item
          ? [story.news_item]
          : []

      return {
        id: story.id,
        title: story.title,
        summary: story.summary,
        created: story.created,
        updated: story.updated,
        newsItems: newsItems,
        newsItemCount: newsItems.length
      }
    })

    // Sort by news item count (descending)
    enrichedStories.sort((a, b) => b.newsItemCount - a.newsItemCount)

    // Apply limit after sorting
    const limitedStories = enrichedStories.slice(0, limit)

    return NextResponse.json({ stories: limitedStories })
  } catch (error) {
    console.error('Error fetching country stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}
