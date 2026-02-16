/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock service client
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args)
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs)
            return { single: mockSingle }
          },
        }
      },
    }),
  }),
}))

import { GET } from '@/app/api/signals/[id]/raw/route'

const VALID_ID = '00000000-0000-0000-0000-000000000001'
const ACCESS_KEY = 'test-secret-key'

function makeRequest(id: string, headers: Record<string, string> = {}): [NextRequest, { params: { id: string } }] {
  const req = new NextRequest(`http://localhost:3000/api/signals/${id}/raw`, {
    headers: new Headers(headers),
  })
  return [req, { params: { id } }]
}

describe('GET /api/signals/[id]/raw', () => {
  const origEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...origEnv, SIGNALS_RAW_ACCESS_KEY: ACCESS_KEY }
  })

  afterAll(() => {
    process.env = origEnv
  })

  it('returns 401 without access key', async () => {
    const [req, ctx] = makeRequest(VALID_ID)
    const res = await GET(req, ctx)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.status).toBe('error')
    expect(json.message).toBe('Unauthorized')
  })

  it('returns 401 with wrong access key', async () => {
    const [req, ctx] = makeRequest(VALID_ID, { 'x-access-key': 'wrong-key' })
    const res = await GET(req, ctx)

    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    const [req, ctx] = makeRequest('not-a-uuid', { 'x-access-key': ACCESS_KEY })
    const res = await GET(req, ctx)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe('Invalid signal ID')
  })

  it('returns raw_text with correct access key', async () => {
    mockSingle.mockResolvedValue({
      data: { id: VALID_ID, raw_text: 'Original message text', published: '2026-02-17T10:00:00Z' },
      error: null,
    })

    const [req, ctx] = makeRequest(VALID_ID, { 'x-access-key': ACCESS_KEY })
    const res = await GET(req, ctx)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.raw_text).toBe('Original message text')
    expect(json.data.published).toBe('2026-02-17T10:00:00Z')
  })

  it('returns 404 when signal not found', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    })

    const [req, ctx] = makeRequest(VALID_ID, { 'x-access-key': ACCESS_KEY })
    const res = await GET(req, ctx)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.message).toBe('Signal not found')
  })

  it('returns 401 when env key not set', async () => {
    delete process.env.SIGNALS_RAW_ACCESS_KEY

    const [req, ctx] = makeRequest(VALID_ID, { 'x-access-key': ACCESS_KEY })
    const res = await GET(req, ctx)

    expect(res.status).toBe(401)
  })
})
