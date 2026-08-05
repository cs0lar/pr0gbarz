import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  ne,
  sql,
  type SQL,
} from 'drizzle-orm'

import type { Pr0gbarzDatabase } from './connection.js'
import {
  progressEvents,
  projects,
  tags,
  taskTags,
  tasks,
  type NewProject,
  type NewTag,
  type NewTask,
  type ProgressEvent,
  type Project,
  type Tag,
  type Task,
} from './schema.js'

export interface ProjectWithStats extends Project {
  completion: number | null
  taskCount: number
}

export interface TaskWithTags extends Task {
  tags: Tag[]
}

export interface ProjectListOptions {
  archived: boolean
  direction: 'asc' | 'desc'
  limit: number
  offset: number
  search?: string | undefined
  sort: 'manual' | 'name' | 'updated'
}

export interface TaskListOptions {
  archived: boolean
  direction: 'asc' | 'desc'
  limit: number
  offset: number
  priority?: Task['priority'] | undefined
  projectId: number
  search?: string | undefined
  sort: 'manual' | 'name' | 'priority' | 'progress' | 'dueDate' | 'updated'
  status?: Task['status'] | undefined
  tagId?: number | undefined
}

export interface TagListOptions {
  limit: number
  search?: string | undefined
}

export interface Page<T> {
  items: T[]
  total: number
}

export interface ProjectUpdateValues {
  accentColor?: string | null | undefined
  archivedAt?: Date | null | undefined
  description?: string | null | undefined
  name?: string | undefined
  sortPosition?: number | undefined
  startDate?: string | null | undefined
  targetDate?: string | null | undefined
  updatedAt: Date
}

export interface TaskUpdateValues {
  archivedAt?: Date | null | undefined
  completedAt?: Date | null | undefined
  description?: string | null | undefined
  dueDate?: string | null | undefined
  name?: string | undefined
  priority?: Task['priority'] | undefined
  progress?: number | undefined
  sortPosition?: number | undefined
  startDate?: string | null | undefined
  status?: Task['status'] | undefined
  updatedAt: Date
}

export interface ProgressChange {
  newProgress: number
  note: string | null
  occurredAt: Date
  previousProgress: number
}

export interface DashboardStats {
  activeProjects: number
  averageProgress: number | null
  blockedTasks: number
  completedTasks: number
  overdueTasks: number
  recentProgress: DashboardProgress[]
  totalTasks: number
}

export interface DashboardProgress extends ProgressEvent {
  projectId: number
  projectName: string
  taskName: string
}

export interface WorkspaceRepository {
  addTagToTask(taskId: number, tagId: number): boolean
  archiveProject(id: number, archivedAt: Date | null): Project | undefined
  archiveTask(id: number, archivedAt: Date | null): Task | undefined
  createProject(input: NewProject): Project
  createTag(input: NewTag): Tag
  createTask(input: NewTask, initialProgress?: ProgressChange): Task
  dashboard(today: string): DashboardStats
  findProject(id: number): ProjectWithStats | undefined
  findTag(id: number): Tag | undefined
  findTagByNormalizedName(normalizedName: string): Tag | undefined
  findTask(id: number): TaskWithTags | undefined
  listProgressEvents(
    taskId: number,
    limit: number,
    offset: number,
  ): Page<ProgressEvent>
  listProjects(options: ProjectListOptions): Page<ProjectWithStats>
  listTags(options: TagListOptions): Tag[]
  listTasks(options: TaskListOptions): Page<TaskWithTags>
  removeTagFromTask(taskId: number, tagId: number): boolean
  updateProject(id: number, values: ProjectUpdateValues): Project | undefined
  updateTask(
    id: number,
    values: TaskUpdateValues,
    progressChange?: ProgressChange,
  ): Task | undefined
}

function toNumber(value: number | string | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value)
}

function projectStats(
  db: Pr0gbarzDatabase,
  projectIds: number[],
): Map<number, { completion: number | null; taskCount: number }> {
  if (projectIds.length === 0) {
    return new Map()
  }

  const rows = db
    .select({
      completion: avg(tasks.progress),
      projectId: tasks.projectId,
      taskCount: count(tasks.id),
    })
    .from(tasks)
    .where(and(inArray(tasks.projectId, projectIds), isNull(tasks.archivedAt)))
    .groupBy(tasks.projectId)
    .all()

  return new Map(
    rows.map((row) => [
      row.projectId,
      {
        completion:
          row.completion === null
            ? null
            : Number(Number(row.completion).toFixed(2)),
        taskCount: toNumber(row.taskCount),
      },
    ]),
  )
}

function withProjectStats(
  db: Pr0gbarzDatabase,
  rows: Project[],
): ProjectWithStats[] {
  const stats = projectStats(
    db,
    rows.map((project) => project.id),
  )

  return rows.map((project) => ({
    ...project,
    completion: stats.get(project.id)?.completion ?? null,
    taskCount: stats.get(project.id)?.taskCount ?? 0,
  }))
}

function tagsByTaskId(
  db: Pr0gbarzDatabase,
  taskIds: number[],
): Map<number, Tag[]> {
  if (taskIds.length === 0) {
    return new Map()
  }

  const rows = db
    .select({ tag: tags, taskId: taskTags.taskId })
    .from(taskTags)
    .innerJoin(tags, eq(tags.id, taskTags.tagId))
    .where(inArray(taskTags.taskId, taskIds))
    .orderBy(asc(tags.label))
    .all()
  const result = new Map<number, Tag[]>()

  for (const row of rows) {
    const taskTagList = result.get(row.taskId) ?? []
    taskTagList.push(row.tag)
    result.set(row.taskId, taskTagList)
  }

  return result
}

function withTags(db: Pr0gbarzDatabase, rows: Task[]): TaskWithTags[] {
  const assignedTags = tagsByTaskId(
    db,
    rows.map((task) => task.id),
  )

  return rows.map((task) => ({
    ...task,
    tags: assignedTags.get(task.id) ?? [],
  }))
}

function projectConditions(options: ProjectListOptions): SQL[] {
  const conditions: SQL[] = [
    options.archived
      ? isNotNull(projects.archivedAt)
      : isNull(projects.archivedAt),
  ]

  if (options.search) {
    conditions.push(like(projects.name, `%${options.search}%`))
  }

  return conditions
}

function projectOrder(options: ProjectListOptions) {
  const column =
    options.sort === 'name'
      ? projects.name
      : options.sort === 'updated'
        ? projects.updatedAt
        : projects.sortPosition
  return options.direction === 'desc' ? desc(column) : asc(column)
}

function taskOrder(options: TaskListOptions) {
  const column =
    options.sort === 'name'
      ? tasks.name
      : options.sort === 'priority'
        ? sql<number>`CASE ${tasks.priority}
            WHEN 'urgent' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
            ELSE 0
          END`
        : options.sort === 'progress'
          ? tasks.progress
          : options.sort === 'dueDate'
            ? tasks.dueDate
            : options.sort === 'updated'
              ? tasks.updatedAt
              : tasks.sortPosition
  return options.direction === 'desc' ? desc(column) : asc(column)
}

function taskConditions(
  options: TaskListOptions,
  tagTaskIds?: number[],
): SQL[] {
  const conditions: SQL[] = [
    eq(tasks.projectId, options.projectId),
    options.archived ? isNotNull(tasks.archivedAt) : isNull(tasks.archivedAt),
  ]

  if (options.search) {
    conditions.push(like(tasks.name, `%${options.search}%`))
  }
  if (options.status) {
    conditions.push(eq(tasks.status, options.status))
  }
  if (options.priority) {
    conditions.push(eq(tasks.priority, options.priority))
  }
  if (tagTaskIds) {
    conditions.push(inArray(tasks.id, tagTaskIds))
  }

  return conditions
}

export function createWorkspaceRepository(
  db: Pr0gbarzDatabase,
): WorkspaceRepository {
  return {
    addTagToTask: (taskId, tagId) => {
      const result = db
        .insert(taskTags)
        .values({ tagId, taskId })
        .onConflictDoNothing()
        .run()
      return result.changes > 0
    },
    archiveProject: (id, archivedAt) =>
      db
        .update(projects)
        .set({ archivedAt, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning()
        .get(),
    archiveTask: (id, archivedAt) =>
      db
        .update(tasks)
        .set({ archivedAt, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning()
        .get(),
    createProject: (input) =>
      db.insert(projects).values(input).returning().get(),
    createTag: (input) => db.insert(tags).values(input).returning().get(),
    createTask: (input, initialProgress) =>
      db.transaction((transaction) => {
        const task = transaction.insert(tasks).values(input).returning().get()

        if (initialProgress) {
          transaction
            .insert(progressEvents)
            .values({ taskId: task.id, ...initialProgress })
            .run()
        }

        return task
      }),
    dashboard: (today) => {
      const activeProjects = db
        .select({ value: count(projects.id) })
        .from(projects)
        .where(isNull(projects.archivedAt))
        .get()?.value
      const taskStats = db
        .select({
          averageProgress: avg(tasks.progress),
          totalTasks: count(tasks.id),
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(and(isNull(tasks.archivedAt), isNull(projects.archivedAt)))
        .get()
      const completedTasks = db
        .select({ value: count(tasks.id) })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(
          and(
            isNull(tasks.archivedAt),
            isNull(projects.archivedAt),
            eq(tasks.status, 'completed'),
          ),
        )
        .get()?.value
      const blockedTasks = db
        .select({ value: count(tasks.id) })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(
          and(
            isNull(tasks.archivedAt),
            isNull(projects.archivedAt),
            eq(tasks.status, 'blocked'),
          ),
        )
        .get()?.value
      const overdueTasks = db
        .select({ value: count(tasks.id) })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(
          and(
            isNull(tasks.archivedAt),
            isNull(projects.archivedAt),
            isNotNull(tasks.dueDate),
            lt(tasks.dueDate, today),
            ne(tasks.status, 'completed'),
          ),
        )
        .get()?.value
      const recentProgress = db
        .select({
          id: progressEvents.id,
          newProgress: progressEvents.newProgress,
          note: progressEvents.note,
          occurredAt: progressEvents.occurredAt,
          previousProgress: progressEvents.previousProgress,
          projectId: projects.id,
          projectName: projects.name,
          taskId: tasks.id,
          taskName: tasks.name,
        })
        .from(progressEvents)
        .innerJoin(tasks, eq(tasks.id, progressEvents.taskId))
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(and(isNull(tasks.archivedAt), isNull(projects.archivedAt)))
        .orderBy(desc(progressEvents.occurredAt), desc(progressEvents.id))
        .limit(5)
        .all()

      return {
        activeProjects: toNumber(activeProjects),
        averageProgress:
          taskStats?.averageProgress === null ||
          taskStats?.averageProgress === undefined
            ? null
            : Number(Number(taskStats.averageProgress).toFixed(2)),
        blockedTasks: toNumber(blockedTasks),
        completedTasks: toNumber(completedTasks),
        overdueTasks: toNumber(overdueTasks),
        recentProgress,
        totalTasks: toNumber(taskStats?.totalTasks),
      }
    },
    findProject: (id) => {
      const project = db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .get()
      return project ? withProjectStats(db, [project])[0] : undefined
    },
    findTag: (id) => db.select().from(tags).where(eq(tags.id, id)).get(),
    findTagByNormalizedName: (normalizedName) =>
      db
        .select()
        .from(tags)
        .where(eq(tags.normalizedName, normalizedName))
        .get(),
    findTask: (id) => {
      const task = db.select().from(tasks).where(eq(tasks.id, id)).get()
      return task ? withTags(db, [task])[0] : undefined
    },
    listProgressEvents: (taskId, limit, offset) => {
      const conditions = eq(progressEvents.taskId, taskId)
      return {
        items: db
          .select()
          .from(progressEvents)
          .where(conditions)
          .orderBy(desc(progressEvents.occurredAt), desc(progressEvents.id))
          .limit(limit)
          .offset(offset)
          .all(),
        total: toNumber(
          db
            .select({ value: count(progressEvents.id) })
            .from(progressEvents)
            .where(conditions)
            .get()?.value,
        ),
      }
    },
    listProjects: (options) => {
      const conditions = and(...projectConditions(options))
      const rows = db
        .select()
        .from(projects)
        .where(conditions)
        .orderBy(projectOrder(options), asc(projects.id))
        .limit(options.limit)
        .offset(options.offset)
        .all()
      return {
        items: withProjectStats(db, rows),
        total: toNumber(
          db
            .select({ value: count(projects.id) })
            .from(projects)
            .where(conditions)
            .get()?.value,
        ),
      }
    },
    listTags: (options) =>
      db
        .select()
        .from(tags)
        .where(
          options.search ? like(tags.label, `%${options.search}%`) : undefined,
        )
        .orderBy(asc(tags.label))
        .limit(options.limit)
        .all(),
    listTasks: (options) => {
      const tagTaskIds = options.tagId
        ? db
            .select({ taskId: taskTags.taskId })
            .from(taskTags)
            .where(eq(taskTags.tagId, options.tagId))
            .all()
            .map((row) => row.taskId)
        : undefined

      if (tagTaskIds?.length === 0) {
        return { items: [], total: 0 }
      }

      const conditions = and(...taskConditions(options, tagTaskIds))
      const rows = db
        .select()
        .from(tasks)
        .where(conditions)
        .orderBy(taskOrder(options), asc(tasks.id))
        .limit(options.limit)
        .offset(options.offset)
        .all()
      return {
        items: withTags(db, rows),
        total: toNumber(
          db
            .select({ value: count(tasks.id) })
            .from(tasks)
            .where(conditions)
            .get()?.value,
        ),
      }
    },
    removeTagFromTask: (taskId, tagId) =>
      db
        .delete(taskTags)
        .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)))
        .run().changes > 0,
    updateProject: (id, values) =>
      db
        .update(projects)
        .set(values)
        .where(eq(projects.id, id))
        .returning()
        .get(),
    updateTask: (id, values, progressChange) =>
      db.transaction((transaction) => {
        const updated = transaction
          .update(tasks)
          .set(values)
          .where(eq(tasks.id, id))
          .returning()
          .get()

        if (progressChange) {
          transaction
            .insert(progressEvents)
            .values({ taskId: id, ...progressChange })
            .run()
        }

        return updated
      }),
  }
}

// Retained for small consumers that need only basic record operations.
export interface ProjectRepository {
  create(input: NewProject): Project
  findById(id: number): Project | undefined
}

export interface TaskRepository {
  create(input: NewTask): Task
  findById(id: number): Task | undefined
}

export interface TagRepository {
  create(input: NewTag): Tag
  findByNormalizedName(normalizedName: string): Tag | undefined
}

export interface Repositories {
  projects: ProjectRepository
  tags: TagRepository
  tasks: TaskRepository
}

export function createRepositories(db: Pr0gbarzDatabase): Repositories {
  const workspace = createWorkspaceRepository(db)
  return {
    projects: {
      create: (input) => workspace.createProject(input),
      findById: (id) =>
        db.select().from(projects).where(eq(projects.id, id)).get(),
    },
    tags: {
      create: (input) => workspace.createTag(input),
      findByNormalizedName: (normalizedName) =>
        workspace.findTagByNormalizedName(normalizedName),
    },
    tasks: {
      create: (input) => workspace.createTask(input),
      findById: (id) => db.select().from(tasks).where(eq(tasks.id, id)).get(),
    },
  }
}
