import type {
  TaskListQuery,
  TaskPriority,
  TaskResponse,
  TaskStatus,
} from '@pr0gbarz/contracts'
import { Button, Card, Dialog, EmptyState, Skeleton } from '@pr0gbarz/ui'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useToast } from '../../components/toast-context.js'
import { TagFormDialog } from './TagFormDialog.js'
import { TaskCard } from './TaskCard.js'
import { TaskFormDialog } from './TaskFormDialog.js'
import { useArchiveTask, useTags, useTasks, useUpdateTask } from './queries.js'

const statuses: { label: string; value: TaskStatus }[] = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'Planned', value: 'planned' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Completed', value: 'completed' },
]
const priorities: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent']
const sorts = [
  'manual',
  'name',
  'priority',
  'progress',
  'dueDate',
  'updated',
] as const
function enumValue<T extends string>(
  value: string | null,
  values: readonly T[],
) {
  return value && values.includes(value as T) ? (value as T) : undefined
}

export function TaskWorkspace({ projectId }: { projectId: number }) {
  const [parameters, setParameters] = useSearchParams()
  const archived = parameters.get('tasks') === 'archived'
  const search = parameters.get('taskSearch') ?? ''
  const status = enumValue(
    parameters.get('status'),
    statuses.map((item) => item.value),
  )
  const priority = enumValue(parameters.get('priority'), priorities)
  const sort = enumValue(parameters.get('taskSort'), sorts) ?? 'manual'
  const direction = parameters.get('direction') === 'desc' ? 'desc' : 'asc'
  const tagIdValue = Number(parameters.get('tag'))
  const tagId =
    Number.isInteger(tagIdValue) && tagIdValue > 0 ? tagIdValue : undefined
  const query: TaskListQuery = {
    archived,
    direction,
    limit: 200,
    ...(priority ? { priority } : {}),
    ...(search ? { search } : {}),
    sort,
    ...(status ? { status } : {}),
    ...(tagId ? { tagId } : {}),
  }
  const tasks = useTasks(projectId, query)
  const tags = useTags()
  const update = useUpdateTask(projectId)
  const archive = useArchiveTask(projectId)
  const notify = useToast()
  const [editing, setEditing] = useState<TaskResponse | 'create' | null>(null)
  const [archiving, setArchiving] = useState<TaskResponse | null>(null)
  const [creatingTag, setCreatingTag] = useState(false)
  const items = useMemo(() => tasks.data?.items ?? [], [tasks.data?.items])
  const ordered = useMemo(
    () =>
      [...items].sort((left, right) => left.sortPosition - right.sortPosition),
    [items],
  )
  const filtered = [search, status, priority, tagId].some(Boolean)
  const canReorder = !archived && !filtered && sort === 'manual'

  function setParameter(name: string, value?: string) {
    const next = new URLSearchParams(parameters)
    if (value) next.set(name, value)
    else next.delete(name)
    setParameters(next, { replace: true })
  }

  function clearFilters() {
    const next = new URLSearchParams(parameters)
    for (const key of ['taskSearch', 'status', 'priority', 'tag'])
      next.delete(key)
    setParameters(next, { replace: true })
  }

  async function changeTask(
    task: TaskResponse,
    input: Parameters<typeof update.mutateAsync>[0]['input'],
    success: string,
  ) {
    try {
      await update.mutateAsync({ id: task.id, input })
      notify({ message: success, tone: 'positive' })
    } catch {
      notify({
        message: `${task.name} could not be updated. The previous value was restored.`,
      })
    }
  }

  async function move(task: TaskResponse, directionToMove: -1 | 1) {
    const index = ordered.findIndex((item) => item.id === task.id)
    const other = ordered[index + directionToMove]
    if (!other) return
    try {
      await Promise.all([
        update.mutateAsync({
          id: task.id,
          input: { sortPosition: other.sortPosition },
        }),
        update.mutateAsync({
          id: other.id,
          input: { sortPosition: task.sortPosition },
        }),
      ])
      notify({ message: `${task.name} moved.`, tone: 'positive' })
    } catch {
      notify({
        message:
          'The task order could not be saved. The previous order was restored.',
      })
    }
  }

  async function restore(task: TaskResponse) {
    await changeTask(task, { archived: false }, `${task.name} restored.`)
  }

  function confirmArchive() {
    if (!archiving) return
    archive.mutate(archiving, {
      onError: () => {
        notify({ message: `${archiving.name} could not be archived.` })
      },
      onSuccess: () => {
        const archivedTask = archiving
        setArchiving(null)
        notify({
          action: { label: 'Undo', onClick: () => void restore(archivedTask) },
          message: `${archivedTask.name} archived.`,
          tone: 'positive',
        })
      },
    })
  }

  return (
    <section className="task-workspace" aria-labelledby="project-tasks-title">
      <div className="section-heading task-workspace__heading">
        <div>
          <span>Work</span>
          <h2 id="project-tasks-title">Tasks</h2>
        </div>
        <div>
          <Button
            onClick={() => {
              setParameter('tasks', archived ? undefined : 'archived')
            }}
            variant="ghost"
          >
            {archived ? 'View active' : 'View archive'}
          </Button>
          {!archived ? (
            <Button
              onClick={() => {
                setEditing('create')
              }}
            >
              New task
            </Button>
          ) : null}
        </div>
      </div>

      <div className="task-toolbar">
        <label className="task-toolbar__search">
          <span className="ui-visually-hidden">Search tasks</span>
          <input
            onChange={(event) => {
              setParameter('taskSearch', event.target.value)
            }}
            placeholder="Search tasks…"
            type="search"
            value={search}
          />
        </label>
        <label>
          <span>Status</span>
          <select
            onChange={(event) => {
              setParameter('status', event.target.value)
            }}
            value={status ?? ''}
          >
            <option value="">All</option>
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select
            onChange={(event) => {
              setParameter('priority', event.target.value)
            }}
            value={priority ?? ''}
          >
            <option value="">All</option>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tag</span>
          <select
            onChange={(event) => {
              setParameter('tag', event.target.value)
            }}
            value={tagId ?? ''}
          >
            <option value="">All</option>
            {(tags.data?.items ?? []).map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select
            onChange={(event) => {
              setParameter(
                'taskSort',
                event.target.value === 'manual'
                  ? undefined
                  : event.target.value,
              )
            }}
            value={sort}
          >
            <option value="manual">Manual</option>
            <option value="name">Name</option>
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
            <option value="dueDate">Due date</option>
            <option value="updated">Updated</option>
          </select>
        </label>
        <Button
          aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}
          onClick={() => {
            setParameter('direction', direction === 'asc' ? 'desc' : undefined)
          }}
          variant="ghost"
        >
          {direction === 'asc' ? '↑' : '↓'}
        </Button>
        <Button
          onClick={() => {
            setCreatingTag(true)
          }}
          variant="ghost"
        >
          New tag
        </Button>
        {filtered ? (
          <Button onClick={clearFilters} variant="ghost">
            Clear filters
          </Button>
        ) : null}
      </div>

      {tasks.isPending ? (
        <Card>
          <Skeleton lines={4} />
        </Card>
      ) : tasks.isError ? (
        <Card>
          <EmptyState
            action={
              <Button onClick={() => void tasks.refetch()}>Try again</Button>
            }
            description="The task workspace could not be loaded."
            title="Tasks unavailable"
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            action={
              filtered ? (
                <Button onClick={clearFilters}>Clear filters</Button>
              ) : archived ? undefined : (
                <Button
                  onClick={() => {
                    setEditing('create')
                  }}
                >
                  Create your first task
                </Button>
              )
            }
            description={
              filtered
                ? 'Try removing one or more filters.'
                : archived
                  ? 'Archived tasks remain available for restoration.'
                  : 'Break the project into the next concrete pieces of work.'
            }
            title={
              filtered
                ? 'No tasks match this view'
                : archived
                  ? 'The task archive is empty'
                  : 'No tasks yet'
            }
          />
        </Card>
      ) : (
        <div className="task-list">
          {(sort === 'manual' ? ordered : items).map(
            (task, index, collection) => (
              <TaskCard
                canMoveDown={canReorder && index < collection.length - 1}
                canMoveUp={canReorder && index > 0}
                key={task.id}
                onArchive={archived ? undefined : setArchiving}
                onEdit={archived ? undefined : setEditing}
                onMove={
                  canReorder
                    ? (item, moveDirection) => void move(item, moveDirection)
                    : undefined
                }
                onProgress={
                  archived
                    ? undefined
                    : (item, progress) =>
                        void changeTask(
                          item,
                          {
                            progress,
                            ...(item.status === 'completed' && progress < 100
                              ? { status: 'in_progress' as const }
                              : {}),
                          },
                          `${item.name} is now ${String(progress)}% complete.`,
                        )
                }
                onRestore={archived ? (item) => void restore(item) : undefined}
                onStatus={
                  archived
                    ? undefined
                    : (item, nextStatus) =>
                        void changeTask(
                          item,
                          { status: nextStatus },
                          `${item.name} moved to ${nextStatus.replaceAll('_', ' ')}.`,
                        )
                }
                task={task}
              />
            ),
          )}
        </div>
      )}

      {editing ? (
        <TaskFormDialog
          onClose={() => {
            setEditing(null)
          }}
          onSaved={(saved) => {
            notify({ message: `${saved.name} saved.`, tone: 'positive' })
            setEditing(null)
            void tasks.refetch()
          }}
          open
          projectId={projectId}
          tags={tags.data?.items ?? []}
          task={editing !== 'create' ? editing : undefined}
        />
      ) : null}
      <TagFormDialog
        onClose={() => {
          setCreatingTag(false)
        }}
        onSaved={() => {
          setCreatingTag(false)
          notify({ message: 'Tag created.', tone: 'positive' })
        }}
        open={creatingTag}
      />
      <Dialog
        description="Its progress history remains safe and the task can be restored from this project’s archive."
        onClose={() => {
          setArchiving(null)
        }}
        open={archiving !== null}
        title={`Archive ${archiving?.name ?? 'task'}?`}
      >
        <div className="dialog-actions">
          <Button
            onClick={() => {
              setArchiving(null)
            }}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={archive.isPending}
            onClick={confirmArchive}
            variant="danger"
          >
            Archive task
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
