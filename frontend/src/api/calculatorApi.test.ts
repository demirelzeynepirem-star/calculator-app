import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculate, CalculatorApiError } from './calculatorApi'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('calculate', () => {
  it('returns a validated calculation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ expression: '2 + 2', result: 4 }),
    }))
    await expect(calculate('2 + 2')).resolves.toEqual({ expression: '2 + 2', result: 4 })
  })

  it('preserves structured API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ code: 'invalid_expression', error: 'division by zero' }),
    }))
    await expect(calculate('1 / 0')).rejects.toMatchObject({
      name: 'CalculatorApiError',
      code: 'invalid_expression',
      status: 422,
    })
  })

  it('rejects malformed successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: '4' }),
    }))
    await expect(calculate('2 + 2')).rejects.toEqual(
      new CalculatorApiError('Calculator service returned an invalid response', 'invalid_response', 200),
    )
  })

  it('classifies network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(calculate('2 + 2')).rejects.toMatchObject({ code: 'network_error' })
  })
})
