import { useId, type Ref } from 'react'
import type { Token } from '../api/prices.ts'
import { sanitizeAmountInput, type Decimal } from '../lib/amount.ts'
import { cx } from '../lib/cx.ts'
import { formatTokenAmount, formatUsd } from '../lib/format.ts'
import type { Side } from '../swap/swapForm.ts'
import { AlertIcon, ChevronDownIcon } from './icons.tsx'
import { TokenIcon } from './TokenIcon.tsx'
import styles from './AmountPanel.module.css'

interface AmountPanelProps {
  side: Side
  label: string
  value: string
  token: Token | undefined
  balance: Decimal | undefined
  usdValue: Decimal | null
  error: string | null
  loading: boolean
  inputRef?: Ref<HTMLInputElement>
  onValueChange: (value: string) => void
  onTokenClick: () => void
  onMax?: () => void
}

/** One side of the swap: amount, token, USD value and balance. */
export function AmountPanel({
  side,
  label,
  value,
  token,
  balance,
  usdValue,
  error,
  loading,
  inputRef,
  onValueChange,
  onTokenClick,
  onMax,
}: AmountPanelProps) {
  const id = useId()
  const inputId = `${id}-amount`
  const errorId = `${id}-error`
  const purpose = side === 'pay' ? 'to pay with' : 'to receive'

  return (
    <div className={styles.panel} data-invalid={error ? '' : undefined}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>

      <div className={styles.row}>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="0"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            const next = sanitizeAmountInput(event.target.value)
            if (next !== null) onValueChange(next)
          }}
        />

        {loading ? (
          <span className={cx(styles.tokenSkeleton, 'skeleton')} />
        ) : (
          <button
            type="button"
            className={styles.tokenButton}
            data-empty={token ? undefined : ''}
            aria-haspopup="dialog"
            aria-label={token ? `${token.symbol}, change token ${purpose}` : `Select token ${purpose}`}
            onClick={onTokenClick}
          >
            {token ? (
              <>
                <TokenIcon symbol={token.symbol} size={28} />
                {token.symbol}
              </>
            ) : (
              'Select token'
            )}
            <ChevronDownIcon className={styles.chevron} width={18} height={18} />
          </button>
        )}
      </div>

      {/* The error takes the USD value's place, so the panel never changes height. */}
      <div className={styles.meta}>
        <span className={styles.status}>
          <span id={errorId} className={styles.error} aria-live="polite">
            {error && (
              <>
                <AlertIcon width={16} height={16} />
                {error}
              </>
            )}
          </span>
          {!error && usdValue && `≈ ${formatUsd(usdValue)}`}
        </span>
        {token && balance && (
          <span className={styles.balance}>
            Balance: {formatTokenAmount(balance, 'down')}
            {onMax && balance.gt(0) && (
              <button
                type="button"
                className={styles.max}
                aria-label={`Max, use your whole ${token.symbol} balance`}
                onClick={onMax}
              >
                Max
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
