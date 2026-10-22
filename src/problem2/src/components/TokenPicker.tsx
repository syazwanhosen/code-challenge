import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { Token } from '../api/prices.ts'
import { formatTokenAmount, formatUsd, formatUsdPrice } from '../lib/format.ts'
import { searchTokens } from '../swap/tokenSearch.ts'
import { balanceOf, type Balances } from '../swap/wallet.ts'
import { CheckIcon, CloseIcon, SearchIcon } from './icons.tsx'
import { TokenIcon } from './TokenIcon.tsx'
import styles from './TokenPicker.module.css'

const POPULAR_SYMBOLS = ['ETH', 'USDC', 'WBTC', 'ATOM', 'SWTH']

interface TokenPickerProps {
  tokens: readonly Token[]
  balances: Balances
  selectedSymbol: string | null
  onSelect: (symbol: string) => void
  onClose: () => void
}

/** Modal token list with search. ↑/↓ move through the results, Enter picks, Esc closes. */
export function TokenPicker({ tokens, balances, selectedSymbol, onSelect, onClose }: TokenPickerProps) {
  const id = useId()
  const titleId = `${id}-title`
  const listId = `${id}-list`
  const optionId = (symbol: string) => `${id}-option-${symbol}`

  const dialogRef = useRef<HTMLDialogElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchTokens(tokens, balances, query), [tokens, balances, query])
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, results.findIndex((token) => token.symbol === selectedSymbol)),
  )
  const activePosition = Math.min(activeIndex, results.length - 1)
  const active = results[activePosition]
  const activeId = active ? optionId(active.symbol) : undefined
  const popular = query
    ? []
    : POPULAR_SYMBOLS.flatMap((symbol) => tokens.find((token) => token.symbol === symbol) ?? [])

  // A native modal dialog traps focus, makes the page inert and closes on Esc.
  // Focus goes back to whatever opened it.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement
    dialog.showModal()
    searchRef.current?.focus()
    return () => {
      dialog.close()
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(Math.min(Math.max(activePosition + step, 0), results.length - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (active) onSelect(active.symbol)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Clicks on the backdrop land on the dialog element itself.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Select a token
          </h2>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.search}>
          <SearchIcon className={styles.searchIcon} width={18} height={18} />
          <input
            ref={searchRef}
            className={styles.searchInput}
            type="text"
            role="combobox"
            aria-label="Search tokens"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            placeholder="Search by symbol"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        {popular.length > 0 && (
          <div className={styles.popular} role="group" aria-label="Popular tokens">
            {popular.map((token) => (
              <button
                key={token.symbol}
                type="button"
                className={styles.chip}
                aria-pressed={token.symbol === selectedSymbol}
                onClick={() => onSelect(token.symbol)}
              >
                <TokenIcon symbol={token.symbol} size={22} />
                {token.symbol}
              </button>
            ))}
          </div>
        )}

        <ul id={listId} className={styles.list} role="listbox" aria-label="Tokens">
          {results.map((token, index) => {
            const balance = balanceOf(balances, token.symbol)
            const current = token.symbol === selectedSymbol
            return (
              <li
                key={token.symbol}
                id={optionId(token.symbol)}
                className={styles.option}
                role="option"
                tabIndex={-1}
                aria-selected={index === activePosition}
                data-current={current ? '' : undefined}
                onClick={() => onSelect(token.symbol)}
                onMouseMove={() => setActiveIndex(index)}
              >
                <TokenIcon symbol={token.symbol} size={36} />
                <span className={styles.name}>
                  <span className={styles.symbol}>{token.symbol}</span>
                  <span className={styles.price}>{formatUsdPrice(token.price)}</span>
                </span>
                {balance.gt(0) && (
                  <span className={styles.holding}>
                    <span className={styles.holdingAmount}>{formatTokenAmount(balance, 'down')}</span>
                    <span className={styles.holdingUsd}>{formatUsd(balance.times(token.price))}</span>
                  </span>
                )}
                {current && (
                  <>
                    <CheckIcon className={styles.check} width={18} height={18} />
                    <span className="visually-hidden">(current selection)</span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
        {results.length === 0 && <p className={styles.empty}>No tokens match “{query.trim()}”.</p>}
      </div>
    </dialog>
  )
}
