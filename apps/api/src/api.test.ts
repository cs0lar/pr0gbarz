import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { openDatabase } from '@pr0gbarz/database'

import { buildApp } from './app.js'

type TestApp = Awaited<ReturnType<typeof buildApp>>

const apps: TestApp[] = []
const temporaryDirectories: string[] = []
const fixedNow = new Date('2026-08-04T12:00:00.000Z')

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()))
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

async function createTestApp(
  options: { bodyLimit?: number } = {},
): Promise<TestApp> {
  const directory = await mkdtemp(path.join(tmpdir(), 'pr0gbarz-api-'))
  temporaryDirectories.push(directory)
  const database = await openDatabase({
    databasePath: path.join(directory, 'test.sqlite'),
  })
  const app = await buildApp({
    database,
    now: () => new Date(fixedNow),
    staticRoot: false,
    ...(options.bodyLimit === undefined
      ? {}
      : { bodyLimit: options.bodyLimit }),
  })
  apps.push(app)
  return app
}

async function createProject(app: TestApp, name = 'Launch') {
  const response = await app.inject({
    method: 'POST',
    payload: { name },
    url: '/api/v1/projects',
  })
  expect(response.statusCode).toBe(201)
  return response.json<{ id: number }>()
}

async function createTask(
  app: TestApp,
  projectId: number,
  payload: Record<string, unknown> = { name: 'Ship API' },
) {
  const response = await app.inject({
    method: 'POST',
    payload,
    url: `/api/v1/projects/${projectId}/tasks`,
  })
  expect(response.statusCode).toBe(201)
  return response.json<{ id: number }>()
}

describe('system API', () => {
  it('returns a stable error when a request exceeds the body limit', async () => {
    const app = await createTestApp({ bodyLimit: 64 })
    const response = await app.inject({
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      payload: JSON.stringify({ value: 'x'.repeat(100) }),
      url: '/api/v1/import/json',
    })

    expect(response.statusCode).toBe(413)
    expect(response.json()).toEqual({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'The request body exceeds the configured size limit.',
    })
  })

  it('reports database readiness', async () => {
    const app = await createTestApp()

    const response = await app.inject({ method: 'GET', url: '/ready' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ database: 'ready', status: 'ok' })
  })

  it('returns a consistent not-found envelope', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/not-a-resource',
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    })
  })
})

describe('portability API', () => {
  it('round-trips JSON through dry-run and transactional import', async () => {
    const source = await createTestApp()
    const project = await createProject(source, 'Portable project')
    const task = await createTask(source, project.id, {
      description: 'Preserve this text.',
      name: 'Portable task',
      progress: 40,
      progressNote: 'First measured checkpoint.',
      status: 'in_progress',
    })
    const tag = await source.inject({
      method: 'POST',
      payload: { label: 'Release' },
      url: '/api/v1/tags',
    })
    await source.inject({
      method: 'PUT',
      url: `/api/v1/tasks/${task.id}/tags/${String(tag.json<{ id: number }>().id)}`,
    })

    const exported = await source.inject({
      method: 'GET',
      url: '/api/v1/export/json',
    })
    expect(exported.statusCode).toBe(200)
    const backup = exported.json<Record<string, unknown>>()
    const target = await createTestApp()
    const dryRun = await target.inject({
      method: 'POST',
      payload: { backup, conflictPolicy: 'reject', mode: 'dry_run' },
      url: '/api/v1/import/json',
    })
    expect(dryRun.statusCode, dryRun.body).toBe(200)
    expect(dryRun.json()).toMatchObject({ applied: false, valid: true })
    const stillEmpty = await target.inject({
      method: 'GET',
      url: '/api/v1/projects',
    })
    expect(stillEmpty.json()).toMatchObject({ total: 0 })

    const applied = await target.inject({
      method: 'POST',
      payload: { backup, conflictPolicy: 'reject', mode: 'apply' },
      url: '/api/v1/import/json',
    })
    expect(applied.statusCode).toBe(200)
    expect(applied.json()).toMatchObject({ applied: true, valid: true })

    const conflict = await target.inject({
      method: 'POST',
      payload: { backup, conflictPolicy: 'reject', mode: 'apply' },
      url: '/api/v1/import/json',
    })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json()).toMatchObject({ code: 'CONFLICT' })

    const reexported = await target.inject({
      method: 'GET',
      url: '/api/v1/export/json',
    })
    expect(reexported.json()).toMatchObject({
      data: exported.json<{ data: unknown }>().data,
      integrity: exported.json<{ integrity: unknown }>().integrity,
    })
  })

  it('rejects altered imports without partially writing', async () => {
    const source = await createTestApp()
    await createProject(source, 'Untampered name')
    const exported = await source.inject({
      method: 'GET',
      url: '/api/v1/export/json',
    })
    const backup = exported.json<{
      data: { projects: { name: string }[] }
    }>()
    const exportedProject = backup.data.projects[0]
    if (!exportedProject) throw new Error('Expected an exported project')
    exportedProject.name = 'Tampered name'

    const target = await createTestApp()
    const response = await target.inject({
      method: 'POST',
      payload: { backup, conflictPolicy: 'reject', mode: 'apply' },
      url: '/api/v1/import/json',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'INVALID_IMPORT' })
    const list = await target.inject({ method: 'GET', url: '/api/v1/projects' })
    expect(list.json()).toMatchObject({ total: 0 })
  })

  it('exports quoted CSV and security headers', async () => {
    const app = await createTestApp()
    const project = await createProject(app, 'Project, one')
    await createTask(app, project.id, { name: 'Task "quoted"' })

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/export/tasks.csv?projectId=${String(project.id)}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.body).toContain('"Project, one"')
    expect(response.body).toContain('"Task ""quoted"""')
  })
})

describe('project API', () => {
  it('validates input before it reaches persistence', async () => {
    const app = await createTestApp()

    const invalid = await app.inject({
      method: 'POST',
      payload: { name: '   ', unexpected: true },
      url: '/api/v1/projects',
    })
    const list = await app.inject({ method: 'GET', url: '/api/v1/projects' })

    expect(invalid.statusCode).toBe(400)
    expect(invalid.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(list.json()).toMatchObject({ items: [], total: 0 })
  })

  it('creates, reads, searches, updates, archives, and restores projects', async () => {
    const app = await createTestApp()
    const alpha = await createProject(app, 'Alpha')
    await createProject(app, 'Beta')

    const search = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?search=Al&sort=name&direction=desc&limit=10&offset=0',
    })
    expect(search.statusCode).toBe(200)
    expect(search.json()).toMatchObject({
      items: [{ id: alpha.id, name: 'Alpha' }],
      limit: 10,
      offset: 0,
      total: 1,
    })

    const update = await app.inject({
      method: 'PATCH',
      payload: {
        accentColor: '#7357ff',
        description: 'A focused launch',
        targetDate: '2026-08-20',
      },
      url: `/api/v1/projects/${alpha.id}`,
    })
    expect(update.statusCode).toBe(200)
    expect(update.json()).toMatchObject({
      accentColor: '#7357ff',
      description: 'A focused launch',
      scheduleHealth: 'insufficient_data',
      targetDate: '2026-08-20',
    })

    const manualOrder = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?sort=manual',
    })
    expect(manualOrder.json()).toMatchObject({
      items: [
        { name: 'Alpha', sortPosition: 0 },
        { name: 'Beta', sortPosition: 1 },
      ],
    })

    const archive = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${alpha.id}`,
    })
    expect(archive.statusCode).toBe(204)

    const archived = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?archived=true',
    })
    expect(archived.json()).toMatchObject({
      items: [{ id: alpha.id }],
      total: 1,
    })

    const restore = await app.inject({
      method: 'PATCH',
      payload: { archived: false },
      url: `/api/v1/projects/${alpha.id}`,
    })
    expect(restore.statusCode).toBe(200)
    expect(restore.json()).toMatchObject({ archivedAt: null })
  })

  it('returns 404 and domain conflicts with stable envelopes', async () => {
    const app = await createTestApp()

    const missing = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/999',
    })
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toEqual({
      code: 'NOT_FOUND',
      message: 'Project was not found.',
    })

    const project = await createProject(app)
    const conflict = await app.inject({
      method: 'PATCH',
      payload: { startDate: '2026-08-20', targetDate: '2026-08-10' },
      url: `/api/v1/projects/${project.id}`,
    })
    expect(conflict.statusCode).toBe(409)
    expect(conflict.json()).toMatchObject({ code: 'INVALID_STATE' })
  })

  it('reports schedule health without inventing a projection', async () => {
    const app = await createTestApp()
    const created = await app.inject({
      method: 'POST',
      payload: {
        name: 'Scheduled launch',
        startDate: '2026-07-01',
        targetDate: '2026-08-31',
      },
      url: '/api/v1/projects',
    })
    const project = created.json<{ id: number }>()
    const task = await createTask(app, project.id, {
      name: 'Prepare release',
      progress: 40,
    })

    expect(created.json()).toMatchObject({
      scheduleHealth: 'insufficient_data',
    })

    const atRisk = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    })
    expect(atRisk.json()).toMatchObject({ scheduleHealth: 'at_risk' })

    await app.inject({
      method: 'PATCH',
      payload: { progress: 50 },
      url: `/api/v1/tasks/${task.id}`,
    })
    const onTrack = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    })
    expect(onTrack.json()).toMatchObject({ scheduleHealth: 'on_track' })

    const overdue = await app.inject({
      method: 'PATCH',
      payload: { targetDate: '2026-08-03' },
      url: `/api/v1/projects/${project.id}`,
    })
    expect(overdue.json()).toMatchObject({ scheduleHealth: 'overdue' })

    const complete = await app.inject({
      method: 'PATCH',
      payload: { status: 'completed' },
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(complete.statusCode).toBe(200)
    const completedProject = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    })
    expect(completedProject.json()).toMatchObject({
      scheduleHealth: 'complete',
    })
  })
})

describe('task, tag, history, and dashboard API', () => {
  it('manages tasks, progress history, tags, filters, and aggregates', async () => {
    const app = await createTestApp()
    const project = await createProject(app)
    const task = await createTask(app, project.id, {
      dueDate: '2026-08-03',
      name: 'Ship API',
      priority: 'high',
    })
    await createTask(app, project.id, {
      name: 'Resolve blocker',
      status: 'blocked',
    })
    await createTask(app, project.id, {
      name: 'Already complete',
      progress: 25,
      status: 'completed',
    })

    const progress = await app.inject({
      method: 'PATCH',
      payload: { note: 'Core routes working', progress: 40 },
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(progress.statusCode).toBe(200)
    expect(progress.json()).toMatchObject({ progress: 40 })

    const history = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task.id}/progress-events`,
    })
    expect(history.statusCode).toBe(200)
    expect(history.json()).toMatchObject({
      items: [
        {
          newProgress: 40,
          note: 'Core routes working',
          previousProgress: 0,
        },
      ],
      total: 1,
    })

    const createdTag = await app.inject({
      method: 'POST',
      payload: { color: '#22aa88', label: 'Backend Work' },
      url: '/api/v1/tags',
    })
    expect(createdTag.statusCode).toBe(201)
    const tag = createdTag.json<{ id: number }>()

    const duplicateTag = await app.inject({
      method: 'POST',
      payload: { label: ' backend   work ' },
      url: '/api/v1/tags',
    })
    expect(duplicateTag.statusCode).toBe(409)

    const tags = await app.inject({ method: 'GET', url: '/api/v1/tags' })
    expect(tags.statusCode).toBe(200)
    expect(tags.json()).toMatchObject({
      items: [{ id: tag.id, normalizedName: 'backend-work' }],
    })

    const assignment = await app.inject({
      method: 'PUT',
      url: `/api/v1/tasks/${task.id}/tags/${tag.id}`,
    })
    expect(assignment.statusCode).toBe(200)
    expect(assignment.json()).toMatchObject({
      tags: [{ id: tag.id, normalizedName: 'backend-work' }],
    })

    const filtered = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}/tasks?tagId=${tag.id}&priority=high&sort=progress&direction=desc`,
    })
    expect(filtered.statusCode).toBe(200)
    expect(filtered.json()).toMatchObject({
      items: [{ id: task.id }],
      total: 1,
    })

    const projectDetail = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    })
    expect(projectDetail.json()).toMatchObject({
      completion: 46.67,
      taskCount: 3,
    })

    const analytics = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}/analytics`,
    })
    expect(analytics.statusCode).toBe(200)
    expect(analytics.json()).toMatchObject({
      completedTasks: 1,
      projectId: project.id,
      remainingTasks: 2,
      velocity: { state: 'insufficient_data', windowDays: 28 },
    })

    const manualOrder = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}/tasks?sort=manual`,
    })
    expect(manualOrder.json()).toMatchObject({
      items: [
        { name: 'Ship API', sortPosition: 0 },
        { name: 'Resolve blocker', sortPosition: 1 },
        { name: 'Already complete', sortPosition: 2 },
      ],
    })

    const dashboard = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
    })
    expect(dashboard.statusCode).toBe(200)
    expect(dashboard.json()).toMatchObject({
      activeProjects: 1,
      averageProgress: 46.67,
      blockedTasks: 1,
      completedTasks: 1,
      overdueTasks: 1,
      recentProgress: [
        {
          newProgress: 40,
          note: 'Core routes working',
          previousProgress: 0,
          projectName: 'Launch',
          taskName: 'Ship API',
        },
        {
          newProgress: 100,
          previousProgress: 0,
          projectName: 'Launch',
          taskName: 'Already complete',
        },
      ],
      totalTasks: 3,
    })

    const removal = await app.inject({
      method: 'DELETE',
      url: `/api/v1/tasks/${task.id}/tags/${tag.id}`,
    })
    expect(removal.statusCode).toBe(204)

    const archive = await app.inject({
      method: 'DELETE',
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(archive.statusCode).toBe(204)

    const archived = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}/tasks?archived=true`,
    })
    expect(archived.json()).toMatchObject({
      items: [{ id: task.id }],
      total: 1,
    })

    const restore = await app.inject({
      method: 'PATCH',
      payload: { archived: false },
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(restore.statusCode).toBe(200)
    expect(restore.json()).toMatchObject({ archivedAt: null })
  })

  it('enforces completed-task transition rules', async () => {
    const app = await createTestApp()
    const project = await createProject(app)
    const task = await createTask(app, project.id, {
      name: 'Complete task',
      status: 'completed',
    })

    const completed = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(completed.json()).toMatchObject({
      completedAt: fixedNow.toISOString(),
      progress: 100,
      status: 'completed',
    })

    const invalid = await app.inject({
      method: 'PATCH',
      payload: { progress: 50 },
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(invalid.statusCode).toBe(409)
    expect(invalid.json()).toMatchObject({ code: 'INVALID_STATE' })

    const reopened = await app.inject({
      method: 'PATCH',
      payload: { progress: 50, status: 'in_progress' },
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(reopened.statusCode).toBe(200)
    expect(reopened.json()).toMatchObject({
      completedAt: null,
      progress: 50,
      status: 'in_progress',
    })
  })

  it('rolls back task progress when history persistence fails', async () => {
    const app = await createTestApp()
    const project = await createProject(app)
    const task = await createTask(app, project.id)

    // Inject a storage failure after the task update but before transaction commit.
    // Reach the test database through a setup-only route-free handle by creating a trigger
    // before the request. The connection itself remains owned by Fastify.
    const directory = temporaryDirectories.at(-1)
    if (!directory) {
      throw new Error('Test database directory was not created')
    }
    const direct = await openDatabase({
      databasePath: path.join(directory, 'test.sqlite'),
    })
    direct.client.exec(`
      CREATE TRIGGER fail_progress_history
      BEFORE INSERT ON progress_events
      BEGIN
        SELECT RAISE(ABORT, 'injected progress history failure');
      END;
    `)
    direct.close()

    const failed = await app.inject({
      method: 'PATCH',
      payload: { progress: 60 },
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(failed.statusCode).toBe(500)
    expect(failed.json()).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    })

    const unchanged = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task.id}`,
    })
    expect(unchanged.json()).toMatchObject({ progress: 0 })
  })
})
