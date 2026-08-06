import { asc, count } from 'drizzle-orm'

import type { Pr0gbarzDatabase } from './connection.js'
import {
  progressEvents,
  projects,
  tags,
  tasks,
  taskTags,
  type ProgressEvent,
  type Project,
  type Tag,
  type Task,
} from './schema.js'

export interface DatabaseSnapshot {
  progressEvents: ProgressEvent[]
  projects: Project[]
  tags: Tag[]
  taskTags: { tagId: number; taskId: number }[]
  tasks: Task[]
}

export interface ImportableSnapshot {
  progressEvents: (Omit<ProgressEvent, 'occurredAt'> & { occurredAt: string })[]
  projects: (Omit<Project, 'archivedAt' | 'createdAt' | 'updatedAt'> & {
    archivedAt: null | string
    createdAt: string
    updatedAt: string
  })[]
  tags: (Omit<Tag, 'createdAt'> & { createdAt: string })[]
  taskTags: { tagId: number; taskId: number }[]
  tasks: (Omit<
    Task,
    'archivedAt' | 'completedAt' | 'createdAt' | 'updatedAt'
  > & {
    archivedAt: null | string
    completedAt: null | string
    createdAt: string
    updatedAt: string
  })[]
}

export type ImportConflictPolicy = 'reject' | 'replace'

export function readDatabaseSnapshot(db: Pr0gbarzDatabase): DatabaseSnapshot {
  return {
    progressEvents: db
      .select()
      .from(progressEvents)
      .orderBy(asc(progressEvents.id))
      .all(),
    projects: db.select().from(projects).orderBy(asc(projects.id)).all(),
    tags: db.select().from(tags).orderBy(asc(tags.id)).all(),
    taskTags: db
      .select()
      .from(taskTags)
      .orderBy(asc(taskTags.taskId), asc(taskTags.tagId))
      .all(),
    tasks: db.select().from(tasks).orderBy(asc(tasks.id)).all(),
  }
}

class DryRunRollback extends Error {}

export function importDatabaseSnapshot(
  db: Pr0gbarzDatabase,
  snapshot: ImportableSnapshot,
  options: { apply: boolean; conflictPolicy: ImportConflictPolicy },
): void {
  try {
    db.transaction((transaction) => {
      const projectCount = transaction
        .select({ value: count(projects.id) })
        .from(projects)
        .get()
      if (
        (projectCount?.value ?? 0) > 0 &&
        options.conflictPolicy === 'reject'
      ) {
        throw new Error(
          'The database already contains projects. Choose the replace conflict policy or import into a fresh database.',
        )
      }

      if (options.conflictPolicy === 'replace') {
        transaction.delete(progressEvents).run()
        transaction.delete(taskTags).run()
        transaction.delete(tasks).run()
        transaction.delete(tags).run()
        transaction.delete(projects).run()
      }

      if (snapshot.projects.length > 0) {
        transaction
          .insert(projects)
          .values(
            snapshot.projects.map((project) => ({
              ...project,
              archivedAt: project.archivedAt
                ? new Date(project.archivedAt)
                : null,
              createdAt: new Date(project.createdAt),
              updatedAt: new Date(project.updatedAt),
            })),
          )
          .run()
      }
      if (snapshot.tags.length > 0) {
        transaction
          .insert(tags)
          .values(
            snapshot.tags.map((tag) => ({
              ...tag,
              createdAt: new Date(tag.createdAt),
            })),
          )
          .run()
      }
      if (snapshot.tasks.length > 0) {
        transaction
          .insert(tasks)
          .values(
            snapshot.tasks.map((task) => ({
              ...task,
              archivedAt: task.archivedAt ? new Date(task.archivedAt) : null,
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt),
            })),
          )
          .run()
      }
      if (snapshot.taskTags.length > 0) {
        transaction.insert(taskTags).values(snapshot.taskTags).run()
      }
      if (snapshot.progressEvents.length > 0) {
        transaction
          .insert(progressEvents)
          .values(
            snapshot.progressEvents.map((event) => ({
              ...event,
              occurredAt: new Date(event.occurredAt),
            })),
          )
          .run()
      }

      if (!options.apply) throw new DryRunRollback()
    })
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error
  }
}
