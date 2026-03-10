import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function truncateWithEllipsis(text: string | null | undefined, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const location = request.nextUrl.searchParams.get('location');

    if (!location) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required "location" parameter' },
        { status: 400 }
      );
    }

    // Look up location_id from mv_globe_locations
    const { data: locRow, error: locError } = await supabase
      .from('mv_globe_locations')
      .select('location_id')
      .eq('location_name', location)
      .limit(1)
      .single();

    if (locError || !locRow) {
      return NextResponse.json(
        { status: 'error', message: `Location not found: ${location}` },
        { status: 404 }
      );
    }

    // Fetch all posts for this location
    const { data: posts, error: postsError } = await supabase
      .from('mv_globe_posts')
      .select('*')
      .eq('location_id', locRow.location_id)
      .order('post_date', { ascending: false })
      .limit(20);

    if (postsError) {
      console.error('Globe posts API error:', postsError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch posts', error: postsError.message },
        { status: 500 }
      );
    }

    // Dedupe by post_internal_id
    const seen = new Set<string>();
    const uniquePosts = (posts || []).filter(post => {
      if (!post.post_internal_id) return true;
      if (seen.has(post.post_internal_id)) return false;
      seen.add(post.post_internal_id);
      return true;
    });

    // mv_globe_posts can be stale; prefer canonical media_url from news_item.
    const postIds = uniquePosts
      .map(post => post.post_internal_id)
      .filter((id): id is string => Boolean(id));
    const mediaByPostId = new Map<string, string | null>();
    if (postIds.length > 0) {
      const { data: mediaRows, error: mediaError } = await supabase
        .from('news_item')
        .select('id, media_url')
        .in('id', postIds);

      if (mediaError) {
        console.warn('Globe posts API - failed to reconcile media urls from news_item:', mediaError.message);
      } else {
        for (const row of mediaRows || []) {
          mediaByPostId.set(row.id, row.media_url ?? null);
        }
      }
    }

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

    return NextResponse.json(
      { status: 'success', data: { posts: formattedPosts } },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Globe posts API error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch posts', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
