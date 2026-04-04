import React, { useState, useCallback } from 'react'
import Board from './components/Board.jsx'
import GameInfo from './components/GameInfo.jsx'
import { createInitialBoard } from './engine/board.js'
import { getLegalMoves } from './engine/moves.js'
import { isInCheck, getGameStatus } from './engine/gameState.js'
import { cloneBoard } from './engine/board.js'
import styles from './App.module.css'

export default function App() {
  const [board, setBoard] = useState(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState('white')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [castlingRights, setCastlingRights] = useState({
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true }
  })
  const [enPassantTarget, setEnPassantTarget] = useState(null)
  const [promotionPending, setPromotionPending] = useState(null)
  const [gameStatus, setGameStatus] = useState('playing')
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [moveHistory, setMoveHistory] = useState([])

  // Single source-of-truth ref-free helper — reads latest state via setters
  const finishMove = useCallback((
    newBoard, newCastling, newEnPassant,
    captured, fromRow, fromCol, toRow, toCol, movingColor
  ) => {
    const nextPlayer = movingColor === 'white' ? 'black' : 'white'
    const nextState = {
      board: newBoard,
      currentPlayer: nextPlayer,
      castlingRights: newCastling,
      enPassantTarget: newEnPassant
    }
    const status = getGameStatus(nextState)

    setBoard(newBoard)
    setCastlingRights(newCastling)
    setEnPassantTarget(newEnPassant)
    setCurrentPlayer(nextPlayer)
    setSelectedSquare(null)
    setLegalMoves([])
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] })
    setGameStatus(status)

    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [movingColor]: [...prev[movingColor], captured]
      }))
    }

    setMoveHistory(prev => [
      ...prev,
      { from: [fromRow, fromCol], to: [toRow, toCol] }
    ])
  }, [])

  const handleSquareClick = useCallback((row, col) => {
    // All state is read via functional updaters or captured in closure at call time;
    // we pass all needed values explicitly to avoid stale closure issues.
    setBoard(prevBoard => prevBoard) // no-op read; actual logic below

    // We need fresh state — use a ref-like pattern with a single setState batch.
    // React batches updates; we read state directly from the closure because
    // handleSquareClick is recreated whenever any dependency changes.
  }, []) // intentional empty deps — handler is rebuilt on each render via the wrapper below

  // Wrapper that always has fresh state — recreated on every relevant state change
  const onSquareClick = (row, col) => {
    if (gameStatus !== 'playing') return

    const piece = board[row][col]

    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare
      const gameState = { board, currentPlayer, castlingRights, enPassantTarget }
      const move = legalMoves.find(m => m.to[0] === row && m.to[1] === col)

      if (move) {
        // Execute the move
        const newBoard = cloneBoard(board)
        const movingPiece = { ...newBoard[selRow][selCol] }
        let captured = newBoard[row][col]
        let newEnPassant = null
        const newCastling = {
          white: { ...castlingRights.white },
          black: { ...castlingRights.black }
        }

        if (move.enPassant) {
          const capturedRow = currentPlayer === 'white' ? row + 1 : row - 1
          captured = newBoard[capturedRow][col]
          newBoard[capturedRow][col] = null
        }

        if (move.castling) {
          const rookCol = move.castling === 'kingSide' ? 7 : 0
          const newRookCol = move.castling === 'kingSide' ? col - 1 : col + 1
          const castleRow = currentPlayer === 'white' ? 7 : 0
          newBoard[castleRow][newRookCol] = { ...newBoard[castleRow][rookCol] }
          newBoard[castleRow][rookCol] = null
        }

        if (movingPiece.type === 'king') {
          newCastling[currentPlayer] = { kingSide: false, queenSide: false }
        }
        if (movingPiece.type === 'rook') {
          if (selCol === 0) newCastling[currentPlayer].queenSide = false
          if (selCol === 7) newCastling[currentPlayer].kingSide = false
        }
        // If opponent's rook is captured
        const oppColor = currentPlayer === 'white' ? 'black' : 'white'
        if (row === (oppColor === 'white' ? 7 : 0)) {
          if (col === 0) newCastling[oppColor].queenSide = false
          if (col === 7) newCastling[oppColor].kingSide = false
        }

        if (movingPiece.type === 'pawn' && Math.abs(row - selRow) === 2) {
          newEnPassant = [(selRow + row) / 2, col]
        }

        movingPiece.hasMoved = true
        newBoard[row][col] = movingPiece
        newBoard[selRow][selCol] = null

        // Pawn promotion
        if (movingPiece.type === 'pawn' && (row === 0 || row === 7)) {
          setBoard(newBoard)
          setPromotionPending({ row, col, color: currentPlayer, newCastling, newEnPassant, captured, selRow, selCol })
          setLastMove({ from: [selRow, selCol], to: [row, col] })
          setCastlingRights(newCastling)
          setEnPassantTarget(newEnPassant)
          setSelectedSquare(null)
          setLegalMoves([])
          if (captured) {
            setCapturedPieces(prev => ({
              ...prev,
              [currentPlayer]: [...prev[currentPlayer], captured]
            }))
          }
          return
        }

        finishMove(newBoard, newCastling, newEnPassant, captured, selRow, selCol, row, col, currentPlayer)
        return
      }

      // Clicked own piece — reselect
      if (piece && piece.color === currentPlayer) {
        const gameState = { board, currentPlayer, castlingRights, enPassantTarget }
        setSelectedSquare([row, col])
        setLegalMoves(getLegalMoves(gameState, row, col))
        return
      }

      // Clicked empty/invalid — deselect
      setSelectedSquare(null)
      setLegalMoves([])
      return
    }

    // Nothing selected yet
    if (piece && piece.color === currentPlayer) {
      const gameState = { board, currentPlayer, castlingRights, enPassantTarget }
      setSelectedSquare([row, col])
      setLegalMoves(getLegalMoves(gameState, row, col))
    }
  }

  const handlePromotion = (pieceType) => {
    if (!promotionPending) return
    const { row, col, color, newCastling, newEnPassant, selRow, selCol } = promotionPending
    const newBoard = cloneBoard(board)
    newBoard[row][col] = { type: pieceType, color, hasMoved: true }
    setPromotionPending(null)
    finishMove(newBoard, newCastling, newEnPassant, null, selRow, selCol, row, col, color)
  }

  const resetGame = () => {
    setBoard(createInitialBoard())
    setCurrentPlayer('white')
    setSelectedSquare(null)
    setLegalMoves([])
    setLastMove(null)
    setCastlingRights({ white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } })
    setEnPassantTarget(null)
    setPromotionPending(null)
    setGameStatus('playing')
    setCapturedPieces({ white: [], black: [] })
    setMoveHistory([])
  }

  const inCheck = gameStatus === 'playing' &&
    isInCheck({ board, currentPlayer, castlingRights, enPassantTarget })

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <svg className={styles.logo} viewBox="0 0 40 40" fill="none" aria-label="Chess">
          <rect width="40" height="40" rx="8" fill="#b58a3c"/>
          <text x="7" y="29" fontSize="24" fill="#1a1510">♛</text>
        </svg>
        <h1 className={styles.title}>Chess</h1>
      </header>
      <main className={styles.main}>
        <GameInfo
          currentPlayer={currentPlayer}
          gameStatus={gameStatus}
          inCheck={inCheck}
          capturedPieces={capturedPieces}
          onReset={resetGame}
          moveHistory={moveHistory}
        />
        <Board
          board={board}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={lastMove}
          currentPlayer={currentPlayer}
          inCheck={inCheck}
          onSquareClick={onSquareClick}
          promotionPending={promotionPending}
          onPromotion={handlePromotion}
          gameStatus={gameStatus}
        />
      </main>
    </div>
  )
}
