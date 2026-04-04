import React from 'react'
import styles from './Piece.module.css'

// Lichess cburnett piece set — open source SVGs served from lichess CDN
const PIECE_NAMES = {
  white: { king: 'wK', queen: 'wQ', rook: 'wR', bishop: 'wB', knight: 'wN', pawn: 'wP' },
  black: { king: 'bK', queen: 'bQ', rook: 'bR', bishop: 'bB', knight: 'bN', pawn: 'bP' },
}

const BASE = 'https://lichess1.org/assets/piece/cburnett'

export default function Piece({ type, color }) {
  const name = PIECE_NAMES[color][type]
  return (
    <img
      className={styles.piece}
      src={`${BASE}/${name}.svg`}
      alt={`${color} ${type}`}
      draggable={false}
      width="80"
      height="80"
      loading="eager"
    />
  )
}
