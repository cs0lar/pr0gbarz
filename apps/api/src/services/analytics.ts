import type { ProjectAnalyticsResponse } from '@pr0gbarz/contracts'
import type { ProgressEvent, Task } from '@pr0gbarz/database'

const dayMilliseconds = 86_400_000
export const analyticsWindowDays = 28
export const stalledAfterDays = 14

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function round(value: number): number {
  return Number(value.toFixed(2))
}

export function calculateProjectAnalytics({
  events,
  lastProgress,
  now,
  projectId,
  tasks,
}: {
  events: ProgressEvent[]
  lastProgress: Map<number, Date>
  now: Date
  projectId: number
  tasks: Task[]
}): ProjectAnalyticsResponse {
  const completedTasks = tasks.filter(
    (task) => task.status === 'completed',
  ).length
  const remainingTasks = tasks.length - completedTasks
  const daily = new Map<
    string,
    { netProgressPoints: number; updates: number }
  >()

  for (const event of events) {
    const date = dateOnly(event.occurredAt)
    const current = daily.get(date) ?? { netProgressPoints: 0, updates: 0 }
    current.netProgressPoints += event.newProgress - event.previousProgress
    current.updates += 1
    daily.set(date, current)
  }

  const dailyProgress = [...daily.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date,
      netProgressPoints: round(value.netProgressPoints),
      updates: value.updates,
    }))

  const eventTimes = events.map((event) => event.occurredAt.getTime())
  const observedDays =
    eventTimes.length < 2
      ? 0
      : Math.floor(
          (Math.max(...eventTimes) - Math.min(...eventTimes)) / dayMilliseconds,
        )
  const sufficientVelocity =
    events.length >= 2 && observedDays >= 7 && tasks.length > 0
  const netProgress = events.reduce(
    (total, event) => total + event.newProgress - event.previousProgress,
    0,
  )
  const pointsPerWeek = sufficientVelocity
    ? round((netProgress / tasks.length / observedDays) * 7)
    : null

  const completion =
    tasks.length === 0
      ? null
      : tasks.reduce((total, task) => total + task.progress, 0) / tasks.length
  let projectedCompletionDate: string | null = null
  if (
    pointsPerWeek !== null &&
    pointsPerWeek > 0 &&
    completion !== null &&
    completion < 100
  ) {
    const days = Math.ceil(((100 - completion) / pointsPerWeek) * 7)
    if (days <= 1_825) {
      projectedCompletionDate = dateOnly(
        new Date(now.getTime() + days * dayMilliseconds),
      )
    }
  }

  const stalledTasks = tasks
    .filter((task) => task.status !== 'completed')
    .map((task) => {
      const last = lastProgress.get(task.id) ?? task.createdAt
      return {
        daysWithoutProgress: Math.max(
          0,
          Math.floor((now.getTime() - last.getTime()) / dayMilliseconds),
        ),
        id: task.id,
        lastProgressAt: lastProgress.get(task.id)?.toISOString() ?? null,
        name: task.name,
        progress: task.progress,
        status: task.status,
      }
    })
    .filter((task) => task.daysWithoutProgress >= stalledAfterDays)
    .sort(
      (left, right) =>
        right.daysWithoutProgress - left.daysWithoutProgress ||
        left.id - right.id,
    )
    .slice(0, 20)

  return {
    completedTasks,
    dailyProgress,
    generatedAt: now.toISOString(),
    projectId,
    projection: {
      projectedCompletionDate,
      state: projectedCompletionDate ? 'available' : 'insufficient_data',
    },
    remainingTasks,
    stalledTasks,
    velocity: {
      observedDays,
      pointsPerWeek,
      state: sufficientVelocity ? 'available' : 'insufficient_data',
      updateCount: events.length,
      windowDays: analyticsWindowDays,
    },
  }
}
