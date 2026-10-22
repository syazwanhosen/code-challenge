import { describe, expect, it } from 'vitest'
import { searchTokens } from './tokenSearch.ts'

const TOKENS = [
  { symbol: 'ATOM', price: 7 },
  { symbol: 'ETH', price: 1600 },
  { symbol: 'rATOM', price: 10 },
  { symbol: 'stATOM', price: 8 },
  { symbol: 'SWTH', price: 0.004 },
  { symbol: 'USDC', price: 1 },
]

const symbols = (query: string, balances = {}) => searchTokens(TOKENS, balances, query).map((token) => token.symbol)

describe('searchTokens', () => {
  it('lists held tokens first, largest USD value first, then the rest alphabetically', () => {
    expect(symbols('', { SWTH: '100000', ETH: '0.1' })).toEqual(['SWTH', 'ETH', 'ATOM', 'rATOM', 'stATOM', 'USDC'])
  })

  it('ranks exact matches, then prefixes, then other matches, ignoring case', () => {
    expect(symbols('atom')).toEqual(['ATOM', 'rATOM', 'stATOM'])
    expect(symbols('ST')).toEqual(['stATOM'])
    expect(symbols(' usd ')).toEqual(['USDC'])
  })

  it('returns nothing when no symbol matches', () => {
    expect(symbols('doge')).toEqual([])
  })
})
