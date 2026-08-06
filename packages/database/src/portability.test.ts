import { count } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { openDatabase, type DatabaseConnection } from './connection.js'
import {
  importDatabaseSnapshot,
  type ImportableSnapshot,
} from './portability.js'
import { projects } from './schema.js'

const connections: DatabaseConnection[] = []
const directories: string[] = []

afterEach(async () => {
  connections.splice(0).forEach((connection) => {
    connection.close()
  })
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('database portability', () => {
  it('rolls back every imported record after an integrity failure', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'pr0gbarz-import-'))
    directories.push(directory)
    const connection = await openDatabase({
      databasePath: path.join(directory, 'target.sqlite'),
    })
    connections.push(connection)
    const now = '2026-08-06T12:00:00.000Z'
    const snapshot: ImportableSnapshot = {
      progressEvents: [],
      projects: [
        {
          accentColor: null,
          archivedAt: null,
          createdAt: now,
          description: null,
          id: 1,
          name: 'Should roll back',
          sortPosition: 0,
          startDate: null,
          targetDate: null,
          updatedAt: now,
        },
      ],
      tags: [],
      taskTags: [],
      tasks: [
        {
          archivedAt: null,
          completedAt: null,
          createdAt: now,
          description: null,
          dueDate: null,
          id: 1,
          name: 'Broken reference',
          priority: 'none',
          progress: 0,
          projectId: 999,
          sortPosition: 0,
          startDate: null,
          status: 'backlog',
          updatedAt: now,
        },
      ],
    }

    expect(() => {
      importDatabaseSnapshot(connection.db, snapshot, {
        apply: true,
        conflictPolicy: 'reject',
      })
    }).toThrow(/insert into "tasks"/)
    const projectCount = connection.db
      .select({ value: count(projects.id) })
      .from(projects)
      .get()
    expect(projectCount?.value ?? 0).toBe(0)
  })
})
