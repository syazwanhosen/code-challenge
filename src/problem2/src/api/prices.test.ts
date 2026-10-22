import { describe, expect, it } from 'vitest'
import snapshot from '../test/prices.snapshot.json'
import { normalizePrices } from './prices.ts'

describe('normalizePrices', () => {
  it('keeps the latest price per currency, and the later entry on a timestamp tie', () => {
    const tokens = normalizePrices([
      { currency: 'USDC', date: '2023-08-29T07:10:40.000Z', price: 0.989832 },
      { currency: 'USDC', date: '2023-08-29T07:10:30.000Z', price: 1 },
      { currency: 'USDC', date: '2023-08-29T07:10:40.000Z', price: 0.9998782611186441 },
    ])
    expect(tokens).toEqual([{ symbol: 'USDC', price: 0.9998782611186441 }])
  })

  it('uses the mixed-case symbols the icon repo expects', () => {
    const tokens = normalizePrices([{ currency: 'STATOM', date: '2023-08-29T07:10:40.000Z', price: 8.5 }])
    expect(tokens).toEqual([{ symbol: 'stATOM', price: 8.5 }])
  })

  it('drops entries without a usable price', () => {
    const date = '2023-08-29T07:10:40.000Z'
    const tokens = normalizePrices([
      { currency: 'ZERO', date, price: 0 },
      { currency: 'NEGATIVE', date, price: -1 },
      { currency: 'NAN', date, price: Number.NaN },
      { currency: 'TEXT', date, price: '1.5' },
      { currency: 'BAD_DATE', date: 'yesterday', price: 1 },
      { currency: '', date, price: 1 },
      null,
      'ETH',
    ])
    expect(tokens).toEqual([])
  })

  it('sorts tokens by symbol, ignoring case', () => {
    const date = '2023-08-29T07:10:40.000Z'
    const tokens = normalizePrices([
      { currency: 'ZIL', date, price: 0.0165 },
      { currency: 'ampLUNA', date, price: 0.4955 },
      { currency: 'ATOM', date, price: 7.19 },
    ])
    expect(tokens.map((token) => token.symbol)).toEqual(['ampLUNA', 'ATOM', 'ZIL'])
  })

  it('rejects data that is not a list', () => {
    expect(() => normalizePrices({ prices: [] })).toThrow('Unexpected price data format')
  })

  it('turns the real feed into one token per currency', () => {
    const tokens = normalizePrices(snapshot)
    expect(snapshot).toHaveLength(36)
    expect(tokens).toHaveLength(32)
    expect(new Set(tokens.map((token) => token.symbol)).size).toBe(32)
    expect(tokens.find((token) => token.symbol === 'USDC')?.price).toBe(0.9998782611186441)
    expect(tokens.map((token) => token.symbol)).toEqual(
      expect.arrayContaining(['rATOM', 'stATOM', 'stEVMOS', 'stLUNA', 'stOSMO']),
    )
  })
})
