import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface DailyCount {
  day: string;
  count: number;
}

interface TrendingEntity {
  id: number;
  name: string;
  type: 'location' | 'person' | 'organisation';
  total_mentions: number;
  daily_counts: DailyCount[];
  trend_direction: 'rising' | 'falling' | 'stable';
  trend_percentage: number;
}

interface TrendingResponse {
  locations: TrendingEntity[];
  persons: TrendingEntity[];
  organisations: TrendingEntity[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // Call the cached database RPC function (queries materialized view - super fast!)
    const { data: trendingData, error: trendingError } = await supabase.rpc('get_trending_entities_cached');

    if (trendingError) {
      console.error('Trending RPC error:', trendingError);
      throw trendingError;
    }

    // Extract entity arrays from the returned JSONB
    const locationsData = trendingData?.locations || [];
    const personsData = trendingData?.persons || [];
    const orgsData = trendingData?.organisations || [];

    // Process data and calculate trends
    const processTrendData = (data: any[], type: 'location' | 'person' | 'organisation'): TrendingEntity[] => {
      return data.map((entity: any) => {
        const dailyCounts: DailyCount[] = entity.daily_counts || [];

        // Calculate trend based on first half vs second half
        const midpoint = Math.floor(dailyCounts.length / 2);
        const firstHalf = dailyCounts.slice(0, midpoint);
        const secondHalf = dailyCounts.slice(midpoint);

        const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / (firstHalf.length || 1);
        const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / (secondHalf.length || 1);

        const trendPercentage = firstHalfAvg > 0
          ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
          : 0;

        let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
        if (trendPercentage > 10) trendDirection = 'rising';
        else if (trendPercentage < -10) trendDirection = 'falling';

        return {
          id: entity.id,
          name: entity.name,
          type,
          total_mentions: entity.total_mentions,
          daily_counts: dailyCounts,
          trend_direction: trendDirection,
          trend_percentage: Math.round(trendPercentage),
        };
      });
    };

    const response: TrendingResponse = {
      locations: processTrendData(locationsData || [], 'location'),
      persons: processTrendData(personsData || [], 'person'),
      organisations: processTrendData(orgsData || [], 'organisation'),
    };

    return NextResponse.json(
      {
        status: 'success',
        data: response,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'CDN-Cache-Control': 'max-age=1800',
        },
      }
    );
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch trending entities',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
