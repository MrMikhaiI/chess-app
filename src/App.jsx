import React, { useState, useCallback, useEffect, useRef } from 'react'
import Board from './components/Board.jsx'
import GameInfo from './components/GameInfo.jsx'
import OpeningBanner from './components/OpeningBanner.jsx'
import { createInitialBoard } from './engine/board.js'
import { getLegalMoves } from './engine/moves.js'
import { isInCheck, getGameStatus } from './engine/gameState.js'
import { cloneBoard } from './engine/board.js'
import { detectOpening } from './engine/openings.js'
import styles from './App.module.css'

// canvas-confetti via CDN — loaded lazily on win
let confettiLoaded = false
let confettiFn = null
function fireConfetti() {
  if (confettiFn) {
    confettiFn({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ['#b58a3c','#f0d9b5','#ffffff','#e94560','#4a90d9'] })
    setTimeout(() => confettiFn({ particleCount: 80, spread: 120, origin: { y: 0.4 }, startVelocity: 20 }), 400)
    return
  }
  if (confettiLoaded) return
  confettiLoaded = true
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
  script.onload = () => {
    confettiFn = window.confetti
    fireConfetti()
  }
  document.head.appendChild(script)
}

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
  const [opening, setOpening] = useState(null)
  // drag state
  const dragSource = useRef(null)

  // Fire confetti when game ends in checkmate
  useEffect(() => {
    if (gameStatus === 'checkmate') {
      setTimeout(fireConfetti, 200)
    }
  }, [gameStatus])

  const finishMove = useCallback((
    newBoard, newCastling, newEnPassant,
    captured, fromRow, fromCol, toRow, toCol, movingColor
  ) => {
    const nextPlayer = movingColor === 'white' ? 'black' : 'white'
    const nextState = { board: newBoard, currentPlayer: nextPlayer, castlingRights: newCastling, enPassantTarget: newEnPassant }
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
      setCapturedPieces(prev => ({ ...prev, [movingColor]: [...prev[movingColor], captured] }))
    }

    setMoveHistory(prev => {
      const updated = [...prev, { from: [fromRow, fromCol], to: [toRow, toCol] }]
      setOpening(detectOpening(updated))
      return updated
    })
  }, [])

  const executeMove = useCallback((selRow, selCol, toRow, toCol, currentBoard, curPlayer, curCastling, curEnPassant, curLegalMoves) => {
    const move = curLegalMoves.find(m => m.to[0] === toRow && m.to[1] === toCol)
    if (!move) return false

    const newBoard = cloneBoard(currentBoard)
    const movingPiece = { ...newBoard[selRow][selCol] }
    let captured = newBoard[toRow][toCol]
    let newEnPassant = null
    const newCastling = { white: { ...curCastling.white }, black: { ...curCastling.black } }

    if (move.enPassant) {
      const capturedRow = curPlayer === 'white' ? toRow + 1 : toRow - 1
      captured = newBoard[capturedRow][toCol]
      newBoard[capturedRow][toCol] = null
    }
    if (move.castling) {
      const rookCol = move.castling === 'kingSide' ? 7 : 0
      const newRookCol = move.castling === 'kingSide' ? toCol - 1 : toCol + 1
      const castleRow = curPlayer === 'white' ? 7 : 0
      newBoard[castleRow][newRookCol] = { ...newBoard[castleRow][rookCol] }
      newBoard[castleRow][rookCol] = null
    }
    if (movingPiece.type === 'king') newCastling[curPlayer] = { kingSide: false, queenSide: false }
    if (movingPiece.type === 'rook') {
      if (selCol === 0) newCastling[curPlayer].queenSide = false
      if (selCol === 7) newCastling[curPlayer].kingSide = false
    }
    const oppColor = curPlayer === 'white' ? 'black' : 'white'
    if (toRow === (oppColor === 'white' ? 7 : 0)) {
      if (toCol === 0) newCastling[oppColor].queenSide = false
      if (toCol === 7) newCastling[oppColor].kingSide = false
    }
    if (movingPiece.type === 'pawn' && Math.abs(toRow - selRow) === 2) {
      newEnPassant = [(selRow + toRow) / 2, toCol]
    }

    movingPiece.hasMoved = true
    newBoard[toRow][toCol] = movingPiece
    newBoard[selRow][selCol] = null

    if (movingPiece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      setBoard(newBoard)
      setPromotionPending({ row: toRow, col: toCol, color: curPlayer, newCastling, newEnPassant, captured, selRow, selCol })
      setLastMove({ from: [selRow, selCol], to: [toRow, toCol] })
      setCastlingRights(newCastling)
      setEnPassantTarget(newEnPassant)
      setSelectedSquare(null)
      setLegalMoves([])
      if (captured) setCapturedPieces(prev => ({ ...prev, [curPlayer]: [...prev[curPlayer], captured] }))
      return true
    }

    finishMove(newBoard, newCastling, newEnPassant, captured, selRow, selCol, toRow, toCol, curPlayer)
    return true
  }, [finishMove])

  const onSquareClick = (row, col) => {
    if (gameStatus !== 'playing') return
    const piece = board[row][col]
    const gameState = { board, currentPlayer, castlingRights, enPassantTarget }

    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare
      const moved = executeMove(selRow, selCol, row, col, board, currentPlayer, castlingRights, enPassantTarget, legalMoves)
      if (moved) return

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
  }

  // Drag & drop handlers
  const onDragStart = useCallback((row, col) => {
    dragSource.current = { row, col }
    // Compute legal moves at drag start so we can show them
    setSelectedSquare([row, col])
    setLegalMoves(prev => {
      // use functional update to avoid stale board — compute fresh
      return prev
    })
    // We need fresh board/state here — set selected which triggers legalMoves via the state
    setBoard(prevBoard => {
      const gameState = { board: prevBoard, currentPlayer, castlingRights, enPassantTarget }
      const moves = getLegalMoves(gameState, row, col)
      setLegalMoves(moves)
      return prevBoard
    })
  }, [currentPlayer, castlingRights, enPassantTarget])

  const onDragEnd = useCallback((toRow, toCol) => {
    if (toRow === null || !dragSource.current) {
      dragSource.current = null
      setSelectedSquare(null)
      setLegalMoves([])
      return
    }
    const { row: selRow, col: selCol } = dragSource.current
    dragSource.current = null

    setBoard(prevBoard => {
      setLegalMoves(prevMoves => {
        executeMove(selRow, selCol, toRow, toCol, prevBoard, currentPlayer, castlingRights, enPassantTarget, prevMoves)
        return []
      })
      return prevBoard
    })
  }, [currentPlayer, castlingRights, enPassantTarget, executeMove])

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
    setOpening(null)
  }

  const inCheck = gameStatus === 'playing' &&
    isInCheck({ board, currentPlayer, castlingRights, enPassantTarget })

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        {/* New expressive SVG logo — stylised knight head */}
        <svg className={styles.logo} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Chess">
          <rect width="40" height="40" rx="8" fill="#1a1510"/>
          <rect x="1" y="1" width="38" height="38" rx="7" stroke="#b58a3c" strokeWidth="1.5" fill="none"/>
          {/* Knight silhouette */}
          <path d="M13 30 L13 26 C13 26 10 24 10 20 C10 15 14 11 18 10 C18 10 17 12 18 13 C19 14 22 13 23 15 C24 17 22 18 21 19 L27 19 L27 30 Z" fill="#b58a3c"/>
          <circle cx="16" cy="15" r="1.2" fill="#1a1510"/>
          <line x1="13" y1="30" x2="27" y2="30" stroke="#b58a3c" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h1 className={styles.title}>Chess</h1>
      </header>
      <OpeningBanner opening={opening} />
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
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          promotionPending={promotionPending}
          onPromotion={handlePromotion}
          gameStatus={gameStatus}
        />
      </main>
    </div>
  )
}
