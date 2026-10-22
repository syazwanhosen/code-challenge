import type { Token } from '../api/prices.ts'
import { balanceOf, type Balances } from './wallet.ts'

/**
 * Tokens matching a search, best first: exact symbol match, then prefix, then
 * substring. Within each group, held tokens come first (largest USD value first),
 * then the rest alphabetically.
 */
export function searchTokens(tokens: readonly Token[], balances: Balances, query: string): Token[] {
  const needle = query.trim().toLowerCase()
  const relevance = (token: Token): number => {
    const symbol = token.symbol.toLowerCase()
    if (!needle || symbol === needle) return 0
    if (symbol.startsWith(needle)) return 1
    return symbol.includes(needle) ? 2 : -1
  }

  return tokens
    .map((token) => ({
      token,
      relevance: relevance(token),
      holding: balanceOf(balances, token.symbol).times(token.price).toNumber(),
    }))
    .filter((result) => result.relevance >= 0)
    .sort(
      (a, b) =>
        a.relevance - b.relevance ||
        b.holding - a.holding ||
        a.token.symbol.localeCompare(b.token.symbol, 'en', { sensitivity: 'base' }),
    )
    .map((result) => result.token)
}
