import type { ProjectResponse } from '@pr0gbarz/contracts'
import { Badge, Button, Card, Progress } from '@pr0gbarz/ui'
import { Link } from 'react-router'
import type { CSSProperties } from 'react'

import { healthLabels, healthTone } from './schedule-health.js'

export interface ProjectCardProps {
  canMoveDown?: boolean
  canMoveUp?: boolean
  onArchive?: ((project: ProjectResponse) => void) | undefined
  onEdit?: ((project: ProjectResponse) => void) | undefined
  onMove?: ((project: ProjectResponse, direction: -1 | 1) => void) | undefined
  onRestore?: ((project: ProjectResponse) => void) | undefined
  project: ProjectResponse
}

export function ProjectCard({
  canMoveDown,
  canMoveUp,
  onArchive,
  onEdit,
  onMove,
  onRestore,
  project,
}: ProjectCardProps) {
  return (
    <Card
      className="project-card"
      style={
        {
          '--project-accent': project.accentColor ?? '#5b45d6',
        } as CSSProperties
      }
    >
      <div className="project-card__accent" aria-hidden="true" />
      <div className="project-card__body">
        <div className="project-card__heading">
          <div>
            <Link to={`/projects/${String(project.id)}`}>{project.name}</Link>
            <p>{project.description ?? 'No description yet.'}</p>
          </div>
          <Badge tone={healthTone(project.scheduleHealth)}>
            {healthLabels[project.scheduleHealth]}
          </Badge>
        </div>
        <div className="project-card__progress">
          <div>
            <span>Progress</span>
            <strong>
              {project.completion === null
                ? 'Not measured'
                : `${String(Math.round(project.completion))}%`}
            </strong>
          </div>
          <Progress
            label={`${project.name} progress`}
            value={project.completion ?? 0}
          />
        </div>
        <div className="project-card__meta">
          <span>
            {String(project.taskCount)}{' '}
            {project.taskCount === 1 ? 'task' : 'tasks'}
          </span>
          <span>
            {project.targetDate
              ? `Due ${project.targetDate}`
              : 'No target date'}
          </span>
        </div>
        <div className="project-card__actions">
          {onMove ? (
            <div className="move-actions" aria-label={`Move ${project.name}`}>
              <Button
                aria-label={`Move ${project.name} up`}
                disabled={!canMoveUp}
                onClick={() => {
                  onMove(project, -1)
                }}
                size="compact"
                variant="ghost"
              >
                ↑
              </Button>
              <Button
                aria-label={`Move ${project.name} down`}
                disabled={!canMoveDown}
                onClick={() => {
                  onMove(project, 1)
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
                onEdit(project)
              }}
              size="compact"
              variant="ghost"
            >
              Edit
            </Button>
          ) : null}
          {onArchive ? (
            <Button
              onClick={() => {
                onArchive(project)
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
                onRestore(project)
              }}
              size="compact"
              variant="secondary"
            >
              Restore
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
