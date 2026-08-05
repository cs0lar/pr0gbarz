// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from './App.js'

describe('application shell', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    window.history.replaceState({}, '', '/')
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        if (url.includes('/api/v1/dashboard')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                activeProjects: 0,
                averageProgress: null,
                blockedTasks: 0,
                completedTasks: 0,
                overdueTasks: 0,
                recentProgress: [],
                totalTasks: 0,
              }),
            ),
          )
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({ items: [], limit: 100, offset: 0, total: 0 }),
          ),
        )
      }),
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('navigates without a page reload', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Good morning.' }),
    ).toBeInTheDocument()

    const projectsLink = screen.getAllByRole('link', { name: 'Projects' }).at(0)
    expect(projectsLink).toBeDefined()
    if (projectsLink) await user.click(projectsLink)

    expect(
      screen.getByRole('heading', { name: 'Projects' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/projects')
  })

  it('persists an explicit colour theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'dark' }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })
    expect(localStorage.getItem('pr0gbarz-theme')).toBe('dark')
  })

  it('has no detectable automated accessibility violations', async () => {
    render(<App />)
    const result = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(result.violations).toEqual([])
  })
})
