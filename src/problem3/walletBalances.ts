export interface WalletBalance {
  currency: string
  amount: number
  blockchain: string
}

// Chains the wallet page lists, highest priority first. Balances on any other chain are hidden.
const BLOCKCHAIN_PRIORITY = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
} as const satisfies Record<string, number>

type Blockchain = keyof typeof BLOCKCHAIN_PRIORITY

/** The chain's priority, or undefined for chains the page doesn't list. */
export function getPriority(blockchain: string): number | undefined {
  // hasOwn, so a name like "toString" can't resolve to an Object.prototype member.
  return Object.hasOwn(BLOCKCHAIN_PRIORITY, blockchain) ? BLOCKCHAIN_PRIORITY[blockchain as Blockchain] : undefined
}

/**
 * The balances to list: positive amounts on supported chains, highest priority first.
 * Each priority is looked up once rather than on every comparison, and the sort is
 * stable, so balances with equal priority keep their original order.
 */
export function selectVisibleBalances(balances: readonly WalletBalance[]): WalletBalance[] {
  const ranked: Array<{ balance: WalletBalance; priority: number }> = []
  for (const balance of balances) {
    const priority = getPriority(balance.blockchain)
    if (priority !== undefined && balance.amount > 0) ranked.push({ balance, priority })
  }
  return ranked.sort((a, b) => b.priority - a.priority).map(({ balance }) => balance)
}

// Built once: constructing a formatter costs far more than calling it.
const amountFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 })

/** "1,234.5678". Unlike toFixed(), keeps the decimals that small balances depend on. */
export function formatAmount(amount: number): string {
  return amountFormat.format(amount)
}

/** The balance's value in USD. A token without a price counts as $0 instead of producing NaN. */
export function usdValueOf(balance: WalletBalance, prices: Readonly<Record<string, number>>): number {
  return (prices[balance.currency] ?? 0) * balance.amount
}
