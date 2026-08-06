import { useQuery } from '@tanstack/react-query'

import { api } from '../../api/client.js'

export const analyticsKeys = {
  project: (id: number) => ['analytics', 'project', id] as const,
  task: (id: number) => ['analytics', 'task', id] as const,
}

export function useProjectAnalytics(id: number) {
  return useQuery({
    enabled: Number.isInteger(id) && id > 0,
    queryFn: () => api.projectAnalytics(id),
    queryKey: analyticsKeys.project(id),
  })
}

export function useTaskProgress(id: number) {
  return useQuery({
    enabled: Number.isInteger(id) && id > 0,
    queryFn: () => api.taskProgress(id),
    queryKey: analyticsKeys.task(id),
  })
}
