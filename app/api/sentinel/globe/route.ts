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
  news_item_count: number;
  coordinates: [number, number];  // [longitude, latitude] - from event_location
  default_zoom: number;
  event_location: boolean;        // Indicates this is an event location
  news_items: Array<{
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
    const requestedHours = hoursParam ? Math.max(0, Math.min(parseInt(hoursParam, 10), 720)) : 0; // 0 = all time
    const allTimeRequested = requestedHours === 0;
    // "All time" is not feasible for these RPCs under typical serverless statement timeouts.
    // Serve a large-but-safe default window instead of erroring.
    let hours = allTimeRequested ? 168 : requestedHours;

    const limitParam = searchParams.get('limit');
    const maxLocations = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10), 50)) : 30;

    console.log(`Globe API - Fetching top ${maxLocations} event locations from last ${hours} hours`);

    const fallbackHoursFor = (h: number) => {
      // Prefer 7d over 48h when reducing from large windows; keep shrinking if needed.
      if (h === 0) return 168;
      if (h > 168) return 168;
      if (h > 48) return 48;
      if (h > 24) return 24;
      return h;
    };

    // Step 1: Get aggregated location data with post counts (OPTIMIZED - single query)
    // NOTE: This query should filter for event_location to get where news events actually occurred
    const fetchLocationAggregates = async (hoursAgo: number) =>
      supabase.rpc('get_location_aggregates_v2', {
        hours_ago: hoursAgo,
        max_locations: maxLocations,
      });

    let locationAggregates: LocationAggregate[] | null = null;
    let aggregateError: { message?: string } | null = null;

    const firstAttempt = await fetchLocationAggregates(hours);
    locationAggregates = (firstAttempt.data as LocationAggregate[] | null) ?? null;
    aggregateError = firstAttempt.error as { message?: string } | null;

    // If the requested time window is too expensive, fall back to a smaller window.
    // This prevents the globe UI from showing "no data" due to DB statement timeouts.
    if (aggregateError?.message?.includes('statement timeout') && hours > 0) {
      const fallbackHours = fallbackHoursFor(hours);
      console.warn(
        `Globe API - Statement timeout for hours=${hours}; retrying with hours=${fallbackHours}`
      );
      hours = fallbackHours;
      const res = await fetchLocationAggregates(hours);
      locationAggregates = (res.data as LocationAggregate[] | null) ?? null;
      aggregateError = res.error as { message?: string } | null;
    }

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
    const locationIds = locationAggregates.map(l => l.location_id);

    let { data: locationPosts, error: postsError } = await supabase.rpc('get_location_posts', {
      location_ids: locationIds,
      hours_ago: hours,
      posts_per_location: 20, // Limit to top 20 posts per location
    });

    // Posts RPC can time out even if aggregates succeeds (e.g. "all time" or large windows).
    // Retry the whole flow with a smaller window.
    if (postsError?.message?.includes('statement timeout')) {
      const fallbackHours = fallbackHoursFor(hours);
      if (fallbackHours !== hours) {
        console.warn(
          `Globe API - Posts statement timeout for hours=${hours}; retrying with hours=${fallbackHours}`
        );
        hours = fallbackHours;

        const aggRetry = await fetchLocationAggregates(hours);
        locationAggregates = (aggRetry.data as LocationAggregate[] | null) ?? null;
        aggregateError = aggRetry.error as { message?: string } | null;

        if (!aggregateError && locationAggregates && locationAggregates.length > 0) {
          const retryIds = locationAggregates.map(l => l.location_id);
          const retryPosts = await supabase.rpc('get_location_posts', {
            location_ids: retryIds,
            hours_ago: hours,
            posts_per_location: 20,
          });
          locationPosts = retryPosts.data;
          postsError = retryPosts.error;
        }
      }
    }

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

    // A retry may have changed the aggregates; re-validate before continuing.
    if (!locationAggregates || locationAggregates.length === 0) {
      console.log('Globe API - No locations found in time range (post fetch stage)');
      return NextResponse.json(
        {
          status: 'success',
          data: {
            locations: [],
            stats: {
              total_locations: 0,
              requested_hours: requestedHours,
              served_hours: hours,
              all_time_requested: allTimeRequested,
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

    // Step 3: Group posts by location and format response
    const locationPostsMap = new Map<number, LocationPost[]>();
    for (const post of (locationPosts as LocationPost[] || [])) {
      if (!locationPostsMap.has(post.location_id)) {
        locationPostsMap.set(post.location_id, []);
      }
      locationPostsMap.get(post.location_id)!.push(post);
    }

    const formattedLocations: LocationData[] = locationAggregates.map(loc => {
      const posts = locationPostsMap.get(loc.location_id) || [];

      // Dedupe posts per location by stable internal id to avoid repeated cards
      const seen = new Set<string>();
      const uniquePosts = posts.filter(post => {
        if (!post.post_internal_id) return true;
        if (seen.has(post.post_internal_id)) return false;
        seen.add(post.post_internal_id);
        return true;
      });

      // Sort by most recent first
      uniquePosts.sort((a, b) => new Date(b.post_date).getTime() - new Date(a.post_date).getTime());

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
        news_item_count: Number(loc.post_count),
        coordinates: [loc.longitude, loc.latitude] as [number, number],  // event_location coordinates
        default_zoom: loc.default_zoom,
        event_location: loc.event_location ?? true,  // Mark as event location
        news_items: formattedPosts,
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
	            requested_hours: requestedHours,
	            served_hours: hours,
	            all_time_requested: allTimeRequested,
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
