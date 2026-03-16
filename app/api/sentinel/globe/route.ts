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

const BROAD_LOCATION_SUBTYPES = new Set([
  'CONTINENT',
  'REGION',
  'SUBREGION',
  'MACRO_REGION',
  'OCEAN',
  'SEA',
  'WATER_BODY',
]);

const BROAD_LOCATION_NAME_PATTERNS: RegExp[] = [
  /\bafrica\b/i,
  /\bantarctica\b/i,
  /\basia\b/i,
  /\beurope\b/i,
  /\bnorth america\b/i,
  /\bsouth america\b/i,
  /\boceania\b/i,
  /\bmiddle east\b/i,
  /\bpersian gulf\b/i,
  /\b(arabian|red|black|baltic|mediterranean)\s+sea\b/i,
  /\bocean\b/i,
  /\bgulf\b/i,
];

function shouldExcludeBroadLocation(loc: LocationAggregate): boolean {
  const subtype = (loc.location_subtype || '').toUpperCase().trim();
  const type = (loc.location_type || '').toUpperCase().trim();
  const name = (loc.location_name || '').trim();
  const normalizedName = name.toLowerCase();

  // Manual suppression for malformed composite location entities.
  if (normalizedName === 'united states-israel') {
    return true;
  }

  if (BROAD_LOCATION_SUBTYPES.has(subtype) || BROAD_LOCATION_SUBTYPES.has(type)) {
    return true;
  }

  // Exclude very broad zoom levels (continents/macro-regions), but allow countries back in.
  if (typeof loc.default_zoom === 'number' && loc.default_zoom <= 4) {
    return true;
  }

  return BROAD_LOCATION_NAME_PATTERNS.some((pattern) => pattern.test(name));
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
    const fetchLocations = Math.min(200, Math.max(maxLocations * 3, maxLocations));

    const pplParam = searchParams.get('posts_per_location');
    const postsPerLocation = pplParam ? Math.max(1, Math.min(parseInt(pplParam, 10), 20)) : 20;

    const hoursParam = searchParams.get('hours');
    const hoursAgo = hoursParam ? Math.max(1, Math.min(parseInt(hoursParam, 10), 8760)) : 24;

    console.log(`Globe API - Fetching top ${fetchLocations} candidate locations, ${postsPerLocation} posts each, ${hoursAgo}h window`);

    const { data: globeData, error: rpcError } = await supabase.rpc('get_globe_data', {
      hours_ago: hoursAgo,
      max_locations: fetchLocations,
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
    const locationAggregatesRaw: LocationAggregate[] = result?.locations ?? [];
    const locationAggregates = locationAggregatesRaw.filter((loc) => !shouldExcludeBroadLocation(loc)).slice(0, maxLocations);
    const locationPosts: LocationPost[] = result?.posts ?? [];

    if (locationAggregates.length === 0) {
      console.log('Globe API - No locations found');
      return NextResponse.json(
        { status: 'success', data: { locations: [], stats: { total_locations: 0 } } },
        { status: 200, headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
      );
    }

    console.log(`Globe API - Found ${locationAggregates.length} locations after broad-geo filtering (from ${locationAggregatesRaw.length})`);

    // Group posts by location
    const locationPostsMap = new Map<number, LocationPost[]>();
    for (const post of locationPosts) {
      if (!locationPostsMap.has(post.location_id)) {
        locationPostsMap.set(post.location_id, []);
      }
      locationPostsMap.get(post.location_id)!.push(post);
    }

    // mv_globe_posts can lag behind news_item updates; prefer canonical media_url from news_item.
    const postIds = Array.from(new Set(locationPosts.map(post => post.post_internal_id).filter(Boolean)));
    const mediaByPostId = new Map<string, string | null>();
    if (postIds.length > 0) {
      const { data: mediaRows, error: mediaError } = await supabase
        .from('news_item')
        .select('id, media_url')
        .in('id', postIds);

      if (mediaError) {
        console.warn('Globe API - failed to reconcile media urls from news_item:', mediaError.message);
      } else {
        for (const row of mediaRows || []) {
          mediaByPostId.set(row.id, row.media_url ?? null);
        }
      }
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
          media_url: mediaByPostId.has(post.post_internal_id)
            ? mediaByPostId.get(post.post_internal_id) ?? null
            : post.media_url,
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
