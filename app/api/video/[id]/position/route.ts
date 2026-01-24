import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// PATCH /api/video/[id]/position - Update video coordinates
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const body = await request.json()
    const { latitude, longitude } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    console.log(`Updating position for video ${videoId}: lat=${latitude}, lng=${longitude}`)

    // First check if the video exists
    const { data: existing, error: checkError } = await supabase
      .from('video')
      .select('video_id, latitude, longitude')
      .eq('video_id', videoId)

    if (checkError) {
      console.error('Error checking video existence:', checkError)
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      )
    }

    if (!existing || existing.length === 0) {
      console.error(`Video ${videoId} not found in database`)
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (existing.length > 1) {
      console.error(`Multiple records found for video ${videoId}. Count: ${existing.length}`)
      // Still proceed with update but log the issue
    }

    console.log(`Before update - Video ${videoId}: lat=${existing[0].latitude}, lng=${existing[0].longitude}`)

    const { data, error } = await supabase
      .from('video')
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      })
      .eq('video_id', videoId)
      .select('video_id, latitude, longitude')
      .single()

    console.log('Update result:', { data, error })

    if (error) {
      console.error('Video position update error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Verify the update was applied
    const { data: verification } = await supabase
      .from('video')
      .select('video_id, latitude, longitude')
      .eq('video_id', videoId)
      .single()

    console.log(`After update verification - Video ${videoId}: lat=${verification?.latitude}, lng=${verification?.longitude}`)

    if (verification && (verification.latitude !== latitude || verification.longitude !== longitude)) {
      console.error(`WARNING: Verification failed! Expected lat=${latitude}, lng=${longitude}, but got lat=${verification.latitude}, lng=${verification.longitude}`)
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (err) {
    console.error('Video position API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
