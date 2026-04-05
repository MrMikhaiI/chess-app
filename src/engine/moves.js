import { cloneBoard } from './board.js'
import { isInCheck } from './gameState.js'

export function getLegalMoves(gameState, row, col) {
  const { board, currentPlayer, castlingRights, enPassantTarget } = gameState
  const piece = board[row][col]
  if (!piece || piece.color !== currentPlayer) return []

  const pseudoMoves = getPseudoMoves(gameState, row, col)

  return pseudoMoves.filter(move => {
    const newBoard = cloneBoard(board)
    const { to, enPassant, castling } = move

    if (enPassant) {
      const capturedRow = currentPlayer === 'white' ? to[0] + 1 : to[0] - 1
      newBoard[capturedRow][to[1]] = null
    }
    if (castling) {
      const rookCol = castling === 'kingSide' ? 7 : 0
      const newRookCol = castling === 'kingSide' ? to[1] - 1 : to[1] + 1
      newBoard[row][newRookCol] = { ...newBoard[row][rookCol] }
      newBoard[row][rookCol] = null
    }

    newBoard[to[0]][to[1]] = { ...newBoard[row][col] }
    newBoard[row][col] = null

    return !isInCheck({ board: newBoard, currentPlayer, castlingRights, enPassantTarget })
  })
}

function getPseudoMoves(gameState, row, col) {
  const { board, currentPlayer, castlingRights, enPassantTarget } = gameState
  const piece = board[row][col]
  const moves = []

  const addMove = (toRow, toCol, extra = {}) => {
    moves.push({ from: [row, col], to: [toRow, toCol], ...extra })
  }

  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8
  const isEmpty = (r, c) => !board[r][c]
  const isEnemy = (r, c) => board[r][c] && board[r][c].color !== currentPlayer

  switch (piece.type) {
    case 'pawn': {
      const dir = currentPlayer === 'white' ? -1 : 1
      const startRow = currentPlayer === 'white' ? 6 : 1

      if (inBounds(row + dir, col) && isEmpty(row + dir, col)) {
        addMove(row + dir, col)
        if (row === startRow && isEmpty(row + 2 * dir, col)) {
          addMove(row + 2 * dir, col)
        }
      }

      for (const dc of [-1, 1]) {
        if (inBounds(row + dir, col + dc)) {
          if (isEnemy(row + dir, col + dc)) {
            addMove(row + dir, col + dc)
          }
          if (enPassantTarget &&
              enPassantTarget[0] === row + dir &&
              enPassantTarget[1] === col + dc) {
            addMove(row + dir, col + dc, { enPassant: true })
          }
        }
      }
      break
    }

    case 'knight': {
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      for (const [dr, dc] of knightMoves) {
        const r = row + dr, c = col + dc
        if (inBounds(r, c) && (isEmpty(r, c) || isEnemy(r, c))) addMove(r, c)
      }
      break
    }

    case 'bishop': {
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c)) {
          if (isEmpty(r, c)) { addMove(r, c) }
          else { if (isEnemy(r, c)) addMove(r, c); break }
          r += dr; c += dc
        }
      }
      break
    }

    case 'rook': {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c)) {
          if (isEmpty(r, c)) { addMove(r, c) }
          else { if (isEnemy(r, c)) addMove(r, c); break }
          r += dr; c += dc
        }
      }
      break
    }

    case 'queen': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        let r = row + dr, c = col + dc
        while (inBounds(r, c)) {
          if (isEmpty(r, c)) { addMove(r, c) }
          else { if (isEnemy(r, c)) addMove(r, c); break }
          r += dr; c += dc
        }
      }
      break
    }

    case 'king': {
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const r = row + dr, c = col + dc
        if (inBounds(r, c) && (isEmpty(r, c) || isEnemy(r, c))) addMove(r, c)
      }

      // Castling: king must not currently be in check (FIDE rule)
      const currentlyInCheck = isInCheck({ board, currentPlayer, castlingRights, enPassantTarget })
      if (!currentlyInCheck && !piece.hasMoved && row === (currentPlayer === 'white' ? 7 : 0)) {
        const rights = castlingRights[currentPlayer]
        const castleRow = currentPlayer === 'white' ? 7 : 0

        if (rights.kingSide &&
            isEmpty(castleRow, 5) && isEmpty(castleRow, 6) &&
            board[castleRow][7]?.type === 'rook' && !board[castleRow][7].hasMoved) {
          const tempBoard1 = cloneBoard(board)
          tempBoard1[castleRow][5] = tempBoard1[castleRow][4]
          tempBoard1[castleRow][4] = null
          if (!isInCheck({ board: tempBoard1, currentPlayer, castlingRights, enPassantTarget })) {
            addMove(castleRow, 6, { castling: 'kingSide' })
          }
        }

        if (rights.queenSide &&
            isEmpty(castleRow, 1) && isEmpty(castleRow, 2) && isEmpty(castleRow, 3) &&
            board[castleRow][0]?.type === 'rook' && !board[castleRow][0].hasMoved) {
          const tempBoard2 = cloneBoard(board)
          tempBoard2[castleRow][3] = tempBoard2[castleRow][4]
          tempBoard2[castleRow][4] = null
          if (!isInCheck({ board: tempBoard2, currentPlayer, castlingRights, enPassantTarget })) {
            addMove(castleRow, 2, { castling: 'queenSide' })
          }
        }
      }
      break
    }
  }

  return moves
}

export function getAllLegalMoves(gameState) {
  const { board, currentPlayer } = gameState
  const allMoves = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === currentPlayer) {
        const moves = getLegalMoves(gameState, r, c)
        allMoves.push(...moves)
      }
    }
  }
  return allMoves
}
