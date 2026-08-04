import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const productIdentifier = 'pr0gbarz'
export const databaseMajorVersion = 2

const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' })

export const appMetadata = sqliteTable(
  'app_metadata',
  {
    id: integer('id').primaryKey(),
    product: text('product').notNull(),
    majorVersion: integer('major_version').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [
    check('app_metadata_singleton_check', sql`${table.id} = 1`),
    check('app_metadata_product_check', sql`${table.product} = 'pr0gbarz'`),
    check('app_metadata_major_version_check', sql`${table.majorVersion} = 2`),
  ],
)

export const projects = sqliteTable(
  'projects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    accentColor: text('accent_color'),
    startDate: text('start_date'),
    targetDate: text('target_date'),
    sortPosition: integer('sort_position').notNull().default(0),
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [
    check('projects_name_check', sql`length(trim(${table.name})) > 0`),
    check(
      'projects_start_date_format_check',
      sql`${table.startDate} IS NULL OR (length(${table.startDate}) = 10 AND ${table.startDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`,
    ),
    check(
      'projects_target_date_format_check',
      sql`${table.targetDate} IS NULL OR (length(${table.targetDate}) = 10 AND ${table.targetDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`,
    ),
    check(
      'projects_date_order_check',
      sql`${table.startDate} IS NULL OR ${table.targetDate} IS NULL OR ${table.startDate} <= ${table.targetDate}`,
    ),
    index('projects_active_sort_idx').on(table.archivedAt, table.sortPosition),
  ],
)

export const taskStatuses = [
  'backlog',
  'planned',
  'in_progress',
  'blocked',
  'completed',
] as const

export const taskPriorities = [
  'none',
  'low',
  'medium',
  'high',
  'urgent',
] as const

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status', { enum: taskStatuses }).notNull().default('backlog'),
    priority: text('priority', { enum: taskPriorities })
      .notNull()
      .default('none'),
    progress: integer('progress').notNull().default(0),
    startDate: text('start_date'),
    dueDate: text('due_date'),
    sortPosition: integer('sort_position').notNull().default(0),
    archivedAt: timestamp('archived_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [
    check('tasks_name_check', sql`length(trim(${table.name})) > 0`),
    check(
      'tasks_status_check',
      sql`${table.status} IN ('backlog', 'planned', 'in_progress', 'blocked', 'completed')`,
    ),
    check(
      'tasks_priority_check',
      sql`${table.priority} IN ('none', 'low', 'medium', 'high', 'urgent')`,
    ),
    check('tasks_progress_check', sql`${table.progress} BETWEEN 0 AND 100`),
    check(
      'tasks_start_date_format_check',
      sql`${table.startDate} IS NULL OR (length(${table.startDate}) = 10 AND ${table.startDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`,
    ),
    check(
      'tasks_due_date_format_check',
      sql`${table.dueDate} IS NULL OR (length(${table.dueDate}) = 10 AND ${table.dueDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`,
    ),
    check(
      'tasks_completion_check',
      sql`(${table.status} = 'completed' AND ${table.progress} = 100 AND ${table.completedAt} IS NOT NULL) OR (${table.status} <> 'completed' AND ${table.completedAt} IS NULL)`,
    ),
    check(
      'tasks_date_order_check',
      sql`${table.startDate} IS NULL OR ${table.dueDate} IS NULL OR ${table.startDate} <= ${table.dueDate}`,
    ),
    index('tasks_project_active_sort_idx').on(
      table.projectId,
      table.archivedAt,
      table.sortPosition,
    ),
    index('tasks_project_status_idx').on(table.projectId, table.status),
    index('tasks_due_date_idx').on(table.dueDate),
  ],
)

export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    normalizedName: text('normalized_name').notNull(),
    label: text('label').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [
    check(
      'tags_normalized_name_check',
      sql`length(trim(${table.normalizedName})) > 0`,
    ),
    check('tags_label_check', sql`length(trim(${table.label})) > 0`),
    uniqueIndex('tags_normalized_name_unique').on(table.normalizedName),
  ],
)

export const taskTags = sqliteTable(
  'task_tags',
  {
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.tagId] }),
    index('task_tags_tag_idx').on(table.tagId),
  ],
)

export const progressEvents = sqliteTable(
  'progress_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    previousProgress: integer('previous_progress').notNull(),
    newProgress: integer('new_progress').notNull(),
    note: text('note'),
    occurredAt: timestamp('occurred_at')
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [
    check(
      'progress_events_previous_progress_check',
      sql`${table.previousProgress} BETWEEN 0 AND 100`,
    ),
    check(
      'progress_events_new_progress_check',
      sql`${table.newProgress} BETWEEN 0 AND 100`,
    ),
    index('progress_events_task_occurred_idx').on(
      table.taskId,
      table.occurredAt,
    ),
  ],
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type ProgressEvent = typeof progressEvents.$inferSelect
