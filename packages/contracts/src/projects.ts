import { Type, type Static } from 'typebox'

import {
  ColorSchema,
  DateOnlySchema,
  NameSchema,
  NullableDateOnlySchema,
  NullableTextSchema,
  NullableTimestampSchema,
  TimestampSchema,
} from './common.js'

export const ProjectSchema = Type.Object(
  {
    accentColor: ColorSchema,
    archivedAt: NullableTimestampSchema,
    completion: Type.Union([
      Type.Number({ maximum: 100, minimum: 0 }),
      Type.Null(),
    ]),
    createdAt: TimestampSchema,
    description: NullableTextSchema(5_000),
    id: Type.Integer({ minimum: 1 }),
    name: NameSchema,
    scheduleHealth: Type.Union([
      Type.Literal('complete'),
      Type.Literal('insufficient_data'),
      Type.Literal('not_started'),
      Type.Literal('on_track'),
      Type.Literal('at_risk'),
      Type.Literal('overdue'),
    ]),
    sortPosition: Type.Integer(),
    startDate: NullableDateOnlySchema,
    targetDate: NullableDateOnlySchema,
    taskCount: Type.Integer({ minimum: 0 }),
    updatedAt: TimestampSchema,
  },
  { additionalProperties: false },
)

export const CreateProjectSchema = Type.Object(
  {
    accentColor: Type.Optional(ColorSchema),
    description: Type.Optional(NullableTextSchema(5_000)),
    name: NameSchema,
    sortPosition: Type.Optional(Type.Integer()),
    startDate: Type.Optional(NullableDateOnlySchema),
    targetDate: Type.Optional(NullableDateOnlySchema),
  },
  { additionalProperties: false },
)

export const UpdateProjectSchema = Type.Object(
  {
    accentColor: Type.Optional(ColorSchema),
    archived: Type.Optional(Type.Boolean()),
    description: Type.Optional(NullableTextSchema(5_000)),
    name: Type.Optional(NameSchema),
    sortPosition: Type.Optional(Type.Integer()),
    startDate: Type.Optional(NullableDateOnlySchema),
    targetDate: Type.Optional(NullableDateOnlySchema),
  },
  { additionalProperties: false, minProperties: 1 },
)

export const ProjectListQuerySchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean({ default: false })),
    direction: Type.Optional(
      Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
        default: 'asc',
      }),
    ),
    limit: Type.Optional(
      Type.Integer({ default: 50, maximum: 100, minimum: 1 }),
    ),
    offset: Type.Optional(Type.Integer({ default: 0, minimum: 0 })),
    search: Type.Optional(Type.String({ maxLength: 100 })),
    sort: Type.Optional(
      Type.Union(
        [Type.Literal('manual'), Type.Literal('name'), Type.Literal('updated')],
        { default: 'manual' },
      ),
    ),
  },
  { additionalProperties: false },
)

export const ProjectListSchema = Type.Object(
  {
    items: Type.Array(ProjectSchema),
    limit: Type.Integer({ minimum: 1 }),
    offset: Type.Integer({ minimum: 0 }),
    total: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const ProjectDateRangeSchema = Type.Object({
  startDate: Type.Optional(Type.Union([DateOnlySchema, Type.Null()])),
  targetDate: Type.Optional(Type.Union([DateOnlySchema, Type.Null()])),
})

export type ProjectResponse = Static<typeof ProjectSchema>
export type CreateProject = Static<typeof CreateProjectSchema>
export type UpdateProject = Static<typeof UpdateProjectSchema>
export type ProjectListQuery = Static<typeof ProjectListQuerySchema>
export type ProjectListResponse = Static<typeof ProjectListSchema>
