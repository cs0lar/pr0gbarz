import type {
  CreateProject,
  DashboardResponse,
  ErrorResponse,
  ProjectListQuery,
  ProjectListResponse,
  ProjectResponse,
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
}
