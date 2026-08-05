import type {
  CreateProject,
  CreateTag,
  CreateTask,
  DashboardResponse,
  ProgressEventListQuery,
  ProgressEventListResponse,
  ProjectListQuery,
  ProjectListResponse,
  ProjectResponse,
  TagListQuery,
  TagListResponse,
  TagResponse,
  TaskListQuery,
  TaskListResponse,
  TaskResponse,
  UpdateProject,
  UpdateTask,
} from '@pr0gbarz/contracts'
import type {
  ProgressEvent,
  ProjectWithStats,
  Tag,
  TaskWithTags,
  WorkspaceRepository,
} from '@pr0gbarz/database'

import { conflict, invalidState, notFound } from '../errors.js'

export interface WorkspaceServiceOptions {
  now?: (() => Date) | undefined
}

function timestamp(value: Date | null): string | null {
  return value?.toISOString() ?? null
}

function tagResponse(tag: Tag): TagResponse {
  return {
    color: tag.color,
    id: tag.id,
    label: tag.label,
    normalizedName: tag.normalizedName,
  }
}

type ScheduleHealth = ProjectResponse['scheduleHealth']

function scheduleHealth(
  project: ProjectWithStats,
  today: string,
): ScheduleHealth {
  if (project.completion === 100) return 'complete'
  if (
    project.completion === null ||
    !project.startDate ||
    !project.targetDate
  ) {
    return 'insufficient_data'
  }
  if (today < project.startDate) return 'not_started'
  if (today > project.targetDate) return 'overdue'

  const start = Date.parse(`${project.startDate}T00:00:00Z`)
  const target = Date.parse(`${project.targetDate}T00:00:00Z`)
  const current = Date.parse(`${today}T00:00:00Z`)
  if (target <= start) return project.completion > 0 ? 'on_track' : 'at_risk'

  const expected = ((current - start) / (target - start)) * 100
  return project.completion + 10 < expected ? 'at_risk' : 'on_track'
}

function projectResponse(
  project: ProjectWithStats,
  today: string,
): ProjectResponse {
  return {
    accentColor: project.accentColor,
    archivedAt: timestamp(project.archivedAt),
    completion: project.completion,
    createdAt: project.createdAt.toISOString(),
    description: project.description,
    id: project.id,
    name: project.name,
    scheduleHealth: scheduleHealth(project, today),
    sortPosition: project.sortPosition,
    startDate: project.startDate,
    targetDate: project.targetDate,
    taskCount: project.taskCount,
    updatedAt: project.updatedAt.toISOString(),
  }
}

function taskResponse(task: TaskWithTags): TaskResponse {
  return {
    archivedAt: timestamp(task.archivedAt),
    completedAt: timestamp(task.completedAt),
    createdAt: task.createdAt.toISOString(),
    description: task.description,
    dueDate: task.dueDate,
    id: task.id,
    name: task.name,
    priority: task.priority,
    progress: task.progress,
    projectId: task.projectId,
    sortPosition: task.sortPosition,
    startDate: task.startDate,
    status: task.status,
    tags: task.tags.map(tagResponse),
    updatedAt: task.updatedAt.toISOString(),
  }
}

function progressEventResponse(event: ProgressEvent) {
  return {
    id: event.id,
    newProgress: event.newProgress,
    note: event.note,
    occurredAt: event.occurredAt.toISOString(),
    previousProgress: event.previousProgress,
    taskId: event.taskId,
  }
}

function normalizeName(value: string): string {
  return value.trim()
}

function normalizedTagName(label: string): string {
  return label.trim().toLocaleLowerCase('en').replace(/\s+/g, '-')
}

function assertDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  endLabel: string,
): void {
  if (startDate && endDate && startDate > endDate) {
    throw invalidState(`${endLabel} cannot be before the start date.`)
  }
}

export class WorkspaceService {
  readonly #now: () => Date
  readonly #repository: WorkspaceRepository

  constructor(
    repository: WorkspaceRepository,
    options: WorkspaceServiceOptions = {},
  ) {
    this.#repository = repository
    this.#now = options.now ?? (() => new Date())
  }

  addTagToTask(taskId: number, tagId: number): TaskResponse {
    this.requireTask(taskId)
    this.requireTag(tagId)
    this.#repository.addTagToTask(taskId, tagId)
    return taskResponse(this.requireTask(taskId))
  }

  archiveProject(id: number): void {
    if (!this.#repository.archiveProject(id, this.#now())) {
      throw notFound('Project')
    }
  }

  archiveTask(id: number): void {
    if (!this.#repository.archiveTask(id, this.#now())) {
      throw notFound('Task')
    }
  }

  createProject(input: CreateProject): ProjectResponse {
    assertDateRange(input.startDate, input.targetDate, 'Target date')
    const lastProject = this.#repository.listProjects({
      archived: false,
      direction: 'desc',
      limit: 1,
      offset: 0,
      sort: 'manual',
    }).items[0]
    const project = this.#repository.createProject({
      accentColor: input.accentColor,
      description: input.description,
      name: normalizeName(input.name),
      sortPosition: input.sortPosition ?? (lastProject?.sortPosition ?? -1) + 1,
      startDate: input.startDate,
      targetDate: input.targetDate,
    })
    return projectResponse(this.requireProject(project.id), this.today())
  }

  createTag(input: CreateTag): TagResponse {
    const label = normalizeName(input.label)
    const normalizedName = normalizedTagName(label)

    if (this.#repository.findTagByNormalizedName(normalizedName)) {
      throw conflict(`A tag named "${label}" already exists.`)
    }

    return tagResponse(
      this.#repository.createTag({
        color: input.color,
        label,
        normalizedName,
      }),
    )
  }

  createTask(projectId: number, input: CreateTask): TaskResponse {
    this.requireProject(projectId)
    assertDateRange(input.startDate, input.dueDate, 'Due date')
    const now = this.#now()
    const status = input.status ?? 'backlog'
    const progress = status === 'completed' ? 100 : (input.progress ?? 0)
    const lastTask = this.#repository.listTasks({
      archived: false,
      direction: 'desc',
      limit: 1,
      offset: 0,
      projectId,
      sort: 'manual',
    }).items[0]
    const task = this.#repository.createTask(
      {
        completedAt: status === 'completed' ? now : null,
        createdAt: now,
        description: input.description,
        dueDate: input.dueDate,
        name: normalizeName(input.name),
        priority: input.priority,
        progress,
        projectId,
        sortPosition:
          input.sortPosition ?? (lastTask ? lastTask.sortPosition + 1 : 0),
        startDate: input.startDate,
        status,
        updatedAt: now,
      },
      progress === 0
        ? undefined
        : {
            newProgress: progress,
            note: null,
            occurredAt: now,
            previousProgress: 0,
          },
    )
    return taskResponse(this.requireTask(task.id))
  }

  dashboard(): DashboardResponse {
    const stats = this.#repository.dashboard(this.today())
    return {
      ...stats,
      recentProgress: stats.recentProgress.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      })),
    }
  }

  getProject(id: number): ProjectResponse {
    return projectResponse(this.requireProject(id), this.today())
  }

  getTask(id: number): TaskResponse {
    return taskResponse(this.requireTask(id))
  }

  listProgressEvents(
    taskId: number,
    query: ProgressEventListQuery,
  ): ProgressEventListResponse {
    this.requireTask(taskId)
    const limit = query.limit ?? 50
    const offset = query.offset ?? 0
    const page = this.#repository.listProgressEvents(taskId, limit, offset)
    return {
      items: page.items.map(progressEventResponse),
      limit,
      offset,
      total: page.total,
    }
  }

  listProjects(query: ProjectListQuery): ProjectListResponse {
    const limit = query.limit ?? 50
    const offset = query.offset ?? 0
    const page = this.#repository.listProjects({
      archived: query.archived ?? false,
      direction: query.direction ?? 'asc',
      limit,
      offset,
      search: query.search?.trim(),
      sort: query.sort ?? 'manual',
    })
    return {
      items: page.items.map((project) =>
        projectResponse(project, this.today()),
      ),
      limit,
      offset,
      total: page.total,
    }
  }

  listTags(query: TagListQuery): TagListResponse {
    return {
      items: this.#repository
        .listTags({
          limit: query.limit ?? 100,
          search: query.search?.trim(),
        })
        .map(tagResponse),
    }
  }

  listTasks(projectId: number, query: TaskListQuery): TaskListResponse {
    this.requireProject(projectId)
    const limit = query.limit ?? 100
    const offset = query.offset ?? 0
    const page = this.#repository.listTasks({
      archived: query.archived ?? false,
      direction: query.direction ?? 'asc',
      limit,
      offset,
      priority: query.priority,
      projectId,
      search: query.search?.trim(),
      sort: query.sort ?? 'manual',
      status: query.status,
      tagId: query.tagId,
    })
    return {
      items: page.items.map(taskResponse),
      limit,
      offset,
      total: page.total,
    }
  }

  removeTagFromTask(taskId: number, tagId: number): void {
    this.requireTask(taskId)
    this.requireTag(tagId)

    if (!this.#repository.removeTagFromTask(taskId, tagId)) {
      throw notFound('Task tag assignment')
    }
  }

  updateProject(id: number, input: UpdateProject): ProjectResponse {
    const current = this.requireProject(id)
    const startDate = input.startDate ?? current.startDate
    const targetDate = input.targetDate ?? current.targetDate
    assertDateRange(startDate, targetDate, 'Target date')
    const updated = this.#repository.updateProject(id, {
      accentColor: input.accentColor,
      archivedAt:
        input.archived === undefined
          ? undefined
          : input.archived
            ? this.#now()
            : null,
      description: input.description,
      name: input.name === undefined ? undefined : normalizeName(input.name),
      sortPosition: input.sortPosition,
      startDate: input.startDate,
      targetDate: input.targetDate,
      updatedAt: this.#now(),
    })

    if (!updated) {
      throw notFound('Project')
    }

    return projectResponse(this.requireProject(id), this.today())
  }

  updateTask(id: number, input: UpdateTask): TaskResponse {
    const current = this.requireTask(id)
    const startDate = input.startDate ?? current.startDate
    const dueDate = input.dueDate ?? current.dueDate
    assertDateRange(startDate, dueDate, 'Due date')

    if (input.note !== undefined && input.progress === undefined) {
      throw invalidState('A progress note requires a progress change.')
    }

    const status = input.status ?? current.status
    let progress = input.progress ?? current.progress
    let completedAt = current.completedAt

    if (status === 'completed') {
      progress = 100
      completedAt ??= this.#now()
    } else {
      completedAt = null
    }

    if (
      current.status === 'completed' &&
      input.status === undefined &&
      input.progress !== undefined &&
      input.progress < 100
    ) {
      throw invalidState(
        'Change the task status when reducing progress on a completed task.',
      )
    }

    const now = this.#now()
    const progressNote = input.note?.trim()
    const progressChange =
      progress === current.progress
        ? undefined
        : {
            newProgress: progress,
            note:
              progressNote === undefined || progressNote === ''
                ? null
                : progressNote,
            occurredAt: now,
            previousProgress: current.progress,
          }
    const updated = this.#repository.updateTask(
      id,
      {
        archivedAt:
          input.archived === undefined
            ? undefined
            : input.archived
              ? now
              : null,
        completedAt,
        description: input.description,
        dueDate: input.dueDate,
        name: input.name === undefined ? undefined : normalizeName(input.name),
        priority: input.priority,
        progress,
        sortPosition: input.sortPosition,
        startDate: input.startDate,
        status,
        updatedAt: now,
      },
      progressChange,
    )

    if (!updated) {
      throw notFound('Task')
    }

    return taskResponse(this.requireTask(id))
  }

  private requireProject(id: number): ProjectWithStats {
    const project = this.#repository.findProject(id)
    if (!project) {
      throw notFound('Project')
    }
    return project
  }

  private today(): string {
    return this.#now().toISOString().slice(0, 10)
  }

  private requireTag(id: number): Tag {
    const tag = this.#repository.findTag(id)
    if (!tag) {
      throw notFound('Tag')
    }
    return tag
  }

  private requireTask(id: number): TaskWithTags {
    const task = this.#repository.findTask(id)
    if (!task) {
      throw notFound('Task')
    }
    return task
  }
}
