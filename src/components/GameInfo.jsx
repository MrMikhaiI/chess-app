import React from 'react'
import styles from './GameInfo.module.css'

const BASE = 'https://lichess1.org/assets/piece/cburnett'
const PIECE_NAMES = {
  white: { king:'wK', queen:'wQ', rook:'wR', bishop:'wB', knight:'wN', pawn:'wP' },
  black: { king:'bK', queen:'bQ', rook:'bR', bishop:'bB', knight:'bN', pawn:'bP' },
}

const STATUS_MESSAGES = {
  checkmate: (p) => `Checkmate! ${p === 'white' ? 'Black' : 'White'} wins! 🏆`,
  stalemate: () => 'Stalemate — Draw 🤝',
  playing: (p, check) => check
    ? `${p === 'white' ? 'White' : 'Black'} — Check! ⚠️`
    : `${p === 'white' ? 'White' : 'Black'} to move`,
}

export default function GameInfo({ currentPlayer, gameStatus, inCheck, capturedPieces, onReset, moveHistory }) {
  const statusMsg = gameStatus !== 'playing'
    ? STATUS_MESSAGES[gameStatus](currentPlayer)
    : STATUS_MESSAGES.playing(currentPlayer, inCheck)

  const renderCaptured = (color) => {
    const pieces = capturedPieces[color]
    if (!pieces.length) return <span className={styles.noCaptured}>—</span>
    return pieces.map((p, i) => (
      <img
        key={i}
        className={styles.capturedPiece}
        src={`${BASE}/${PIECE_NAMES[p.color][p.type]}.svg`}
        alt={`${p.color} ${p.type}`}
        loading="lazy"
      />
    ))
  }

  return (
    <aside className={styles.info}>
      <div className={`${styles.statusBadge} ${gameStatus !== 'playing' ? styles.gameOver : inCheck ? styles.checkBadge : ''}`}>
        {gameStatus === 'playing' && (
          <span className={`${styles.dot} ${styles[currentPlayer]}`} aria-hidden="true" />
        )}
        <span>{statusMsg}</span>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Captured</h2>
        <div className={styles.capturedRow}>
          <span className={styles.capturedLabel}>White took:</span>
          <div className={styles.capturedPieces}>{renderCaptured('white')}</div>
        </div>
        <div className={styles.capturedRow}>
          <span className={styles.capturedLabel}>Black took:</span>
          <div className={styles.capturedPieces}>{renderCaptured('black')}</div>
        </div>
      </div>

      {moveHistory.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Moves ({moveHistory.length})</h2>
          <div className={styles.history}>
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
              const w = moveHistory[i * 2]
              const b = moveHistory[i * 2 + 1]
              const toAlg = m => String.fromCharCode(97 + m.to[1]) + (8 - m.to[0])
              return (
                <div key={i} className={styles.moveRow}>
                  <span className={styles.moveNum}>{i + 1}.</span>
                  <span className={styles.moveWhite}>{w ? toAlg(w) : ''}</span>
                  <span className={styles.moveBlack}>{b ? toAlg(b) : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button className={styles.resetBtn} onClick={onReset}>New Game</button>
    </aside>
  )
}
