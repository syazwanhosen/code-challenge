import Big from 'big.js'
import type { SwapRequest } from '../api/swap.ts'
import type { Decimal } from '../lib/amount.ts'

/** Token balances as exact decimal strings, keyed by symbol. */
export type Balances = Readonly<Record<string, string>>

/** What the demo wallet holds at startup. Tokens not listed start at zero. */
export const STARTING_BALANCES: Balances = {
  ETH: '1.8642',
  USDC: '2450.75',
  WBTC: '0.0421',
  ATOM: '86.5',
  stATOM: '32.18',
  OSMO: '1240',
  SWTH: '185000',
  EVMOS: '5200',
}

export function balanceOf(balances: Balances, symbol: string): Decimal {
  return new Big(balances[symbol] ?? 0)
}

/** Balances after a completed swap. */
export function applySwap(balances: Balances, swap: SwapRequest): Balances {
  return {
    ...balances,
    [swap.from]: balanceOf(balances, swap.from).minus(swap.amountIn).toFixed(),
    [swap.to]: balanceOf(balances, swap.to).plus(swap.amountOut).toFixed(),
  }
}
