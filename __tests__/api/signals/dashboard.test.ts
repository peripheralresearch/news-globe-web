/**
 * @jest-environment node
 */

// Mock supabase server client
const mockRpc = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: () => ({ rpc: mockRpc }),
}))

import { GET } from '@/app/api/signals/dashboard/route'

describe('GET /api/signals/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns combined stats and intensity', async () => {
    const mockStats = {
      total: 336000,
      firstDate: '2022-02-24',
      lastDate: '2026-02-17',
      weapons: [{ weapon_type: 'Shahed-136', count: 5000 }],
      frequency: [{ date: '2026-02-10', count: 120 }],
    }
    const mockIntensity = [
      { day: '2026-02-16', intensity_score: 3.5, total_raw_signals: 450 },
      { day: '2026-02-17', intensity_score: 4.1, total_raw_signals: 520 },
    ]

    mockRpc
      .mockResolvedValueOnce({ data: mockStats, error: null })
      .mockResolvedValueOnce({ data: mockIntensity, error: null })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.stats).toEqual(mockStats)
    expect(json.data.intensity).toHaveLength(2)
  })

  it('returns 500 when stats RPC fails', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'stats error' } })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.message).toContain('dashboard stats')
  })

  it('returns 500 when intensity RPC fails', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'intensity error' } })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.message).toContain('alert intensity')
  })
})
