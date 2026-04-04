import React, { useRef } from 'react'
import Square from './Square.jsx'
import DraggablePiece from './DraggablePiece.jsx'
import PromotionModal from './PromotionModal.jsx'
import styles from './Board.module.css'

const PIECE_LETTER = { king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N', pawn:'P' }

export default function Board({
  board, selectedSquare, legalMoves, lastMove,
  currentPlayer, inCheck, onSquareClick,
  onDragStart, onDragEnd,
  promotionPending, onPromotion, gameStatus,
  flipped, pieceSet
}) {
  const boardRef = useRef(null)
  const legalMoveSet = new Set(legalMoves.map(m => `${m.to[0]}-${m.to[1]}`))

  // board[0]=black (top), board[7]=white (bottom)
  // Without flip: render row 0 first (top) → row 7 last (bottom) = black on top, white on bottom ✓
  // With flip: render row 7 first (top) → row 0 last (bottom) = white on top, black on bottom
  const rows  = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7]
  const cols  = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7]
  // rank labels top→bottom:
  // no flip: row0→rank8, row1→rank7 ... row7→rank1
  const ranks = flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1]
  const files = flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h']

  const isLastMove = (r, c) =>
    lastMove && (
      (lastMove.from[0] === r && lastMove.from[1] === c) ||
      (lastMove.to[0] === r && lastMove.to[1] === c)
    )

  const isKingInCheck = (r, c) => {
    const piece = board[r][c]
    return inCheck && piece?.type === 'king' && piece?.color === currentPlayer
  }

  const pieceUrl = (piece) =>
    `https://lichess1.org/assets/piece/${pieceSet}/${piece.color === 'white' ? 'w' : 'b'}${PIECE_LETTER[piece.type]}.svg`

  // a1 = col0,row7: (7+0)%2=1 → dark ✓   a8 = col0,row0: (0+0)%2=0 → light ✓
  const isLight = (r, c) => (r + c) % 2 === 0

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.boardContainer}>
        <div className={styles.coords}>
          {ranks.map(n => <span key={n} className={styles.coordRank}>{n}</span>)}
        </div>
        <div className={styles.board} ref={boardRef}>
          {rows.map(r =>
            cols.map(c => {
              const piece = board[r][c]
              return (
                <Square
                  key={`${r}-${c}`}
                  piece={piece}
                  row={r}
                  col={c}
                  isLight={isLight(r, c)}
                  isSelected={selectedSquare?.[0] === r && selectedSquare?.[1] === c}
                  isLegalMove={legalMoveSet.has(`${r}-${c}`)}
                  isLastMove={isLastMove(r, c)}
                  isCheck={isKingInCheck(r, c)}
                  onClick={() => onSquareClick(r, c)}
                  disabled={gameStatus !== 'playing'}
                >
                  {piece && piece.color === currentPlayer && gameStatus === 'playing' ? (
                    <DraggablePiece
                      type={piece.type}
                      color={piece.color}
                      row={r}
                      col={c}
                      pieceUrl={pieceUrl(piece)}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      boardRef={boardRef}
                      flipped={flipped}
                    />
                  ) : piece ? (
                    <img
                      src={pieceUrl(piece)}
                      alt={`${piece.color} ${piece.type}`}
                      draggable={false}
                      style={{ width:'88%', height:'88%', objectFit:'contain', display:'block',
                        filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.45))', userSelect:'none', pointerEvents:'none' }}
                    />
                  ) : null}
                </Square>
              )
            })
          )}
        </div>
        <div className={styles.coordsFile}>
          {files.map(f => <span key={f} className={styles.coordFile}>{f}</span>)}
        </div>
      </div>
      {promotionPending && (
        <PromotionModal color={promotionPending.color} onSelect={onPromotion} pieceSet={pieceSet} />
      )}
    </div>
  )
}
