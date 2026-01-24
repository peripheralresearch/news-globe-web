import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface VideoMarker {
  id: string
  title: string
  channelName: string
  date: string | null
  coordinates: [number, number]
  videoUrl: string | null
  description?: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country: countryParam } = await params
    const country = countryParam.toUpperCase()

    const supabase = supabaseServer()

    const { data, error } = await supabase
      .from('video')
      .select('*')
      .eq('country', country)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('ICE videos API - Query error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform database records to VideoMarker format
    const videos: VideoMarker[] = (data || []).map(video => {
      // Parse coordinates - Supabase returns numeric as strings
      const lng = parseFloat(video.longitude)
      const lat = parseFloat(video.latitude)

      return {
        id: video.video_id,
        title: video.title,
        channelName: video.channel || video.uploader || '',
        date: video.published_date,
        coordinates: (!isNaN(lng) && !isNaN(lat)) ? [lng, lat] as [number, number] : null,
        videoUrl: video.public_url,
        sourceUrl: video.source_url,
        description: video.description
      }
    }).filter(v => v.coordinates !== null) as VideoMarker[]

    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=120',
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
