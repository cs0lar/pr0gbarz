import { Type, type Static } from 'typebox'

export const IdParamsSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const ProjectIdParamsSchema = Type.Object(
  {
    projectId: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const TaskIdParamsSchema = Type.Object(
  {
    taskId: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const TaskTagParamsSchema = Type.Object(
  {
    tagId: Type.Integer({ minimum: 1 }),
    taskId: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const ErrorResponseSchema = Type.Object(
  {
    code: Type.String(),
    fieldErrors: Type.Optional(
      Type.Record(Type.String(), Type.Array(Type.String())),
    ),
    message: Type.String(),
  },
  { additionalProperties: false },
)
export const NoContentSchema = Type.Null()

export const DateOnlySchema = Type.String({
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
})
export const TimestampSchema = Type.String({ format: 'date-time' })
export const NullableDateOnlySchema = Type.Union([DateOnlySchema, Type.Null()])
export const NullableTimestampSchema = Type.Union([
  TimestampSchema,
  Type.Null(),
])
export const NullableTextSchema = (maximum: number) =>
  Type.Union([Type.String({ maxLength: maximum }), Type.Null()])
export const NameSchema = Type.String({
  maxLength: 120,
  minLength: 1,
  pattern: '\\S',
})
export const ColorSchema = Type.Union([
  Type.String({ pattern: '^#[0-9a-fA-F]{6}$' }),
  Type.Null(),
])

export type IdParams = Static<typeof IdParamsSchema>
export type ProjectIdParams = Static<typeof ProjectIdParamsSchema>
export type TaskIdParams = Static<typeof TaskIdParamsSchema>
export type TaskTagParams = Static<typeof TaskTagParamsSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
