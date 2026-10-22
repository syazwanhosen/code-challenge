import { describe, expect, it } from 'vitest'
import { formatTokenAmount, formatUsd, formatUsdPrice } from './format.ts'

describe('formatTokenAmount', () => {
  it('shows about six significant digits with thousands separators', () => {
    expect(formatTokenAmount('1234.5678')).toBe('1,234.57')
    expect(formatTokenAmount('185000')).toBe('185,000')
    expect(formatTokenAmount('1234567.891')).toBe('1,234,568')
    expect(formatTokenAmount('0.000123456789')).toBe('0.00012346')
    expect(formatTokenAmount(0)).toBe('0')
  })

  it('rounds balances down so they never overstate what you hold', () => {
    expect(formatTokenAmount('1.99999999')).toBe('2')
    expect(formatTokenAmount('1.99999999', 'down')).toBe('1.99999')
  })

  it('marks amounts too small to show', () => {
    expect(formatTokenAmount('0.000000001')).toBe('<0.00000001')
  })
})

describe('formatUsd', () => {
  it('formats totals in dollars and cents', () => {
    expect(formatUsd('1234.567')).toBe('$1,234.57')
    expect(formatUsd(0)).toBe('$0.00')
    expect(formatUsd('0.004')).toBe('<$0.01')
  })
})

describe('formatUsdPrice', () => {
  it('keeps four significant digits for prices under a dollar', () => {
    expect(formatUsdPrice(1645.9337373737374)).toBe('$1,645.93')
    expect(formatUsdPrice(0.9998782611186441)).toBe('$0.9999')
    expect(formatUsdPrice(0.004039850455012084)).toBe('$0.00404')
  })
})
