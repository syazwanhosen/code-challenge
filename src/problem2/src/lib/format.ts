import Big from 'big.js'
import { decimalPlacesFor, MAX_DECIMALS, type Decimal } from './amount.ts'

type Numeric = Decimal | number | string

const SMALLEST_SHOWN = `0.${'0'.repeat(MAX_DECIMALS - 1)}1`

function groupThousands(plain: string): string {
  const [integer = '', fraction] = plain.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction ? `${grouped}.${fraction}` : grouped
}

/**
 * Formats a token amount for reading (not editing): about six significant digits
 * with thousands separators. Balances round down so a wallet never looks fuller
 * than it is.
 */
export function formatTokenAmount(value: Numeric, rounding: 'nearest' | 'down' = 'nearest'): string {
  const amount = new Big(value)
  if (amount.eq(0)) return '0'
  const places = decimalPlacesFor(amount, 6)
  const rounded = amount.round(places, rounding === 'down' ? Big.roundDown : Big.roundHalfUp)
  return rounded.eq(0) ? `<${SMALLEST_SHOWN}` : groupThousands(rounded.toFixed())
}

/** Formats a USD total with cents, e.g. "$1,234.56". Tiny non-zero values read "<$0.01". */
export function formatUsd(value: Numeric): string {
  const amount = new Big(value)
  if (amount.gt(0) && amount.lt(0.01)) return '<$0.01'
  return `$${groupThousands(amount.toFixed(2))}`
}

/** Formats a unit price: cents from $1 up, four significant digits below that ("$0.004040"). */
export function formatUsdPrice(price: Numeric): string {
  const amount = new Big(price)
  if (amount.gte(1)) return formatUsd(amount)
  return `$${amount.round(decimalPlacesFor(amount, 4)).toFixed()}`
}
