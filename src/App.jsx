import React, { useState, useCallback, useEffect, useRef } from 'react'
import Board from './components/Board.jsx'
import GameInfo from './components/GameInfo.jsx'
import OpeningBanner from './components/OpeningBanner.jsx'
import BoardControls from './components/BoardControls.jsx'
import { createInitialBoard } from './engine/board.js'
import { getLegalMoves } from './engine/moves.js'
import { isInCheck, getGameStatus } from './engine/gameState.js'
import { cloneBoard } from './engine/board.js'
import { detectOpening } from './engine/openings.js'
import { useSound } from './hooks/useSound.js'
import styles from './App.module.css'

let confettiFn = null
function fireConfetti() {
  const run = () => {
    confettiFn({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ['#b58a3c','#f0d9b5','#fff','#e94560','#4a90d9'] })
    setTimeout(() => confettiFn({ particleCount: 80, spread: 120, origin: { y: 0.4 }, startVelocity: 20 }), 400)
  }
  if (confettiFn) { run(); return }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
  s.onload = () => { confettiFn = window.confetti; run() }
  document.head.appendChild(s)
}

export default function App() {
  const [board, setBoard] = useState(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState('white')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [castlingRights, setCastlingRights] = useState({
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true },
  })
  const [enPassantTarget, setEnPassantTarget] = useState(null)
  const [promotionPending, setPromotionPending] = useState(null)
  const [gameStatus, setGameStatus] = useState('playing')
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [moveHistory, setMoveHistory] = useState([])
  const [opening, setOpening] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [pieceSet, setPieceSet] = useState('cburnett')
  const dragSource = useRef(null)
  const { playMove, playCapture, playCheck, playEnd } = useSound()

  useEffect(() => {
    if (gameStatus === 'checkmate') { setTimeout(fireConfetti, 200); playEnd() }
    if (gameStatus === 'stalemate') { playEnd() }
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
      playCapture()
    } else {
      playMove()
    }

    // check sound
    const inCheckNext = isInCheck(nextState)
    if (inCheckNext && status === 'playing') setTimeout(playCheck, 80)

    setMoveHistory(prev => {
      const updated = [...prev, { from: [fromRow, fromCol], to: [toRow, toCol] }]
      setOpening(detectOpening(updated))
      return updated
    })
  }, [playMove, playCapture, playCheck])

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

  const onDragStart = useCallback((row, col) => {
    dragSource.current = { row, col }
    setSelectedSquare([row, col])
    setBoard(prevBoard => {
      const gs = { board: prevBoard, currentPlayer, castlingRights, enPassantTarget }
      setLegalMoves(getLegalMoves(gs, row, col))
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

  const handleResign = () => {
    if (gameStatus !== 'playing') return
    playEnd()
    setGameStatus('resigned')
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
        {/* Clean geometric chess logo: two-tone board square with crown */}
        <svg className={styles.logo} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Chess">
          <rect width="42" height="42" rx="9" fill="#1a1510"/>
          {/* mini chessboard pattern */}
          <rect x="6"  y="6"  width="7" height="7" rx="1" fill="#b58a3c"/>
          <rect x="13" y="6"  width="7" height="7" rx="1" fill="#2a2420"/>
          <rect x="20" y="6"  width="7" height="7" rx="1" fill="#b58a3c"/>
          <rect x="27" y="6"  width="7" height="7" rx="1" fill="#2a2420"/>
          <rect x="6"  y="13" width="7" height="7" rx="1" fill="#2a2420"/>
          <rect x="13" y="13" width="7" height="7" rx="1" fill="#b58a3c"/>
          <rect x="20" y="13" width="7" height="7" rx="1" fill="#2a2420"/>
          <rect x="27" y="13" width="7" height="7" rx="1" fill="#b58a3c"/>
          {/* queen silhouette over the board */}
          <path d="M21 18 L23.5 23 L26 20 L25 26 L17 26 L16 20 L18.5 23 Z" fill="#f0d9b5" stroke="#b58a3c" strokeWidth="0.6"/>
          <circle cx="21" cy="16.5" r="1.5" fill="#f0d9b5"/>
          <circle cx="16.5" cy="18.5" r="1.2" fill="#f0d9b5"/>
          <circle cx="25.5" cy="18.5" r="1.2" fill="#f0d9b5"/>
          {/* base line */}
          <rect x="15" y="27" width="12" height="2.5" rx="1.25" fill="#b58a3c"/>
          {/* bottom strip */}
          <rect x="6" y="32" width="30" height="4" rx="2" fill="#b58a3c" opacity="0.3"/>
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
          pieceSet={pieceSet}
        />
        <div className={styles.boardColumn}>
          <BoardControls
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            pieceSet={pieceSet}
            onPieceSet={setPieceSet}
            onResign={handleResign}
            gameStatus={gameStatus}
            currentPlayer={currentPlayer}
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
            flipped={flipped}
            pieceSet={pieceSet}
          />
        </div>
      </main>
    </div>
  )
}
