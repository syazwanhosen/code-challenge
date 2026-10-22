import { useCallback, useId, useMemo, useReducer, useRef, useState, type SubmitEvent } from 'react'
import type { Token } from '../api/prices.ts'
import { submitSwap } from '../api/swap.ts'
import { useTokens, type TokensState } from '../hooks/useTokens.ts'
import { formatTokenAmount } from '../lib/format.ts'
import { getQuote, initialSwapForm, swapFormReducer, type Side, type SwapQuote } from '../swap/swapForm.ts'
import { applySwap, balanceOf, STARTING_BALANCES } from '../swap/wallet.ts'
import { AmountPanel } from './AmountPanel.tsx'
import { AlertIcon, ArrowDownIcon } from './icons.tsx'
import { RateLine } from './RateLine.tsx'
import { ToastRegion, type ToastMessage } from './Toast.tsx'
import { TokenPicker } from './TokenPicker.tsx'
import styles from './SwapForm.module.css'

const NO_TOKENS: readonly Token[] = []

export function SwapForm() {
  const titleId = useId()
  const prices = useTokens()
  const [form, dispatch] = useReducer(swapFormReducer, initialSwapForm)
  const [balances, setBalances] = useState(STARTING_BALANCES)
  const [pickerSide, setPickerSide] = useState<Side | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [flips, setFlips] = useState(0)
  const payInputRef = useRef<HTMLInputElement>(null)
  const toastCount = useRef(0)
  const dismissToast = useCallback(() => setToast(null), [])

  function showToast(message: Omit<ToastMessage, 'id'>) {
    toastCount.current += 1
    setToast({ ...message, id: toastCount.current })
  }

  const tokens = prices.status === 'ready' ? prices.tokens : NO_TOKENS
  const tokensBySymbol = useMemo(() => new Map(tokens.map((token) => [token.symbol, token])), [tokens])
  const quote = getQuote(form, tokensBySymbol, balances)
  const { pay, receive } = quote
  const loading = prices.status === 'loading'

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || prices.status !== 'ready') return
    // The button always leads somewhere useful, even before the swap is ready.
    if (quote.issue === 'selectToken') {
      setPickerSide(pay ? 'receive' : 'pay')
      return
    }
    if (quote.issue === 'enterAmount') {
      payInputRef.current?.focus()
      return
    }
    const { pay: amountIn, receive: amountOut } = quote.amounts
    if (quote.issue || !pay || !receive || !amountIn || !amountOut) return

    setSubmitting(true)
    try {
      const swap = await submitSwap({
        from: pay.symbol,
        to: receive.symbol,
        amountIn: amountIn.toFixed(),
        amountOut: amountOut.toFixed(),
      })
      setBalances((current) => applySwap(current, swap))
      dispatch({ type: 'amountCleared' })
      showToast({
        tone: 'success',
        title: 'Swap complete',
        description: `Swapped ${formatTokenAmount(swap.amountIn)} ${swap.from} for ${formatTokenAmount(swap.amountOut)} ${swap.to}.`,
      })
    } catch {
      showToast({
        tone: 'error',
        title: 'Swap failed',
        description: 'Nothing was exchanged. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const errors = fieldErrors(quote, form.typedSide)
  const action = callToAction(prices.status, quote, submitting)

  return (
    <>
      <form
        className={styles.card}
        aria-labelledby={titleId}
        aria-busy={submitting}
        noValidate
        onSubmit={handleSubmit}
      >
        <h1 id={titleId} className={styles.title}>
          Swap
        </h1>

        <fieldset className={styles.fields} disabled={submitting || prices.status !== 'ready'}>
          <AmountPanel
            side="pay"
            label="You pay"
            value={quote.fieldValues.pay}
            token={pay}
            balance={pay && balanceOf(balances, pay.symbol)}
            usdValue={quote.usdValues.pay}
            error={errors.pay}
            loading={loading}
            inputRef={payInputRef}
            onValueChange={(value) => dispatch({ type: 'amountTyped', side: 'pay', value })}
            onTokenClick={() => setPickerSide('pay')}
            onMax={
              pay &&
              (() => dispatch({ type: 'amountTyped', side: 'pay', value: balanceOf(balances, pay.symbol).toFixed() }))
            }
          />

          <div className={styles.flipRow}>
            <button
              type="button"
              className={styles.flip}
              aria-label="Switch tokens"
              onClick={() => {
                dispatch({ type: 'sidesFlipped' })
                setFlips((count) => count + 1)
              }}
            >
              <ArrowDownIcon className={styles.flipIcon} style={{ transform: `rotate(${flips * 180}deg)` }} />
            </button>
          </div>

          <AmountPanel
            side="receive"
            label="You receive"
            value={quote.fieldValues.receive}
            token={receive}
            balance={receive && balanceOf(balances, receive.symbol)}
            usdValue={quote.usdValues.receive}
            error={errors.receive}
            loading={loading}
            onValueChange={(value) => dispatch({ type: 'amountTyped', side: 'receive', value })}
            onTokenClick={() => setPickerSide('receive')}
          />
        </fieldset>

        {prices.status === 'error' ? (
          <div className={styles.alert} role="alert">
            <AlertIcon width={18} height={18} />
            Couldn’t load token prices.
            <button type="button" className={styles.retry} onClick={prices.retry}>
              Try again
            </button>
          </div>
        ) : (
          <RateLine pay={pay} receive={receive} loading={loading} />
        )}

        <button
          type="submit"
          className={styles.submit}
          aria-disabled={action.inert || undefined}
          data-tone={action.tone}
        >
          {submitting && <span className={styles.spinner} aria-hidden="true" />}
          {action.label}
        </button>
      </form>

      {pickerSide && prices.status === 'ready' && (
        <TokenPicker
          tokens={prices.tokens}
          balances={balances}
          selectedSymbol={form.tokens[pickerSide]}
          onSelect={(symbol) => {
            dispatch({ type: 'tokenSelected', side: pickerSide, symbol })
            setPickerSide(null)
          }}
          onClose={() => setPickerSide(null)}
        />
      )}
      <ToastRegion toast={toast} onDismiss={dismissToast} />
    </>
  )
}

/** Inline messages for each amount field. */
function fieldErrors(quote: SwapQuote, typedSide: Side): Record<Side, string | null> {
  const errors: Record<Side, string | null> = { pay: null, receive: null }
  if (quote.issue === 'insufficientBalance') {
    errors.pay = 'Exceeds your balance'
  } else if (quote.issue === 'amountTooSmall') {
    errors[typedSide] = 'Too small to swap'
  }
  return errors
}

interface CallToAction {
  label: string
  /** Shown as disabled: the label explains what's missing instead of submitting. */
  inert: boolean
  tone?: 'busy' | 'danger'
}

function callToAction(status: TokensState['status'], quote: SwapQuote, submitting: boolean): CallToAction {
  if (submitting) return { label: 'Swapping…', inert: true, tone: 'busy' }
  if (status === 'loading') return { label: 'Loading prices…', inert: true }
  if (status === 'error') return { label: 'Prices unavailable', inert: true }
  switch (quote.issue) {
    case 'selectToken':
      return { label: 'Select a token', inert: false }
    case 'enterAmount':
      return { label: 'Enter an amount', inert: true }
    case 'amountTooSmall':
      return { label: 'Amount too small', inert: true }
    case 'insufficientBalance':
      return { label: `Insufficient ${quote.pay?.symbol ?? ''} balance`, inert: true, tone: 'danger' }
    case null:
      return { label: 'Confirm swap', inert: false }
  }
}
