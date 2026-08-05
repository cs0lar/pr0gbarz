import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const visualProject = {
  accentColor: '#5b45d6',
  archivedAt: null,
  completion: 64,
  createdAt: '2026-08-05T09:00:00.000Z',
  description: 'Prepare the focused v2 launch.',
  id: 1,
  name: 'Launch pr0gbarz 2.0',
  scheduleHealth: 'on_track',
  sortPosition: 0,
  startDate: '2026-08-01',
  targetDate: '2026-09-01',
  taskCount: 8,
  updatedAt: '2026-08-05T09:00:00.000Z',
}

async function mockDashboard(page: Page) {
  await page.route('**/api/v1/dashboard', async (route) => {
    await route.fulfill({
      json: {
        activeProjects: 1,
        averageProgress: 64,
        blockedTasks: 1,
        completedTasks: 3,
        overdueTasks: 0,
        recentProgress: [],
        totalTasks: 8,
      },
    })
  })
  await page.route('**/api/v1/projects?**', async (route) => {
    await route.fulfill({
      json: { items: [visualProject], limit: 4, offset: 0, total: 1 },
    })
  })
}

test('shell fits its viewport and matches the visual baseline', async ({
  page,
}) => {
  await mockDashboard(page)
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Good morning.' }),
  ).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await expect(page).toHaveScreenshot('shell-light.png', { fullPage: true })
})

test('dark theme matches the visual baseline', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pr0gbarz-theme', 'dark')
  })
  await page.goto('/components')
  await expect(
    page.getByRole('heading', { name: 'Interface system' }),
  ).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await expect(page).toHaveScreenshot('components-dark.png', { fullPage: true })
})
