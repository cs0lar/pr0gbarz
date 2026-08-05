import type { ProjectResponse } from '@pr0gbarz/contracts'

export const healthLabels: Record<ProjectResponse['scheduleHealth'], string> = {
  at_risk: 'At risk',
  complete: 'Complete',
  insufficient_data: 'Not enough data',
  not_started: 'Not started',
  on_track: 'On track',
  overdue: 'Overdue',
}

export function healthTone(
  health: ProjectResponse['scheduleHealth'],
): 'danger' | 'neutral' | 'positive' | 'warning' {
  if (health === 'on_track' || health === 'complete') return 'positive'
  if (health === 'at_risk' || health === 'not_started') return 'warning'
  if (health === 'overdue') return 'danger'
  return 'neutral'
}
