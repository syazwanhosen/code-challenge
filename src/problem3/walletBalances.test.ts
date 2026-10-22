import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatAmount, getPriority, selectVisibleBalances, usdValueOf, type WalletBalance } from './walletBalances.ts'

const balance = (currency: string, blockchain: string, amount: number): WalletBalance => ({
  currency,
  blockchain,
  amount,
})

// The sample wallet from the README. The original component would list only OSMO and NEO here.
const WALLET = [
  balance('ETH', 'Ethereum', 1.5),
  balance('OSMO', 'Osmosis', 0),
  balance('ATOM', 'Cosmos', 10),
  balance('ZIL', 'Zilliqa', 250.75),
  balance('NEO', 'Neo', 0),
  balance('ARB', 'Arbitrum', 0.25),
]

describe('selectVisibleBalances', () => {
  it('lists positive balances on supported chains, highest priority first', () => {
    const symbols = selectVisibleBalances(WALLET).map((b) => b.currency)
    assert.deepEqual(symbols, ['ETH', 'ARB', 'ZIL'])
  })

  it('drops zero and negative amounts', () => {
    const result = selectVisibleBalances([balance('ETH', 'Ethereum', 0), balance('NEO', 'Neo', -1)])
    assert.deepEqual(result, [])
  })

  it('keeps the original order for chains with equal priority', () => {
    const symbols = selectVisibleBalances([
      balance('NEO', 'Neo', 1),
      balance('ZIL', 'Zilliqa', 1),
      balance('OSMO', 'Osmosis', 1),
    ]).map((b) => b.currency)
    assert.deepEqual(symbols, ['OSMO', 'NEO', 'ZIL'])
  })

  it('leaves the input array untouched', () => {
    const input = [balance('ZIL', 'Zilliqa', 1), balance('OSMO', 'Osmosis', 1)]
    const copy = structuredClone(input)
    selectVisibleBalances(input)
    assert.deepEqual(input, copy)
  })
})

describe('getPriority', () => {
  it('returns undefined for unsupported chains, including Object.prototype names', () => {
    assert.equal(getPriority('Osmosis'), 100)
    assert.equal(getPriority('Cosmos'), undefined)
    assert.equal(getPriority('toString'), undefined)
  })
})

describe('formatAmount', () => {
  it('keeps the decimals that toFixed() rounded away', () => {
    assert.equal(formatAmount(0.25), '0.25')
    assert.equal(formatAmount(1.5), '1.5')
    assert.equal(formatAmount(1234.5678), '1,234.5678')
  })
})

describe('usdValueOf', () => {
  it('multiplies by the price, and treats a missing price as $0 instead of NaN', () => {
    const prices = { ETH: 1600 }
    assert.equal(usdValueOf(balance('ETH', 'Ethereum', 1.5), prices), 2400)
    assert.equal(usdValueOf(balance('NEO', 'Neo', 2), prices), 0)
  })
})
