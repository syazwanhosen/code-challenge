import Big from 'big.js'
import { useState } from 'react'
import type { Token } from '../api/prices.ts'
import { cx } from '../lib/cx.ts'
import { formatTokenAmount, formatUsdPrice } from '../lib/format.ts'
import { SwapHorizontalIcon } from './icons.tsx'
import styles from './RateLine.module.css'

interface RateLineProps {
  pay: Token | undefined
  receive: Token | undefined
  loading: boolean
}

/** "1 ETH = 1,645.93 USDC", with a toggle for the inverse rate. */
export function RateLine({ pay, receive, loading }: RateLineProps) {
  const [inverted, setInverted] = useState(false)

  if (loading) {
    return (
      <div className={styles.rate}>
        <span className={cx(styles.skeleton, 'skeleton')} />
      </div>
    )
  }
  if (!pay || !receive) return <div className={styles.rate} />

  const [base, quote] = inverted ? [receive, pay] : [pay, receive]
  return (
    <div className={styles.rate}>
      <span className={styles.text}>
        1 {base.symbol} = {formatTokenAmount(new Big(base.price).div(quote.price))} {quote.symbol}
      </span>
      <span className={styles.usd}>({formatUsdPrice(base.price)})</span>
      <button
        type="button"
        className={styles.invert}
        aria-label="Show inverse rate"
        title="Show inverse rate"
        onClick={() => setInverted((value) => !value)}
      >
        <SwapHorizontalIcon width={16} height={16} />
      </button>
    </div>
  )
}
