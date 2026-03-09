import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer()
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required "id" parameter' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('news_item')
      .select('id,title,content')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { status: 'error', message: 'News item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        status: 'success',
        data: {
          id: data.id,
          title: data.title,
          content: data.content,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('News item content API error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch news item content',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
