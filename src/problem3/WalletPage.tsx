// useWalletBalances, usePrices and WalletRow are the app's own modules, which the task
// doesn't show, so their import paths are placeholders. `classes` was never defined in
// the original; it is assumed to be a CSS module here.
import { Box, type BoxProps } from '@mui/material'
import { useMemo } from 'react'
import { usePrices, useWalletBalances } from './hooks'
import classes from './WalletPage.module.css'
import { WalletRow } from './WalletRow'
import { formatAmount, selectVisibleBalances, usdValueOf } from './walletBalances'

// The page renders its own rows, so it accepts Box props but not children.
type WalletPageProps = Omit<BoxProps, 'children'>

export function WalletPage(props: WalletPageProps) {
  const balances = useWalletBalances()
  const prices = usePrices()

  // Filtering and sorting don't involve prices, so a price update doesn't redo them.
  const visibleBalances = useMemo(() => selectVisibleBalances(balances), [balances])

  return (
    <Box {...props}>
      {visibleBalances.map((balance) => (
        <WalletRow
          key={`${balance.blockchain}:${balance.currency}`}
          className={classes.row}
          amount={balance.amount}
          usdValue={usdValueOf(balance, prices)}
          formattedAmount={formatAmount(balance.amount)}
        />
      ))}
    </Box>
  )
}
