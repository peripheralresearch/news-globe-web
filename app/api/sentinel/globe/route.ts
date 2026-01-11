import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Interface for location aggregate from database function
interface LocationAggregate {
  location_id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  location_type: string;
  location_subtype: string;
  post_count: number;
  latest_post_date: string;
  default_zoom: number;
}

// Interface for post detail from database function
interface LocationPost {
  location_id: number;
  post_id: number;
  post_internal_id: number;
  post_date: string;
  post_text: string;
  channel_name: string;
  channel_username: string;
  has_photo: boolean;
  has_video: boolean;
  priority: number;
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

    console.log(`Globe API - Fetching top ${maxLocations} locations from last ${hours} hours`);

    // Step 1: Get aggregated location data with post counts (OPTIMIZED - single query)
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

    console.log(`Globe API - Found ${locationAggregates.length} locations`);

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

    // Step 3: Fetch media for posts (if needed)
    const postInternalIds = (locationPosts as LocationPost[] || []).map(p => p.post_internal_id);
    const uniquePostIds = [...new Set(postInternalIds)];

    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .select('id, post_id, media_type, public_url, filename')
      .in('post_id', uniquePostIds);

    if (mediaError) {
      console.warn('Globe API - Media query warning:', mediaError);
      // Continue without media - not critical
    }

    // Create media lookup map
    const mediaByPostId = new Map<number, typeof mediaData>();
    if (mediaData) {
      for (const media of mediaData) {
        if (!mediaByPostId.has(media.post_id)) {
          mediaByPostId.set(media.post_id, []);
        }
        mediaByPostId.get(media.post_id)!.push(media);
      }
    }

    // Step 4: Group posts by location and format response
    const locationPostsMap = new Map<number, LocationPost[]>();
    for (const post of (locationPosts as LocationPost[] || [])) {
      if (!locationPostsMap.has(post.location_id)) {
        locationPostsMap.set(post.location_id, []);
      }
      locationPostsMap.get(post.location_id)!.push(post);
    }

    const formattedLocations = (locationAggregates as LocationAggregate[]).map(loc => {
      const posts = locationPostsMap.get(loc.location_id) || [];

      const formattedPosts = posts.map(post => {
        const channelUsername = post.channel_username?.replace(/^@/, '');
        const sourceUrl = channelUsername && post.post_id
          ? `https://t.me/${channelUsername}/${post.post_id}`
          : null;

        const media = mediaByPostId.get(post.post_internal_id) || null;

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
          media: media,
        };
      });

      return {
        entity_name: loc.location_name,
        entity_type: 'Location',
        location_subtype: loc.location_subtype || loc.location_type,
        confidence: 0.8,
        story_count: Number(loc.post_count),
        coordinates: [loc.longitude, loc.latitude] as [number, number],
        default_zoom: loc.default_zoom,
        stories: formattedPosts,
      };
    });

    console.log(`Globe API - Returning ${formattedLocations.length} locations with posts`);

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
