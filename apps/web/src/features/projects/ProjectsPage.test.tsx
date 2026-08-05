// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../../App.js'

const project = {
  accentColor: null,
  archivedAt: null,
  completion: null,
  createdAt: '2026-08-05T09:00:00.000Z',
  description: null,
  id: 1,
  name: 'Launch website',
  scheduleHealth: 'insufficient_data',
  sortPosition: 0,
  startDate: null,
  targetDate: null,
  taskCount: 0,
  updatedAt: '2026-08-05T09:00:00.000Z',
}

describe('project workflow', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/projects?create=1')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('creates a project without leaving the application', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST')
        return Promise.resolve(
          new Response(JSON.stringify(project), { status: 201 }),
        )
      return Promise.resolve(
        new Response(
          JSON.stringify({ items: [], limit: 100, offset: 0, total: 0 }),
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText(/Name/), 'Launch website')
    await user.click(screen.getByRole('button', { name: 'Create project' }))

    expect(await screen.findByText('Launch website saved.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/projects')
    const post = fetchMock.mock.calls.find((call) => call[1]?.method === 'POST')
    expect(post?.[1]?.body).toContain('Launch website')
  })

  it('restores an archived project with optimistic feedback', async () => {
    window.history.replaceState({}, '', '/archive')
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ ...project, archivedAt: null })),
        )
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: [{ ...project, archivedAt: '2026-08-05T10:00:00.000Z' }],
            limit: 100,
            offset: 0,
            total: 1,
          }),
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Restore' }))

    await waitFor(() => {
      expect(screen.getByText('Launch website restored.')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects/1',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })
})
