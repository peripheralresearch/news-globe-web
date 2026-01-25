import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/remove-video - Remove Bellingcat video
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || 'Bellingcat'

    const supabase = createServiceClient()

    // First, find videos matching the search term
    const { data: videos, error: searchError } = await supabase
      .from('video')
      .select('video_id, title, channel, uploader, country')
      .or(`title.ilike.%${searchTerm}%,channel.ilike.%${searchTerm}%,uploader.ilike.%${searchTerm}%`)

    if (searchError) {
      return NextResponse.json(
        { error: searchError.message },
        { status: 500 }
      )
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { message: 'No videos found matching: ' + searchTerm, videos: [] },
        { status: 404 }
      )
    }

    // Log found videos
    console.log(`Found ${videos.length} video(s) matching "${searchTerm}":`)
    videos.forEach(v => {
      console.log(`- ${v.video_id}: ${v.title} (${v.channel || v.uploader}) [${v.country}]`)
    })

    // Delete the videos
    const { error: deleteError } = await supabase
      .from('video')
      .delete()
      .or(`title.ilike.%${searchTerm}%,channel.ilike.%${searchTerm}%,uploader.ilike.%${searchTerm}%`)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${videos.length} video(s) matching "${searchTerm}"`,
      deleted: videos
    })

  } catch (err) {
    console.error('Remove video API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

// GET /api/admin/remove-video - Search for videos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || 'Bellingcat'

    const supabase = createServiceClient()

    const { data: videos, error } = await supabase
      .from('video')
      .select('video_id, title, channel, uploader, country, created_at')
      .or(`title.ilike.%${searchTerm}%,channel.ilike.%${searchTerm}%,uploader.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      searchTerm,
      count: videos?.length || 0,
      videos: videos || []
    })

  } catch (err) {
    console.error('Search video API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}