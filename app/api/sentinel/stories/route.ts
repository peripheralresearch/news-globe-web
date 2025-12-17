import { NextRequest, NextResponse } from 'next/server';
import { getSentinelClient, SentinelStory } from '@/lib/sentinel/api-client';
import type { RelationshipType, RelationshipSentiment } from '@/lib/sentinel/types';

export const dynamic = 'force-dynamic';

// Infer relationship type from story content
function inferRelationshipType(story: SentinelStory): RelationshipType | null {
  const text = `${story.title || ''} ${story.summary || ''}`.toLowerCase();

  if (/\b(war|attack|strike|missile|bomb|shell|kill|combat|militar\w+ operation|explosion|assault)\b/.test(text)) {
    return 'CONFLICT';
  }
  if (/\b(military|defense|army|navy|air force|weapons|troops|armed forces|drone)\b/.test(text)) {
    return 'MILITARY';
  }
  if (/\b(diplomat|summit|negotiat|treaty|agreement|talks|ambassador|foreign minister|bilateral)\b/.test(text)) {
    return 'DIPLOMACY';
  }
  if (/\b(trade|economic|sanction|tariff|investment|market|finance|currency|gdp)\b/.test(text)) {
    return 'ECONOMIC';
  }
  if (/\b(humanitarian|refugee|aid|crisis|relief|disaster|civilian|casualt|evacuat)\b/.test(text)) {
    return 'HUMANITARIAN';
  }
  return null;
}

// Infer sentiment
function inferSentiment(type: RelationshipType | null, story: SentinelStory): RelationshipSentiment {
  if (type === 'CONFLICT') return 'hostile';
  if (type === 'HUMANITARIAN') return 'cooperative';

  const text = `${story.title || ''} ${story.summary || ''}`.toLowerCase();

  if (/\b(tension|threat|warn|condemn|accuse|hostile|oppose)\b/.test(text)) {
    return 'tense';
  }
  if (/\b(cooperat|partner|ally|support|agreement|peace)\b/.test(text)) {
    return 'cooperative';
  }
  return 'neutral';
}

// Extract locations from story text
const KNOWN_LOCATIONS = [
  'Ukraine', 'Russia', 'United States', 'U.S.', 'US', 'China', 'Germany',
  'France', 'UK', 'Israel', 'Palestine', 'Gaza', 'Syria', 'Iran', 'Iraq',
  'Turkey', 'Japan', 'South Korea', 'North Korea', 'India', 'Pakistan',
  'Egypt', 'Saudi Arabia', 'Venezuela', 'Sudan', 'Europe', 'Washington',
  'Moscow', 'Kyiv', 'Beijing', 'Damascus', 'Crimea', 'Taiwan',
];

function extractLocations(story: SentinelStory): string[] {
  const text = `${story.title || ''} ${story.summary || ''}`;
  return KNOWN_LOCATIONS.filter(loc => text.includes(loc));
}

export async function GET(request: NextRequest) {
  try {
    const client = getSentinelClient();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const relationshipType = searchParams.get('type') as RelationshipType | null;

    // Fetch stories from Sentinel API
    const stories = await client.getStories({ page, limit: limit * 2 });

    // Transform stories with entity extraction
    const storiesWithEntities = stories.map((story) => {
      const type = inferRelationshipType(story);
      const sentiment = inferSentiment(type, story);
      const locations = extractLocations(story);

      // Create entities from locations
      const entities = locations.map(loc => ({
        entity_name: loc,
        entity_type: 'Location',
        location_subtype: 'Country',
        confidence: 0.8,
      }));

      // Create relationship if we have location data
      let relationship = null;
      if (locations.length >= 1 && type) {
        const actor = locations[0];
        const targets = locations.length > 1 ? locations.slice(1) : locations;

        relationship = {
          type,
          sentiment,
          actor,
          targets,
          description: story.summary || story.title,
        };
      }

      return {
        id: story.id,
        title: story.title,
        summary: story.summary,
        content: story.content,
        created: story.created,
        published: story.published,
        link: story.link,
        entities,
        relationship,
        tags: [],
        source: story.news_items?.[0]?.source || null,
      };
    });

    // Filter by relationship type if specified
    let filteredStories = storiesWithEntities;
    if (relationshipType) {
      filteredStories = storiesWithEntities.filter(
        s => s.relationship?.type === relationshipType
      );
    }

    // Paginate
    const paginatedStories = filteredStories.slice(0, limit);

    return NextResponse.json({
      status: 'success',
      stories: paginatedStories,
      count: stories.length,
      hasMore: filteredStories.length > limit,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching Sentinel stories:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch stories from Sentinel API',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
