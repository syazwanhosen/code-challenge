export interface SwapRequest {
  from: string
  to: string
  /** Decimal strings, so no precision is lost on the way to the server. */
  amountIn: string
  amountOut: string
}

const SIMULATED_LATENCY_MS = 1500

/**
 * Stands in for the swap endpoint: resolves with the executed swap after a short,
 * realistic delay. Swap this for a real request once a backend exists.
 */
export function submitSwap(request: SwapRequest): Promise<SwapRequest> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...request }), SIMULATED_LATENCY_MS)
  })
}
