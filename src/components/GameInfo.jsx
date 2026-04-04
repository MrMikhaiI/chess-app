import React from 'react'
import { PIECE_UNICODE } from '../engine/pieces.js'
import styles from './GameInfo.module.css'

const STATUS_MESSAGES = {
  checkmate: (player) => `Checkmate! ${player === 'white' ? 'Black' : 'White'} wins! 🏆`,
  stalemate: () => 'Stalemate! Draw 🤝',
  playing: (player, inCheck) => inCheck
    ? `${player.charAt(0).toUpperCase() + player.slice(1)}'s turn — Check! ⚠️`
    : `${player.charAt(0).toUpperCase() + player.slice(1)}'s turn`,
}

export default function GameInfo({
  currentPlayer, gameStatus, inCheck,
  capturedPieces, onReset, moveHistory
}) {
  const statusMsg = gameStatus !== 'playing'
    ? STATUS_MESSAGES[gameStatus](currentPlayer)
    : STATUS_MESSAGES.playing(currentPlayer, inCheck)

  const renderCaptured = (color) => {
    const pieces = capturedPieces[color]
    if (!pieces.length) return <span className={styles.noCaptured}>—</span>
    return pieces.map((p, i) => (
      <span key={i} className={styles.capturedPiece}>{PIECE_UNICODE[p.color][p.type]}</span>
    ))
  }

  return (
    <aside className={styles.info}>
      <div className={`${styles.statusBadge} ${gameStatus !== 'playing' ? styles.gameOver : inCheck ? styles.checkBadge : styles[currentPlayer]}`}>
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
              const white = moveHistory[i * 2]
              const black = moveHistory[i * 2 + 1]
              const toAlg = (m) => {
                const file = String.fromCharCode(97 + m.to[1])
                const rank = 8 - m.to[0]
                return `${file}${rank}`
              }
              return (
                <div key={i} className={styles.moveRow}>
                  <span className={styles.moveNum}>{i + 1}.</span>
                  <span className={styles.moveWhite}>{white ? toAlg(white) : ''}</span>
                  <span className={styles.moveBlack}>{black ? toAlg(black) : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button className={styles.resetBtn} onClick={onReset} aria-label="Start new game">
        New Game
      </button>
    </aside>
  )
}
