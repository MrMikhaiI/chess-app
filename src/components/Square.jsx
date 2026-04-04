import React from 'react'
import styles from './Square.module.css'

export default function Square({
  piece, row, col, isLight, isSelected, isLegalMove, isLastMove, isCheck, onClick, disabled, children
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
    <div
      data-square={`${row}-${col}`}
      className={squareClass}
      onClick={onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={piece
        ? `${piece.color} ${piece.type} at ${String.fromCharCode(97+col)}${8-row}`
        : `${String.fromCharCode(97+col)}${8-row}`}
    >
      {isLegalMove && (
        <span className={piece ? styles.captureDot : styles.moveDot} aria-hidden="true" />
      )}
      {children}
    </div>
  )
}
