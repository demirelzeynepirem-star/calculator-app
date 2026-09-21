import { type FormEvent, useEffect, useRef, useState } from 'react'
import { calculate } from './api/calculatorApi'
import './styles.css'

const keys = [
  { label: 'C', value: 'clear', kind: 'utility' }, { label: '(', value: '(' }, { label: ')', value: ')' }, { label: '÷', value: ' / ', kind: 'operator' },
  { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '×', value: ' * ', kind: 'operator' },
  { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '−', value: ' - ', kind: 'operator' },
  { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '+', value: ' + ', kind: 'operator' },
  { label: '√', value: 'sqrt(' }, { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '^', value: ' ^ ', kind: 'operator' },
  { label: '%', value: '%' }, { label: '⌫', value: 'backspace', kind: 'utility' }, { label: '=', value: 'submit', kind: 'equals' },
]

interface PendingRequest {
  id: number
  controller: AbortController
}

export default function App() {
  const [expression, setExpression] = useState('3 + 5 * 2')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingRequest = useRef<PendingRequest | null>(null)
  const requestSequence = useRef(0)

  useEffect(() => () => {
    const pending = pendingRequest.current
    pendingRequest.current = null
    pending?.controller.abort()
  }, [])

  function cancelPendingRequest() {
    pendingRequest.current?.controller.abort()
    pendingRequest.current = null
    requestSequence.current += 1
    setLoading(false)
  }

  function updateExpression(nextExpression: string) {
    cancelPendingRequest()
    setExpression(nextExpression)
    setResult(null)
    setError('')
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    const submittedExpression = expression.trim()
    if (!submittedExpression) {
      setResult(null)
      setError('Enter an expression to calculate')
      return
    }

    pendingRequest.current?.controller.abort()
    const request: PendingRequest = {
      id: requestSequence.current + 1,
      controller: new AbortController(),
    }
    requestSequence.current = request.id
    pendingRequest.current = request
    setLoading(true)
    setError('')

    try {
      const calculation = await calculate(submittedExpression, request.controller.signal)
      if (pendingRequest.current?.id === request.id) setResult(calculation.result)
    } catch (caught) {
      if (pendingRequest.current?.id !== request.id) return
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setResult(null)
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
    } finally {
      if (pendingRequest.current?.id === request.id) {
        pendingRequest.current = null
        setLoading(false)
      }
    }
  }

  function replaceSelection(value: string) {
    const input = inputRef.current
    const start = input?.selectionStart ?? expression.length
    const end = input?.selectionEnd ?? expression.length
    const nextExpression = `${expression.slice(0, start)}${value}${expression.slice(end)}`
    updateExpression(nextExpression)
    queueMicrotask(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(start + value.length, start + value.length)
    })
  }

  function backspace() {
    const input = inputRef.current
    const start = input?.selectionStart ?? expression.length
    const end = input?.selectionEnd ?? expression.length
    if (start === 0 && end === 0) return
    const deleteFrom = start === end ? start - 1 : start
    updateExpression(`${expression.slice(0, deleteFrom)}${expression.slice(end)}`)
    queueMicrotask(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(deleteFrom, deleteFrom)
    })
  }

  function press(value: string) {
    if (value === 'clear') updateExpression('')
    else if (value === 'backspace') backspace()
    else if (value === 'submit') void submit()
    else replaceSelection(value)
    inputRef.current?.focus()
  }

  return <main className="page-shell">
    <section className="calculator" aria-label="Expression calculator">
      <div className="display">
        <form onSubmit={submit}>
          <label htmlFor="expression">Expression</label>
          <input
            ref={inputRef}
            id="expression"
            value={expression}
            maxLength={500}
            onChange={(event) => updateExpression(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="expression-help"
          />
        </form>
        <div className="output" aria-live="polite">
          {loading ? <span className="status">Calculating…</span> : error ? <span className="error" role="alert">{error}</span> : result !== null ? <><span className="equals-sign">=</span><strong>{Number.isInteger(result) ? result : Number(result.toPrecision(12))}</strong></> : <span className="hint">Press = or Enter</span>}
        </div>
      </div>
      <div className="keypad">
        {keys.map((key, index) => <button type="button" key={`${key.label}-${index}`} className={key.kind ?? ''} onClick={() => press(key.value)} aria-label={key.label === '⌫' ? 'Backspace' : key.label}>{key.label}</button>)}
      </div>
      <p id="expression-help" className="keyboard-note">Up to 500 characters · Enter to calculate</p>
    </section>
  </main>
}
