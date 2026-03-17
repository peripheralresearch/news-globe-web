import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    const [peopleRes, orgsRes] = await Promise.all([
      supabase
        .from('news_item_entity_person')
        .select('rank, confidence, role, position, entity_person:person_id (id, name, role, wikidata_qid)')
        .eq('news_item_id', id)
        .order('rank', { ascending: true, nullsFirst: false }),
      supabase
        .from('news_item_entity_organisation')
        .select('rank, confidence, role, position, entity_organisation:organisation_id (id, name, org_type, wikidata_qid)')
        .eq('news_item_id', id)
        .order('rank', { ascending: true, nullsFirst: false }),
    ]);

    if (peopleRes.error) console.error('Entity people error:', peopleRes.error);
    if (orgsRes.error) console.error('Entity orgs error:', orgsRes.error);

    const people = (peopleRes.data || []).map((row: any) => ({
      id: row.entity_person?.id ?? null,
      name: row.entity_person?.name,
      role: row.entity_person?.role || row.role || row.position,
      rank: row.rank,
      confidence: row.confidence,
      wikidataQid: row.entity_person?.wikidata_qid ?? null,
    }));

    const organisations = (orgsRes.data || []).map((row: any) => ({
      id: row.entity_organisation?.id ?? null,
      name: row.entity_organisation?.name,
      orgType: row.entity_organisation?.org_type,
      rank: row.rank,
      confidence: row.confidence,
      wikidataQid: row.entity_organisation?.wikidata_qid ?? null,
    }));

    return NextResponse.json(
      { status: 'success', data: { people, organisations } },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('News item entities API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch entities',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
