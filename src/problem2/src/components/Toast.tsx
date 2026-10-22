import { useEffect, useState } from 'react'
import { AlertIcon, CheckCircleIcon, CloseIcon } from './icons.tsx'
import styles from './Toast.module.css'

export interface ToastMessage {
  id: number
  tone: 'success' | 'error'
  title: string
  description: string
}

const VISIBLE_MS = 6000

interface ToastRegionProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

/** Announces swap results. A toast hides itself after a few seconds unless hovered or focused. */
export function ToastRegion({ toast, onDismiss }: ToastRegionProps) {
  return (
    <div className={styles.region} role="status">
      {toast && <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />}
    </div>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(onDismiss, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [paused, onDismiss])

  return (
    <div
      className={styles.toast}
      data-tone={toast.tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {toast.tone === 'success' ? <CheckCircleIcon className={styles.icon} /> : <AlertIcon className={styles.icon} />}
      <div className={styles.body}>
        <p className={styles.title}>{toast.title}</p>
        <p className={styles.description}>{toast.description}</p>
      </div>
      <button type="button" className={styles.dismiss} aria-label="Dismiss notification" onClick={onDismiss}>
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  )
}
