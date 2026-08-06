import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('creates and opens a project with keyboard-accessible controls', async ({
  page,
}) => {
  let project: Record<string, unknown> | undefined
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname === '/api/v1/projects' && request.method() === 'POST') {
      project = {
        accentColor: null,
        archivedAt: null,
        completion: null,
        createdAt: '2026-08-06T12:00:00.000Z',
        description: null,
        id: 1,
        name: 'Cross-browser release',
        scheduleHealth: 'insufficient_data',
        sortPosition: 0,
        startDate: null,
        targetDate: null,
        taskCount: 0,
        updatedAt: '2026-08-06T12:00:00.000Z',
      }
      await route.fulfill({ json: project, status: 201 })
      return
    }
    if (url.pathname === '/api/v1/projects' && request.method() === 'GET') {
      await route.fulfill({
        json: {
          items: project ? [project] : [],
          limit: 100,
          offset: 0,
          total: project ? 1 : 0,
        },
      })
      return
    }
    if (url.pathname === '/api/v1/projects/1') {
      await route.fulfill({ json: project })
      return
    }
    if (url.pathname === '/api/v1/projects/1/tasks') {
      await route.fulfill({
        json: { items: [], limit: 200, offset: 0, total: 0 },
      })
      return
    }
    if (url.pathname === '/api/v1/projects/1/analytics') {
      await route.fulfill({
        json: {
          completedTasks: 0,
          dailyProgress: [],
          generatedAt: '2026-08-06T12:00:00.000Z',
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
    if (url.pathname === '/api/v1/tags') {
      await route.fulfill({ json: { items: [] } })
      return
    }
    await route.fulfill({
      json: { code: 'NOT_FOUND', message: 'Not found.' },
      status: 404,
    })
  })

  await page.goto('/projects')
  const newProject = page.getByRole('button', { name: 'New project' }).last()
  await newProject.focus()
  await page.keyboard.press('Enter')
  await page
    .getByRole('textbox', { name: 'Name' })
    .fill('Cross-browser release')
  await page.getByRole('button', { name: 'Create project' }).click()
  const projectLink = page.getByRole('link', { name: 'Cross-browser release' })
  await projectLink.focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/projects\/1$/)
  await expect(
    page.getByRole('heading', { name: 'Cross-browser release' }),
  ).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
})
