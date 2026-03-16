import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RawNewsItem {
  id: string;
  created: string;
  title: string | null;
  content: string | null;
  link: string | null;
  media_url: string | null;
  media_type: string | null;
  osint_source_id: string | null;
}

interface LocationLinkRow {
  news_item_id: string;
  location_id: number;
  entity_location:
    | { id: number; name: string; lat: number; lon: number; location_type: string | null; default_zoom: number | null }
    | Array<{ id: number; name: string; lat: number; lon: number; location_type: string | null; default_zoom: number | null }>;
}

function isVideoLike(item: RawNewsItem): boolean {
  const mediaType = (item.media_type || '').toLowerCase();
  const mediaUrl = (item.media_url || '').toLowerCase();
  const link = (item.link || '').toLowerCase();
  return (
    mediaType.includes('video') ||
    /\.(mp4|mov|webm|m3u8)(\?|$)/.test(mediaUrl) ||
    link.includes('instagram.com/reel/') ||
    link.includes('youtube.com/watch') ||
    link.includes('youtu.be/') ||
    link.includes('tiktok.com/')
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;

    const limitParam = searchParams.get('limit');
    const maxLocations = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10), 200)) : 200;

    // Resolve Instagram source IDs
    const { data: sourcesData, error: sourcesError } = await supabase
      .from('osint_source')
      .select('id')
      .ilike('name', '%instagram%');

    if (sourcesError) {
      console.error('Globe Video API - Source lookup error:', sourcesError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch sources', error: sourcesError.message },
        { status: 500 }
      );
    }

    const instagramSourceIds = (sourcesData || []).map((s) => s.id);
    if (instagramSourceIds.length === 0) {
      return NextResponse.json(
        { status: 'success', data: { locations: [], stats: { total_locations: 0, total_video_items: 0 } } },
        { status: 200 }
      );
    }

    console.log(`Globe Video API - Fetching all Instagram items from ${instagramSourceIds.length} sources`);

    const { data: itemData, error: itemError } = await supabase
      .from('news_item')
      .select('id, created, title, content, link, media_url, media_type, osint_source_id')
      .in('osint_source_id', instagramSourceIds)
      .order('created', { ascending: false });

    if (itemError) {
      console.error('Globe Video API - News item query error:', itemError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch video globe data', error: itemError.message },
        { status: 500 }
      );
    }

    const rawItems = (itemData || []) as unknown as RawNewsItem[];
    const videoItems = rawItems.filter(isVideoLike);
    const videoIds = videoItems.map((item) => item.id);

    if (videoIds.length === 0) {
      return NextResponse.json(
        {
          status: 'success',
          data: {
            locations: [],
            stats: {
              total_locations: 0,
              total_video_items: 0,
            },
          },
        },
        { status: 200 }
      );
    }

    // Step 2: fetch location links only for candidate video items.
    let locationLinkRows: LocationLinkRow[] = [];
    const maxIdsPerBatch = 200;
    for (let i = 0; i < videoIds.length; i += maxIdsPerBatch) {
      const batchIds = videoIds.slice(i, i + maxIdsPerBatch);
      const { data: batchLinks, error: linkError } = await supabase
        .from('news_item_entity_location')
        .select(
          `
            news_item_id,
            location_id,
            entity_location!inner(
              id,
              name,
              lat,
              lon,
              location_type,
              default_zoom
            )
          `
        )
        .in('news_item_id', batchIds);

      if (linkError) {
        console.error('Globe Video API - Location link query error:', linkError);
        return NextResponse.json(
          { status: 'error', message: 'Failed to fetch video globe data', error: linkError.message },
          { status: 500 }
        );
      }
      locationLinkRows.push(...((batchLinks || []) as unknown as LocationLinkRow[]));
    }

    const linksByNewsId = new Map<string, LocationLinkRow[]>();
    for (const row of locationLinkRows) {
      if (!linksByNewsId.has(row.news_item_id)) {
        linksByNewsId.set(row.news_item_id, []);
      }
      linksByNewsId.get(row.news_item_id)!.push(row);
    }

    // Step 3: resolve sources in a separate lightweight lookup.
    const sourceIds = Array.from(new Set(videoItems.map((v) => v.osint_source_id).filter(Boolean))) as string[];
    const sourceById = new Map<string, { name: string | null; url: string | null }>();
    if (sourceIds.length > 0) {
      const maxSourceIdsPerBatch = 200;
      for (let i = 0; i < sourceIds.length; i += maxSourceIdsPerBatch) {
        const batch = sourceIds.slice(i, i + maxSourceIdsPerBatch);
        const { data: sourceRows, error: sourceErr } = await supabase
          .from('osint_source')
          .select('id,name,url')
          .in('id', batch);
        if (sourceErr) {
          console.warn('Globe Video API - Source lookup warning:', sourceErr.message);
          continue;
        }
        for (const row of sourceRows || []) {
          sourceById.set(row.id, { name: row.name ?? null, url: row.url ?? null });
        }
      }
    }

    const locationMap = new Map<
      number,
      {
        entity_name: string;
        entity_type: 'Location';
        location_subtype: string | null;
        confidence: number;
        news_item_count: number;
        coordinates: [number, number];
        default_zoom: number;
        event_location: true;
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
    >();

    for (const item of videoItems) {
      const source = item.osint_source_id ? sourceById.get(item.osint_source_id) : null;
      const sourceName = source?.name || 'Unknown source';
      const sourceUrl = source?.url || item.link || '';
      const links = linksByNewsId.get(item.id) || [];

      for (const link of links) {
        const rawLoc = Array.isArray(link.entity_location) ? link.entity_location[0] : link.entity_location;
        if (!rawLoc?.id) continue;
        if (rawLoc.lat == null || rawLoc.lon == null) continue;

        if (!locationMap.has(rawLoc.id)) {
          locationMap.set(rawLoc.id, {
            entity_name: rawLoc.name,
            entity_type: 'Location',
            location_subtype: rawLoc.location_type || null,
            confidence: 0.8,
            news_item_count: 0,
            coordinates: [rawLoc.lon, rawLoc.lat],
            default_zoom: rawLoc.default_zoom ?? 5,
            event_location: true,
            news_items: [],
          });
        }

        const location = locationMap.get(rawLoc.id)!;
        const alreadyExists = location.news_items.some((n) => n.id === item.id);
        if (alreadyExists) continue;

        location.news_items.push({
          id: item.id,
          post_id: 0,
          title: item.title ? item.title.substring(0, 100) : null,
          summary: item.content || item.title || null,
          created: item.created,
          source_name: sourceName,
          source_url: sourceUrl,
          has_photo: false,
          has_video: true,
          media_url: item.media_url,
        });
        location.news_item_count += 1;
      }
    }

    const formattedLocations = Array.from(locationMap.values())
      .sort((a, b) => b.news_item_count - a.news_item_count)
      .slice(0, maxLocations);

    console.log(
      `Globe Video API - Returning ${formattedLocations.length} locations from ${videoItems.length} video items`
    );

    return NextResponse.json(
      {
        status: 'success',
        data: {
          locations: formattedLocations,
          stats: {
            total_locations: formattedLocations.length,
            total_video_items: videoItems.length,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
          'CDN-Cache-Control': 'max-age=120',
          'Vercel-CDN-Cache-Control': 'max-age=120',
        },
      }
    );
  } catch (error) {
    console.error('Globe Video API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch video globe data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
