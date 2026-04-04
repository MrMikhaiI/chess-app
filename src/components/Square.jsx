import React from 'react'
import { PIECE_UNICODE } from '../engine/pieces.js'
import styles from './Square.module.css'

export default function Square({
  piece, row, col, isLight, isSelected, isLegalMove, isLastMove, isCheck, onClick, disabled
}) {
  const squareClass = [
    styles.square,
    isLight ? styles.light : styles.dark,
    isSelected ? styles.selected : '',
    isLastMove && !isSelected ? styles.lastMove : '',
    isCheck ? styles.check : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ')

  return (
    <button
      className={squareClass}
      onClick={onClick}
      aria-label={piece
        ? `${piece.color} ${piece.type} at ${String.fromCharCode(97+col)}${8-row}`
        : `${String.fromCharCode(97+col)}${8-row}`}
    >
      {isLegalMove && (
        <span className={piece ? styles.captureDot : styles.moveDot} aria-hidden="true" />
      )}
      {piece && (
        <span className={`${styles.piece} ${styles[piece.color]}`} aria-hidden="true">
          {PIECE_UNICODE[piece.color][piece.type]}
        </span>
      )}
    </button>
  )
}
