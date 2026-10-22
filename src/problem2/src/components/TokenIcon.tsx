import { useState } from 'react'
import styles from './TokenIcon.module.css'

const ICON_BASE_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens'

interface TokenIconProps {
  symbol: string
  size?: number
}

/** A token's logo from the Switcheo icon repo, or a lettered badge if it has none. */
export function TokenIcon({ symbol, size = 24 }: TokenIconProps) {
  const [failedSymbol, setFailedSymbol] = useState<string | null>(null)

  if (failedSymbol === symbol) {
    return (
      <span
        className={styles.fallback}
        style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: `hsl(${hue(symbol)} 45% 40%)` }}
        aria-hidden="true"
      >
        {symbol.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      className={styles.icon}
      src={`${ICON_BASE_URL}/${encodeURIComponent(symbol)}.svg`}
      alt=""
      width={size}
      height={size}
      decoding="async"
      onError={() => setFailedSymbol(symbol)}
    />
  )
}

// A stable colour per symbol, so a missing logo still looks deliberate.
function hue(text: string): number {
  let hash = 0
  for (const char of text) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360
  return hash
}
