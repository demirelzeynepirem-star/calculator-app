import { expect, test } from '@playwright/test'

test('continues from the last result using the keypad', async ({ page }) => {
  await page.goto('/')
  const expression = page.getByRole('textbox', { name: 'Expression' })
  await expression.fill('2 + 3')
  await expression.press('Enter')
  await expect(page.locator('.output strong')).toHaveText('5')

  await page.getByRole('button', { name: '×' }).click()
  await page.getByRole('button', { name: '4' }).click()
  await expect(expression).toHaveValue('5 * 4')
  await page.getByRole('button', { name: '=' }).click()
  await expect(page.locator('.output strong')).toHaveText('20')
})

for (const scenario of [
  { expression: '0 - 2', result: '-2', next: '^2', answer: '4' },
  {
    expression: '1 / 10000000',
    result: '1e-7',
    next: '*10',
    answer: '0.000001',
  },
  {
    expression: '10 ^ 21',
    result: '1e+21',
    next: '/10',
    answer: '100000000000000000000',
  },
]) {
  test(
    'continues from ' + scenario.expression + ' with the keyboard',
    async ({ page }) => {
      await page.goto('/')
      const expression = page.getByRole('textbox', { name: 'Expression' })
      await expression.fill(scenario.expression)
      await expression.press('Enter')
      await expect(page.locator('.output strong')).toHaveText(scenario.result)
      await expression.pressSequentially(scenario.next)
      await expression.press('Enter')
      await expect(page.locator('.output strong')).toHaveText(scenario.answer)
    },
  )
}

test('calculates an expression through the real browser and API', async ({
  page,
}) => {
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
