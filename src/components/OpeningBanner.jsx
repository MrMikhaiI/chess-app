import React, { useEffect, useState } from 'react'
import styles from './OpeningBanner.module.css'

export default function OpeningBanner({ opening }) {
  const [visible, setVisible] = useState(false)
  const [displayed, setDisplayed] = useState(null)

  useEffect(() => {
    if (opening) {
      setDisplayed(opening)
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [opening])

  if (!displayed) return null

  return (
    <div className={`${styles.banner} ${visible ? styles.visible : styles.hidden}`} aria-live="polite">
      <span className={styles.icon}>📖</span>
      <span className={styles.name}>{displayed}</span>
    </div>
  )
}
