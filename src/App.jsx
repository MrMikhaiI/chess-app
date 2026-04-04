import React, { useState, useCallback } from 'react'
import Board from './components/Board.jsx'
import GameInfo from './components/GameInfo.jsx'
import { createInitialBoard } from './engine/board.js'
import { getLegalMoves } from './engine/moves.js'
import { isInCheck, getGameStatus } from './engine/gameState.js'
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

  const gameState = { board, currentPlayer, castlingRights, enPassantTarget }

  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return

    const piece = board[row][col]

    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare
      const move = legalMoves.find(m => m.to[0] === row && m.to[1] === col)

      if (move) {
        applyMove(move, selRow, selCol, row, col)
        return
      }

      if (piece && piece.color === currentPlayer) {
        setSelectedSquare([row, col])
        setLegalMoves(getLegalMoves(gameState, row, col))
        return
      }

      setSelectedSquare(null)
      setLegalMoves([])
      return
    }

    if (piece && piece.color === currentPlayer) {
      setSelectedSquare([row, col])
      setLegalMoves(getLegalMoves(gameState, row, col))
    }
  }, [board, currentPlayer, selectedSquare, legalMoves, gameStatus, castlingRights, enPassantTarget])

  const applyMove = (move, fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null))
    const movingPiece = { ...newBoard[fromRow][fromCol] }
    let captured = newBoard[toRow][toCol]
    let newEnPassant = null
    let newCastling = {
      white: { ...castlingRights.white },
      black: { ...castlingRights.black }
    }

    if (move.enPassant) {
      const capturedRow = currentPlayer === 'white' ? toRow + 1 : toRow - 1
      captured = newBoard[capturedRow][toCol]
      newBoard[capturedRow][toCol] = null
    }

    if (move.castling) {
      const rookCol = move.castling === 'kingSide' ? 7 : 0
      const newRookCol = move.castling === 'kingSide' ? toCol - 1 : toCol + 1
      newBoard[fromRow][newRookCol] = { ...newBoard[fromRow][rookCol] }
      newBoard[fromRow][rookCol] = null
    }

    if (movingPiece.type === 'king') {
      newCastling[currentPlayer] = { kingSide: false, queenSide: false }
    }
    if (movingPiece.type === 'rook') {
      if (fromCol === 0) newCastling[currentPlayer].queenSide = false
      if (fromCol === 7) newCastling[currentPlayer].kingSide = false
    }
    if (toRow === 0 || toRow === 7) {
      const oppColor = currentPlayer === 'white' ? 'black' : 'white'
      if (toCol === 0) newCastling[oppColor].queenSide = false
      if (toCol === 7) newCastling[oppColor].kingSide = false
    }

    if (movingPiece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      newEnPassant = [(fromRow + toRow) / 2, toCol]
    }

    movingPiece.hasMoved = true
    newBoard[toRow][toCol] = movingPiece
    newBoard[fromRow][fromCol] = null

    if (movingPiece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      setBoard(newBoard)
      setPromotionPending({ row: toRow, col: toCol, color: currentPlayer })
      setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] })
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

    finishMove(newBoard, newCastling, newEnPassant, captured, fromRow, fromCol, toRow, toCol)
  }

  const finishMove = (newBoard, newCastling, newEnPassant, captured, fromRow, fromCol, toRow, toCol) => {
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white'
    const nextGameState = { board: newBoard, currentPlayer: nextPlayer, castlingRights: newCastling, enPassantTarget: newEnPassant }
    const status = getGameStatus(nextGameState)

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
        [currentPlayer]: [...prev[currentPlayer], captured]
      }))
    }

    setMoveHistory(prev => [...prev, { from: [fromRow, fromCol], to: [toRow, toCol], piece: newBoard[toRow][toCol] }])
  }

  const handlePromotion = (pieceType) => {
    if (!promotionPending) return
    const { row, col, color } = promotionPending
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null))
    newBoard[row][col] = { type: pieceType, color, hasMoved: true }
    setPromotionPending(null)
    finishMove(newBoard, castlingRights, enPassantTarget, null, lastMove.from[0], lastMove.from[1], row, col)
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

  const inCheck = gameStatus === 'playing' && isInCheck({ board, currentPlayer, castlingRights, enPassantTarget })

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <svg className={styles.logo} viewBox="0 0 40 40" fill="none" aria-label="Chess App">
          <rect width="40" height="40" rx="8" fill="#e94560"/>
          <text x="8" y="28" fontSize="22" fill="white">♛</text>
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
          onSquareClick={handleSquareClick}
          promotionPending={promotionPending}
          onPromotion={handlePromotion}
          gameStatus={gameStatus}
        />
      </main>
    </div>
  )
}
