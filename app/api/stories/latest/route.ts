import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const hours = parseInt(searchParams.get('hours') || '24')

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

    // Query latest stories with their entities
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
            source_type,
            country_id
          )
        )
      `)
      .gte('created', timeThreshold)
      .order('created', { ascending: false })
      .range(offset, offset + limit - 1)

    if (storiesError) {
      console.error('Error fetching stories:', storiesError)
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch stories',
        error: storiesError.message
      }, { status: 500 })
    }

    // Get story IDs for entity queries
    const storyIds = stories?.map(s => s.id) || []

    if (storyIds.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: {
          stories: [],
          total: 0,
          hasMore: false
        }
      })
    }

    // Fetch entities for all stories in parallel
    const [locationsResult, peopleResult, organisationsResult] = await Promise.all([
      supabase
        .from('story_entity_location')
        .select(`
          story_id,
          rank,
          confidence,
          entity_location!inner(
            id,
            name,
            lat,
            lon,
            location_type,
            default_zoom
          )
        `)
        .in('story_id', storyIds)
        .order('rank', { ascending: true }),

      supabase
        .from('story_entity_person')
        .select(`
          story_id,
          rank,
          confidence,
          entity_person!inner(
            id,
            name,
            role
          )
        `)
        .in('story_id', storyIds)
        .order('rank', { ascending: true }),

      supabase
        .from('story_entity_organisation')
        .select(`
          story_id,
          rank,
          confidence,
          entity_organisation!inner(
            id,
            name,
            org_type
          )
        `)
        .in('story_id', storyIds)
        .order('rank', { ascending: true })
    ])

    // Build entity maps
    const locationsByStory = new Map()
    const peopleByStory = new Map()
    const organisationsByStory = new Map()

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
        defaultZoom: item.entity_location.default_zoom,
        rank: item.rank,
        confidence: item.confidence,
        isPrimary: item.rank === 1
      })
    })

    peopleResult.data?.forEach((item: any) => {
      if (!peopleByStory.has(item.story_id)) {
        peopleByStory.set(item.story_id, [])
      }
      peopleByStory.get(item.story_id).push({
        id: item.entity_person.id,
        name: item.entity_person.name,
        role: item.entity_person.role,
        rank: item.rank,
        confidence: item.confidence
      })
    })

    organisationsResult.data?.forEach((item: any) => {
      if (!organisationsByStory.has(item.story_id)) {
        organisationsByStory.set(item.story_id, [])
      }
      organisationsByStory.get(item.story_id).push({
        id: item.entity_organisation.id,
        name: item.entity_organisation.name,
        type: item.entity_organisation.org_type,
        rank: item.rank,
        confidence: item.confidence
      })
    })

    // Combine stories with their entities
    const enrichedStories = stories.map((story: any) => {
      const locations = locationsByStory.get(story.id) || []
      const primaryLocation = locations.find((l: any) => l.isPrimary) || locations[0] || null

      return {
        id: story.id,
        title: story.title,
        description: story.description,
        summary: story.summary,
        created: story.created,
        updated: story.updated,
        topicKeywords: story.topic_keywords || [],
        newsItems: Array.isArray(story.news_item) ? story.news_item : [story.news_item].filter(Boolean),
        entities: {
          locations: locations,
          people: peopleByStory.get(story.id) || [],
          organisations: organisationsByStory.get(story.id) || []
        },
        primaryLocation
      }
    })

    return NextResponse.json({
      status: 'success',
      data: {
        stories: enrichedStories,
        total: enrichedStories.length,
        hasMore: enrichedStories.length === limit
      }
    })

  } catch (error) {
    console.error('Latest stories API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
