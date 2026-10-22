import { useCallback, useEffect, useState } from 'react'
import { fetchTokens, type Token } from '../api/prices.ts'

export type TokensState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; tokens: Token[] }

/** Loads the priced tokens on mount; `retry` loads them again after a failure. */
export function useTokens(): TokensState & { retry: () => void } {
  const [state, setState] = useState<TokensState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchTokens(controller.signal).then(
      (tokens) => setState({ status: 'ready', tokens }),
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
      },
    )
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  return { ...state, retry }
}
