import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Interface for Telegram video posts with location data
interface TelegramVideoLocation {
  location_name: string;
  latitude: number;
  longitude: number;
  location_type: string;
  location_subtype: string;
  default_zoom: number;
  post_count: number;
  news_items: Array<{
    id: string;
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

    // Parse query parameters
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? Math.max(0, Math.min(parseInt(hoursParam, 10), 720)) : 168; // Default 7 days

    const limitParam = searchParams.get('limit');
    const maxLocations = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10), 50)) : 30;

    console.log(`Globby API - Fetching Telegram video posts from last ${hours} hours`);

    // Query for Telegram posts with videos that have event locations
    // We'll use the news_item_attribute table to get location data
    const { data: telegramVideos, error: queryError } = await supabase
      .rpc('get_telegram_video_locations', {
        hours_ago: hours,
        max_locations: maxLocations,
      });

    if (queryError) {
      // If RPC doesn't exist, fall back to direct query
      console.log('RPC not found, using direct query');

      const timeAgo = new Date();
      timeAgo.setHours(timeAgo.getHours() - hours);

      // Direct query for Telegram posts with videos that have locations
      const { data: posts, error: postsError } = await supabase
        .from('news_item')
        .select(`
          id,
          title,
          content,
          link,
          published,
          created,
          media_url,
          media_type,
          osint_source!inner (
            name
          ),
          news_item_entity_location!inner (
            location_id,
            is_primary,
            confidence,
            entity_location!inner (
              id,
              name,
              lat,
              lon,
              location_type,
              default_zoom
            )
          )
        `)
        .like('link', '%t.me/%')
        .not('media_url', 'is', null)
        .gte('created', timeAgo.toISOString())
        .order('created', { ascending: false })
        .limit(500);

      if (postsError) {
        console.error('Globby API - Direct query error:', postsError);
        return NextResponse.json(
          {
            status: 'error',
            message: 'Failed to fetch Telegram video posts',
            error: postsError.message,
          },
          { status: 500 }
        );
      }

      // Group posts by location
      const locationMap = new Map<string, TelegramVideoLocation>();

      for (const post of posts || []) {
        const locationLinks = Array.isArray(post.news_item_entity_location)
          ? post.news_item_entity_location
          : [post.news_item_entity_location];

        for (const link of locationLinks) {
          if (!link?.entity_location) continue;

          const location = link.entity_location;
          if (!location.lat || !location.lon) continue;

          const locationKey = `${location.lat},${location.lon}`;

          if (!locationMap.has(locationKey)) {
            locationMap.set(locationKey, {
              location_name: location.name,
              latitude: location.lat,
              longitude: location.lon,
              location_type: location.location_type || 'city',
              location_subtype: location.location_type || 'city',
              default_zoom: location.default_zoom || 8,
              post_count: 0,
              news_items: [],
            });
          }

          const loc = locationMap.get(locationKey)!;
          loc.post_count++;

          // Extract channel info from Telegram URL
          const match = post.link?.match(/t\.me\/([^/]+)\/(\d+)/);
          const channelUsername = match?.[1] || 'unknown';

          loc.news_items.push({
            id: post.id,
            title: post.title?.substring(0, 100) || null,
            summary: post.content?.substring(0, 500) || post.title || null,
            created: post.created,
            source_name: post.osint_source?.name || channelUsername,
            source_url: post.link || '',
            has_photo: post.media_type === 'photo',
            has_video: post.media_type === 'video' || post.media_type === 'animation',
            media_url: post.media_url,
          });
        }
      }

      // Convert map to array and sort by post count
      const locations = Array.from(locationMap.values())
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, maxLocations);

      // Sort news items within each location by date
      locations.forEach(loc => {
        loc.news_items.sort((a, b) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      });

      const formattedLocations = locations.map(loc => ({
        entity_name: loc.location_name,
        entity_type: 'Location',
        location_subtype: loc.location_subtype,
        confidence: 0.8,
        news_item_count: loc.post_count,
        coordinates: [loc.longitude, loc.latitude] as [number, number],
        default_zoom: loc.default_zoom,
        event_location: true,
        news_items: loc.news_items,
      }));

      console.log(`Globby API - Returning ${formattedLocations.length} locations with Telegram videos`);

      return NextResponse.json(
        {
          status: 'success',
          data: {
            locations: formattedLocations,
            stats: {
              total_locations: formattedLocations.length,
              total_posts: locations.reduce((sum, loc) => sum + loc.post_count, 0),
              hours: hours,
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

    // If RPC exists and works, use that data
    const formattedLocations = (telegramVideos || []).map((loc: any) => ({
      entity_name: loc.location_name,
      entity_type: 'Location',
      location_subtype: loc.location_subtype || 'city',
      confidence: 0.8,
      news_item_count: loc.post_count || 0,
      coordinates: [loc.longitude, loc.latitude] as [number, number],
      default_zoom: loc.default_zoom || 8,
      event_location: true,
      news_items: loc.news_items || [],
    }));

    console.log(`Globby API - Returning ${formattedLocations.length} locations with Telegram videos (RPC)`);

    return NextResponse.json(
      {
        status: 'success',
        data: {
          locations: formattedLocations,
          stats: {
            total_locations: formattedLocations.length,
            hours: hours,
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
  } catch (error) {
    console.error('Globby API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch Telegram video data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
