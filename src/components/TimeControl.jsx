import React from 'react'
import styles from './TimeControl.module.css'

export const TIME_CONTROLS = [
  { label: '1+0',  minutes: 1,  increment: 0 },
  { label: '3+0',  minutes: 3,  increment: 0 },
  { label: '3+2',  minutes: 3,  increment: 2 },
  { label: '5+0',  minutes: 5,  increment: 0 },
  { label: '5+3',  minutes: 5,  increment: 3 },
  { label: '10+0', minutes: 10, increment: 0 },
  { label: '10+5', minutes: 10, increment: 5 },
  { label: '∞',    minutes: null, increment: 0 },
]

function fmt(ms) {
  if (ms === null) return '∞'
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TimeControl({ times, currentPlayer, gameStatus, selectedControl, onSelectControl }) {
  const isLow = (color) => times && times[color] !== null && times[color] < 10000

  return (
    <div className={styles.wrapper}>
      {/* clock display */}
      {times && (
        <div className={styles.clocks}>
          {['black', 'white'].map(color => (
            <div
              key={color}
              className={[
                styles.clock,
                currentPlayer === color && gameStatus === 'playing' ? styles.active : '',
                isLow(color) ? styles.low : ''
              ].filter(Boolean).join(' ')}
            >
              <span className={styles.clockColor}>{color === 'white' ? '⬜' : '⬛'}</span>
              <span className={styles.clockTime}>{fmt(times[color])}</span>
            </div>
          ))}
        </div>
      )}

      {/* time control selector */}
      <div className={styles.controls}>
        {TIME_CONTROLS.map(tc => (
          <button
            key={tc.label}
            className={[
              styles.tcBtn,
              selectedControl?.label === tc.label ? styles.tcBtnActive : ''
            ].filter(Boolean).join(' ')}
            onClick={() => onSelectControl(tc)}
            title={tc.increment ? `${tc.minutes} min + ${tc.increment}s/move` : tc.minutes ? `${tc.minutes} min` : 'No limit'}
          >
            {tc.label}
          </button>
        ))}
      </div>
    </div>
  )
}
