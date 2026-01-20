import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface VideoMarker {
  id: string
  title: string
  channelName: string
  date: string
  coordinates: [number, number]
  videoUrl: string
  description?: string
}

export async function GET(
  request: Request,
  { params }: { params: { country: string } }
) {
  try {
    const country = params.country.toUpperCase()

    const supabase = supabaseServer()

    const { data, error } = await supabase
      .from('ice_videos')
      .select('*')
      .eq('country', country)
      .order('published_date', { ascending: false })

    if (error) {
      console.error('ICE videos API - Query error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform database records to VideoMarker format
    const videos: VideoMarker[] = (data || []).map(video => ({
      id: video.video_id,
      title: video.title,
      channelName: video.channel || video.uploader || '',
      date: video.published_date,
      coordinates: [video.longitude, video.latitude] as [number, number],
      videoUrl: video.public_url,
      description: video.description
    }))

    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        }
      }
    )
  } catch (err) {
    console.error('ICE videos API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
