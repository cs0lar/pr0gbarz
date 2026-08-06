import { expect, test } from '@playwright/test'

test('manages tasks across desktop and mobile layouts', async ({ page }) => {
  const project = {
    accentColor: '#5b45d6',
    archivedAt: null,
    completion: 35,
    createdAt: '2026-08-05T09:00:00.000Z',
    description: 'Prepare a polished self-hosted release.',
    id: 1,
    name: 'Launch pr0gbarz 2.0',
    scheduleHealth: 'on_track',
    sortPosition: 0,
    startDate: '2026-08-01',
    targetDate: '2026-09-01',
    taskCount: 2,
    updatedAt: '2026-08-05T09:00:00.000Z',
  }
  const baseTask = {
    archivedAt: null as string | null,
    completedAt: null,
    createdAt: '2026-08-05T09:00:00.000Z',
    description: 'Verify every critical interaction.',
    dueDate: '2026-08-20',
    id: 1,
    name: 'Test the task workspace',
    priority: 'high',
    progress: 30,
    projectId: 1,
    sortPosition: 0,
    startDate: '2026-08-05',
    status: 'in_progress',
    tags: [
      { color: '#5b45d6', id: 1, label: 'Release', normalizedName: 'release' },
    ],
    updatedAt: '2026-08-05T09:00:00.000Z',
  }
  let tasks = [baseTask]
  const analytics = {
    completedTasks: 0,
    dailyProgress: [
      { date: '2026-07-28', netProgressPoints: 10, updates: 1 },
      { date: '2026-08-05', netProgressPoints: 20, updates: 1 },
    ],
    generatedAt: '2026-08-05T12:00:00.000Z',
    projectId: 1,
    projection: {
      projectedCompletionDate: '2026-09-15',
      state: 'available',
    },
    remainingTasks: 1,
    stalledTasks: [],
    velocity: {
      observedDays: 8,
      pointsPerWeek: 26.25,
      state: 'available',
      updateCount: 2,
      windowDays: 28,
    },
  }

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    if (path === '/api/v1/projects/1/analytics') {
      await route.fulfill({ json: analytics })
      return
    }
    if (path === '/api/v1/projects/1') {
      await route.fulfill({
        json: {
          ...project,
          taskCount: tasks.filter((task) => !task.archivedAt).length,
        },
      })
      return
    }
    if (path === '/api/v1/tags') {
      await route.fulfill({ json: { items: baseTask.tags } })
      return
    }
    if (path === '/api/v1/projects/1/tasks' && request.method() === 'POST') {
      const input = request.postDataJSON() as Record<string, unknown>
      const created = {
        ...baseTask,
        ...input,
        description: null,
        dueDate: null,
        id: 2,
        name: String(input.name),
        priority: 'none',
        progress: 0,
        sortPosition: 1,
        startDate: null,
        status: 'backlog',
        tags: [],
      }
      tasks = [...tasks, created]
      await route.fulfill({ json: created, status: 201 })
      return
    }
    if (path === '/api/v1/projects/1/tasks') {
      const archived = url.searchParams.get('archived') === 'true'
      const items = tasks.filter(
        (task) => Boolean(task.archivedAt) === archived,
      )
      await route.fulfill({
        json: { items, limit: 200, offset: 0, total: items.length },
      })
      return
    }
    if (path.startsWith('/api/v1/tasks/') && request.method() === 'PATCH') {
      const id = Number(path.split('/')[4])
      const input = request.postDataJSON() as Record<string, unknown>
      tasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...input,
              archivedAt: input.archived === false ? null : task.archivedAt,
              progress:
                input.status === 'completed'
                  ? 100
                  : Number(input.progress ?? task.progress),
            }
          : task,
      )
      await route.fulfill({ json: tasks.find((task) => task.id === id) })
      return
    }
    if (path === '/api/v1/tasks/1/progress-events') {
      await route.fulfill({
        json: {
          items: [
            {
              id: 2,
              newProgress: 30,
              note: 'Browser flow verified.',
              occurredAt: '2026-08-05T11:00:00.000Z',
              previousProgress: 10,
              taskId: 1,
            },
            {
              id: 1,
              newProgress: 10,
              note: null,
              occurredAt: '2026-07-28T11:00:00.000Z',
              previousProgress: 0,
              taskId: 1,
            },
          ],
          limit: 100,
          offset: 0,
          total: 2,
        },
      })
      return
    }
    if (path.startsWith('/api/v1/tasks/') && request.method() === 'DELETE') {
      const id = Number(path.split('/')[4])
      tasks = tasks.map((task) =>
        task.id === id
          ? { ...task, archivedAt: '2026-08-05T12:00:00.000Z' }
          : task,
      )
      await route.fulfill({ status: 204 })
      return
    }
    if (path.includes('/tags/') && request.method() === 'PUT') {
      const id = Number(path.split('/')[4])
      tasks = tasks.map((task) =>
        task.id === id ? { ...task, tags: baseTask.tags } : task,
      )
      await route.fulfill({ json: tasks.find((task) => task.id === id) })
      return
    }
    await route.fulfill({
      json: { code: 'NOT_FOUND', message: 'Not found' },
      status: 404,
    })
  })

  await page.goto('/projects/1')
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(page.locator('body')).toHaveScreenshot('task-workspace.png', {
    animations: 'disabled',
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  const history = page.getByRole('button', { name: 'History' })
  await history.evaluate((element) => {
    element.scrollIntoView({ block: 'center' })
  })
  await history.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('img', {
      name: /Test the task workspace measured progress/,
    }),
  ).toBeVisible()
  await expect(page.getByText('Browser flow verified.')).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  const newTask = page.getByRole('button', { name: 'New task' })
  await newTask.evaluate((element) => {
    element.scrollIntoView({ block: 'center' })
  })
  await newTask.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('textbox', { name: 'Name' }).fill('Write release notes')
  await page.getByRole('button', { name: 'Create task' }).click()
  await expect(page.getByText('Write release notes saved.')).toBeVisible()

  const increase = page.getByRole('button', {
    name: 'Increase Write release notes progress by 10',
  })
  await increase.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Write release notes is now 10% complete.'),
  ).toBeVisible()
  await page
    .getByLabel('Status for Write release notes')
    .selectOption('blocked')
  await expect(
    page.getByText('Write release notes moved to blocked.'),
  ).toBeVisible()

  await page.getByPlaceholder('Search tasks…').fill('release notes')
  await expect(page).toHaveURL(/taskSearch=release\+notes/)
  const clearFilters = page.getByRole('button', { name: 'Clear filters' })
  await clearFilters.focus()
  await page.keyboard.press('Enter')

  const card = page
    .getByRole('heading', { name: 'Write release notes' })
    .locator('xpath=ancestor::article')
  const archive = card.getByRole('button', { name: 'Archive' })
  await archive.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Archive task' }).click()
  await expect(page.getByText('Write release notes archived.')).toBeVisible()
  const viewArchive = page.getByRole('button', { name: 'View archive' })
  await viewArchive.focus()
  await page.keyboard.press('Enter')
  const restore = page.getByRole('button', { name: 'Restore' })
  await restore.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Write release notes restored.')).toBeVisible()
})
