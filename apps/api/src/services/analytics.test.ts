import { describe, expect, it } from 'vitest'

import type { ProgressEvent, Task } from '@pr0gbarz/database'

import { calculateProjectAnalytics } from './analytics.js'

const now = new Date('2026-08-06T12:00:00.000Z')

function task(input: Partial<Task> & Pick<Task, 'id' | 'name'>): Task {
  return {
    archivedAt: null,
    completedAt: null,
    createdAt: new Date('2026-07-01T12:00:00.000Z'),
    description: null,
    dueDate: null,
    priority: 'none',
    progress: 0,
    projectId: 1,
    sortPosition: input.id,
    startDate: null,
    status: 'in_progress',
    updatedAt: now,
    ...input,
  }
}

function event(
  id: number,
  taskId: number,
  previousProgress: number,
  newProgress: number,
  occurredAt: string,
): ProgressEvent {
  return {
    id,
    newProgress,
    note: null,
    occurredAt: new Date(occurredAt),
    previousProgress,
    taskId,
  }
}

describe('project analytics', () => {
  it('returns honest insufficient-data states and detects stalled work', () => {
    const result = calculateProjectAnalytics({
      events: [],
      lastProgress: new Map(),
      now,
      projectId: 1,
      tasks: [task({ id: 1, name: 'Unstarted task' })],
    })

    expect(result).toMatchObject({
      completedTasks: 0,
      projection: { state: 'insufficient_data' },
      remainingTasks: 1,
      stalledTasks: [{ daysWithoutProgress: 36, id: 1 }],
      velocity: {
        observedDays: 0,
        pointsPerWeek: null,
        state: 'insufficient_data',
        updateCount: 0,
      },
    })
  })

  it('calculates net weekly velocity, daily samples, and a bounded projection', () => {
    const first = task({ id: 1, name: 'First', progress: 60 })
    const second = task({ id: 2, name: 'Second', progress: 40 })
    const events = [
      event(1, 1, 20, 40, '2026-07-22T12:00:00.000Z'),
      event(2, 2, 20, 40, '2026-08-05T12:00:00.000Z'),
    ]
    const result = calculateProjectAnalytics({
      events,
      lastProgress: new Map([
        [1, new Date('2026-07-22T12:00:00.000Z')],
        [2, new Date('2026-08-05T12:00:00.000Z')],
      ]),
      now,
      projectId: 1,
      tasks: [first, second],
    })

    expect(result.dailyProgress).toEqual([
      { date: '2026-07-22', netProgressPoints: 20, updates: 1 },
      { date: '2026-08-05', netProgressPoints: 20, updates: 1 },
    ])
    expect(result.velocity).toMatchObject({
      observedDays: 14,
      pointsPerWeek: 10,
      state: 'available',
      updateCount: 2,
    })
    expect(result.projection).toEqual({
      projectedCompletionDate: '2026-09-10',
      state: 'available',
    })
    expect(result.stalledTasks).toMatchObject([
      { daysWithoutProgress: 15, id: 1 },
    ])
  })
})
