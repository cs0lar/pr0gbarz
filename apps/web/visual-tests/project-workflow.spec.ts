import { expect, test } from '@playwright/test'

test('creates, edits, deep-links, archives, and restores a project', async ({
  page,
}) => {
  let project: Record<string, unknown> | undefined
  let archived = false

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()

    if (url.pathname === '/api/v1/projects' && method === 'GET') {
      const wantsArchived = url.searchParams.get('archived') === 'true'
      await route.fulfill({
        json: {
          items:
            project && wantsArchived === archived
              ? [
                  {
                    ...project,
                    archivedAt: archived ? '2026-08-05T10:00:00.000Z' : null,
                  },
                ]
              : [],
          limit: 100,
          offset: 0,
          total: project && wantsArchived === archived ? 1 : 0,
        },
      })
      return
    }
    if (url.pathname === '/api/v1/projects' && method === 'POST') {
      const input = request.postDataJSON() as Record<string, unknown>
      project = {
        accentColor: input.accentColor ?? null,
        archivedAt: null,
        completion: null,
        createdAt: '2026-08-05T09:00:00.000Z',
        description: input.description ?? null,
        id: 1,
        name: input.name,
        scheduleHealth: 'insufficient_data',
        sortPosition: 0,
        startDate: input.startDate ?? null,
        targetDate: input.targetDate ?? null,
        taskCount: 0,
        updatedAt: '2026-08-05T09:00:00.000Z',
      }
      await route.fulfill({ json: project, status: 201 })
      return
    }
    if (url.pathname === '/api/v1/projects/1' && method === 'GET') {
      await route.fulfill({ json: project })
      return
    }
    if (url.pathname === '/api/v1/projects/1/analytics' && method === 'GET') {
      await route.fulfill({
        json: {
          completedTasks: 0,
          dailyProgress: [],
          generatedAt: '2026-08-05T12:00:00.000Z',
          projectId: 1,
          projection: {
            projectedCompletionDate: null,
            state: 'insufficient_data',
          },
          remainingTasks: 0,
          stalledTasks: [],
          velocity: {
            observedDays: 0,
            pointsPerWeek: null,
            state: 'insufficient_data',
            updateCount: 0,
            windowDays: 28,
          },
        },
      })
      return
    }
    if (url.pathname === '/api/v1/projects/1' && method === 'PATCH') {
      const input = request.postDataJSON() as Record<string, unknown>
      archived = input.archived === false ? false : archived
      project = {
        ...project,
        ...input,
        archivedAt: archived ? '2026-08-05T10:00:00.000Z' : null,
      }
      await route.fulfill({ json: project })
      return
    }
    if (url.pathname === '/api/v1/projects/1' && method === 'DELETE') {
      archived = true
      await route.fulfill({ status: 204 })
      return
    }
    if (url.pathname === '/api/v1/projects/1/tasks') {
      await route.fulfill({
        json: { items: [], limit: 100, offset: 0, total: 0 },
      })
      return
    }
    await route.fulfill({
      json: { code: 'NOT_FOUND', message: 'Not found' },
      status: 404,
    })
  })

  await page.goto('/projects')
  await page.getByRole('button', { name: 'New project' }).last().click()
  await page.getByRole('textbox', { name: 'Name' }).fill('House renovation')
  await page.getByLabel('Description').fill('Create a calmer place to live.')
  await page.getByRole('button', { name: 'Create project' }).click()
  await expect(
    page.getByRole('link', { name: 'House renovation' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('textbox', { name: 'Name' }).fill('Home renovation')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(
    page.getByRole('link', { name: 'Home renovation' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Home renovation' }).click()
  await expect(page).toHaveURL(/\/projects\/1$/)
  await expect(
    page.getByRole('heading', { name: 'Home renovation' }),
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/projects$/)

  await page.getByRole('button', { name: 'Archive' }).click()
  await page.getByRole('button', { name: 'Archive project' }).click()
  await expect(page.getByText('Home renovation archived.')).toBeVisible()

  await page.getByRole('link', { name: 'Archive' }).click()
  await page.getByRole('button', { name: 'Restore' }).click()
  await expect(page.getByText('Home renovation restored.')).toBeVisible()
})
