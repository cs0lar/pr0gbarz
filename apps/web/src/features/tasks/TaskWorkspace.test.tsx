// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../../App.js'

const project = {
  accentColor: null,
  archivedAt: null,
  completion: 20,
  createdAt: '2026-08-05T09:00:00.000Z',
  description: 'Ship a focused release.',
  id: 1,
  name: 'Release 2.0',
  scheduleHealth: 'insufficient_data',
  sortPosition: 0,
  startDate: null,
  targetDate: null,
  taskCount: 1,
  updatedAt: '2026-08-05T09:00:00.000Z',
}

const task = {
  archivedAt: null,
  completedAt: null,
  createdAt: '2026-08-05T09:00:00.000Z',
  description: 'Cover every mutation path.',
  dueDate: null,
  id: 1,
  name: 'Test task workspace',
  priority: 'high',
  progress: 20,
  projectId: 1,
  sortPosition: 0,
  startDate: null,
  status: 'in_progress',
  tags: [],
  updatedAt: '2026-08-05T09:00:00.000Z',
}

function list(items: unknown[]) {
  return { items, limit: 200, offset: 0, total: items.length }
}

function requestPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  return input instanceof URL ? input.toString() : input.url
}

describe('task workspace', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/projects/1')
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('creates a task and represents filtering in the URL', async () => {
    const tasks = [task]
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = requestPath(input)
      if (path === '/api/v1/projects/1')
        return Promise.resolve(new Response(JSON.stringify(project)))
      if (path === '/api/v1/tags')
        return Promise.resolve(new Response(JSON.stringify({ items: [] })))
      if (path === '/api/v1/projects/1/tasks' && init?.method === 'POST') {
        const created = {
          ...task,
          id: 2,
          name: 'Write release notes',
          sortPosition: 1,
        }
        tasks.push(created)
        return Promise.resolve(
          new Response(JSON.stringify(created), { status: 201 }),
        )
      }
      if (path.startsWith('/api/v1/projects/1/tasks'))
        return Promise.resolve(new Response(JSON.stringify(list(tasks))))
      return Promise.resolve(new Response('{}', { status: 404 }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'New task' }))
    await user.type(
      screen.getByRole('textbox', { name: /Name/ }),
      'Write release notes',
    )
    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(
      await screen.findByText('Write release notes saved.'),
    ).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'blocked')
    expect(window.location.search).toContain('status=blocked')
    await user.type(screen.getByPlaceholderText('Search tasks…'), 'notes')
    expect(window.location.search).toContain('taskSearch=notes')
  })

  it('rolls back a failed optimistic progress update', async () => {
    let failUpdate: (() => void) | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = requestPath(input)
      if (path === '/api/v1/projects/1')
        return Promise.resolve(new Response(JSON.stringify(project)))
      if (path === '/api/v1/tags')
        return Promise.resolve(new Response(JSON.stringify({ items: [] })))
      if (path === '/api/v1/tasks/1' && init?.method === 'PATCH')
        return new Promise<Response>((resolve) => {
          failUpdate = () => {
            resolve(
              new Response(
                JSON.stringify({
                  code: 'FAILED',
                  message: 'Injected failure.',
                }),
                { status: 500 },
              ),
            )
          }
        })
      if (path.startsWith('/api/v1/projects/1/tasks'))
        return Promise.resolve(new Response(JSON.stringify(list([task]))))
      return Promise.resolve(new Response('{}', { status: 404 }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      await screen.findByRole('button', {
        name: 'Increase Test task workspace progress by 10',
      }),
    )

    expect(await screen.findByText('30%')).toBeInTheDocument()
    await waitFor(() => {
      expect(failUpdate).toBeTypeOf('function')
    })
    failUpdate?.()
    expect(
      await screen.findByText(/previous value was restored/),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText('20%').length).toBeGreaterThan(0)
    })
  })
})
