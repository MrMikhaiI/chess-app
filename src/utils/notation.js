// Full algebraic notation builder
import { getLegalMoves } from '../engine/moves.js'

const FILE = col => String.fromCharCode(97 + col)
const RANK = row => String(8 - row)
const PIECE_LETTER = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', king: 'K' }

export function buildNotation(move, boardBefore, nextBoard, gameStatus) {
  const { from, to, castling, enPassant, promotion } = move
  const piece = boardBefore[from[0]][from[1]]
  if (!piece) return '?'

  // Castling
  if (castling === 'kingSide')  return gameStatus === 'checkmate' ? 'O-O#'  : gameStatus === 'check' ? 'O-O+'  : 'O-O'
  if (castling === 'queenSide') return gameStatus === 'checkmate' ? 'O-O-O#' : gameStatus === 'check' ? 'O-O-O+' : 'O-O-O'

  const captured = boardBefore[to[0]][to[1]] || (enPassant ? boardBefore[from[0]][to[1]] : null)
  const letter = piece.type === 'pawn' ? '' : PIECE_LETTER[piece.type]

  // Disambiguation: find all other same-type pieces that could reach the same square
  let disambig = ''
  if (piece.type !== 'pawn') {
    const gs = {
      board: boardBefore,
      currentPlayer: piece.color,
      castlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      enPassantTarget: null
    }
    const ambiguous = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === from[0] && c === from[1]) continue
        const p = boardBefore[r][c]
        if (!p || p.type !== piece.type || p.color !== piece.color) continue
        const moves = getLegalMoves({ ...gs }, r, c)
        if (moves.some(m => m.to[0] === to[0] && m.to[1] === to[1])) {
          ambiguous.push([r, c])
        }
      }
    }
    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some(([, c]) => c === from[1])
      const sameRank = ambiguous.some(([r]) => r === from[0])
      if (!sameFile) disambig = FILE(from[1])
      else if (!sameRank) disambig = RANK(from[0])
      else disambig = FILE(from[1]) + RANK(from[0])
    }
  }

  const captureStr = captured ? (piece.type === 'pawn' ? FILE(from[1]) : '') + 'x' : ''
  const dest = FILE(to[1]) + RANK(to[0])
  const promoStr = promotion ? '=' + PIECE_LETTER[promotion] : ''
  const suffix = gameStatus === 'checkmate' ? '#' : gameStatus === 'check' ? '+' : ''

  return letter + disambig + captureStr + dest + promoStr + suffix
}
