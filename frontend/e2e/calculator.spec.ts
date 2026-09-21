import { expect, test } from '@playwright/test'

test('calculates an expression through the real browser and API', async ({ page }) => {
  await page.goto('/')

  const expression = page.getByRole('textbox', { name: 'Expression' })
  await expression.fill('(3 + 5) * 2')
  await page.getByRole('button', { name: '=' }).click()

  await expect(page.locator('.output strong')).toHaveText('16')
})

test('shows a backend validation error', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('textbox', { name: 'Expression' }).fill('1 / 0')
  await page.getByRole('button', { name: '=' }).click()

  await expect(page.getByRole('alert')).toContainText('division by zero')
})
