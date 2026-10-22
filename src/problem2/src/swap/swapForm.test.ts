import { describe, expect, it } from 'vitest'
import type { Token } from '../api/prices.ts'
import { getQuote, initialSwapForm, swapFormReducer, type SwapFormState } from './swapForm.ts'

// Real prices from the feed, so rounding is exercised on awkward numbers.
const TOKENS = new Map<string, Token>(
  [
    { symbol: 'ETH', price: 1645.9337373737374 },
    { symbol: 'USDC', price: 0.9998782611186441 },
    { symbol: 'SWTH', price: 0.004039850455012084 },
    { symbol: 'WBTC', price: 26002.82202020202 },
  ].map((token) => [token.symbol, token]),
)
const BALANCES = { ETH: '2', SWTH: '1000' }

const form = (changes: Partial<SwapFormState>): SwapFormState => ({ ...initialSwapForm, ...changes })

describe('getQuote', () => {
  it('computes what you receive, rounded down', () => {
    const quote = getQuote(form({ typedValue: '1' }), TOKENS, BALANCES)
    expect(quote.fieldValues).toEqual({ pay: '1', receive: '1646.13' })
    expect(quote.usdValues.pay?.toFixed(2)).toBe('1645.93')
    expect(quote.issue).toBeNull()
  })

  it('computes what you pay for a typed receive amount, rounded up', () => {
    const quote = getQuote(form({ typedSide: 'receive', typedValue: '500' }), TOKENS, BALANCES)
    expect(quote.fieldValues).toEqual({ pay: '0.303742', receive: '500' })
    expect(quote.issue).toBeNull()
  })

  it('asks for an amount until a positive one is typed', () => {
    for (const typedValue of ['', '0', '0.']) {
      expect(getQuote(form({ typedValue }), TOKENS, BALANCES).issue).toBe('enterAmount')
    }
  })

  it('flags an amount above the balance', () => {
    expect(getQuote(form({ typedValue: '2.00000001' }), TOKENS, BALANCES).issue).toBe('insufficientBalance')
    expect(getQuote(form({ typedValue: '2' }), TOKENS, BALANCES).issue).toBeNull()
  })

  it('flags a computed balance overrun too', () => {
    const quote = getQuote(form({ typedSide: 'receive', typedValue: '5000' }), TOKENS, BALANCES)
    expect(quote.issue).toBe('insufficientBalance')
  })

  it('flags amounts that round to nothing on the other side', () => {
    const tokens = { pay: 'SWTH', receive: 'WBTC' }
    const quote = getQuote(form({ tokens, typedValue: '0.00000001' }), TOKENS, BALANCES)
    expect(quote.fieldValues.receive).toBe('0')
    expect(quote.issue).toBe('amountTooSmall')
  })

  it('asks for a token when one side is empty or unpriced', () => {
    expect(getQuote(form({ tokens: { pay: 'ETH', receive: null } }), TOKENS, BALANCES).issue).toBe('selectToken')
    expect(getQuote(form({ tokens: { pay: 'DOGE', receive: 'USDC' } }), TOKENS, BALANCES).issue).toBe('selectToken')
  })
})

describe('swapFormReducer', () => {
  it('keeps a typed amount with its token when the sides flip', () => {
    const typed = swapFormReducer(initialSwapForm, { type: 'amountTyped', side: 'pay', value: '1.5' })
    expect(swapFormReducer(typed, { type: 'sidesFlipped' })).toEqual({
      tokens: { pay: 'USDC', receive: 'ETH' },
      typedSide: 'receive',
      typedValue: '1.5',
    })
  })

  it('swaps the sides when you pick the token already on the other side', () => {
    const state = swapFormReducer(initialSwapForm, { type: 'tokenSelected', side: 'pay', symbol: 'USDC' })
    expect(state.tokens).toEqual({ pay: 'USDC', receive: 'ETH' })
  })

  it('replaces the token on the chosen side', () => {
    const state = swapFormReducer(initialSwapForm, { type: 'tokenSelected', side: 'receive', symbol: 'SWTH' })
    expect(state.tokens).toEqual({ pay: 'ETH', receive: 'SWTH' })
  })
})
