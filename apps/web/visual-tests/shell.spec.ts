import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('shell fits its viewport and matches the visual baseline', async ({
  page,
}) => {
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
