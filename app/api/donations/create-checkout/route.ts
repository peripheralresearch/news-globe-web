import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Security constants
const MAX_AMOUNT = 1000000 // $10,000 maximum donation (in cents)
const MIN_AMOUNT = 100 // $1 minimum donation (in cents)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://peripheral.com',
  'https://www.peripheral.com'
]

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 checkout sessions per IP per 15 minutes
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Too many requests. Please try again later.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()
    const { amount } = body

    // Validate amount with min/max bounds
    if (!amount || typeof amount !== 'number' || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Please enter a valid amount between $${MIN_AMOUNT / 100} and $${MAX_AMOUNT / 100}`
        },
        { status: 400 }
      )
    }

    // Get Stripe secret key from environment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set')
      return NextResponse.json(
        {
          status: 'error',
          message: 'Service temporarily unavailable'
        },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey)

    // Validate origin to prevent open redirect vulnerability
    const requestOrigin = request.headers.get('origin')
    const origin = ALLOWED_ORIGINS.includes(requestOrigin || '')
      ? requestOrigin
      : ALLOWED_ORIGINS[0] // Default to localhost for development

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to Peripheral',
              description: 'Support Peripheral with a donation'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${origin}?donation=success`,
      cancel_url: `${origin}?donation=cancelled`,
      metadata: {
        donation_type: 'custom',
        amount: amount.toString()
      }
    })

    return NextResponse.json({
      status: 'success',
      url: session.url
    })
  } catch (error) {
    console.error('Create checkout API error:', error)
    // Don't leak error details to client in production
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create checkout session. Please try again later.'
      },
      { status: 500 }
    )
  }
}

