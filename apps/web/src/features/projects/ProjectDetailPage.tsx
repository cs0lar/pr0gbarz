import type { ProjectResponse } from '@pr0gbarz/contracts'
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Progress,
  Skeleton,
} from '@pr0gbarz/ui'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { ApiError } from '../../api/client.js'
import { useToast } from '../../components/toast-context.js'
import { ProjectAnalyticsPanel } from '../analytics/ProjectAnalyticsPanel.js'
import { TaskWorkspace } from '../tasks/TaskWorkspace.js'
import { ProjectFormDialog } from './ProjectFormDialog.js'
import { useArchiveProject, useProject, useProjectTasks } from './queries.js'
import { healthLabels, healthTone } from './schedule-health.js'

const healthDescriptions: Record<ProjectResponse['scheduleHealth'], string> = {
  at_risk: 'Progress is more than ten points behind the elapsed schedule.',
  complete: 'All measured work is complete.',
  insufficient_data:
    'Add dates and task progress to calculate schedule health.',
  not_started: 'The planned start date has not arrived yet.',
  on_track: 'Measured progress is keeping pace with the project schedule.',
  overdue: 'The target date has passed while work remains incomplete.',
}

export function ProjectDetailPage() {
  const rawId = useParams().projectId ?? ''
  const id = Number(rawId)
  const navigate = useNavigate()
  const notify = useToast()
  const project = useProject(id)
  const tasks = useProjectTasks(id)
  const archive = useArchiveProject()
  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)

  if (!Number.isInteger(id) || id < 1) {
    return (
      <EmptyState
        description="The project address is invalid."
        title="Project not found"
      />
    )
  }

  if (project.isPending) {
    return (
      <Card className="project-detail-loading">
        <Skeleton lines={3} />
      </Card>
    )
  }

  if (project.isError) {
    const missing =
      project.error instanceof ApiError && project.error.status === 404
    return (
      <Card>
        <EmptyState
          action={
            missing ? (
              <Link className="button-link" to="/projects">
                Back to projects
              </Link>
            ) : (
              <Button
                onClick={() => {
                  void project.refetch()
                }}
              >
                Try again
              </Button>
            )
          }
          description={
            missing
              ? 'It may have been archived or the link may be incorrect.'
              : 'The project could not be loaded. Try again.'
          }
          title={missing ? 'Project not found' : 'Project unavailable'}
        />
      </Card>
    )
  }

  const item = project.data
  const activeTasks = tasks.data?.items ?? []
  const completed = activeTasks.filter(
    (task) => task.status === 'completed',
  ).length

  function archiveProject() {
    archive.mutate(item, {
      onError: () => {
        notify({ message: `${item.name} could not be archived.` })
      },
      onSuccess: () => {
        notify({ message: `${item.name} archived.`, tone: 'positive' })
        void navigate('/projects')
      },
    })
  }

  return (
    <div className="page-stack project-detail">
      <Link className="back-link" to="/projects">
        ← All projects
      </Link>
      <header
        className="project-hero"
        style={
          { '--project-accent': item.accentColor ?? '#5b45d6' } as CSSProperties
        }
      >
        <div className="project-hero__top">
          <div>
            <p>Project overview</p>
            <h1>{item.name}</h1>
          </div>
          <div className="project-hero__actions">
            <Button
              onClick={() => {
                setEditing(true)
              }}
              variant="secondary"
            >
              Edit
            </Button>
            <Button
              onClick={() => {
                setConfirmArchive(true)
              }}
              variant="ghost"
            >
              Archive
            </Button>
          </div>
        </div>
        <p className="project-hero__description">
          {item.description ?? 'No project description yet.'}
        </p>
        <div className="project-hero__progress">
          <div>
            <span>Overall progress</span>
            <strong>
              {item.completion === null
                ? 'Not measured'
                : `${String(Math.round(item.completion))}%`}
            </strong>
          </div>
          <Progress
            label={`${item.name} overall progress`}
            value={item.completion ?? 0}
          />
        </div>
      </header>

      <div className="project-overview-grid">
        <Card className="overview-card">
          <span>Schedule health</span>
          <Badge tone={healthTone(item.scheduleHealth)}>
            {healthLabels[item.scheduleHealth]}
          </Badge>
          <p>{healthDescriptions[item.scheduleHealth]}</p>
        </Card>
        <Card className="overview-card">
          <span>Timeline</span>
          <strong>{item.targetDate ?? 'No target set'}</strong>
          <p>
            {item.startDate ? `Starts ${item.startDate}` : 'No start date set'}
          </p>
        </Card>
        <Card className="overview-card">
          <span>Tasks</span>
          <strong>{String(item.taskCount)}</strong>
          <p>
            {String(completed)} completed ·{' '}
            {String(Math.max(0, item.taskCount - completed))} remaining
          </p>
        </Card>
      </div>

      <ProjectAnalyticsPanel projectId={id} />

      <TaskWorkspace projectId={id} />

      <ProjectFormDialog
        onClose={() => {
          setEditing(false)
        }}
        onSaved={(saved) => {
          notify({ message: `${saved.name} updated.`, tone: 'positive' })
          setEditing(false)
        }}
        open={editing}
        project={item}
      />
      <Dialog
        description="Its tasks and progress history stay safe and can be restored from the archive."
        onClose={() => {
          setConfirmArchive(false)
        }}
        open={confirmArchive}
        title={`Archive ${item.name}?`}
      >
        <div className="dialog-actions">
          <Button
            onClick={() => {
              setConfirmArchive(false)
            }}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={archive.isPending}
            onClick={archiveProject}
            variant="danger"
          >
            Archive project
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
