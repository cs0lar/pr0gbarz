// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProjectAnalyticsPanel } from './ProjectAnalyticsPanel.js'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderPanel(response: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(response)))),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ProjectAnalyticsPanel projectId={1} />
    </QueryClientProvider>,
  )
}

describe('project analytics', () => {
  it('explains insufficient data without presenting a projection', async () => {
    renderPanel({
      completedTasks: 0,
      dailyProgress: [],
      generatedAt: '2026-08-06T12:00:00.000Z',
      projectId: 1,
      projection: {
        projectedCompletionDate: null,
        state: 'insufficient_data',
      },
      remainingTasks: 1,
      stalledTasks: [],
      velocity: {
        observedDays: 0,
        pointsPerWeek: null,
        state: 'insufficient_data',
        updateCount: 0,
        windowDays: 28,
      },
    })

    expect(await screen.findAllByText('Insufficient data')).toHaveLength(2)
    expect(screen.getByText('No recent measurements')).toBeInTheDocument()
    expect(screen.getByText(/No incomplete task/)).toBeInTheDocument()
  })

  it('gives an SVG chart a textual equivalent', async () => {
    renderPanel({
      completedTasks: 1,
      dailyProgress: [
        { date: '2026-07-28', netProgressPoints: 10, updates: 1 },
        { date: '2026-08-06', netProgressPoints: 20, updates: 1 },
      ],
      generatedAt: '2026-08-06T12:00:00.000Z',
      projectId: 1,
      projection: {
        projectedCompletionDate: '2026-09-10',
        state: 'available',
      },
      remainingTasks: 1,
      stalledTasks: [],
      velocity: {
        observedDays: 9,
        pointsPerWeek: 11.67,
        state: 'available',
        updateCount: 2,
        windowDays: 28,
      },
    })

    expect(
      await screen.findByRole('img', {
        name: /Project progress gained over 28 days.*2 updates were recorded/,
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/2 updates were recorded/)).toHaveLength(2)
    expect(screen.getByText('2026-09-10')).toBeInTheDocument()
  })
})
