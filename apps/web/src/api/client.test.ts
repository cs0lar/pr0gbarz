import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from './client.js'

afterEach(() => vi.unstubAllGlobals())

describe('typed API client', () => {
  it('serializes bounded project queries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ items: [], limit: 20, offset: 10, total: 0 }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.projects({ limit: 20, offset: 10, search: 'launch' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects?limit=20&offset=10&search=launch',
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
  })

  it('turns API error envelopes into actionable errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'NOT_FOUND',
            message: 'Project was not found.',
          }),
          {
            status: 404,
          },
        ),
      ),
    )

    await expect(api.dashboard()).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Project was not found.',
      status: 404,
    })
  })
})
