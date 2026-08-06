import type {
  CreateProject,
  CreateTag,
  CreateTask,
  DashboardResponse,
  ErrorResponse,
  ProgressEventListResponse,
  ProjectAnalyticsResponse,
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

export class ApiError extends Error {
  readonly code: string
  readonly fieldErrors: Record<string, string[]> | undefined
  readonly status: number

  constructor(status: number, response: ErrorResponse) {
    super(response.message)
    this.name = 'ApiError'
    this.code = response.code
    this.fieldErrors = response.fieldErrors
    this.status = status
  }
}

function queryString(values: object) {
  const parameters = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) parameters.set(key, String(value))
  }

  const result = parameters.toString()
  return result ? `?${result}` : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('accept', 'application/json')
  if (init?.body) headers.set('content-type', 'application/json')

  const response = await fetch(path, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse
    throw new ApiError(response.status, error)
  }

  if (response.status === 204) return null as T

  return (await response.json()) as T
}

export const api = {
  dashboard: () => request<DashboardResponse>('/api/v1/dashboard'),
  projects: (query: ProjectListQuery = {}) =>
    request<ProjectListResponse>(`/api/v1/projects${queryString(query)}`),
  createProject: (project: CreateProject) =>
    request<ProjectResponse>('/api/v1/projects', {
      body: JSON.stringify(project),
      method: 'POST',
    }),
  project: (id: number) =>
    request<ProjectResponse>(`/api/v1/projects/${String(id)}`),
  projectAnalytics: (id: number) =>
    request<ProjectAnalyticsResponse>(
      `/api/v1/projects/${String(id)}/analytics`,
    ),
  updateProject: (id: number, project: UpdateProject) =>
    request<ProjectResponse>(`/api/v1/projects/${String(id)}`, {
      body: JSON.stringify(project),
      method: 'PATCH',
    }),
  archiveProject: (id: number) =>
    request<null>(`/api/v1/projects/${String(id)}`, { method: 'DELETE' }),
  projectTasks: (projectId: number, query: TaskListQuery = {}) =>
    request<TaskListResponse>(
      `/api/v1/projects/${String(projectId)}/tasks${queryString(query)}`,
    ),
  createTask: (projectId: number, task: CreateTask) =>
    request<TaskResponse>(`/api/v1/projects/${String(projectId)}/tasks`, {
      body: JSON.stringify(task),
      method: 'POST',
    }),
  task: (id: number) => request<TaskResponse>(`/api/v1/tasks/${String(id)}`),
  taskProgress: (id: number, limit = 100) =>
    request<ProgressEventListResponse>(
      `/api/v1/tasks/${String(id)}/progress-events?limit=${String(limit)}&offset=0`,
    ),
  updateTask: (id: number, task: UpdateTask) =>
    request<TaskResponse>(`/api/v1/tasks/${String(id)}`, {
      body: JSON.stringify(task),
      method: 'PATCH',
    }),
  archiveTask: (id: number) =>
    request<null>(`/api/v1/tasks/${String(id)}`, { method: 'DELETE' }),
  tags: (query: TagListQuery = {}) =>
    request<TagListResponse>(`/api/v1/tags${queryString(query)}`),
  createTag: (tag: CreateTag) =>
    request<TagResponse>('/api/v1/tags', {
      body: JSON.stringify(tag),
      method: 'POST',
    }),
  addTaskTag: (taskId: number, tagId: number) =>
    request<TaskResponse>(
      `/api/v1/tasks/${String(taskId)}/tags/${String(tagId)}`,
      { method: 'PUT' },
    ),
  removeTaskTag: (taskId: number, tagId: number) =>
    request<null>(`/api/v1/tasks/${String(taskId)}/tags/${String(tagId)}`, {
      method: 'DELETE',
    }),
}
