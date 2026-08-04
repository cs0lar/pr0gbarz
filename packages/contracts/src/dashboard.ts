import { Type, type Static } from 'typebox'

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
    totalTasks: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export type DashboardResponse = Static<typeof DashboardSchema>
