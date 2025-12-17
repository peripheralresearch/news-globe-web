import { NextRequest, NextResponse } from 'next/server';
import { getSentinelClient, SentinelStory } from '@/lib/sentinel/api-client';
import type {
  RelationshipType,
  RelationshipSentiment,
} from '@/lib/sentinel/types';

export const dynamic = 'force-dynamic';

// Country coordinates lookup (ISO country names to [lng, lat])
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  // Major powers (with variations)
  'United States': [-98.5795, 39.8283],
  'USA': [-98.5795, 39.8283],
  'US': [-98.5795, 39.8283],
  'U.S.': [-98.5795, 39.8283],
  'U.S': [-98.5795, 39.8283],
  'America': [-98.5795, 39.8283],
  'Russia': [105.3188, 61.524],
  'Russian Federation': [105.3188, 61.524],
  'China': [104.1954, 35.8617],
  'United Kingdom': [-3.436, 55.3781],
  'UK': [-3.436, 55.3781],
  'Britain': [-3.436, 55.3781],
  'France': [2.2137, 46.2276],
  'Germany': [10.4515, 51.1657],

  // Europe
  'Ukraine': [31.1656, 48.3794],
  'Europe': [10.4515, 51.1657],
  'Poland': [19.1451, 51.9194],
  'Italy': [12.5674, 41.8719],
  'Spain': [-3.7492, 40.4637],
  'Netherlands': [5.2913, 52.1326],
  'Belgium': [4.3517, 50.8503],
  'Greece': [21.8243, 39.0742],
  'Turkey': [35.2433, 38.9637],
  'Sweden': [18.6435, 60.1282],
  'Norway': [8.4689, 60.472],
  'Finland': [25.7482, 61.9241],
  'Austria': [14.5501, 47.5162],
  'Switzerland': [8.2275, 46.8182],
  'Hungary': [19.5033, 47.1625],
  'Romania': [24.9668, 45.9432],
  'Serbia': [21.0059, 44.0165],
  'Bulgaria': [25.4858, 42.7339],
  'Belarus': [27.9534, 53.7098],

  // Middle East
  'Israel': [34.8516, 31.0461],
  'Palestine': [35.2332, 31.9522],
  'Gaza': [34.4667, 31.5],
  'Iran': [53.688, 32.4279],
  'Iraq': [43.6793, 33.2232],
  'Syria': [38.9968, 34.8021],
  'Lebanon': [35.8623, 33.8547],
  'Jordan': [36.2384, 30.5852],
  'Saudi Arabia': [45.0792, 23.8859],
  'Yemen': [48.5164, 15.5527],
  'UAE': [53.8478, 23.4241],
  'Qatar': [51.1839, 25.3548],
  'Kuwait': [47.4818, 29.3117],
  'Egypt': [30.8025, 26.8206],

  // Asia
  'Japan': [138.2529, 36.2048],
  'South Korea': [127.7669, 35.9078],
  'Korea': [127.7669, 35.9078],
  'North Korea': [127.5101, 40.3399],
  'India': [78.9629, 20.5937],
  'Pakistan': [69.3451, 30.3753],
  'Afghanistan': [67.7099, 33.9391],
  'Bangladesh': [90.3563, 23.685],
  'Vietnam': [108.2772, 14.0583],
  'Thailand': [100.9925, 15.870],
  'Indonesia': [113.9213, -0.7893],
  'Philippines': [121.774, 12.8797],
  'Taiwan': [120.9605, 23.6978],
  'Mongolia': [103.8467, 46.8625],
  'Kazakhstan': [66.9237, 48.0196],
  'Azerbaijan': [47.5769, 40.1431],
  'Armenia': [45.0382, 40.0691],
  'Georgia': [43.3569, 42.3154],
  'Myanmar': [95.956, 21.9162],
  'Nepal': [84.124, 28.3949],
  'Malaysia': [101.9758, 4.2105],
  'Singapore': [103.8198, 1.3521],
  'Cambodia': [104.9910, 12.5657],

  // Africa
  'South Africa': [22.9375, -30.5595],
  'Nigeria': [8.6753, 9.082],
  'Kenya': [37.9062, -0.0236],
  'Ethiopia': [40.4897, 9.145],
  'Tanzania': [34.8888, -6.369],
  'Sudan': [30.2176, 12.8628],
  'Libya': [17.2283, 26.3351],
  'Morocco': [-7.0926, 31.7917],
  'Algeria': [1.6596, 28.0339],
  'Tunisia': [9.5375, 33.8869],
  'Ghana': [-1.0232, 7.9465],
  'Mali': [-4.0, 17.0],
  'Niger': [8.0817, 17.6078],
  'Chad': [18.7322, 15.4542],
  'Congo': [15.8277, -0.228],
  'Somalia': [46.1996, 5.1521],
  'Rwanda': [29.8739, -1.9403],

  // Americas
  'Canada': [-106.3468, 56.1304],
  'Mexico': [-102.5528, 23.6345],
  'Brazil': [-51.9253, -14.235],
  'Argentina': [-63.6167, -38.4161],
  'Chile': [-71.543, -35.6751],
  'Colombia': [-74.2973, 4.5709],
  'Venezuela': [-66.5897, 6.4238],
  'Peru': [-75.0152, -9.19],
  'Cuba': [-77.7812, 21.5218],

  // Oceania
  'Australia': [133.7751, -25.2744],
  'New Zealand': [174.886, -40.9006],

  // Organizations
  'NATO': [4.3517, 50.8503],
  'EU': [4.3517, 50.8503],
  'UN': [-73.9680, 40.7489],
};

// City/Location coordinates
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // Ukraine cities/regions
  'Kyiv': [30.5234, 50.4501],
  'Kiev': [30.5234, 50.4501],
  'Donetsk': [37.8003, 48.0159],
  'Luhansk': [39.3078, 48.574],
  'Lugansk': [39.3078, 48.574],
  'Kharkiv': [36.2304, 49.9935],
  'Crimea': [34.1, 44.95],
  'Odesa': [30.7233, 46.4825],
  'Odessa': [30.7233, 46.4825],
  'Mariupol': [37.5499, 47.0971],
  'Bakhmut': [38.0008, 48.5953],
  'Zaporizhzhia': [35.1396, 47.8388],
  'Lviv': [24.0297, 49.8397],
  'Kherson': [32.6178, 46.6354],
  'Mykolaiv': [31.9946, 46.9750],
  'Dnipro': [35.0462, 48.4647],
  'Sumy': [34.7981, 50.9077],
  'Chernihiv': [31.2893, 51.4982],
  'Sevastopol': [33.5224, 44.6054],

  // Russia cities
  'Moscow': [37.6173, 55.7558],
  'St Petersburg': [30.3351, 59.9343],
  'Saint Petersburg': [30.3351, 59.9343],
  'Kursk': [36.1874, 51.7304],
  'Belgorod': [36.5983, 50.5997],
  'Rostov': [39.7233, 47.2357],
  'Voronezh': [39.1843, 51.6720],

  // Middle East cities
  'Baghdad': [44.3661, 33.3152],
  'Damascus': [36.2765, 33.5138],
  'Aleppo': [37.1343, 36.2021],
  'Tehran': [51.3890, 35.6892],
  'Kabul': [69.1723, 34.5553],
  'Jerusalem': [35.2137, 31.7683],
  'Tel Aviv': [34.7818, 32.0853],
  'Beirut': [35.4956, 33.8938],
  'Riyadh': [46.6753, 24.7136],
  'Dubai': [55.2708, 25.2048],
  'Cairo': [31.2357, 30.0444],
  'Khartoum': [32.5599, 15.5007],
  'Rafah': [34.2524, 31.2969],
  'Khan Younis': [34.3065, 31.3462],

  // Asia cities
  'Beijing': [116.4074, 39.9042],
  'Shanghai': [121.4737, 31.2304],
  'Hong Kong': [114.1694, 22.3193],
  'Tokyo': [139.6917, 35.6895],
  'Seoul': [126.978, 37.5665],
  'Pyongyang': [125.7625, 39.0392],
  'Taipei': [121.5654, 25.033],
  'New Delhi': [77.1025, 28.6139],
  'Delhi': [77.1025, 28.6139],
  'Mumbai': [72.8777, 19.076],
  'Islamabad': [73.0479, 33.6844],
  'Karachi': [67.0011, 24.8607],

  // Europe cities
  'London': [-0.1276, 51.5074],
  'Paris': [2.3522, 48.8566],
  'Berlin': [13.405, 52.52],
  'Brussels': [4.3517, 50.8503],
  'Vienna': [16.3738, 48.2082],
  'Rome': [12.4964, 41.9028],
  'Madrid': [-3.7038, 40.4168],
  'Warsaw': [21.0122, 52.2297],
  'Ankara': [32.8597, 39.9334],
  'Istanbul': [28.9784, 41.0082],
  'Athens': [23.7275, 37.9838],
  'Minsk': [27.5667, 53.9],
  'Geneva': [6.1432, 46.2044],

  // Americas cities
  'Washington': [-77.0369, 38.9072],
  'Washington DC': [-77.0369, 38.9072],
  'New York': [-74.006, 40.7128],
  'Los Angeles': [-118.2437, 34.0522],
  'Ottawa': [-75.6972, 45.4215],
  'Mexico City': [-99.1332, 19.4326],
  'Brasilia': [-47.8825, -15.7942],
  'Buenos Aires': [-58.3816, -34.6037],
  'Caracas': [-66.9036, 10.4806],

  // Africa cities
  'Johannesburg': [28.0473, -26.2041],
  'Lagos': [3.3792, 6.5244],
  'Nairobi': [36.8219, -1.2921],
  'Addis Ababa': [38.7578, 9.0222],
};

// All known locations for text matching
const ALL_LOCATIONS = Object.keys({ ...COUNTRY_COORDINATES, ...LOCATION_COORDINATES });

// Infer relationship type from story content
function inferRelationshipType(story: SentinelStory): RelationshipType | null {
  const text = `${story.title || ''} ${story.summary || ''}`.toLowerCase();

  if (/\b(war|attack|strike|missile|bomb|shell|kill|combat|militar\w+ operation|explosion|assault|raid)\b/.test(text)) {
    return 'CONFLICT';
  }
  if (/\b(military|defense|army|navy|air force|weapons|troops|armed forces|drone|forces)\b/.test(text)) {
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

// Extract location entities from story tags (preferred method)
function findLocationsFromTags(story: SentinelStory): string[] {
  const locations: string[] = [];
  
  if (story.tags) {
    // Look for tags with tag_type === 'Location'
    for (const [tagName, tagInfo] of Object.entries(story.tags)) {
      if (tagInfo.tag_type === 'Location') {
        locations.push(tagName);
      }
    }
  }
  
  return locations;
}

// Fallback: Find locations mentioned in story text (if no tags available)
function findLocationsInStoryText(story: SentinelStory): string[] {
  const text = `${story.title || ''} ${story.summary || ''}`;
  const found: string[] = [];

  for (const location of ALL_LOCATIONS) {
    // Use word boundary for more accurate matching
    const regex = new RegExp(`\\b${location}\\b`, 'i');
    if (regex.test(text)) {
      found.push(location);
    }
  }

  return found;
}

// Main function: Try tags first, fallback to text matching
function findLocationsInStory(story: SentinelStory): string[] {
  // First, try to get locations from tags (most accurate)
  const tagLocations = findLocationsFromTags(story);
  if (tagLocations.length > 0) {
    return tagLocations;
  }
  
  // Fallback to text matching if no location tags found
  return findLocationsInStoryText(story);
}

// Get coordinates for a location
function getCoordinates(name: string): [number, number] | null {
  return COUNTRY_COORDINATES[name] || LOCATION_COORDINATES[name] || null;
}

export async function GET(request: NextRequest) {
  try {
    const client = getSentinelClient();

    const searchParams = request.nextUrl.searchParams;
    const types = searchParams.get('types')?.split(',') as RelationshipType[] | undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20; // Default to 20, max 50

    // Fetch limited stories for better performance
    const stories = await client.getStories({ limit });

    // Track location stats
    const locationData = new Map<string, {
      entity_name: string;
      story_count: number;
      stories: Array<{
        id: string;
        title: string | null;
        summary: string | null;
        created: string;
        relationship_type: RelationshipType | null;
        sentiment: RelationshipSentiment;
      }>;
      coordinates: [number, number];
    }>();

    const relationships: Array<{
      actor: string;
      actor_coordinates: [number, number];
      targets: string[];
      target_coordinates: Array<{ name: string; coordinates: [number, number] }>;
      type: RelationshipType;
      sentiment: RelationshipSentiment;
      story_id: string;
      story_title: string | null;
      story_summary: string | null;
      description: string | null;
      created_at: string;
    }> = [];

    const typeCount: Record<RelationshipType, number> = {
      DIPLOMACY: 0,
      CONFLICT: 0,
      ECONOMIC: 0,
      MILITARY: 0,
      HUMANITARIAN: 0,
    };

    const sentimentCount: Record<RelationshipSentiment, number> = {
      cooperative: 0,
      tense: 0,
      hostile: 0,
      neutral: 0,
    };

    // Process each story
    for (const story of stories) {
      const type = inferRelationshipType(story);
      const sentiment = inferSentiment(type, story);
      const locations = findLocationsInStory(story);
      
      // Log if we found locations from tags vs text matching
      if (story.tags && Object.values(story.tags).some(t => t.tag_type === 'Location')) {
        console.log(`Story ${story.id}: Found ${locations.length} location(s) from tags`);
      } else if (locations.length > 0) {
        console.log(`Story ${story.id}: Found ${locations.length} location(s) from text matching (no location tags)`);
      }

      // Filter by types if specified
      if (types && types.length > 0 && type && !types.includes(type)) {
        continue;
      }

      // Extract individual news items from the story
      const newsItems = story.news_items || [];
      
      // Update location stats with individual news items
      for (const location of locations) {
        const coords = getCoordinates(location);
        if (!coords) continue;

        if (!locationData.has(location)) {
          locationData.set(location, {
            entity_name: location,
            story_count: 0,
            stories: [],
            coordinates: coords,
          });
        }

        const locStat = locationData.get(location)!;
        
        // Add each news item from this story
        for (const newsItem of newsItems) {
          locStat.story_count++;
          locStat.stories.push({
            id: newsItem.id, // Use news item ID, not story ID
            title: newsItem.title || story.title, // Prefer news item title, fallback to story
            summary: newsItem.content?.substring(0, 200) || story.summary, // Use news item content as summary
            created: newsItem.published || story.created, // Use news item published date
            relationship_type: type,
            sentiment,
          });
        }
        
        // If no news items, still add the story as a fallback
        if (newsItems.length === 0) {
          locStat.story_count++;
          locStat.stories.push({
            id: story.id,
            title: story.title,
            summary: story.summary,
            created: story.created,
            relationship_type: type,
            sentiment,
          });
        }
      }

      // Create relationship if multiple locations and has a type
      if (locations.length >= 2 && type) {
        const actor = locations[0];
        const actorCoords = getCoordinates(actor);

        if (actorCoords) {
          const targetLocations = locations.slice(1);
          const targetCoords = targetLocations
            .map(t => {
              const coords = getCoordinates(t);
              return coords ? { name: t, coordinates: coords } : null;
            })
            .filter((t): t is { name: string; coordinates: [number, number] } => t !== null);

          if (targetCoords.length > 0) {
            relationships.push({
              actor,
              actor_coordinates: actorCoords,
              targets: targetLocations,
              target_coordinates: targetCoords,
              type,
              sentiment,
              story_id: story.id,
              story_title: story.title,
              story_summary: story.summary,
              description: story.summary,
              created_at: story.created,
            });
          }
        }

        typeCount[type]++;
        sentimentCount[sentiment]++;
      } else if (type) {
        typeCount[type]++;
        sentimentCount[sentiment]++;
      }
    }

    // Convert location data to array, sorted by story count
    const formattedLocations = Array.from(locationData.values())
      .sort((a, b) => b.story_count - a.story_count)
      .map(loc => ({
        entity_name: loc.entity_name,
        entity_type: 'Location',
        location_subtype: 'Country',
        confidence: 0.8,
        story_count: loc.story_count,
        coordinates: loc.coordinates,
        stories: loc.stories.slice(0, 10), // Limit stories per location
      }));

    return NextResponse.json({
      status: 'success',
      data: {
        locations: formattedLocations,
        relationships,
        stats: {
          total_stories: stories.length,
          total_locations: formattedLocations.length,
          total_relationships: relationships.length,
          by_type: typeCount,
          by_sentiment: sentimentCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching globe data:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch globe data from Sentinel API',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
