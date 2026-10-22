import { PRICES_URL } from './api/prices.ts'
import { SwapForm } from './components/SwapForm.tsx'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <Logo />
          Fancy Swap
        </span>
        <span className={styles.wallet}>
          <span className={styles.walletDot} aria-hidden="true" />
          Demo wallet
        </span>
      </header>

      <main className={styles.main}>
        <SwapForm />
      </main>

      <footer className={styles.footer}>
        Prices from <a href={PRICES_URL}>Switcheo</a> · Icons from{' '}
        <a href="https://github.com/Switcheo/token-icons">Switcheo/token-icons</a>
        <br />
        Demo only: swaps are simulated and no real assets move.
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b6cff" />
          <stop offset="1" stopColor="#4c7dff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-gradient)" />
      <path
        d="M9.5 12.5h12l-3.5-3.5M22.5 19.5h-12l3.5 3.5"
        stroke="#fff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
