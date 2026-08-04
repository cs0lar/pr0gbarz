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
import { Link } from 'react-router-dom'

import { Icon } from './components/icons.js'
import { useToast } from './components/toast-context.js'

function PageHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="page-heading">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
    </header>
  )
}

export function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="Tuesday, 4 August" title="Good morning." />
      <div
        className="metric-grid"
        aria-label="Workspace summary"
        role="region"
        tabIndex={0}
      >
        <Card className="metric-card metric-card--accent">
          <span>Active projects</span>
          <strong>—</strong>
          <small>Your workspace is ready</small>
        </Card>
        <Card className="metric-card">
          <span>Tasks in progress</span>
          <strong>—</strong>
          <small>Nothing underway yet</small>
        </Card>
        <Card className="metric-card">
          <span>Needs attention</span>
          <strong>—</strong>
          <small>No overdue or blocked work</small>
        </Card>
      </div>
      <div className="dashboard-grid">
        <Card className="workspace-ready">
          <Badge tone="positive">Foundation ready</Badge>
          <h2>Your focused workspace starts here.</h2>
          <p>
            The shell, themes, navigation, and feedback states are in place.
            Project workflows arrive in the next phase.
          </p>
          <div className="workspace-ready__bar">
            <span>Interface foundation</span>
            <strong>100%</strong>
          </div>
          <Progress label="Interface foundation progress" value={100} />
        </Card>
        <Card className="next-up">
          <div className="section-heading">
            <div>
              <span>Next up</span>
              <h2>Build momentum</h2>
            </div>
            <Badge>Phase 5</Badge>
          </div>
          <ul>
            <li>
              <span>01</span>
              <div>
                <strong>Create a project</strong>
                <small>Give meaningful work a clear home.</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Set a target</strong>
                <small>Make progress visible and time-bound.</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Choose what’s next</strong>
                <small>Keep attention on the work that matters.</small>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export function ProjectsPage() {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="Workspace" title="Projects" />
      <Card>
        <EmptyState
          action={<Button disabled>New project</Button>}
          description="Project creation, searching, and ordering arrive together in phase 5."
          icon={<Icon name="projects" />}
          title="No projects yet"
        />
      </Card>
    </div>
  )
}

export function ArchivePage() {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="Workspace" title="Archive" />
      <Card>
        <EmptyState
          description="Archived projects and tasks will appear here, ready to restore."
          icon={<Icon name="archive" />}
          title="The archive is empty"
        />
      </Card>
    </div>
  )
}

export function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const notify = useToast()

  return (
    <div className="page-stack component-preview">
      <PageHeading eyebrow="Internal preview" title="Interface system" />
      <Card className="preview-card">
        <h2>Actions and status</h2>
        <div className="preview-row">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Quiet action</Button>
          <Badge tone="positive">On track</Badge>
          <Badge tone="warning">At risk</Badge>
          <Badge tone="danger">Blocked</Badge>
        </div>
      </Card>
      <Card className="preview-card">
        <h2>Feedback</h2>
        <Progress label="Example project progress" value={64} />
        <Skeleton lines={3} />
        <div className="preview-row">
          <Button
            onClick={() => {
              notify({ message: 'Progress saved.', tone: 'positive' })
            }}
            variant="secondary"
          >
            Show toast
          </Button>
          <Button
            onClick={() => {
              setDialogOpen(true)
            }}
            variant="secondary"
          >
            Open dialog
          </Button>
        </div>
      </Card>
      <Dialog
        description="A native modal with labelled content and keyboard dismissal."
        onClose={() => {
          setDialogOpen(false)
        }}
        open={dialogOpen}
        title="Accessible by default"
      >
        <div className="dialog-actions">
          <Button
            onClick={() => {
              setDialogOpen(false)
            }}
          >
            Got it
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

export function NotFoundPage({
  description = 'That page does not exist.',
}: {
  description?: string
}) {
  return (
    <div className="standalone-state">
      <span className="error-code">404</span>
      <h1>We lost that trail.</h1>
      <p>{description}</p>
      <Link className="button-link" to="/">
        Return to overview
      </Link>
    </div>
  )
}
