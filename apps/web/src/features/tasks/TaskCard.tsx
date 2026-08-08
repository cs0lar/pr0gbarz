import type { TaskResponse, TaskStatus } from '@pr0gbarz/contracts'
import { Badge, Button, Progress } from '@pr0gbarz/ui'

const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  blocked: 'Blocked',
  completed: 'Completed',
  in_progress: 'In progress',
  planned: 'Planned',
}

function statusTone(status: TaskStatus) {
  if (status === 'blocked') return 'danger' as const
  if (status === 'completed') return 'positive' as const
  if (status === 'in_progress') return 'warning' as const
  return 'neutral' as const
}

export function TaskCard({
  canMoveDown,
  canMoveUp,
  onArchive,
  onEdit,
  onHistory,
  onMove,
  onProgress,
  onRestore,
  onStatus,
  task,
}: {
  canMoveDown?: boolean | undefined
  canMoveUp?: boolean | undefined
  onArchive?: ((task: TaskResponse) => void) | undefined
  onEdit?: ((task: TaskResponse) => void) | undefined
  onHistory?: ((task: TaskResponse) => void) | undefined
  onMove?: ((task: TaskResponse, direction: -1 | 1) => void) | undefined
  onProgress?: ((task: TaskResponse, progress: number) => void) | undefined
  onRestore?: ((task: TaskResponse) => void) | undefined
  onStatus?: ((task: TaskResponse, status: TaskStatus) => void) | undefined
  task: TaskResponse
}) {
  return (
    <article className="task-card">
      <div className="task-card__main">
        <div className="task-card__heading">
          <div>
            <h3>{task.name}</h3>
            {task.description ? (
              <p className="task-card__description">{task.description}</p>
            ) : null}
          </div>
          <Badge tone={statusTone(task.status)}>
            {statusLabels[task.status]}
          </Badge>
        </div>
        <div className="task-card__meta">
          <span className={`priority priority--${task.priority}`}>
            {task.priority} priority
          </span>
          {task.dueDate ? <span>Due {task.dueDate}</span> : null}
          {task.tags.map((tag) => (
            <span className="task-tag" key={tag.id}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      <div className="task-card__progress">
        <Progress label={`${task.name} progress`} value={task.progress} />
        <strong>{String(task.progress)}%</strong>
        {onProgress ? (
          <div className="task-card__quick-progress">
            <Button
              aria-label={`Decrease ${task.name} progress by 10`}
              disabled={task.progress === 0}
              onClick={() => {
                onProgress(task, Math.max(0, task.progress - 10))
              }}
              size="compact"
              variant="ghost"
            >
              −10
            </Button>
            <Button
              aria-label={`Increase ${task.name} progress by 10`}
              disabled={task.progress === 100}
              onClick={() => {
                onProgress(task, Math.min(100, task.progress + 10))
              }}
              size="compact"
              variant="ghost"
            >
              +10
            </Button>
          </div>
        ) : null}
      </div>

      <div className="task-card__actions">
        {onStatus ? (
          <label>
            <span className="ui-visually-hidden">Status for {task.name}</span>
            <select
              aria-label={`Status for ${task.name}`}
              onChange={(event) => {
                onStatus(task, event.target.value as TaskStatus)
              }}
              value={task.status}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {onMove ? (
          <div className="move-controls" aria-label={`Move ${task.name}`}>
            <Button
              aria-label={`Move ${task.name} up`}
              disabled={!canMoveUp}
              onClick={() => {
                onMove(task, -1)
              }}
              size="compact"
              variant="ghost"
            >
              ↑
            </Button>
            <Button
              aria-label={`Move ${task.name} down`}
              disabled={!canMoveDown}
              onClick={() => {
                onMove(task, 1)
              }}
              size="compact"
              variant="ghost"
            >
              ↓
            </Button>
          </div>
        ) : null}
        {onEdit ? (
          <Button
            onClick={() => {
              onEdit(task)
            }}
            size="compact"
            variant="secondary"
          >
            Edit
          </Button>
        ) : null}
        {onHistory ? (
          <Button
            onClick={() => {
              onHistory(task)
            }}
            size="compact"
            variant="ghost"
          >
            History
          </Button>
        ) : null}
        {onArchive ? (
          <Button
            onClick={() => {
              onArchive(task)
            }}
            size="compact"
            variant="ghost"
          >
            Archive
          </Button>
        ) : null}
        {onRestore ? (
          <Button
            onClick={() => {
              onRestore(task)
            }}
            size="compact"
          >
            Restore
          </Button>
        ) : null}
      </div>
    </article>
  )
}
