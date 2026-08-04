import { Type, type Static } from 'typebox'

export const HealthSchema = Type.Object(
  {
    status: Type.Literal('ok'),
  },
  { additionalProperties: false },
)

export const ReadinessSchema = Type.Object(
  {
    database: Type.Literal('ready'),
    status: Type.Literal('ok'),
  },
  { additionalProperties: false },
)

export type HealthResponse = Static<typeof HealthSchema>
export type ReadinessResponse = Static<typeof ReadinessSchema>
