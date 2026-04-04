import React from 'react'
import styles from './PromotionModal.module.css'

const PROMOTION_PIECES = ['queen', 'rook', 'bishop', 'knight']
const PIECE_LETTER = { queen:'Q', rook:'R', bishop:'B', knight:'N' }

export default function PromotionModal({ color, onSelect, pieceSet = 'cburnett' }) {
  const colorChar = color === 'white' ? 'w' : 'b'
  return (
    <div className={styles.overlay} role="dialog" aria-label="Choose promotion piece">
      <div className={styles.modal}>
        <h2 className={styles.title}>Promote pawn</h2>
        <div className={styles.pieces}>
          {PROMOTION_PIECES.map(type => (
            <button key={type} className={styles.pieceBtn} onClick={() => onSelect(type)} aria-label={`Promote to ${type}`}>
              <span className={styles.pieceWrap}>
                <img
                  src={`https://lichess1.org/assets/piece/${pieceSet}/${colorChar}${PIECE_LETTER[type]}.svg`}
                  alt={`${color} ${type}`}
                  width="56" height="56"
                  style={{ width:'100%', height:'100%', objectFit:'contain' }}
                />
              </span>
              <span className={styles.label}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
