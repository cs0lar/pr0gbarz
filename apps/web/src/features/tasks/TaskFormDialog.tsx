import type {
  CreateTask,
  TagResponse,
  TaskPriority,
  TaskResponse,
  TaskStatus,
} from '@pr0gbarz/contracts'
import { Button, Dialog } from '@pr0gbarz/ui'
import { type SyntheticEvent, useId, useState } from 'react'

import { ApiError } from '../../api/client.js'
import { syncTaskTags, useCreateTask, useUpdateTask } from './queries.js'

const statuses: { label: string; value: TaskStatus }[] = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'Planned', value: 'planned' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Completed', value: 'completed' },
]

const priorities: { label: string; value: TaskPriority }[] = [
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

function optionalText(data: FormData, key: string): string | null {
  const value = data.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function TaskFormDialog({
  onClose,
  onSaved,
  open,
  projectId,
  tags,
  task,
}: {
  onClose: () => void
  onSaved: (task: TaskResponse) => void
  open: boolean
  projectId: number
  tags: TagResponse[]
  task?: TaskResponse | undefined
}) {
  const prefix = useId()
  const create = useCreateTask(projectId)
  const update = useUpdateTask(projectId)
  const [progress, setProgress] = useState(task?.progress ?? 0)
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'backlog')
  const [selectedTags, setSelectedTags] = useState<number[]>(
    task?.tags.map((tag) => tag.id) ?? [],
  )
  const [tagError, setTagError] = useState(false)
  const pending = create.isPending || update.isPending
  const error = create.error ?? update.error

  function changeProgress(value: number) {
    const next = Math.max(0, Math.min(100, Math.round(value)))
    setProgress(next)
    if (next < 100 && status === 'completed') setStatus('in_progress')
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input: CreateTask = {
      description: optionalText(data, 'description'),
      dueDate: optionalText(data, 'dueDate'),
      name: optionalText(data, 'name') ?? '',
      priority: data.get('priority') as TaskPriority,
      progress,
      startDate: optionalText(data, 'startDate'),
      status,
    }
    const progressNote = optionalText(data, 'note')

    try {
      const saved = task
        ? await update.mutateAsync({
            id: task.id,
            input: {
              ...input,
              ...(progress !== task.progress && progressNote
                ? { note: progressNote }
                : {}),
            },
          })
        : await create.mutateAsync(input)
      const tagged = await syncTaskTags(saved, selectedTags)
      onSaved(tagged)
    } catch {
      if (!create.error && !update.error) setTagError(true)
    }
  }

  return (
    <Dialog
      description="Keep status, dates, priority, tags, and measured progress in one place."
      onClose={onClose}
      open={open}
      title={task ? 'Edit task' : 'Create a task'}
    >
      <form
        className="task-form"
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <label htmlFor={`${prefix}-name`}>
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          autoFocus
          defaultValue={task?.name ?? ''}
          id={`${prefix}-name`}
          maxLength={120}
          name="name"
          required
        />

        <label htmlFor={`${prefix}-description`}>Description</label>
        <textarea
          defaultValue={task?.description ?? ''}
          id={`${prefix}-description`}
          maxLength={10_000}
          name="description"
          rows={3}
        />

        <div className="form-columns">
          <div>
            <label htmlFor={`${prefix}-status`}>Status</label>
            <select
              id={`${prefix}-status`}
              name="status"
              onChange={(event) => {
                const next = event.target.value as TaskStatus
                setStatus(next)
                if (next === 'completed') setProgress(100)
              }}
              value={status}
            >
              {statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${prefix}-priority`}>Priority</label>
            <select
              defaultValue={task?.priority ?? 'none'}
              id={`${prefix}-priority`}
              name="priority"
            >
              {priorities.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="progress-editor">
          <legend>Progress</legend>
          <div className="progress-editor__controls">
            <Button
              aria-label="Decrease progress by 10"
              onClick={() => {
                changeProgress(progress - 10)
              }}
              size="compact"
              variant="secondary"
            >
              −10
            </Button>
            <input
              aria-label="Task progress slider"
              max="100"
              min="0"
              onChange={(event) => {
                changeProgress(Number(event.target.value))
              }}
              step="1"
              type="range"
              value={progress}
            />
            <label>
              <span className="ui-visually-hidden">
                Task progress percentage
              </span>
              <input
                max="100"
                min="0"
                onChange={(event) => {
                  changeProgress(Number(event.target.value))
                }}
                type="number"
                value={progress}
              />
              <span aria-hidden="true">%</span>
            </label>
            <Button
              aria-label="Increase progress by 10"
              onClick={() => {
                changeProgress(progress + 10)
              }}
              size="compact"
              variant="secondary"
            >
              +10
            </Button>
          </div>
        </fieldset>

        {task && progress !== task.progress ? (
          <>
            <label htmlFor={`${prefix}-note`}>Progress note</label>
            <input
              id={`${prefix}-note`}
              maxLength={2_000}
              name="note"
              placeholder="What moved this forward?"
            />
          </>
        ) : null}

        <div className="form-columns">
          <div>
            <label htmlFor={`${prefix}-start`}>Start date</label>
            <input
              defaultValue={task?.startDate ?? ''}
              id={`${prefix}-start`}
              name="startDate"
              type="date"
            />
          </div>
          <div>
            <label htmlFor={`${prefix}-due`}>Due date</label>
            <input
              defaultValue={task?.dueDate ?? ''}
              id={`${prefix}-due`}
              name="dueDate"
              type="date"
            />
          </div>
        </div>

        {tags.length > 0 ? (
          <fieldset className="tag-picker">
            <legend>Tags</legend>
            <div>
              {tags.map((tag) => (
                <label key={tag.id}>
                  <input
                    checked={selectedTags.includes(tag.id)}
                    onChange={(event) => {
                      setSelectedTags((current) =>
                        event.target.checked
                          ? [...current, tag.id]
                          : current.filter((id) => id !== tag.id),
                      )
                    }}
                    type="checkbox"
                  />
                  <span>{tag.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {error || tagError ? (
          <p className="form-error" role="alert">
            {error instanceof ApiError
              ? error.message
              : tagError
                ? 'The task was saved, but its tags could not be updated. Try again.'
                : 'The task could not be saved. Try again.'}
          </p>
        ) : null}

        <div className="dialog-actions">
          <Button disabled={pending} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
