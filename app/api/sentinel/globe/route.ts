import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Interface for location aggregate from database function
// NOTE: These coordinates come from event_location - the actual location where news events occurred
interface LocationAggregate {
  location_id: number;
  location_name: string;
  latitude: number;      // From event_location
  longitude: number;     // From event_location
  location_type: string;
  location_subtype: string;
  post_count: number;
  latest_post_date: string;
  default_zoom: number;
  event_location?: boolean;  // Indicates this is an event location (not just mentioned)
}

// Interface for post detail from database function
interface LocationPost {
  location_id: number;
  post_id: number;
  post_internal_id: string;
  post_date: string;
  post_text: string;
  channel_name: string;
  channel_username: string;
  has_photo: boolean;
  has_video: boolean;
  priority: number;
  media_url: string | null;
}

// Location data returned for globe visualization
interface LocationData {
  entity_name: string;
  entity_type: string;
  location_subtype: string;
  confidence: number;
  story_count: number;
  coordinates: [number, number];  // [longitude, latitude] - from event_location
  default_zoom: number;
  event_location: boolean;        // Indicates this is an event location
  stories: Array<{
    id: string;
    post_id: number;
    title: string | null;
    summary: string | null;
    created: string;
    source_name: string;
    source_url: string;
    has_photo: boolean;
    has_video: boolean;
    media_url: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? Math.max(1, Math.min(parseInt(hoursParam, 10), 720)) : 48;

    const limitParam = searchParams.get('limit');
    const maxLocations = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10), 50)) : 30;

    console.log(`Globe API - Fetching top ${maxLocations} event locations from last ${hours} hours`);

    // Step 1: Get aggregated location data with post counts (OPTIMIZED - single query)
    // NOTE: This query should filter for event_location to get where news events actually occurred
    const { data: locationAggregates, error: aggregateError } = await supabase
      .rpc('get_location_aggregates_v2', {
        hours_ago: hours,
        max_locations: maxLocations,
      });

    if (aggregateError) {
      console.error('Globe API - Location aggregates error:', aggregateError);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to fetch location aggregates',
          error: aggregateError.message,
        },
        { status: 500 }
      );
    }

    if (!locationAggregates || locationAggregates.length === 0) {
      console.log('Globe API - No locations found in time range');
      return NextResponse.json(
        {
          status: 'success',
          data: {
            locations: [],
            stats: {
              total_locations: 0,
            },
          },
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'CDN-Cache-Control': 'max-age=300',
          },
        }
      );
    }

    console.log(`Globe API - Found ${locationAggregates.length} event locations`);

    // Step 2: Get post details for these locations (OPTIMIZED - single query with limit)
    const locationIds = (locationAggregates as LocationAggregate[]).map(l => l.location_id);

    const { data: locationPosts, error: postsError } = await supabase
      .rpc('get_location_posts', {
        location_ids: locationIds,
        hours_ago: hours,
        posts_per_location: 20, // Limit to top 20 posts per location
      });

    if (postsError) {
      console.error('Globe API - Location posts error:', postsError);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to fetch location posts',
          error: postsError.message,
        },
        { status: 500 }
      );
    }

    // Step 3: Group posts by location and format response
    const locationPostsMap = new Map<number, LocationPost[]>();
    for (const post of (locationPosts as LocationPost[] || [])) {
      if (!locationPostsMap.has(post.location_id)) {
        locationPostsMap.set(post.location_id, []);
      }
      locationPostsMap.get(post.location_id)!.push(post);
    }

    const formattedLocations: LocationData[] = (locationAggregates as LocationAggregate[]).map(loc => {
      const posts = locationPostsMap.get(loc.location_id) || [];

      // Dedupe posts per location by stable internal id to avoid repeated cards
      const seen = new Set<string>();
      const uniquePosts = posts.filter(post => {
        if (!post.post_internal_id) return true;
        if (seen.has(post.post_internal_id)) return false;
        seen.add(post.post_internal_id);
        return true;
      });

      const formattedPosts = uniquePosts.map(post => {
        const channelUsername = post.channel_username?.replace(/^@/, '');
        const sourceUrl = channelUsername && post.post_id
          ? `https://t.me/${channelUsername}/${post.post_id}`
          : post.channel_username; // Use channel_username as fallback (may be RSS feed URL)

        return {
          id: post.post_internal_id,
          post_id: post.post_id,
          title: post.post_text ? post.post_text.substring(0, 100) : null,
          summary: post.post_text, // Already truncated to 500 chars by database
          created: post.post_date,
          source_name: post.channel_name || 'Unknown source',
          source_url: sourceUrl,
          has_photo: post.has_photo,
          has_video: post.has_video,
          media_url: post.media_url,
        };
      });

      return {
        entity_name: loc.location_name,
        entity_type: 'Location',
        location_subtype: loc.location_subtype || loc.location_type,
        confidence: 0.8,
        story_count: Number(loc.post_count),
        coordinates: [loc.longitude, loc.latitude] as [number, number],  // event_location coordinates
        default_zoom: loc.default_zoom,
        event_location: loc.event_location ?? true,  // Mark as event location
        stories: formattedPosts,
      } as LocationData;
    });

    console.log(`Globe API - Returning ${formattedLocations.length} event locations with posts`);

    return NextResponse.json(
      {
        status: 'success',
        data: {
          locations: formattedLocations,
          stats: {
            total_locations: formattedLocations.length,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'max-age=300',
          'Vercel-CDN-Cache-Control': 'max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('Globe API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch globe data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
