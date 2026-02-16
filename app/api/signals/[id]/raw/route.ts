import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessKey = request.headers.get('x-access-key')
    const expectedKey = process.env.SIGNALS_RAW_ACCESS_KEY

    if (!expectedKey || !accessKey || accessKey !== expectedKey) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid signal ID' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('signal')
      .select('id, raw_text, published')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { status: 'error', message: 'Signal not found' },
          { status: 404 }
        )
      }
      console.error('Signal raw API error:', error)
      return NextResponse.json(
        { status: 'error', message: 'Failed to fetch signal', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      data: { raw_text: data.raw_text, published: data.published },
    })
  } catch (error) {
    console.error('Signal raw API error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
