import { Badge, Button, Card, EmptyState, Skeleton } from '@pr0gbarz/ui'

import { ProgressChart } from './ProgressChart.js'
import { useProjectAnalytics } from './queries.js'

export function ProjectAnalyticsPanel({ projectId }: { projectId: number }) {
  const analytics = useProjectAnalytics(projectId)

  if (analytics.isPending) {
    return (
      <section aria-label="Loading project insights" className="analytics-grid">
        <Card>
          <Skeleton lines={3} />
        </Card>
        <Card>
          <Skeleton lines={3} />
        </Card>
      </section>
    )
  }

  if (analytics.isError) {
    return (
      <Card>
        <EmptyState
          action={
            <Button onClick={() => void analytics.refetch()}>Try again</Button>
          }
          description="Progress insights could not be calculated. Task data has not changed."
          title="Insights unavailable"
        />
      </Card>
    )
  }

  const data = analytics.data
  const chartPoints = data.dailyProgress.map((day) => ({
    label: day.date,
    value: day.netProgressPoints,
  }))
  const chartDescription =
    chartPoints.length === 0
      ? 'No measured progress changes were recorded in the last 28 days.'
      : `${String(data.velocity.updateCount)} updates were recorded across ${String(data.velocity.observedDays)} observed days.`

  return (
    <section className="analytics-section" aria-labelledby="analytics-title">
      <div className="section-heading">
        <div>
          <span>Signals</span>
          <h2 id="analytics-title">Progress insights</h2>
        </div>
        <Badge tone={data.stalledTasks.length > 0 ? 'warning' : 'positive'}>
          {data.stalledTasks.length > 0
            ? `${String(data.stalledTasks.length)} stalled`
            : 'Momentum healthy'}
        </Badge>
      </div>

      <div className="analytics-metrics">
        <Card>
          <span>Completed</span>
          <strong>{String(data.completedTasks)}</strong>
          <small>{String(data.remainingTasks)} remaining</small>
        </Card>
        <Card>
          <span>Recent velocity</span>
          <strong>
            {data.velocity.state === 'available'
              ? `${String(data.velocity.pointsPerWeek)} pts/week`
              : 'Insufficient data'}
          </strong>
          <small>28-day window · measured progress only</small>
        </Card>
        <Card>
          <span>Projected completion</span>
          <strong>
            {data.projection.state === 'available'
              ? data.projection.projectedCompletionDate
              : 'Insufficient data'}
          </strong>
          <small>Shown only when recent velocity supports it</small>
        </Card>
      </div>

      <div className="analytics-grid">
        <Card className="analytics-chart-card">
          <h3>Progress gained</h3>
          {chartPoints.length > 0 ? (
            <ProgressChart
              description={chartDescription}
              points={chartPoints}
              title="Project progress gained over 28 days"
            />
          ) : (
            <EmptyState
              description={chartDescription}
              title="No recent measurements"
            />
          )}
        </Card>
        <Card className="stalled-panel">
          <h3>Stalled tasks</h3>
          {data.stalledTasks.length === 0 ? (
            <p>
              No incomplete task has gone 14 days without measured progress.
            </p>
          ) : (
            <ul>
              {data.stalledTasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.name}</strong>
                    <span>{task.status.replaceAll('_', ' ')}</span>
                  </div>
                  <span>{String(task.daysWithoutProgress)} days</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  )
}
