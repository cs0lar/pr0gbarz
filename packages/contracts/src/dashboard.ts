import { Type, type Static } from 'typebox'

import { NullableTextSchema, TimestampSchema } from './common.js'

export const RecentProgressSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
    newProgress: Type.Integer({ maximum: 100, minimum: 0 }),
    note: NullableTextSchema(2_000),
    occurredAt: TimestampSchema,
    previousProgress: Type.Integer({ maximum: 100, minimum: 0 }),
    projectId: Type.Integer({ minimum: 1 }),
    projectName: Type.String(),
    taskId: Type.Integer({ minimum: 1 }),
    taskName: Type.String(),
  },
  { additionalProperties: false },
)

export const DashboardSchema = Type.Object(
  {
    activeProjects: Type.Integer({ minimum: 0 }),
    averageProgress: Type.Union([
      Type.Number({ maximum: 100, minimum: 0 }),
      Type.Null(),
    ]),
    blockedTasks: Type.Integer({ minimum: 0 }),
    completedTasks: Type.Integer({ minimum: 0 }),
    overdueTasks: Type.Integer({ minimum: 0 }),
    recentProgress: Type.Array(RecentProgressSchema, { maxItems: 5 }),
    totalTasks: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export type DashboardResponse = Static<typeof DashboardSchema>
export type RecentProgressResponse = Static<typeof RecentProgressSchema>
