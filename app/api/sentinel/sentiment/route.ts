import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SentimentDataPoint {
  day: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  avg_score: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // Call the cached database RPC function (queries materialized view)
    const { data: sentimentData, error: sentimentError } = await supabase.rpc('get_sentiment_tracker');

    if (sentimentError) {
      console.error('Sentiment RPC error:', sentimentError);
      throw sentimentError;
    }

    const dataPoints: SentimentDataPoint[] = sentimentData || [];

    return NextResponse.json(
      {
        status: 'success',
        data: {
          sentiment: dataPoints,
          stats: {
            total_days: dataPoints.length,
            total_items: dataPoints.reduce((sum, d) => sum + d.total, 0),
            avg_sentiment: dataPoints.length > 0
              ? (dataPoints.reduce((sum, d) => sum + d.avg_score, 0) / dataPoints.length).toFixed(3)
              : 0,
          },
        },
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
    console.error('Sentiment API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch sentiment data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
