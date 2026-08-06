import { Badge, Button, Card, Dialog, Progress, Skeleton } from '@pr0gbarz/ui'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useToast } from './components/toast-context.js'

export function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const notify = useToast()

  return (
    <div className="page-stack component-preview">
      <header className="page-heading">
        <p>Internal preview</p>
        <h1>Interface system</h1>
      </header>
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
