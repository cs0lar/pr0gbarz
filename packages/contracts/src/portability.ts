import { Type, type Static } from 'typebox'

import { DateOnlySchema, TimestampSchema } from './common.js'
import { TaskPrioritySchema, TaskStatusSchema } from './tasks.js'

const IdSchema = Type.Integer({ minimum: 1 })
const NullableDateSchema = Type.Union([Type.Null(), DateOnlySchema])
const NullableTimestampImportSchema = Type.Union([Type.Null(), TimestampSchema])
const NullableTextImportSchema = (maximum: number) =>
  Type.Union([Type.Null(), Type.String({ maxLength: maximum })])
const NullableColorSchema = Type.Union([
  Type.Null(),
  Type.String({ pattern: '^#[0-9a-fA-F]{6}$' }),
])

export const ExportProjectSchema = Type.Object(
  {
    accentColor: NullableColorSchema,
    archivedAt: NullableTimestampImportSchema,
    createdAt: TimestampSchema,
    description: NullableTextImportSchema(10_000),
    id: IdSchema,
    name: Type.String({ maxLength: 200, minLength: 1 }),
    sortPosition: Type.Integer({ minimum: 0 }),
    startDate: NullableDateSchema,
    targetDate: NullableDateSchema,
    updatedAt: TimestampSchema,
  },
  { additionalProperties: false },
)

export const ExportTaskSchema = Type.Object(
  {
    archivedAt: NullableTimestampImportSchema,
    completedAt: NullableTimestampImportSchema,
    createdAt: TimestampSchema,
    description: NullableTextImportSchema(20_000),
    dueDate: NullableDateSchema,
    id: IdSchema,
    name: Type.String({ maxLength: 300, minLength: 1 }),
    priority: TaskPrioritySchema,
    progress: Type.Integer({ maximum: 100, minimum: 0 }),
    projectId: IdSchema,
    sortPosition: Type.Integer({ minimum: 0 }),
    startDate: NullableDateSchema,
    status: TaskStatusSchema,
    updatedAt: TimestampSchema,
  },
  { additionalProperties: false },
)

export const ExportTagSchema = Type.Object(
  {
    color: NullableColorSchema,
    createdAt: TimestampSchema,
    id: IdSchema,
    label: Type.String({ maxLength: 100, minLength: 1 }),
    normalizedName: Type.String({ maxLength: 100, minLength: 1 }),
  },
  { additionalProperties: false },
)

export const ExportTaskTagSchema = Type.Object(
  { tagId: IdSchema, taskId: IdSchema },
  { additionalProperties: false },
)

export const ExportProgressEventSchema = Type.Object(
  {
    id: IdSchema,
    newProgress: Type.Integer({ maximum: 100, minimum: 0 }),
    note: NullableTextImportSchema(2_000),
    occurredAt: TimestampSchema,
    previousProgress: Type.Integer({ maximum: 100, minimum: 0 }),
    taskId: IdSchema,
  },
  { additionalProperties: false },
)

export const BackupDataSchema = Type.Object(
  {
    progressEvents: Type.Array(ExportProgressEventSchema),
    projects: Type.Array(ExportProjectSchema),
    tags: Type.Array(ExportTagSchema),
    taskTags: Type.Array(ExportTaskTagSchema),
    tasks: Type.Array(ExportTaskSchema),
  },
  { additionalProperties: false },
)

export const BackupCountsSchema = Type.Object(
  {
    progressEvents: Type.Integer({ minimum: 0 }),
    projects: Type.Integer({ minimum: 0 }),
    tags: Type.Integer({ minimum: 0 }),
    taskTags: Type.Integer({ minimum: 0 }),
    tasks: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const JsonBackupSchema = Type.Object(
  {
    data: BackupDataSchema,
    exportedAt: TimestampSchema,
    format: Type.Literal('pr0gbarz-json-backup'),
    integrity: Type.Object(
      {
        algorithm: Type.Literal('sha256'),
        counts: BackupCountsSchema,
        dataHash: Type.String({ pattern: '^[a-f0-9]{64}$' }),
        collectionHashes: Type.Object(
          {
            progressEvents: Type.String({ pattern: '^[a-f0-9]{64}$' }),
            projects: Type.String({ pattern: '^[a-f0-9]{64}$' }),
            tags: Type.String({ pattern: '^[a-f0-9]{64}$' }),
            taskTags: Type.String({ pattern: '^[a-f0-9]{64}$' }),
            tasks: Type.String({ pattern: '^[a-f0-9]{64}$' }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
    product: Type.Literal('pr0gbarz'),
    version: Type.Literal(1),
  },
  { additionalProperties: false },
)

export const ImportRequestSchema = Type.Object(
  {
    backup: JsonBackupSchema,
    conflictPolicy: Type.Union([
      Type.Literal('reject'),
      Type.Literal('replace'),
    ]),
    mode: Type.Union([Type.Literal('dry_run'), Type.Literal('apply')]),
  },
  { additionalProperties: false },
)

export const ImportResultSchema = Type.Object(
  {
    applied: Type.Boolean(),
    counts: BackupCountsSchema,
    message: Type.String(),
    valid: Type.Literal(true),
  },
  { additionalProperties: false },
)

export const CsvExportQuerySchema = Type.Object(
  { projectId: Type.Optional(IdSchema) },
  { additionalProperties: false },
)

export type BackupData = Static<typeof BackupDataSchema>
export type BackupCounts = Static<typeof BackupCountsSchema>
export type JsonBackup = Static<typeof JsonBackupSchema>
export type ImportRequest = Static<typeof ImportRequestSchema>
export type ImportResult = Static<typeof ImportResultSchema>
export type CsvExportQuery = Static<typeof CsvExportQuerySchema>
