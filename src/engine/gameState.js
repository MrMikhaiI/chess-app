import { getAllLegalMoves } from './moves.js'

export function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'king' && board[r][c]?.color === color) {
        return [r, c]
      }
    }
  }
  return null
}

export function isSquareAttacked(board, row, col, byColor) {
  const pawnDir = byColor === 'white' ? 1 : -1
  for (const dc of [-1, 1]) {
    const r = row + pawnDir, c = col + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8 &&
        board[r][c]?.type === 'pawn' && board[r][c]?.color === byColor) return true
  }

  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = row + dr, c = col + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8 &&
        board[r][c]?.type === 'knight' && board[r][c]?.color === byColor) return true
  }

  const straight = [[-1,0],[1,0],[0,-1],[0,1]]
  const diagonal = [[-1,-1],[-1,1],[1,-1],[1,1]]

  for (const [dr, dc] of straight) {
    let r = row + dr, c = col + dc
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c]
      if (piece) {
        if (piece.color === byColor && (piece.type === 'rook' || piece.type === 'queen')) return true
        break
      }
      r += dr; c += dc
    }
  }

  for (const [dr, dc] of diagonal) {
    let r = row + dr, c = col + dc
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c]
      if (piece) {
        if (piece.color === byColor && (piece.type === 'bishop' || piece.type === 'queen')) return true
        break
      }
      r += dr; c += dc
    }
  }

  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const r = row + dr, c = col + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8 &&
        board[r][c]?.type === 'king' && board[r][c]?.color === byColor) return true
  }

  return false
}

export function isInCheck(gameState) {
  const { board, currentPlayer } = gameState
  const kingPos = findKing(board, currentPlayer)
  if (!kingPos) return false
  const opponent = currentPlayer === 'white' ? 'black' : 'white'
  return isSquareAttacked(board, kingPos[0], kingPos[1], opponent)
}

export function getGameStatus(gameState) {
  const allMoves = getAllLegalMoves(gameState)
  if (allMoves.length === 0) {
    if (isInCheck(gameState)) return 'checkmate'
    return 'stalemate'
  }
  return 'playing'
}
