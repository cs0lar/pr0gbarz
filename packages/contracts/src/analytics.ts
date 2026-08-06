import { Type, type Static } from 'typebox'

import {
  DateOnlySchema,
  NullableDateOnlySchema,
  TimestampSchema,
} from './common.js'
import { TaskStatusSchema } from './tasks.js'

export const AnalyticsStateSchema = Type.Union([
  Type.Literal('available'),
  Type.Literal('insufficient_data'),
])

export const DailyProgressSchema = Type.Object(
  {
    date: DateOnlySchema,
    netProgressPoints: Type.Number(),
    updates: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const StalledTaskSchema = Type.Object(
  {
    daysWithoutProgress: Type.Integer({ minimum: 0 }),
    id: Type.Integer({ minimum: 1 }),
    lastProgressAt: Type.Union([TimestampSchema, Type.Null()]),
    name: Type.String(),
    progress: Type.Integer({ maximum: 100, minimum: 0 }),
    status: TaskStatusSchema,
  },
  { additionalProperties: false },
)

export const ProjectAnalyticsSchema = Type.Object(
  {
    completedTasks: Type.Integer({ minimum: 0 }),
    dailyProgress: Type.Array(DailyProgressSchema, { maxItems: 28 }),
    generatedAt: TimestampSchema,
    projectId: Type.Integer({ minimum: 1 }),
    projection: Type.Object(
      {
        projectedCompletionDate: NullableDateOnlySchema,
        state: AnalyticsStateSchema,
      },
      { additionalProperties: false },
    ),
    remainingTasks: Type.Integer({ minimum: 0 }),
    stalledTasks: Type.Array(StalledTaskSchema, { maxItems: 20 }),
    velocity: Type.Object(
      {
        observedDays: Type.Integer({ minimum: 0 }),
        pointsPerWeek: Type.Union([Type.Number(), Type.Null()]),
        state: AnalyticsStateSchema,
        updateCount: Type.Integer({ minimum: 0 }),
        windowDays: Type.Literal(28),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
)

export type ProjectAnalyticsResponse = Static<typeof ProjectAnalyticsSchema>
export type DailyProgressResponse = Static<typeof DailyProgressSchema>
export type StalledTaskResponse = Static<typeof StalledTaskSchema>
