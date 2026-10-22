import Big from 'big.js'
import { describe, expect, it } from 'vitest'
import { convertAmount, parseAmount, sanitizeAmountInput, toFieldValue } from './amount.ts'

describe('sanitizeAmountInput', () => {
  it.each([
    ['', ''],
    ['12', '12'],
    ['0', '0'],
    ['007', '7'],
    ['.', '0.'],
    ['.5', '0.5'],
    ['00.5', '0.5'],
    ['1,5', '1.5'],
    ['1,234.5', '1234.5'],
    ['1,234,567', '1234567'],
    [' 42 ', '42'],
    ['0.123456789', '0.12345678'],
  ])('cleans %j to %j', (raw, expected) => {
    expect(sanitizeAmountInput(raw)).toBe(expected)
  })

  it.each(['abc', '1a', '1.2.3', '-1', '1e5', '1234567890123456'])('rejects %j', (raw) => {
    expect(sanitizeAmountInput(raw)).toBeNull()
  })
})

describe('parseAmount', () => {
  it('returns null for empty or zero amounts', () => {
    for (const value of ['', '0', '0.', '0.000']) expect(parseAmount(value)).toBeNull()
  })

  it('parses positive amounts exactly', () => {
    expect(parseAmount('0.1')?.plus('0.2').toFixed()).toBe('0.3')
  })
})

describe('toFieldValue', () => {
  it('keeps six significant digits without dropping integer digits', () => {
    expect(toFieldValue(new Big('1646.134135902'), 'down')).toBe('1646.13')
    expect(toFieldValue(new Big('123456789.987'), 'down')).toBe('123456789')
    expect(toFieldValue(new Big('0.0607546789'), 'down')).toBe('0.0607546')
  })

  it('never shows more than eight decimal places', () => {
    expect(toFieldValue(new Big('0.000607546789'), 'down')).toBe('0.00060754')
    expect(toFieldValue(new Big('0.0000001553620008'), 'down')).toBe('0.00000015')
    expect(toFieldValue(new Big('0.00000000000000155362'), 'down')).toBe('0')
  })

  it('rounds in the requested direction', () => {
    expect(toFieldValue(new Big('0.30374195461661'), 'down')).toBe('0.303741')
    expect(toFieldValue(new Big('0.30374195461661'), 'up')).toBe('0.303742')
  })
})

describe('convertAmount', () => {
  it('converts through USD prices', () => {
    expect(convertAmount(new Big(3), 2000, 1).toFixed()).toBe('6000')
    expect(convertAmount(new Big(1), 1, 8).toFixed()).toBe('0.125')
  })
})
