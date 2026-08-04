import { Type, type Static } from 'typebox'

import {
  DateOnlySchema,
  NameSchema,
  NullableDateOnlySchema,
  NullableTextSchema,
  NullableTimestampSchema,
  TimestampSchema,
} from './common.js'

export const TaskStatusSchema = Type.Union([
  Type.Literal('backlog'),
  Type.Literal('planned'),
  Type.Literal('in_progress'),
  Type.Literal('blocked'),
  Type.Literal('completed'),
])

export const TaskPrioritySchema = Type.Union([
  Type.Literal('none'),
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high'),
  Type.Literal('urgent'),
])

export const TagSchema = Type.Object(
  {
    color: Type.Union([
      Type.String({ pattern: '^#[0-9a-fA-F]{6}$' }),
      Type.Null(),
    ]),
    id: Type.Integer({ minimum: 1 }),
    label: Type.String({ maxLength: 60, minLength: 1, pattern: '\\S' }),
    normalizedName: Type.String({ maxLength: 60, minLength: 1 }),
  },
  { additionalProperties: false },
)

export const TaskSchema = Type.Object(
  {
    archivedAt: NullableTimestampSchema,
    completedAt: NullableTimestampSchema,
    createdAt: TimestampSchema,
    description: NullableTextSchema(10_000),
    dueDate: NullableDateOnlySchema,
    id: Type.Integer({ minimum: 1 }),
    name: NameSchema,
    priority: TaskPrioritySchema,
    progress: Type.Integer({ maximum: 100, minimum: 0 }),
    projectId: Type.Integer({ minimum: 1 }),
    sortPosition: Type.Integer(),
    startDate: NullableDateOnlySchema,
    status: TaskStatusSchema,
    tags: Type.Array(TagSchema),
    updatedAt: TimestampSchema,
  },
  { additionalProperties: false },
)

export const CreateTaskSchema = Type.Object(
  {
    description: Type.Optional(NullableTextSchema(10_000)),
    dueDate: Type.Optional(NullableDateOnlySchema),
    name: NameSchema,
    priority: Type.Optional(TaskPrioritySchema),
    progress: Type.Optional(Type.Integer({ maximum: 100, minimum: 0 })),
    sortPosition: Type.Optional(Type.Integer()),
    startDate: Type.Optional(NullableDateOnlySchema),
    status: Type.Optional(TaskStatusSchema),
  },
  { additionalProperties: false },
)

export const UpdateTaskSchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean()),
    description: Type.Optional(NullableTextSchema(10_000)),
    dueDate: Type.Optional(NullableDateOnlySchema),
    name: Type.Optional(NameSchema),
    note: Type.Optional(Type.String({ maxLength: 2_000 })),
    priority: Type.Optional(TaskPrioritySchema),
    progress: Type.Optional(Type.Integer({ maximum: 100, minimum: 0 })),
    sortPosition: Type.Optional(Type.Integer()),
    startDate: Type.Optional(NullableDateOnlySchema),
    status: Type.Optional(TaskStatusSchema),
  },
  { additionalProperties: false, minProperties: 1 },
)

export const TaskListQuerySchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean({ default: false })),
    direction: Type.Optional(
      Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
        default: 'asc',
      }),
    ),
    limit: Type.Optional(
      Type.Integer({ default: 100, maximum: 200, minimum: 1 }),
    ),
    offset: Type.Optional(Type.Integer({ default: 0, minimum: 0 })),
    priority: Type.Optional(TaskPrioritySchema),
    search: Type.Optional(Type.String({ maxLength: 100 })),
    sort: Type.Optional(
      Type.Union(
        [
          Type.Literal('manual'),
          Type.Literal('name'),
          Type.Literal('priority'),
          Type.Literal('progress'),
          Type.Literal('dueDate'),
          Type.Literal('updated'),
        ],
        { default: 'manual' },
      ),
    ),
    status: Type.Optional(TaskStatusSchema),
    tagId: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
)

export const TaskListSchema = Type.Object(
  {
    items: Type.Array(TaskSchema),
    limit: Type.Integer({ minimum: 1 }),
    offset: Type.Integer({ minimum: 0 }),
    total: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const ProgressEventSchema = Type.Object(
  {
    id: Type.Integer({ minimum: 1 }),
    newProgress: Type.Integer({ maximum: 100, minimum: 0 }),
    note: Type.Union([Type.String(), Type.Null()]),
    occurredAt: TimestampSchema,
    previousProgress: Type.Integer({ maximum: 100, minimum: 0 }),
    taskId: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
)

export const ProgressEventListQuerySchema = Type.Object(
  {
    limit: Type.Optional(
      Type.Integer({ default: 50, maximum: 200, minimum: 1 }),
    ),
    offset: Type.Optional(Type.Integer({ default: 0, minimum: 0 })),
  },
  { additionalProperties: false },
)

export const ProgressEventListSchema = Type.Object(
  {
    items: Type.Array(ProgressEventSchema),
    limit: Type.Integer({ minimum: 1 }),
    offset: Type.Integer({ minimum: 0 }),
    total: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const TaskDateRangeSchema = Type.Object({
  dueDate: Type.Optional(Type.Union([DateOnlySchema, Type.Null()])),
  startDate: Type.Optional(Type.Union([DateOnlySchema, Type.Null()])),
})

export type TaskResponse = Static<typeof TaskSchema>
export type TagResponse = Static<typeof TagSchema>
export type CreateTask = Static<typeof CreateTaskSchema>
export type UpdateTask = Static<typeof UpdateTaskSchema>
export type TaskListQuery = Static<typeof TaskListQuerySchema>
export type TaskListResponse = Static<typeof TaskListSchema>
export type ProgressEventResponse = Static<typeof ProgressEventSchema>
export type ProgressEventListQuery = Static<typeof ProgressEventListQuerySchema>
export type ProgressEventListResponse = Static<typeof ProgressEventListSchema>
