import type { ProgressEventResponse, TaskResponse } from '@pr0gbarz/contracts'
import { Button, Dialog, EmptyState, Skeleton } from '@pr0gbarz/ui'

import { ProgressChart } from './ProgressChart.js'
import { useTaskProgress } from './queries.js'

function chartPoints(events: ProgressEventResponse[]) {
  const chronological = [...events].reverse()
  const first = chronological[0]
  if (!first) return []
  return [
    {
      label: `${first.occurredAt}-start`,
      value: first.previousProgress,
    },
    ...chronological.map((event) => ({
      label: event.occurredAt,
      value: event.newProgress,
    })),
  ]
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function TaskHistoryDialog({
  onClose,
  task,
}: {
  onClose: () => void
  task: TaskResponse
}) {
  const history = useTaskProgress(task.id)
  const events = history.data?.items ?? []
  const points = chartPoints(events)
  const description =
    events.length === 0
      ? 'No measured progress changes have been recorded for this task.'
      : `${String(events.length)} measured changes, from ${String(points[0]?.value ?? task.progress)}% to ${String(points.at(-1)?.value ?? task.progress)}%.`

  return (
    <Dialog
      description="Measured changes are append-only and newest updates appear first."
      onClose={onClose}
      open
      title={`${task.name} progress`}
    >
      {history.isPending ? (
        <Skeleton lines={4} />
      ) : history.isError ? (
        <EmptyState
          action={
            <Button onClick={() => void history.refetch()}>Try again</Button>
          }
          description="Progress history could not be loaded."
          title="History unavailable"
        />
      ) : events.length === 0 ? (
        <EmptyState description={description} title="No progress history yet" />
      ) : (
        <div className="task-history">
          <ProgressChart
            description={description}
            points={points}
            title={`${task.name} measured progress`}
          />
          <ol className="progress-timeline">
            {events.map((event) => (
              <li key={event.id}>
                <span
                  className="progress-timeline__marker"
                  aria-hidden="true"
                />
                <div>
                  <strong>
                    {String(event.previousProgress)}% →{' '}
                    {String(event.newProgress)}%
                  </strong>
                  {event.note ? <p>{event.note}</p> : null}
                  <time dateTime={event.occurredAt}>
                    {formatTimestamp(event.occurredAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="dialog-actions">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  )
}
