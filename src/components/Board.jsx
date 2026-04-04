import React, { useRef } from 'react'
import Square from './Square.jsx'
import DraggablePiece from './DraggablePiece.jsx'
import PromotionModal from './PromotionModal.jsx'
import styles from './Board.module.css'

export default function Board({
  board, selectedSquare, legalMoves, lastMove,
  currentPlayer, inCheck, onSquareClick,
  onDragStart, onDragEnd,
  promotionPending, onPromotion, gameStatus
}) {
  const boardRef = useRef(null)
  const legalMoveSet = new Set(legalMoves.map(m => `${m.to[0]}-${m.to[1]}`))

  const isLastMove = (r, c) =>
    lastMove && (
      (lastMove.from[0] === r && lastMove.from[1] === c) ||
      (lastMove.to[0] === r && lastMove.to[1] === c)
    )

  const isKingInCheck = (r, c) => {
    const piece = board[r][c]
    return inCheck && piece?.type === 'king' && piece?.color === currentPlayer
  }

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.boardContainer}>
        <div className={styles.coords}>
          {[8,7,6,5,4,3,2,1].map(n => (
            <span key={n} className={styles.coordRank}>{n}</span>
          ))}
        </div>
        <div className={styles.board} ref={boardRef}>
          {board.map((row, r) =>
            row.map((piece, c) => (
              <Square
                key={`${r}-${c}`}
                piece={piece}
                row={r}
                col={c}
                isLight={(r + c) % 2 === 0}
                isSelected={selectedSquare?.[0] === r && selectedSquare?.[1] === c}
                isLegalMove={legalMoveSet.has(`${r}-${c}`)}
                isLastMove={isLastMove(r, c)}
                isCheck={isKingInCheck(r, c)}
                onClick={() => onSquareClick(r, c)}
                disabled={gameStatus !== 'playing'}
              >
                {piece && piece.color === currentPlayer && gameStatus === 'playing' && (
                  <DraggablePiece
                    type={piece.type}
                    color={piece.color}
                    row={r}
                    col={c}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    boardRef={boardRef}
                  />
                )}
                {piece && (piece.color !== currentPlayer || gameStatus !== 'playing') && (
                  <img
                    src={`https://lichess1.org/assets/piece/cburnett/${piece.color === 'white' ? 'w' : 'b'}${{ king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N', pawn:'P' }[piece.type]}.svg`}
                    alt={`${piece.color} ${piece.type}`}
                    draggable={false}
                    style={{ width:'88%', height:'88%', objectFit:'contain', display:'block',
                      filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.45))', userSelect:'none', pointerEvents:'none' }}
                  />
                )}
              </Square>
            ))
          )}
        </div>
        <div className={styles.coordsFile}>
          {['a','b','c','d','e','f','g','h'].map(f => (
            <span key={f} className={styles.coordFile}>{f}</span>
          ))}
        </div>
      </div>
      {promotionPending && (
        <PromotionModal color={promotionPending.color} onSelect={onPromotion} />
      )}
    </div>
  )
}
