/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock supabase server client
const mockRpc = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: () => ({ rpc: mockRpc }),
}))

import { GET } from '@/app/api/signals/latest/route'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/signals/latest')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

describe('GET /api/signals/latest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns signal list without raw_text', async () => {
    const mockData = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        published: '2026-02-17T10:00:00Z',
        signal_type: 'air_threat_track',
        weapon_type: 'Shahed-136',
        target_location: 'Kyiv',
        target_region: 'Kyivska',
        direction: 'Northeast',
        alert_type: null,
        alert_status: null,
        lat: 50.45,
        lon: 30.52,
      },
    ]
    mockRpc.mockResolvedValue({ data: mockData, error: null })

    const res = await GET(makeRequest({ limit: '5' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveLength(1)
    expect(json.data[0]).not.toHaveProperty('raw_text')
    expect(json.data[0].weapon_type).toBe('Shahed-136')

    expect(mockRpc).toHaveBeenCalledWith('get_signals_latest', {
      p_limit: 5,
      p_offset: 0,
      p_region: null,
      p_weapon_type: null,
      p_signal_type: null,
      p_since: null,
      p_category: null,
    })
  })

  it('passes filter parameters to RPC', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    await GET(makeRequest({
      region: 'Kharkivska',
      weapon_type: 'Shahed-136',
      signal_type: 'air_threat_track',
      since: '2026-02-17T00:00:00Z',
    }))

    expect(mockRpc).toHaveBeenCalledWith('get_signals_latest', {
      p_limit: 20,
      p_offset: 0,
      p_region: 'Kharkivska',
      p_weapon_type: 'Shahed-136',
      p_signal_type: 'air_threat_track',
      p_since: '2026-02-17T00:00:00Z',
      p_category: null,
    })
  })

  it('clamps limit to 100', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    await GET(makeRequest({ limit: '999' }))

    expect(mockRpc).toHaveBeenCalledWith('get_signals_latest', expect.objectContaining({
      p_limit: 100,
    }))
  })

  it('returns 500 on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'db error' } })

    const res = await GET(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.status).toBe('error')
  })

  it('returns empty array when no data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    const res = await GET(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toEqual([])
  })
})
