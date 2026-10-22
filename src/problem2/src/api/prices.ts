export const PRICES_URL = 'https://interview.switcheo.com/prices.json'

export interface Token {
  symbol: string
  /** Price in USD. */
  price: number
}

// The feed upper-cases a few liquid-staking tokens that are spelled in mixed case
// everywhere else, including the icon repo (which 404s on the upper-case names).
const CANONICAL_SYMBOLS: Readonly<Record<string, string>> = {
  RATOM: 'rATOM',
  STATOM: 'stATOM',
  STEVMOS: 'stEVMOS',
  STLUNA: 'stLUNA',
  STOSMO: 'stOSMO',
}

interface PriceEntry {
  currency: string
  date: string
  price: number
}

function isPriceEntry(value: unknown): value is PriceEntry {
  if (typeof value !== 'object' || value === null) return false
  const { currency, date, price } = value as Record<string, unknown>
  return (
    typeof currency === 'string' &&
    currency.trim() !== '' &&
    typeof date === 'string' &&
    !Number.isNaN(Date.parse(date)) &&
    typeof price === 'number' &&
    Number.isFinite(price) &&
    price > 0
  )
}

/**
 * Turns the raw feed into one token per currency, sorted by symbol.
 *
 * The feed repeats some currencies, sometimes with the same timestamp but different
 * prices: the most recent entry wins, and on a tie the later one in the feed does.
 * Entries without a usable price are dropped, since no rate can be computed for them.
 */
export function normalizePrices(data: unknown): Token[] {
  if (!Array.isArray(data)) throw new Error('Unexpected price data format')

  const latest = new Map<string, { price: number; time: number }>()
  for (const entry of data) {
    if (!isPriceEntry(entry)) continue
    const symbol = CANONICAL_SYMBOLS[entry.currency] ?? entry.currency
    const time = Date.parse(entry.date)
    const current = latest.get(symbol)
    if (!current || time >= current.time) latest.set(symbol, { price: entry.price, time })
  }

  return Array.from(latest, ([symbol, { price }]) => ({ symbol, price })).sort((a, b) =>
    a.symbol.localeCompare(b.symbol, 'en', { sensitivity: 'base' }),
  )
}

export async function fetchTokens(signal?: AbortSignal): Promise<Token[]> {
  const response = await fetch(PRICES_URL, { signal })
  if (!response.ok) throw new Error(`Price request failed with status ${response.status}`)
  const tokens = normalizePrices(await response.json())
  if (tokens.length < 2) throw new Error('Not enough priced tokens to swap')
  return tokens
}
