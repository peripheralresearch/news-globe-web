import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const hours = parseInt(searchParams.get('hours') || '48')

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase configuration missing'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate time threshold
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Query stories with news item counts to determine trending
    // Trending = most news items (coverage) + most entities (complexity)
    const { data: stories, error: storiesError } = await supabase
      .from('story')
      .select(`
        id,
        title,
        description,
        summary,
        created,
        updated,
        topic_keywords,
        news_item!inner(
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
      .gte('created', timeThreshold)
      .order('created', { ascending: false })
      .limit(200) // Get more stories for analysis

    if (storiesError) {
      console.error('Error fetching stories:', storiesError)
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch stories',
        error: storiesError.message
      }, { status: 500 })
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: {
          stories: [],
          total: 0
        }
      })
    }

    // Get story IDs for entity queries
    const storyIds = stories.map(s => s.id)

    // Fetch entity counts for trending calculation
    const [locationsResult, peopleResult, organisationsResult] = await Promise.all([
      supabase
        .from('story_entity_location')
        .select('story_id, entity_location!inner(id, name, lat, lon, location_type, default_zoom)', { count: 'exact' })
        .in('story_id', storyIds)
        .order('rank', { ascending: true }),

      supabase
        .from('story_entity_person')
        .select('story_id, entity_person!inner(id, name, role)', { count: 'exact' })
        .in('story_id', storyIds)
        .order('rank', { ascending: true }),

      supabase
        .from('story_entity_organisation')
        .select('story_id, entity_organisation!inner(id, name, org_type)', { count: 'exact' })
        .in('story_id', storyIds)
        .order('rank', { ascending: true })
    ])

    // Build entity maps and count
    const locationsByStory = new Map()
    const peopleByStory = new Map()
    const organisationsByStory = new Map()
    const entityCountByStory = new Map()

    locationsResult.data?.forEach((item: any) => {
      if (!locationsByStory.has(item.story_id)) {
        locationsByStory.set(item.story_id, [])
      }
      locationsByStory.get(item.story_id).push({
        id: item.entity_location.id,
        name: item.entity_location.name,
        lat: item.entity_location.lat,
        lon: item.entity_location.lon,
        type: item.entity_location.location_type,
        defaultZoom: item.entity_location.default_zoom
      })
      entityCountByStory.set(item.story_id, (entityCountByStory.get(item.story_id) || 0) + 1)
    })

    peopleResult.data?.forEach((item: any) => {
      if (!peopleByStory.has(item.story_id)) {
        peopleByStory.set(item.story_id, [])
      }
      peopleByStory.get(item.story_id).push({
        id: item.entity_person.id,
        name: item.entity_person.name,
        role: item.entity_person.role
      })
      entityCountByStory.set(item.story_id, (entityCountByStory.get(item.story_id) || 0) + 1)
    })

    organisationsResult.data?.forEach((item: any) => {
      if (!organisationsByStory.has(item.story_id)) {
        organisationsByStory.set(item.story_id, [])
      }
      organisationsByStory.get(item.story_id).push({
        id: item.entity_organisation.id,
        name: item.entity_organisation.name,
        type: item.entity_organisation.org_type
      })
      entityCountByStory.set(item.story_id, (entityCountByStory.get(item.story_id) || 0) + 1)
    })

    // Calculate trending score for each story
    // Score = (news_item_count * 2) + (entity_count) + recency_bonus
    const scoredStories = stories.map((story: any) => {
      const newsItems = Array.isArray(story.news_item) ? story.news_item : [story.news_item].filter(Boolean)
      const newsItemCount = newsItems.length
      const entityCount = entityCountByStory.get(story.id) || 0

      // Recency bonus: stories from last 12 hours get a boost
      const hoursSinceCreation = (Date.now() - new Date(story.created).getTime()) / (1000 * 60 * 60)
      const recencyBonus = hoursSinceCreation < 12 ? 5 : hoursSinceCreation < 24 ? 2 : 0

      const trendingScore = (newsItemCount * 2) + entityCount + recencyBonus

      const locations = locationsByStory.get(story.id) || []
      const primaryLocation = locations[0] || null

      return {
        id: story.id,
        title: story.title,
        description: story.description,
        summary: story.summary,
        created: story.created,
        updated: story.updated,
        topicKeywords: story.topic_keywords || [],
        newsItems: newsItems,
        entities: {
          locations: locations,
          people: peopleByStory.get(story.id) || [],
          organisations: organisationsByStory.get(story.id) || []
        },
        primaryLocation,
        trendingScore,
        newsItemCount,
        entityCount
      }
    })

    // Sort by news item count (most sources), then trending score as tiebreaker
    const trendingStories = scoredStories
      .sort((a, b) => b.newsItemCount - a.newsItemCount || b.trendingScore - a.trendingScore)
      .slice(0, limit)

    return NextResponse.json({
      status: 'success',
      data: {
        stories: trendingStories,
        total: trendingStories.length
      }
    })

  } catch (error) {
    console.error('Trending stories API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
