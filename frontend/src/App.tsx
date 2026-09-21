import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react'
import {
  calculatorKeys,
  type CalculatorKey,
  MAX_EXPRESSION_LENGTH,
  RESULT_DISPLAY_DIGITS,
  resultToExpression,
  repeatOperation,
} from './calculator'
import { useCalculation } from './hooks/useCalculation'
import './styles.css'

export default function App() {
  const [expression, setExpression] = useState('3 + 5 * 2')
  const inputRef = useRef<HTMLInputElement>(null)
  const repeatedOperation = useRef<string | null>(null)
  const { result, error, isLoading, resetCalculation, submitCalculation } =
    useCalculation()

  function updateExpression(nextExpression: string) {
    if (nextExpression.length > MAX_EXPRESSION_LENGTH) return
    resetCalculation()
    repeatedOperation.current = null
    setExpression(nextExpression)
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (isLoading) return
    if (result !== null && repeatedOperation.current) {
      const nextExpression = resultToExpression(result) + repeatedOperation.current
      setExpression(nextExpression)
      void submitCalculation(nextExpression)
    } else {
      repeatedOperation.current = repeatOperation(expression)
      void submitCalculation(expression)
    }
  }

  function focusAt(position: number) {
    queueMicrotask(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(position, position)
    })
  }

  function insertAtCursor(keyValue: string) {
    const input = inputRef.current
    const start = input?.selectionStart ?? expression.length
    const end = input?.selectionEnd ?? expression.length
    updateExpression(
      expression.slice(0, start) + keyValue + expression.slice(end),
    )
    focusAt(start + keyValue.length)
  }

  function deleteAtCursor() {
    const input = inputRef.current
    const start = input?.selectionStart ?? expression.length
    const end = input?.selectionEnd ?? expression.length
    if (start === 0 && end === 0) return
    const deleteFrom = start === end ? start - 1 : start
    updateExpression(expression.slice(0, deleteFrom) + expression.slice(end))
    focusAt(deleteFrom)
  }

  function continueFromResult(operator: string) {
    if (result === null) return
    const nextExpression = resultToExpression(result) + operator
    updateExpression(nextExpression)
    focusAt(nextExpression.length)
  }

  function handleKeyPress(key: CalculatorKey) {
    if (key.value === 'clear') updateExpression('')
    else if (key.value === 'backspace') deleteAtCursor()
    else if (key.value === 'submit') handleSubmit()
    else if (key.kind === 'operator' && result !== null)
      continueFromResult(key.value)
    else insertAtCursor(key.value)
    inputRef.current?.focus()
  }

  function handleKeyboardInput(event: KeyboardEvent<HTMLInputElement>) {
    if (result === null || event.ctrlKey || event.metaKey || event.altKey)
      return
    const operator = calculatorKeys.find(
      (key) => key.kind === 'operator' && key.value.trim() === event.key,
    )
    if (operator) {
      event.preventDefault()
      continueFromResult(operator.value)
    }
  }

  return (
    <main className="page-shell">
      <section className="calculator" aria-label="Calculator App">
        <div className="calculator-heading">
          <span className="brand-mark" aria-hidden="true">
            ✳
          </span>
          <span>Calculator App</span>
        </div>
        <div className="display">
          <form onSubmit={handleSubmit}>
            <label htmlFor="expression">Expression</label>
            <input
              ref={inputRef}
              id="expression"
              value={expression}
              maxLength={MAX_EXPRESSION_LENGTH}
              onChange={(event) => updateExpression(event.target.value)}
              onKeyDown={handleKeyboardInput}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="expression-help"
            />
          </form>
          <div className="output" aria-live="polite">
            {isLoading ? (
              <span className="status">Calculating…</span>
            ) : error ? (
              <span className="error" role="alert">
                {error}
              </span>
            ) : result !== null ? (
              <>
                <span className="equals-sign">=</span>
                <strong>
                  {Number.isInteger(result)
                    ? result
                    : Number(result.toPrecision(RESULT_DISPLAY_DIGITS))}
                </strong>
              </>
            ) : (
              <span className="hint">Press = or Enter</span>
            )}
          </div>
        </div>
        <div className="keypad">
          {calculatorKeys.map((key) => (
            <button
              type="button"
              key={key.value}
              className={key.kind ?? ''}
              onClick={() => handleKeyPress(key)}
              aria-label={key.value === 'backspace' ? 'Backspace' : key.label}
            >
              {key.label}
            </button>
          ))}
        </div>
        <p id="expression-help" className="keyboard-note">
          Up to {MAX_EXPRESSION_LENGTH} characters · Enter to calculate
        </p>
      </section>
    </main>
  )
}
