import React, { useState, useCallback, useEffect, useRef } from 'react'
import Board from './components/Board.jsx'
import GameInfo from './components/GameInfo.jsx'
import OpeningBanner from './components/OpeningBanner.jsx'
import BoardControls from './components/BoardControls.jsx'
import TimeControl, { TIME_CONTROLS } from './components/TimeControl.jsx'
import { createInitialBoard } from './engine/board.js'
import { getLegalMoves } from './engine/moves.js'
import { isInCheck, getGameStatus } from './engine/gameState.js'
import { cloneBoard } from './engine/board.js'
import { detectOpening } from './engine/openings.js'
import { useSound } from './hooks/useSound.js'
import { useTimer } from './hooks/useTimer.js'
import { buildNotation } from './utils/notation.js'
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

const DEFAULT_TC = TIME_CONTROLS.find(t => t.label === '5+0')

function makeTimes(tc) {
  if (!tc || tc.minutes === null) return null
  const ms = tc.minutes * 60 * 1000
  return { white: ms, black: ms }
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
  const [moveHistory, setMoveHistory] = useState([])   // raw move objects
  const [notation, setNotation] = useState([])          // algebraic strings
  // For jump-to-move: store board snapshots
  const [snapshots, setSnapshots] = useState([])        // array of board states
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1) // -1 = live
  const [opening, setOpening] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [pieceSet, setPieceSet] = useState('cburnett')
  const [selectedTC, setSelectedTC] = useState(DEFAULT_TC)
  const [times, setTimes] = useState(() => makeTimes(DEFAULT_TC))
  const dragSource = useRef(null)
  const { playMove, playCapture, playCheck, playEnd } = useSound()

  // always-fresh state ref for drag handlers
  const stateRef = useRef({ board, currentPlayer, castlingRights, enPassantTarget, gameStatus })
  useEffect(() => {
    stateRef.current = { board, currentPlayer, castlingRights, enPassantTarget, gameStatus }
  })

  // timer
  useTimer({ times, setTimes, currentPlayer, gameStatus, increment: selectedTC?.increment ?? 0 })

  // timeout detection
  useEffect(() => {
    if (!times) return
    if (times.white <= 0 && gameStatus === 'playing') {
      playEnd()
      fireConfetti()
      setGameStatus('timeout')
    } else if (times.black <= 0 && gameStatus === 'playing') {
      playEnd()
      fireConfetti()
      setGameStatus('timeout')
    }
  }, [times, gameStatus])

  useEffect(() => {
    if (gameStatus === 'checkmate') { setTimeout(fireConfetti, 200); playEnd() }
    if (gameStatus === 'stalemate') { playEnd() }
    if (gameStatus === 'resigned')  { setTimeout(fireConfetti, 200); playEnd() }
  }, [gameStatus])

  const finishMove = useCallback((
    newBoard, newCastling, newEnPassant,
    captured, fromRow, fromCol, toRow, toCol, movingColor,
    moveObj, boardBefore
  ) => {
    const nextPlayer = movingColor === 'white' ? 'black' : 'white'
    const nextState = { board: newBoard, currentPlayer: nextPlayer, castlingRights: newCastling, enPassantTarget: newEnPassant }
    const status = getGameStatus(nextState)
    const inCheckNext = isInCheck(nextState)
    const notationStatus = status === 'checkmate' ? 'checkmate' : inCheckNext ? 'check' : ''

    // build algebraic notation
    const alg = buildNotation(
      { from: [fromRow, fromCol], to: [toRow, toCol], castling: moveObj?.castling, enPassant: moveObj?.enPassant, promotion: moveObj?.promotion },
      boardBefore,
      newBoard,
      notationStatus
    )

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

    if (inCheckNext && status === 'playing') setTimeout(playCheck, 80)

    setMoveHistory(prev => {
      const updated = [...prev, { from: [fromRow, fromCol], to: [toRow, toCol] }]
      setOpening(detectOpening(updated))
      return updated
    })
    setNotation(prev => [...prev, alg])
    setSnapshots(prev => [...prev, cloneBoard(boardBefore)])
    setCurrentMoveIdx(-1)
  }, [playMove, playCapture, playCheck])

  const executeMove = useCallback((selRow, selCol, toRow, toCol, curBoard, curPlayer, curCastling, curEnPassant, curLegalMoves) => {
    const move = curLegalMoves.find(m => m.to[0] === toRow && m.to[1] === toCol)
    if (!move) return false

    const boardBefore = cloneBoard(curBoard)
    const newBoard = cloneBoard(curBoard)
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
      setPromotionPending({ row: toRow, col: toCol, color: curPlayer, newCastling, newEnPassant, captured, selRow, selCol, move, boardBefore })
      setLastMove({ from: [selRow, selCol], to: [toRow, toCol] })
      setCastlingRights(newCastling)
      setEnPassantTarget(newEnPassant)
      setSelectedSquare(null)
      setLegalMoves([])
      if (captured) setCapturedPieces(prev => ({ ...prev, [curPlayer]: [...prev[curPlayer], captured] }))
      return true
    }

    finishMove(newBoard, newCastling, newEnPassant, captured, selRow, selCol, toRow, toCol, curPlayer, move, boardBefore)
    return true
  }, [finishMove])

  const onSquareClick = (row, col) => {
    if (gameStatus !== 'playing') return
    // if viewing history, return to live first
    if (currentMoveIdx !== -1) { setCurrentMoveIdx(-1); return }
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
    if (stateRef.current.gameStatus !== 'playing') return
    const { board: b, currentPlayer: cp, castlingRights: cr, enPassantTarget: ep } = stateRef.current
    dragSource.current = {
      row, col, board: b, currentPlayer: cp, castlingRights: cr, enPassantTarget: ep,
      legalMoves: getLegalMoves({ board: b, currentPlayer: cp, castlingRights: cr, enPassantTarget: ep }, row, col)
    }
    setSelectedSquare([row, col])
    setLegalMoves(dragSource.current.legalMoves)
  }, [])

  const onDragEnd = useCallback((toRow, toCol) => {
    if (toRow === null || !dragSource.current) {
      dragSource.current = null
      setSelectedSquare(null)
      setLegalMoves([])
      return
    }
    const { row: selRow, col: selCol, board: b, currentPlayer: cp, castlingRights: cr, enPassantTarget: ep, legalMoves: lm } = dragSource.current
    dragSource.current = null
    setSelectedSquare(null)
    setLegalMoves([])
    executeMove(selRow, selCol, toRow, toCol, b, cp, cr, ep, lm)
  }, [executeMove])

  const handlePromotion = (pieceType) => {
    if (!promotionPending) return
    const { row, col, color, newCastling, newEnPassant, selRow, selCol, move, boardBefore } = promotionPending
    const newBoard = cloneBoard(board)
    newBoard[row][col] = { type: pieceType, color, hasMoved: true }
    setPromotionPending(null)
    finishMove(newBoard, newCastling, newEnPassant, null, selRow, selCol, row, col, color, { ...move, promotion: pieceType }, boardBefore)
  }

  const handleResign = () => {
    if (gameStatus !== 'playing') return
    playEnd()
    setGameStatus('resigned')
  }

  const handleSelectTC = (tc) => {
    setSelectedTC(tc)
    setTimes(makeTimes(tc))
    resetGame(tc)
  }

  const handleJumpToMove = (idx) => {
    setCurrentMoveIdx(idx)
  }

  const resetGame = (tc) => {
    const usedTC = tc ?? selectedTC
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
    setNotation([])
    setSnapshots([])
    setCurrentMoveIdx(-1)
    setOpening(null)
    setTimes(makeTimes(usedTC))
  }

  const inCheck = gameStatus === 'playing' &&
    isInCheck({ board, currentPlayer, castlingRights, enPassantTarget })

  // board to display: snapshot if viewing history, live otherwise
  const displayBoard = currentMoveIdx >= 0 && snapshots[currentMoveIdx]
    ? snapshots[currentMoveIdx]
    : board

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <svg className={styles.logo} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Chess">
          <rect width="64" height="64" rx="13" fill="#1a1510"/>
          <rect x="8"  y="8"  width="11" height="11" rx="1.5" fill="#b58a3c"/>
          <rect x="19" y="8"  width="11" height="11" rx="1.5" fill="#2a2420"/>
          <rect x="30" y="8"  width="11" height="11" rx="1.5" fill="#b58a3c"/>
          <rect x="41" y="8"  width="11" height="11" rx="1.5" fill="#2a2420"/>
          <rect x="8"  y="19" width="11" height="11" rx="1.5" fill="#2a2420"/>
          <rect x="19" y="19" width="11" height="11" rx="1.5" fill="#b58a3c"/>
          <rect x="30" y="19" width="11" height="11" rx="1.5" fill="#2a2420"/>
          <rect x="41" y="19" width="11" height="11" rx="1.5" fill="#b58a3c"/>
          <rect x="8"  y="30" width="11" height="11" rx="1.5" fill="#b58a3c"/>
          <rect x="19" y="30" width="11" height="11" rx="1.5" fill="#2a2420"/>
          <rect x="30" y="30" width="11" height="11" rx="1.5" fill="#b58a3c"/>
          <rect x="41" y="30" width="11" height="11" rx="1.5" fill="#2a2420"/>
          <circle cx="32" cy="22" r="3" fill="#f0d9b5"/>
          <circle cx="22" cy="26" r="2.2" fill="#f0d9b5"/>
          <circle cx="42" cy="26" r="2.2" fill="#f0d9b5"/>
          <path d="M22 36 L24 28 L28 33 L32 24 L36 33 L40 28 L42 36 Z" fill="#f0d9b5" stroke="#b58a3c" strokeWidth="0.8"/>
          <rect x="21" y="37" width="22" height="4" rx="2" fill="#b58a3c"/>
          <rect x="8" y="48" width="48" height="7" rx="3.5" fill="#b58a3c" opacity="0.35"/>
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
          onReset={() => resetGame()}
          notation={notation}
          pieceSet={pieceSet}
          onJumpToMove={handleJumpToMove}
          currentMoveIdx={currentMoveIdx}
        />
        <div className={styles.boardColumn}>
          <TimeControl
            times={times}
            currentPlayer={currentPlayer}
            gameStatus={gameStatus}
            selectedControl={selectedTC}
            onSelectControl={handleSelectTC}
          />
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
            board={displayBoard}
            selectedSquare={currentMoveIdx === -1 ? selectedSquare : null}
            legalMoves={currentMoveIdx === -1 ? legalMoves : []}
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
