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
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/calculate') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: '=' }).click()
  const response = await responsePromise
  expect(response.status()).toBe(422)
  expect(await response.json()).toMatchObject({ code: 'invalid_expression' })

  await expect(page.getByRole('alert')).toContainText('division by zero')
})

test('fits the viewport and repeats equals twenty times', async ({ page }) => {
  await page.goto('/')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('textbox', { name: 'Expression' }).fill('2 + 3')
  for (let count = 1; count <= 20; count++) {
    await page.getByRole('button', { name: '=' }).click()
    await expect(page.locator('.output strong')).toHaveText(
      String(2 + 3 * count),
    )
  }
})
