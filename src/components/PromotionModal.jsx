import React from 'react'
import { PIECE_UNICODE } from '../engine/pieces.js'
import styles from './PromotionModal.module.css'

const PROMOTION_PIECES = ['queen', 'rook', 'bishop', 'knight']

export default function PromotionModal({ color, onSelect }) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="Choose promotion piece">
      <div className={styles.modal}>
        <h2 className={styles.title}>Promote pawn</h2>
        <div className={styles.pieces}>
          {PROMOTION_PIECES.map(type => (
            <button
              key={type}
              className={styles.pieceBtn}
              onClick={() => onSelect(type)}
              aria-label={`Promote to ${type}`}
            >
              <span className={styles.piece}>{PIECE_UNICODE[color][type]}</span>
              <span className={styles.label}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
