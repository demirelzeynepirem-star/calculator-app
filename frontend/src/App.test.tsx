import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { mockJsonResponse } from './test/mockJsonResponse'
import { MAX_EXPRESSION_LENGTH } from './calculator'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('repeats the last operation with equals and Enter', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockJsonResponse({ expression: '2 + 3', result: 5 }))
      .mockResolvedValueOnce(mockJsonResponse({ expression: '5 + (3)', result: 8 }))
      .mockResolvedValueOnce(mockJsonResponse({ expression: '8 + (3)', result: 11 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const input = screen.getByLabelText('Expression')
    await user.clear(input)
    await user.type(input, '2 + 3{enter}')
    await screen.findByText('5', { selector: 'strong' })
    await user.click(screen.getByRole('button', { name: '=' }))
    await screen.findByText('8', { selector: 'strong' })
    expect(input).toHaveValue('5 + (3)')
    await user.type(input, '{enter}')
    await screen.findByText('11', { selector: 'strong' })
    expect(fetchMock).toHaveBeenLastCalledWith('/api/calculate', expect.objectContaining({
      body: JSON.stringify({ expression: '8 + (3)' }),
    }))
  })
  it('continues from the result with the keypad', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse({ expression: '2 + 3', result: 5 }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({ expression: '5 * 4', result: 20 }),
      )
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const input = screen.getByLabelText('Expression')

    await user.clear(input)
    await user.type(input, '2 + 3{enter}')
    expect(await screen.findByText('5', { selector: 'strong' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '×' }))
    expect(input).toHaveValue('5 * ')
    await user.click(screen.getByRole('button', { name: '4' }))
    await user.click(screen.getByRole('button', { name: '=' }))

    expect(await screen.findByText('20')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/calculate',
      expect.objectContaining({
        body: JSON.stringify({ expression: '5 * 4' }),
      }),
    )
  })

  it('continues from zero with a keyboard operator', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ expression: '1 - 1', result: 0 }),
        ),
    )
    render(<App />)
    const input = screen.getByLabelText('Expression')

    await user.clear(input)
    await user.type(input, '1 - 1{enter}')
    await screen.findByText('=', { selector: '.equals-sign' })
    await user.type(input, '+4')

    expect(input).toHaveValue('0 + 4')
  })

  it('does not let keypad input exceed the length limit', async () => {
    render(<App />)
    const input = screen.getByLabelText('Expression')
    fireEvent.change(input, {
      target: { value: '1'.repeat(MAX_EXPRESSION_LENGTH) },
    })

    await userEvent.click(screen.getByRole('button', { name: '7' }))

    expect(input).toHaveValue('1'.repeat(MAX_EXPRESSION_LENGTH))
  })

  it('submits an expression and renders the result', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ expression: '3 + 5 * 2', result: 13 }),
        ),
    )
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: '=' }))
    expect(await screen.findByText('13')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      '/api/calculate',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('renders API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockJsonResponse({ error: 'division by zero at position 3' }, 422),
        ),
    )
    render(<App />)
    const input = screen.getByLabelText('Expression')
    await userEvent.clear(input)
    await userEvent.type(input, '1 / 0{enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'division by zero',
    )
  })

  it('supports keypad clear and input', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'C' }))
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(screen.getByLabelText('Expression')).toHaveValue('7')
  })

  it('does not render a stale result after the expression changes', async () => {
    let resolveRequest!: (value: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
      ),
    )
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '=' }))
    await userEvent.clear(screen.getByLabelText('Expression'))
    await userEvent.type(screen.getByLabelText('Expression'), '9 * 9')
    await act(async () => {
      resolveRequest(mockJsonResponse({ expression: '3 + 5 * 2', result: 13 }))
    })

    expect(await screen.findByText('Press = or Enter')).toBeInTheDocument()
    expect(screen.queryByText('13')).not.toBeInTheDocument()
  })

  it('inserts keypad values at the cursor', async () => {
    render(<App />)
    const input = screen.getByLabelText('Expression') as HTMLInputElement
    input.setSelectionRange(0, 0)
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(input).toHaveValue('73 + 5 * 2')
  })

  it('explains why an empty expression cannot be submitted', async () => {
    render(<App />)
    const input = screen.getByLabelText('Expression')
    await userEvent.clear(input)
    await userEvent.type(input, '{enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter an expression',
    )
  })
})
