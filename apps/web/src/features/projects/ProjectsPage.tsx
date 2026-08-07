import type { ProjectResponse } from '@pr0gbarz/contracts'
import { Button, Card, Dialog, EmptyState, Skeleton } from '@pr0gbarz/ui'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { ApiError } from '../../api/client.js'
import { Icon } from '../../components/icons.js'
import { useToast } from '../../components/toast-context.js'
import { ProjectCard } from './ProjectCard.js'
import { ProjectFormDialog } from './ProjectFormDialog.js'
import { useArchiveProject, useProjects, useUpdateProject } from './queries.js'

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <Card>
      <EmptyState
        action={<Button onClick={retry}>Try again</Button>}
        description="The project list could not be loaded. Your existing data has not changed."
        title="Projects are temporarily unavailable"
      />
    </Card>
  )
}

export function ProjectsPage({ archived = false }: { archived?: boolean }) {
  const [parameters, setParameters] = useSearchParams()
  const search = parameters.get('q') ?? ''
  const sort = parameters.get('sort') === 'name' ? 'name' : 'manual'
  const projects = useProjects({
    archived,
    direction: 'asc',
    limit: 100,
    ...(search ? { search } : {}),
    sort,
  })
  const archive = useArchiveProject()
  const update = useUpdateProject()
  const notify = useToast()
  const [editing, setEditing] = useState<ProjectResponse | 'create' | null>(
    null,
  )
  const [archiving, setArchiving] = useState<ProjectResponse | null>(null)

  const createFromUrl = parameters.get('create') === '1'
  const items = useMemo(
    () => projects.data?.items ?? [],
    [projects.data?.items],
  )
  const ordered = useMemo(
    () =>
      [...items].sort((left, right) => left.sortPosition - right.sortPosition),
    [items],
  )

  function closeForm() {
    setEditing(null)
    if (parameters.has('create')) {
      const next = new URLSearchParams(parameters)
      next.delete('create')
      setParameters(next, { replace: true })
    }
  }

  async function move(project: ProjectResponse, direction: -1 | 1) {
    const index = ordered.findIndex((item) => item.id === project.id)
    const other = ordered[index + direction]
    if (!other) return
    try {
      await Promise.all([
        update.mutateAsync({
          id: project.id,
          input: { sortPosition: other.sortPosition },
        }),
        update.mutateAsync({
          id: other.id,
          input: { sortPosition: project.sortPosition },
        }),
      ])
      notify({ message: `${project.name} moved.`, tone: 'positive' })
    } catch {
      notify({
        message:
          'The order could not be saved. The previous order was restored.',
      })
    }
  }

  async function restore(project: ProjectResponse) {
    try {
      await update.mutateAsync({ id: project.id, input: { archived: false } })
      notify({ message: `${project.name} restored.`, tone: 'positive' })
    } catch {
      notify({ message: `${project.name} could not be restored.` })
    }
  }

  function confirmArchive() {
    if (!archiving) return
    archive.mutate(archiving, {
      onError: (error) => {
        notify({
          message:
            error instanceof ApiError
              ? error.message
              : `${archiving.name} could not be archived.`,
        })
      },
      onSuccess: () => {
        notify({
          action: {
            label: 'Undo',
            onClick: () => {
              void restore(archiving)
            },
          },
          message: `${archiving.name} archived.`,
          tone: 'positive',
        })
        setArchiving(null)
      },
    })
  }

  return (
    <div className="page-stack">
      <header className="page-heading page-heading--actions">
        <div>
          <p>Workspace</p>
          <h1>{archived ? 'Archive' : 'Projects'}</h1>
        </div>
        {!archived ? (
          <Button
            onClick={() => {
              setEditing('create')
            }}
          >
            <Icon name="plus" /> New project
          </Button>
        ) : null}
      </header>

      <div className="project-toolbar">
        <label>
          <span className="ui-visually-hidden">Search projects</span>
          <input
            onChange={(event) => {
              const next = new URLSearchParams(parameters)
              if (event.target.value) next.set('q', event.target.value)
              else next.delete('q')
              setParameters(next, { replace: true })
            }}
            placeholder="Search projects…"
            type="search"
            value={search}
          />
        </label>
        <label>
          <span>Sort</span>
          <select
            onChange={(event) => {
              const next = new URLSearchParams(parameters)
              if (event.target.value === 'name') next.set('sort', 'name')
              else next.delete('sort')
              setParameters(next, { replace: true })
            }}
            value={sort}
          >
            <option value="manual">Manual order</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {projects.isPending ? (
        <div
          className="project-grid"
          aria-label="Loading projects"
          role="status"
        >
          <Card className="project-card project-card--loading">
            <Skeleton lines={3} />
          </Card>
          <Card className="project-card project-card--loading">
            <Skeleton lines={3} />
          </Card>
        </div>
      ) : projects.isError ? (
        <ErrorState
          retry={() => {
            void projects.refetch()
          }}
        />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            action={
              search ? (
                <Button
                  onClick={() => {
                    const next = new URLSearchParams(parameters)
                    next.delete('q')
                    setParameters(next)
                  }}
                  variant="secondary"
                >
                  Clear search
                </Button>
              ) : archived ? undefined : (
                <Button
                  onClick={() => {
                    setEditing('create')
                  }}
                >
                  Create your first project
                </Button>
              )
            }
            description={
              search
                ? `No projects match “${search}”.`
                : archived
                  ? 'Archived projects will stay here until you restore them.'
                  : 'Create a project to turn an outcome into visible momentum.'
            }
            icon={<Icon name={archived ? 'archive' : 'projects'} />}
            title={
              search
                ? 'No matching projects'
                : archived
                  ? 'The archive is empty'
                  : 'A clear workspace starts with one project'
            }
          />
        </Card>
      ) : (
        <div className="project-grid">
          {(sort === 'manual' ? ordered : items).map(
            (project, index, collection) => (
              <ProjectCard
                canMoveDown={sort === 'manual' && index < collection.length - 1}
                canMoveUp={sort === 'manual' && index > 0}
                key={project.id}
                onArchive={archived ? undefined : setArchiving}
                onEdit={archived ? undefined : setEditing}
                onMove={
                  archived || sort !== 'manual'
                    ? undefined
                    : (item, direction) => {
                        void move(item, direction)
                      }
                }
                onRestore={
                  archived
                    ? (item) => {
                        void restore(item)
                      }
                    : undefined
                }
                project={project}
              />
            ),
          )}
        </div>
      )}

      <ProjectFormDialog
        onClose={closeForm}
        onSaved={(project) => {
          notify({ message: `${project.name} saved.`, tone: 'positive' })
          closeForm()
        }}
        open={editing !== null || createFromUrl}
        project={editing && editing !== 'create' ? editing : undefined}
      />

      <Dialog
        description="Its tasks and history remain safe. You can restore the project from the archive."
        onClose={() => {
          setArchiving(null)
        }}
        open={archiving !== null}
        title={`Archive ${archiving?.name ?? 'project'}?`}
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
            {archive.isPending ? 'Archiving…' : 'Archive project'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
