import React, { useRef, useEffect } from 'react'
import styles from './GameInfo.module.css'

const PIECE_LETTER = { king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N', pawn:'P' }

const STATUS_MESSAGES = {
  checkmate: (p) => `Checkmate! ${p === 'white' ? 'Black' : 'White'} wins! 🏆`,
  stalemate: () => 'Stalemate — Draw 🤝',
  resigned:  (p) => `${p === 'white' ? 'White' : 'Black'} resigned. ${p === 'white' ? 'Black' : 'White'} wins! 🏆`,
  timeout:   (p) => `${p === 'white' ? 'White' : 'Black'} ran out of time! ${p === 'white' ? 'Black' : 'White'} wins! ⏱️`,
  playing:   (p, check) => check
    ? `${p === 'white' ? 'White' : 'Black'} — Check! ⚠️`
    : `${p === 'white' ? 'White' : 'Black'} to move`,
}

export default function GameInfo({
  currentPlayer, gameStatus, inCheck,
  capturedPieces, onReset, notation, pieceSet,
  onJumpToMove, currentMoveIdx
}) {
  const statusMsg = gameStatus !== 'playing'
    ? (STATUS_MESSAGES[gameStatus]?.(currentPlayer) ?? 'Game over')
    : STATUS_MESSAGES.playing(currentPlayer, inCheck)

  const historyRef = useRef(null)
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [notation?.length])

  const renderCaptured = (color) => {
    const pieces = capturedPieces[color]
    if (!pieces.length) return <span className={styles.noCaptured}>—</span>
    const colorChar = color === 'white' ? 'w' : 'b'
    return pieces.map((p, i) => (
      <img
        key={i}
        className={styles.capturedPiece}
        src={`https://lichess1.org/assets/piece/${pieceSet}/${colorChar}${PIECE_LETTER[p.type]}.svg`}
        alt={`${p.color} ${p.type}`}
        loading="lazy"
      />
    ))
  }

  const pairs = []
  if (notation) {
    for (let i = 0; i < notation.length; i += 2) {
      pairs.push({ w: notation[i], b: notation[i + 1], wi: i, bi: i + 1 })
    }
  }

  return (
    <aside className={styles.info}>
      <div className={`${styles.statusBadge} ${
        gameStatus !== 'playing' ? styles.gameOver :
        inCheck ? styles.checkBadge : ''
      }`}>
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

      {pairs.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Moves ({notation.length})</h2>
          <div className={styles.history} ref={historyRef}>
            {pairs.map(({ w, b, wi, bi }, i) => (
              <div key={i} className={styles.moveRow}>
                <span className={styles.moveNum}>{i + 1}.</span>
                <button
                  className={`${styles.moveBtn} ${styles.moveWhite} ${
                    currentMoveIdx === wi ? styles.moveBtnActive : ''
                  }`}
                  onClick={() => onJumpToMove?.(wi)}
                  title="Jump to this position"
                >
                  {w ?? ''}
                </button>
                <button
                  className={`${styles.moveBtn} ${styles.moveBlack} ${
                    b !== undefined && currentMoveIdx === bi ? styles.moveBtnActive : ''
                  }`}
                  onClick={() => b !== undefined && onJumpToMove?.(bi)}
                  disabled={b === undefined}
                  title="Jump to this position"
                >
                  {b ?? ''}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className={styles.resetBtn} onClick={onReset}>New Game</button>
    </aside>
  )
}
