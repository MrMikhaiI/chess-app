// Piece types: king, queen, rook, bishop, knight, pawn
// Colors: white, black

export function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null))

  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

  backRank.forEach((type, col) => {
    board[0][col] = { type, color: 'black', hasMoved: false }
    board[7][col] = { type, color: 'white', hasMoved: false }
  })

  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false }
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false }
  }

  return board
}

export function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null))
}
