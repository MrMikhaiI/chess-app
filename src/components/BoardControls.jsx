import React from 'react'
import styles from './BoardControls.module.css'

const PIECE_SETS = [
  { id: 'cburnett',  label: 'Cburnett' },
  { id: 'merida',    label: 'Merida' },
  { id: 'alpha',     label: 'Alpha' },
  { id: 'pirouetti', label: 'Pirouetti' },
  { id: 'california',label: 'California' },
  { id: 'cardinal',  label: 'Cardinal' },
  { id: 'chess7',    label: 'Chess7' },
]

export default function BoardControls({ flipped, onFlip, pieceSet, onPieceSet, onResign, gameStatus, currentPlayer }) {
  return (
    <div className={styles.controls}>
      <button
        className={styles.btn}
        onClick={onFlip}
        title="Flip board"
        aria-label="Flip board"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
          <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
        Flip
      </button>

      <div className={styles.selectWrap}>
        <label className={styles.selectLabel} htmlFor="piece-set">Pieces</label>
        <select
          id="piece-set"
          className={styles.select}
          value={pieceSet}
          onChange={e => onPieceSet(e.target.value)}
        >
          {PIECE_SETS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {gameStatus === 'playing' && (
        <button
          className={`${styles.btn} ${styles.resignBtn}`}
          onClick={onResign}
          title="Resign"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Resign
        </button>
      )}
    </div>
  )
}
