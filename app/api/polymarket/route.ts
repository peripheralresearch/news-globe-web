import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface PolymarketMarket {
  id: string
  question: string
  outcomePrices: string
  volume24hr: number
  active: boolean
  closed: boolean
  image: string
}

export async function GET() {
  try {
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=15&order=volume24hr&ascending=false',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }, // Cache 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`)
    }

    const markets: PolymarketMarket[] = await response.json()

    const formatted = markets.map((m) => {
      // outcomePrices is a JSON string like "[\"0.85\",\"0.15\"]"
      let yesPrice = 0
      try {
        const prices = JSON.parse(m.outcomePrices)
        yesPrice = Math.round(parseFloat(prices[0]) * 100)
      } catch {}

      return {
        id: m.id,
        question: m.question,
        yesPrice,
        volume24hr: m.volume24hr,
        image: m.image,
      }
    })

    return NextResponse.json({ status: 'success', data: formatted })
  } catch (error) {
    console.error('Polymarket API error:', error)
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error', data: [] },
      { status: 502 }
    )
  }
}
