import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

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
  event_location?: boolean;
}

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

interface GlobeDataResult {
  locations: LocationAggregate[];
  posts: LocationPost[];
}

interface LocationData {
  entity_name: string;
  entity_type: string;
  location_subtype: string;
  confidence: number;
  news_item_count: number;
  coordinates: [number, number];
  default_zoom: number;
  event_location: boolean;
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

function truncateWithEllipsis(text: string | null | undefined, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;

    const limitParam = searchParams.get('limit');
    const maxLocations = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10), 200)) : 30;

    const pplParam = searchParams.get('posts_per_location');
    const postsPerLocation = pplParam ? Math.max(1, Math.min(parseInt(pplParam, 10), 20)) : 20;

    const hoursParam = searchParams.get('hours');
    const hoursAgo = hoursParam ? Math.max(1, Math.min(parseInt(hoursParam, 10), 8760)) : 24;

    console.log(`Globe API - Fetching top ${maxLocations} locations, ${postsPerLocation} posts each, ${hoursAgo}h window`);

    const { data: globeData, error: rpcError } = await supabase.rpc('get_globe_data', {
      hours_ago: hoursAgo,
      max_locations: maxLocations,
      posts_per_location: postsPerLocation,
    });

    if (rpcError) {
      console.error('Globe API - RPC error:', rpcError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch globe data', error: rpcError.message },
        { status: 500 }
      );
    }

    const result = globeData as GlobeDataResult | null;
    const locationAggregates: LocationAggregate[] = result?.locations ?? [];
    const locationPosts: LocationPost[] = result?.posts ?? [];

    if (locationAggregates.length === 0) {
      console.log('Globe API - No locations found');
      return NextResponse.json(
        { status: 'success', data: { locations: [], stats: { total_locations: 0 } } },
        { status: 200, headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
      );
    }

    console.log(`Globe API - Found ${locationAggregates.length} locations`);

    // Group posts by location
    const locationPostsMap = new Map<number, LocationPost[]>();
    for (const post of locationPosts) {
      if (!locationPostsMap.has(post.location_id)) {
        locationPostsMap.set(post.location_id, []);
      }
      locationPostsMap.get(post.location_id)!.push(post);
    }

    const formattedLocations: LocationData[] = locationAggregates.map(loc => {
      const posts = locationPostsMap.get(loc.location_id) || [];

      // Dedupe by internal id
      const seen = new Set<string>();
      const uniquePosts = posts.filter(post => {
        if (!post.post_internal_id) return true;
        if (seen.has(post.post_internal_id)) return false;
        seen.add(post.post_internal_id);
        return true;
      });

      uniquePosts.sort((a, b) => new Date(b.post_date).getTime() - new Date(a.post_date).getTime());

      const formattedPosts = uniquePosts.map(post => {
        const channelUsername = post.channel_username?.replace(/^@/, '');
        const sourceUrl = channelUsername && post.post_id
          ? `https://t.me/${channelUsername}/${post.post_id}`
          : post.channel_username;

        return {
          id: post.post_internal_id,
          post_id: post.post_id,
          title: truncateWithEllipsis(post.post_text, 100),
          summary: post.post_text,
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
        coordinates: [loc.longitude, loc.latitude] as [number, number],
        default_zoom: loc.default_zoom,
        event_location: loc.event_location ?? true,
        news_items: formattedPosts,
      } as LocationData;
    });

    console.log(`Globe API - Returning ${formattedLocations.length} locations with posts`);

    return NextResponse.json(
      {
        status: 'success',
        data: {
          locations: formattedLocations,
          stats: { total_locations: formattedLocations.length },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
          'CDN-Cache-Control': 'max-age=600',
          'Vercel-CDN-Cache-Control': 'max-age=600',
        },
      }
    );
  } catch (error) {
    console.error('Globe API error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch globe data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
