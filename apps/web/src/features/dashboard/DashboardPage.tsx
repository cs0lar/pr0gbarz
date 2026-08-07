import {
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
  Skeleton,
} from '@pr0gbarz/ui'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'

import { api } from '../../api/client.js'
import { Icon } from '../../components/icons.js'
import { ProjectCard } from '../projects/ProjectCard.js'
import { useProjects } from '../projects/queries.js'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function DashboardPage() {
  const navigate = useNavigate()
  const dashboard = useQuery({
    queryFn: api.dashboard,
    queryKey: ['dashboard'],
  })
  const projects = useProjects({
    archived: false,
    direction: 'desc',
    limit: 4,
    sort: 'updated',
  })

  if (dashboard.isPending || projects.isPending) {
    return (
      <div className="page-stack" aria-label="Loading dashboard" role="status">
        <header className="page-heading">
          <p>Workspace overview</p>
          <h1>Good morning.</h1>
        </header>
        <div className="metric-grid">
          <Card className="metric-card">
            <Skeleton lines={3} />
          </Card>
          <Card className="metric-card">
            <Skeleton lines={3} />
          </Card>
          <Card className="metric-card">
            <Skeleton lines={3} />
          </Card>
        </div>
      </div>
    )
  }

  if (dashboard.isError || projects.isError) {
    return (
      <Card>
        <EmptyState
          action={
            <Button
              onClick={() => {
                void dashboard.refetch()
                void projects.refetch()
              }}
            >
              Try again
            </Button>
          }
          description="The workspace summary could not be loaded. Your project data has not changed."
          title="The dashboard is temporarily unavailable"
        />
      </Card>
    )
  }

  const data = dashboard.data
  if (data.activeProjects === 0) {
    return (
      <div className="first-run">
        <Badge tone="positive">Your workspace is ready</Badge>
        <h1>Make meaningful progress visible.</h1>
        <p>
          Create your first project, give it a target, and start turning the
          work that matters into momentum.
        </p>
        <Button
          onClick={() => {
            void navigate('/projects?create=1')
          }}
        >
          <Icon name="plus" /> Create your first project
        </Button>
        <div className="first-run__steps" aria-label="Getting started">
          <span>
            <strong>01</strong> Define an outcome
          </span>
          <span>
            <strong>02</strong> Add the work
          </span>
          <span>
            <strong>03</strong> See momentum
          </span>
        </div>
      </div>
    )
  }

  const incompleteTasks = data.totalTasks - data.completedTasks
  const needsAttention = data.blockedTasks + data.overdueTasks

  return (
    <div className="page-stack">
      <header className="page-heading page-heading--actions">
        <div>
          <p>Workspace overview</p>
          <h1>Good morning.</h1>
        </div>
        <Button
          onClick={() => {
            void navigate('/projects?create=1')
          }}
        >
          <Icon name="plus" /> New project
        </Button>
      </header>
      <div
        className="metric-grid"
        aria-label="Workspace summary"
        role="region"
        tabIndex={0}
      >
        <Card className="metric-card metric-card--accent">
          <span>Active projects</span>
          <strong>{data.activeProjects}</strong>
          <small>
            {data.averageProgress === null
              ? 'No measured progress yet'
              : `${String(Math.round(data.averageProgress))}% average progress`}
          </small>
        </Card>
        <Card className="metric-card">
          <span>Tasks remaining</span>
          <strong>{incompleteTasks}</strong>
          <small>{String(data.completedTasks)} completed</small>
        </Card>
        <Card className="metric-card">
          <span>Needs attention</span>
          <strong>{needsAttention}</strong>
          <small>
            {String(data.overdueTasks)} overdue · {String(data.blockedTasks)}{' '}
            blocked
          </small>
        </Card>
      </div>

      <section
        className="dashboard-section"
        aria-labelledby="active-projects-title"
      >
        <div className="section-heading">
          <div>
            <span>In focus</span>
            <h2 id="active-projects-title">Active projects</h2>
          </div>
          <Link to="/projects">View all</Link>
        </div>
        <div className="project-grid project-grid--dashboard">
          {projects.data.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <Card className="dashboard-panel">
          <div className="section-heading">
            <div>
              <span>Momentum</span>
              <h2>Recent progress</h2>
            </div>
          </div>
          {data.recentProgress.length === 0 ? (
            <EmptyState
              description="Progress changes will appear here as tasks move forward."
              title="No progress updates yet"
            />
          ) : (
            <ol className="activity-list">
              {data.recentProgress.map((event) => (
                <li key={event.id}>
                  <span className="activity-list__delta">
                    +{String(event.newProgress - event.previousProgress)}
                  </span>
                  <div>
                    <strong>{event.taskName}</strong>
                    <Link to={`/projects/${String(event.projectId)}`}>
                      {event.projectName}
                    </Link>
                    {event.note ? <p>{event.note}</p> : null}
                  </div>
                  <time dateTime={event.occurredAt}>
                    {formatDate(event.occurredAt)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card className="dashboard-panel attention-panel">
          <Badge tone={needsAttention > 0 ? 'warning' : 'positive'}>
            {needsAttention > 0 ? 'Review needed' : 'All clear'}
          </Badge>
          <h2>
            {needsAttention > 0
              ? 'Some work needs your attention.'
              : 'Nothing is blocking momentum.'}
          </h2>
          <p>
            {needsAttention > 0
              ? 'Open a project to review overdue and blocked tasks.'
              : 'There are no overdue or blocked tasks across active projects.'}
          </p>
          {data.averageProgress !== null ? (
            <Progress
              label="Average workspace progress"
              value={data.averageProgress}
            />
          ) : null}
        </Card>
      </div>
    </div>
  )
}
