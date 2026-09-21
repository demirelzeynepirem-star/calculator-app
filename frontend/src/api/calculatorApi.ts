export interface Calculation {
  expression: string
  result: number
}

interface ApiErrorBody {
  code?: string
  error?: string
}

export class CalculatorApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'CalculatorApiError'
  }
}

function isCalculation(value: unknown): value is Calculation {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.expression === 'string' &&
    typeof candidate.result === 'number' &&
    Number.isFinite(candidate.result)
  )
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null
}

export async function calculate(
  expression: string,
  signal?: AbortSignal,
): Promise<Calculation> {
  let response: Response
  try {
    response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new CalculatorApiError(
      'Unable to reach the calculator service',
      'network_error',
    )
  }

  const body: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const apiError = isApiErrorBody(body) ? body : undefined
    throw new CalculatorApiError(
      typeof apiError?.error === 'string'
        ? apiError.error
        : 'Unable to calculate the expression',
      typeof apiError?.code === 'string' ? apiError.code : 'http_error',
      response.status,
    )
  }
  if (!isCalculation(body)) {
    throw new CalculatorApiError(
      'Calculator service returned an invalid response',
      'invalid_response',
      response.status,
    )
  }
  return body
}
