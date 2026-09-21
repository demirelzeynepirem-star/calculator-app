import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('submits an expression and renders the result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ expression: '3 + 5 * 2', result: 13 }) }))
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: '=' }))
    expect(await screen.findByText('13')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/calculate', expect.objectContaining({ method: 'POST' }))
  })

  it('renders API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'division by zero at position 3' }) }))
    render(<App />)
    const input = screen.getByLabelText('Expression')
    await userEvent.clear(input); await userEvent.type(input, '1 / 0{enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('division by zero')
  })

  it('supports keypad clear and input', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'C' }))
    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(screen.getByLabelText('Expression')).toHaveValue('7')
  })

  it('does not render a stale result after the expression changes', async () => {
    let resolveRequest!: (value: unknown) => void
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise((resolve) => { resolveRequest = resolve })))
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: '=' }))
    await userEvent.clear(screen.getByLabelText('Expression'))
    await userEvent.type(screen.getByLabelText('Expression'), '9 * 9')
    resolveRequest({ ok: true, status: 200, json: async () => ({ expression: '3 + 5 * 2', result: 13 }) })

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
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter an expression')
  })
})
