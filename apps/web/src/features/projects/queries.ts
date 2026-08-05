import type {
  CreateProject,
  ProjectListQuery,
  ProjectListResponse,
  ProjectResponse,
  UpdateProject,
} from '@pr0gbarz/contracts'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import { api } from '../../api/client.js'

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: number) => ['projects', 'detail', id] as const,
  lists: ['projects', 'list'] as const,
  list: (query: ProjectListQuery) => ['projects', 'list', query] as const,
  tasks: (id: number) => ['projects', 'tasks', id] as const,
}

export function useProjects(query: ProjectListQuery) {
  return useQuery({
    queryFn: () => api.projects(query),
    queryKey: projectKeys.list(query),
  })
}

export function useProject(id: number) {
  return useQuery({
    enabled: Number.isInteger(id) && id > 0,
    queryFn: () => api.project(id),
    queryKey: projectKeys.detail(id),
  })
}

export function useProjectTasks(id: number) {
  return useQuery({
    enabled: Number.isInteger(id) && id > 0,
    queryFn: () => api.projectTasks(id, { limit: 100 }),
    queryKey: projectKeys.tasks(id),
  })
}

function updateCachedProject(
  client: QueryClient,
  project: ProjectResponse,
): void {
  client.setQueryData(projectKeys.detail(project.id), project)
  client.setQueriesData<ProjectListResponse>(
    { queryKey: projectKeys.lists },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === project.id ? project : item,
            ),
          }
        : current,
  )
}

export function useCreateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProject) => api.createProject(input),
    onSuccess: async (project) => {
      updateCachedProject(client, project)
      await client.invalidateQueries({ queryKey: projectKeys.all })
      await client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateProject }) =>
      api.updateProject(id, input),
    onMutate: async ({ id, input }) => {
      await client.cancelQueries({ queryKey: projectKeys.all })
      const detail = client.getQueryData<ProjectResponse>(
        projectKeys.detail(id),
      )
      const lists = client.getQueriesData<ProjectListResponse>({
        queryKey: projectKeys.lists,
      })
      if (detail) {
        updateCachedProject(client, {
          ...detail,
          ...input,
          archivedAt:
            input.archived === undefined
              ? detail.archivedAt
              : input.archived
                ? new Date().toISOString()
                : null,
        })
      }
      return { detail, lists }
    },
    onError: (_error, variables, context) => {
      if (context?.detail) {
        client.setQueryData(projectKeys.detail(variables.id), context.detail)
      }
      for (const [key, value] of context?.lists ?? []) {
        client.setQueryData(key, value)
      }
    },
    onSuccess: (project) => {
      updateCachedProject(client, project)
    },
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: projectKeys.all })
      await client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useArchiveProject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (project: ProjectResponse) => api.archiveProject(project.id),
    onMutate: async (project) => {
      await client.cancelQueries({ queryKey: projectKeys.all })
      const lists = client.getQueriesData<ProjectListResponse>({
        queryKey: projectKeys.lists,
      })
      client.setQueriesData<ProjectListResponse>(
        { queryKey: projectKeys.lists },
        (current) =>
          current
            ? {
                ...current,
                items: current.items.filter((item) => item.id !== project.id),
                total: Math.max(0, current.total - 1),
              }
            : current,
      )
      return { lists }
    },
    onError: (_error, _project, context) => {
      for (const [key, value] of context?.lists ?? []) {
        client.setQueryData(key, value)
      }
    },
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: projectKeys.all })
      await client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
