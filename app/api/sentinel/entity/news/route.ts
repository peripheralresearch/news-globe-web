import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const type = params.get('type'); // 'person' | 'organisation'
    const id = params.get('id');
    const excludeItemId = params.get('exclude'); // current news item to exclude
    const limit = Math.min(parseInt(params.get('limit') ?? '10', 10), 20);

    if (!type || !id || !['person', 'organisation'].includes(type)) {
      return NextResponse.json({ status: 'error', message: 'Missing or invalid type/id' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const joinTable = type === 'person' ? 'news_item_entity_person' : 'news_item_entity_organisation';
    const fkField = type === 'person' ? 'person_id' : 'organisation_id';

    let query = supabase
      .from(joinTable)
      .select(`
        news_item:news_item_id (
          id,
          title,
          content,
          published,
          media_url,
          link,
          osint_source:osint_source_id (name, url)
        )
      `)
      .eq(fkField, id)
      .order('news_item_id', { ascending: false })
      .limit(limit + (excludeItemId ? 1 : 0));

    const { data, error } = await query;

    if (error) {
      console.error('Entity news API error:', error);
      return NextResponse.json({ status: 'error', message: 'Failed to fetch entity news' }, { status: 500 });
    }

    const items = (data || [])
      .map((row: any) => row.news_item)
      .filter((ni: any) => ni && ni.id !== excludeItemId)
      .slice(0, limit)
      .map((ni: any) => ({
        id: ni.id,
        title: ni.title ?? null,
        summary: ni.content ? ni.content.substring(0, 200) : null,
        published: ni.published,
        mediaUrl: ni.media_url ?? null,
        sourceUrl: ni.link ?? null,
        sourceName: ni.osint_source?.name ?? 'Unknown source',
      }));

    return NextResponse.json(
      { status: 'success', data: { items } },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      }
    );
  } catch (error) {
    console.error('Entity news API error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch entity news' }, { status: 500 });
  }
}
