import { useEffect, useRef, useState } from 'react'
import { calculate } from '../api/calculatorApi'

export function useCalculation() {
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const activeController = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      activeController.current?.abort()
      activeController.current = null
    }
  }, [])

  function resetCalculation() {
    activeController.current?.abort()
    activeController.current = null
    setIsLoading(false)
    setResult(null)
    setError('')
  }

  async function submitCalculation(expression: string) {
    resetCalculation()
    const trimmedExpression = expression.trim()
    if (!trimmedExpression) {
      setError('Enter an expression to calculate')
      return
    }

    const controller = new AbortController()
    activeController.current = controller
    setIsLoading(true)

    try {
      const calculation = await calculate(trimmedExpression, controller.signal)
      if (activeController.current === controller) {
        setResult(calculation.result)
      }
    } catch (error) {
      if (activeController.current !== controller || controller.signal.aborted)
        return
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      if (activeController.current === controller) {
        activeController.current = null
        setIsLoading(false)
      }
    }
  }

  return { result, error, isLoading, resetCalculation, submitCalculation }
}
