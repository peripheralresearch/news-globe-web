import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// POST /api/admin/add-videos - Add new videos to database
export async function POST(request: Request) {
  try {
    const videos = await request.json()

    const supabase = createServiceClient()

    // Insert videos
    const { data, error } = await supabase
      .from('video')
      .insert(videos)
      .select()

    if (error) {
      console.error('Error inserting videos:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Added ${data.length} video(s)`,
      videos: data
    })

  } catch (err) {
    console.error('Add videos API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}