import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockJsonResponse } from '../test/mockJsonResponse'
import { useCalculation } from './useCalculation'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}

describe('useCalculation', () => {
  it('aborts an older request and ignores its late response', async () => {
    const first = deferredResponse()
    const second = deferredResponse()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(useCalculation)

    let firstCalculation!: Promise<void>
    let secondCalculation!: Promise<void>
    act(() => {
      firstCalculation = result.current.submitCalculation('2 + 3')
    })
    act(() => {
      secondCalculation = result.current.submitCalculation('4 * 5')
    })
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)

    await act(async () => {
      second.resolve(mockJsonResponse({ expression: '4 * 5', result: 20 }))
      await secondCalculation
    })
    await act(async () => {
      first.resolve(mockJsonResponse({ expression: '2 + 3', result: 5 }))
      await firstCalculation
    })

    expect(result.current.result).toBe(20)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('')
  })

  it('aborts a request when the component is removed', async () => {
    const request = deferredResponse()
    const fetchMock = vi.fn().mockReturnValue(request.promise)
    vi.stubGlobal('fetch', fetchMock)
    const { result, unmount } = renderHook(useCalculation)
    let calculation!: Promise<void>
    act(() => {
      calculation = result.current.submitCalculation('2 + 3')
    })

    unmount()

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => {
      request.resolve(mockJsonResponse({ expression: '2 + 3', result: 5 }))
      await calculation
    })
  })
})
