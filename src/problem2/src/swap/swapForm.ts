import type { Token } from '../api/prices.ts'
import { convertAmount, parseAmount, toFieldValue, type Decimal } from '../lib/amount.ts'
import { balanceOf, type Balances } from './wallet.ts'

export type Side = 'pay' | 'receive'

export const otherSide = (side: Side): Side => (side === 'pay' ? 'receive' : 'pay')

export interface SwapFormState {
  /** Selected token symbol on each side. */
  tokens: Record<Side, string | null>
  /** The side the user typed an amount into; the other side is computed from it. */
  typedSide: Side
  typedValue: string
}

export type SwapFormAction =
  | { type: 'amountTyped'; side: Side; value: string }
  | { type: 'tokenSelected'; side: Side; symbol: string }
  | { type: 'sidesFlipped' }
  | { type: 'amountCleared' }

export const initialSwapForm: SwapFormState = {
  tokens: { pay: 'ETH', receive: 'USDC' },
  typedSide: 'pay',
  typedValue: '',
}

export function swapFormReducer(state: SwapFormState, action: SwapFormAction): SwapFormState {
  switch (action.type) {
    case 'amountTyped':
      return { ...state, typedSide: action.side, typedValue: action.value }
    case 'tokenSelected':
      // Picking the token already on the other side swaps the two instead of allowing ETH → ETH.
      if (state.tokens[otherSide(action.side)] === action.symbol) return flip(state)
      return { ...state, tokens: { ...state.tokens, [action.side]: action.symbol } }
    case 'sidesFlipped':
      return flip(state)
    case 'amountCleared':
      return { ...state, typedValue: '' }
  }
}

// The typed amount stays with its token, so "1 ETH" is still 1 ETH after flipping.
function flip(state: SwapFormState): SwapFormState {
  return {
    tokens: { pay: state.tokens.receive, receive: state.tokens.pay },
    typedSide: otherSide(state.typedSide),
    typedValue: state.typedValue,
  }
}

/** Why the swap can't be submitted yet. */
export type SwapIssue = 'selectToken' | 'enterAmount' | 'amountTooSmall' | 'insufficientBalance'

export interface SwapQuote {
  pay: Token | undefined
  receive: Token | undefined
  /** What each amount field shows. */
  fieldValues: Record<Side, string>
  /** Amount on each side; null when empty, zero, or not computable yet. */
  amounts: Record<Side, Decimal | null>
  usdValues: Record<Side, Decimal | null>
  issue: SwapIssue | null
}

/** Everything the form shows that follows from its state, the token prices and the balances. */
export function getQuote(
  state: SwapFormState,
  tokens: ReadonlyMap<string, Token>,
  balances: Balances,
): SwapQuote {
  const pay = state.tokens.pay === null ? undefined : tokens.get(state.tokens.pay)
  const receive = state.tokens.receive === null ? undefined : tokens.get(state.tokens.receive)
  const { typedSide, typedValue } = state
  const computedSide = otherSide(typedSide)
  const typedAmount = parseAmount(typedValue)

  const fieldValues: Record<Side, string> = { pay: '', receive: '' }
  const amounts: Record<Side, Decimal | null> = { pay: null, receive: null }
  fieldValues[typedSide] = typedValue
  amounts[typedSide] = typedAmount

  if (pay && receive && typedAmount) {
    const [from, to] = typedSide === 'pay' ? [pay, receive] : [receive, pay]
    // Round against the user, as an exchange would: receive less, or pay more, never the reverse.
    const computed = toFieldValue(
      convertAmount(typedAmount, from.price, to.price),
      computedSide === 'receive' ? 'down' : 'up',
    )
    fieldValues[computedSide] = computed
    amounts[computedSide] = parseAmount(computed)
  }

  return {
    pay,
    receive,
    fieldValues,
    amounts,
    usdValues: {
      pay: pay && amounts.pay ? amounts.pay.times(pay.price) : null,
      receive: receive && amounts.receive ? amounts.receive.times(receive.price) : null,
    },
    issue: findIssue(pay, receive, amounts, balances),
  }
}

function findIssue(
  pay: Token | undefined,
  receive: Token | undefined,
  amounts: Record<Side, Decimal | null>,
  balances: Balances,
): SwapIssue | null {
  if (!pay || !receive) return 'selectToken'
  if (!amounts.pay && !amounts.receive) return 'enterAmount'
  // One side has an amount but the other rounded down to nothing.
  if (!amounts.pay || !amounts.receive) return 'amountTooSmall'
  if (amounts.pay.gt(balanceOf(balances, pay.symbol))) return 'insufficientBalance'
  return null
}
