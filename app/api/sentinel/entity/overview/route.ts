import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function fetchWikidataOverview(qid: string): Promise<{ description: string | null; imageUrl: string | null; wikipediaUrl: string | null }> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&format=json&props=claims|descriptions|sitelinks&languages=en&sitefilter=enwiki`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    if (!res.ok) return { description: null, imageUrl: null, wikipediaUrl: null };

    const json = await res.json();
    const entity = json?.entities?.[qid];
    if (!entity) return { description: null, imageUrl: null, wikipediaUrl: null };

    const description = entity.descriptions?.en?.value ?? null;

    // P18 = image
    const imageClaim = entity.claims?.P18?.[0];
    const imageFilename = imageClaim?.mainsnak?.datavalue?.value;
    const imageUrl = imageFilename
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFilename)}?width=200`
      : null;

    // Wikipedia link
    const wikiTitle = entity.sitelinks?.enwiki?.title;
    const wikipediaUrl = wikiTitle
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`
      : null;

    return { description, imageUrl, wikipediaUrl };
  } catch {
    return { description: null, imageUrl: null, wikipediaUrl: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const type = params.get('type'); // 'person' | 'organisation'
    const id = params.get('id');

    if (!type || !id || !['person', 'organisation'].includes(type)) {
      return NextResponse.json({ status: 'error', message: 'Missing or invalid type/id' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const table = type === 'person' ? 'entity_person' : 'entity_organisation';
    const selectFields = type === 'person'
      ? 'id, name, role, aliases, wikidata_qid'
      : 'id, name, org_type, aliases, wikidata_qid';

    const { data: entity, error } = await supabase
      .from(table)
      .select(selectFields)
      .eq('id', id)
      .single();

    if (error || !entity) {
      return NextResponse.json({ status: 'error', message: 'Entity not found' }, { status: 404 });
    }

    let wikidataData = { description: null as string | null, imageUrl: null as string | null, wikipediaUrl: null as string | null };
    if (entity.wikidata_qid) {
      wikidataData = await fetchWikidataOverview(entity.wikidata_qid);
    }

    return NextResponse.json(
      {
        status: 'success',
        data: {
          id: entity.id,
          name: entity.name,
          type,
          role: type === 'person' ? (entity as any).role : null,
          orgType: type === 'organisation' ? (entity as any).org_type : null,
          aliases: entity.aliases ?? null,
          wikidataQid: entity.wikidata_qid ?? null,
          description: wikidataData.description,
          imageUrl: wikidataData.imageUrl,
          wikipediaUrl: wikidataData.wikipediaUrl,
        },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
      }
    );
  } catch (error) {
    console.error('Entity overview API error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch entity overview' }, { status: 500 });
  }
}
