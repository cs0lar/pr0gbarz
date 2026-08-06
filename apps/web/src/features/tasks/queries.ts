import type {
  CreateTag,
  CreateTask,
  TagResponse,
  TaskListQuery,
  TaskListResponse,
  TaskResponse,
  UpdateTask,
} from '@pr0gbarz/contracts'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import { api } from '../../api/client.js'
import { projectKeys } from '../projects/queries.js'

export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: number) => ['tasks', 'detail', id] as const,
  lists: ['projects', 'tasks'] as const,
  list: (projectId: number, query: TaskListQuery) =>
    ['projects', 'tasks', projectId, query] as const,
}

export const tagKeys = { all: ['tags'] as const }

export function useTasks(projectId: number, query: TaskListQuery) {
  return useQuery({
    enabled: Number.isInteger(projectId) && projectId > 0,
    queryFn: () => api.projectTasks(projectId, query),
    queryKey: taskKeys.list(projectId, query),
  })
}

export function useTags() {
  return useQuery({ queryFn: () => api.tags(), queryKey: tagKeys.all })
}

function updateCachedTask(client: QueryClient, task: TaskResponse): void {
  client.setQueryData(taskKeys.detail(task.id), task)
  client.setQueriesData<TaskListResponse>(
    { queryKey: taskKeys.lists },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === task.id ? task : item,
            ),
          }
        : current,
  )
}

async function refreshWorkspace(client: QueryClient, projectId: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: taskKeys.lists }),
    client.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
    client.invalidateQueries({ queryKey: ['dashboard'] }),
    client.invalidateQueries({ queryKey: ['analytics', 'project', projectId] }),
    client.invalidateQueries({ queryKey: ['analytics', 'task'] }),
  ])
}

export function useCreateTask(projectId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTask) => api.createTask(projectId, input),
    onSuccess: async (task) => {
      updateCachedTask(client, task)
      await refreshWorkspace(client, projectId)
    },
  })
}

export function useUpdateTask(projectId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTask }) =>
      api.updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await client.cancelQueries({ queryKey: taskKeys.lists })
      const detail = client.getQueryData<TaskResponse>(taskKeys.detail(id))
      const lists = client.getQueriesData<TaskListResponse>({
        queryKey: taskKeys.lists,
      })
      const cached =
        detail ??
        lists
          .flatMap(([, value]) => value?.items ?? [])
          .find((task) => task.id === id)
      if (cached) {
        const { archived, note, ...changes } = input
        void note
        updateCachedTask(client, {
          ...cached,
          ...changes,
          archivedAt:
            archived === undefined
              ? cached.archivedAt
              : archived
                ? new Date().toISOString()
                : null,
          completedAt:
            input.status === 'completed'
              ? (cached.completedAt ?? new Date().toISOString())
              : input.status === undefined
                ? cached.completedAt
                : null,
          progress:
            input.status === 'completed'
              ? 100
              : (input.progress ?? cached.progress),
        })
      }
      return { detail, lists }
    },
    onError: (_error, variables, context) => {
      if (context?.detail)
        client.setQueryData(taskKeys.detail(variables.id), context.detail)
      for (const [key, value] of context?.lists ?? [])
        client.setQueryData(key, value)
    },
    onSuccess: (task) => {
      updateCachedTask(client, task)
    },
    onSettled: async () => {
      await refreshWorkspace(client, projectId)
    },
  })
}

export function useArchiveTask(projectId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (task: TaskResponse) => api.archiveTask(task.id),
    onMutate: async (task) => {
      await client.cancelQueries({ queryKey: taskKeys.lists })
      const lists = client.getQueriesData<TaskListResponse>({
        queryKey: taskKeys.lists,
      })
      client.setQueriesData<TaskListResponse>(
        { queryKey: taskKeys.lists },
        (current) =>
          current
            ? {
                ...current,
                items: current.items.filter((item) => item.id !== task.id),
                total: Math.max(0, current.total - 1),
              }
            : current,
      )
      return { lists }
    },
    onError: (_error, _task, context) => {
      for (const [key, value] of context?.lists ?? [])
        client.setQueryData(key, value)
    },
    onSettled: async () => {
      await refreshWorkspace(client, projectId)
    },
  })
}

export function useCreateTag() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTag) => api.createTag(input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export async function syncTaskTags(
  task: TaskResponse,
  selectedTagIds: number[],
): Promise<TaskResponse> {
  const existing = new Set(task.tags.map((tag) => tag.id))
  const selected = new Set(selectedTagIds)
  let current = task
  for (const tagId of selected) {
    if (!existing.has(tagId)) current = await api.addTaskTag(task.id, tagId)
  }
  for (const tagId of existing) {
    if (!selected.has(tagId)) {
      await api.removeTaskTag(task.id, tagId)
      current = {
        ...current,
        tags: current.tags.filter((tag: TagResponse) => tag.id !== tagId),
      }
    }
  }
  return current
}
