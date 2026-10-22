import { vi } from 'vitest'

/** A small price feed with round prices, so expected amounts are easy to check by hand. */
export const PRICE_FEED = [
  { currency: 'ETH', date: '2023-08-29T07:10:52.000Z', price: 2000 },
  { currency: 'USDC', date: '2023-08-29T07:10:40.000Z', price: 1 },
  { currency: 'ATOM', date: '2023-08-29T07:10:50.000Z', price: 8 },
  { currency: 'STATOM', date: '2023-08-29T07:10:45.000Z', price: 10 },
  { currency: 'SWTH', date: '2023-08-29T07:10:45.000Z', price: 0.004 },
  { currency: 'WBTC', date: '2023-08-29T07:10:45.000Z', price: 25000 },
]

/** Stubs `fetch` to answer successive calls with each response in turn; 'offline' rejects. */
export function stubFetch(...responses: Array<unknown>) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) {
    if (response === 'offline') fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    else fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(response)))
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
