import Big from 'big.js'

export type Decimal = Big.Big

/** Most decimal places an amount carries, whether typed or computed. */
export const MAX_DECIMALS = 8

const MAX_INTEGER_DIGITS = 15

/**
 * Cleans a raw amount-field value. Returns the value to show, or null to reject
 * the edit and keep the previous value.
 *
 * Accepts a comma as the decimal separator ("1,5") and drops grouping commas from
 * pasted values ("1,234.5"). Decimal places beyond MAX_DECIMALS are cut off.
 */
export function sanitizeAmountInput(raw: string): string | null {
  let value = raw.replace(/\s+/g, '')
  const commas = value.split(',').length - 1
  value = value.includes('.') || commas > 1 ? value.replaceAll(',', '') : value.replace(',', '.')
  if (!/^\d*(\.\d*)?$/.test(value)) return null

  const [rawInteger = '', fraction] = value.split('.')
  const integer = rawInteger.replace(/^0+(?=\d)/, '')
  if (integer.length > MAX_INTEGER_DIGITS) return null
  if (fraction === undefined) return integer
  return `${integer || '0'}.${fraction.slice(0, MAX_DECIMALS)}`
}

/** The amount in a sanitized field value, or null when it is empty or zero. */
export function parseAmount(value: string): Decimal | null {
  if (!/\d/.test(value)) return null
  const amount = new Big(value)
  return amount.gt(0) ? amount : null
}

/**
 * Decimal places that keep `significantDigits` significant digits without ever
 * rounding away integer digits, capped at MAX_DECIMALS.
 */
export function decimalPlacesFor(amount: Decimal, significantDigits: number): number {
  if (amount.eq(0)) return 0
  // Big's exponent is the position of the leading digit: 1234 → 3, 0.0012 → -3.
  return Math.min(MAX_DECIMALS, Math.max(0, significantDigits - 1 - amount.e))
}

/** Converts an amount of one token into another through their USD prices. */
export function convertAmount(amount: Decimal, fromUsdPrice: number, toUsdPrice: number): Decimal {
  return amount.times(fromUsdPrice).div(toUsdPrice)
}

/**
 * Rounds a computed amount for an amount field: plain digits, six significant
 * digits (never fewer than the integer part needs), at most MAX_DECIMALS places.
 */
export function toFieldValue(amount: Decimal, rounding: 'down' | 'up'): string {
  const places = decimalPlacesFor(amount, 6)
  return amount.round(places, rounding === 'down' ? Big.roundDown : Big.roundUp).toFixed()
}
