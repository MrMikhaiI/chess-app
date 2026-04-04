// ECO opening database — moves stored as "fromCol fromRow toCol toRow" joined by spaces
// Key = space-joined sequence of algebraic pairs like "e2e4 e7e5"

const OPENINGS = [
  // Open games (1.e4 e5)
  { moves: 'e2e4', name: "King's Pawn Opening" },
  { moves: 'e2e4 e7e5', name: 'Open Game' },
  { moves: 'e2e4 e7e5 g1f3', name: "King's Knight Opening" },
  { moves: 'e2e4 e7e5 g1f3 b8c6', name: 'Two Knights / Four Knights' },
  { moves: 'e2e4 e7e5 g1f3 b8c6 f1b5', name: 'Ruy López (Spanish Opening)' },
  { moves: 'e2e4 e7e5 g1f3 b8c6 f1c4', name: 'Italian Game' },
  { moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6', name: 'Two Knights Defense' },
  { moves: 'e2e4 e7e5 g1f3 b8c6 d2d4', name: 'Scotch Game' },
  { moves: 'e2e4 e7e5 g1f3 b8c6 d2d4 e5d4', name: 'Scotch Game Accepted' },
  { moves: 'e2e4 e7e5 f2f4', name: "King's Gambit" },
  { moves: 'e2e4 e7e5 f2f4 e5f4', name: "King's Gambit Accepted" },
  { moves: 'e2e4 e7e5 f2f4 f8c5', name: "King's Gambit Declined" },
  { moves: 'e2e4 e7e5 g1f3 g8f6', name: 'Petrov Defense' },
  { moves: 'e2e4 e7e5 g1f3 f7f5', name: 'Latvian Gambit' },
  { moves: 'e2e4 e7e5 d2d4 e5d4', name: 'Center Game' },
  // Sicilian
  { moves: 'e2e4 c7c5', name: 'Sicilian Defense' },
  { moves: 'e2e4 c7c5 g1f3', name: 'Sicilian Defense, Open' },
  { moves: 'e2e4 c7c5 g1f3 d7d6', name: 'Sicilian, Najdorf' },
  { moves: 'e2e4 c7c5 g1f3 b8c6', name: 'Sicilian, Classical' },
  { moves: 'e2e4 c7c5 g1f3 e7e6', name: 'Sicilian, Scheveningen' },
  { moves: 'e2e4 c7c5 c2c3', name: 'Sicilian, Alapin' },
  { moves: 'e2e4 c7c5 b1c3', name: 'Sicilian, Closed' },
  // French
  { moves: 'e2e4 e7e6', name: 'French Defense' },
  { moves: 'e2e4 e7e6 d2d4', name: 'French Defense, Main Line' },
  { moves: 'e2e4 e7e6 d2d4 d7d5', name: 'French Defense' },
  { moves: 'e2e4 e7e6 d2d4 d7d5 b1c3', name: 'French, Winawer / Classical' },
  { moves: 'e2e4 e7e6 d2d4 d7d5 e4e5', name: 'French, Advance Variation' },
  // Caro-Kann
  { moves: 'e2e4 c7c6', name: 'Caro-Kann Defense' },
  { moves: 'e2e4 c7c6 d2d4 d7d5', name: 'Caro-Kann, Main Line' },
  { moves: 'e2e4 c7c6 d2d4 d7d5 b1c3', name: 'Caro-Kann, Classical' },
  { moves: 'e2e4 c7c6 d2d4 d7d5 e4e5', name: 'Caro-Kann, Advance' },
  // Pirc / Modern
  { moves: 'e2e4 d7d6', name: 'Pirc Defense' },
  { moves: 'e2e4 g7g6', name: 'Modern Defense' },
  { moves: 'e2e4 d7d5', name: "Scandinavian Defense" },
  { moves: 'e2e4 d7d5 e4d5', name: 'Scandinavian, Main Line' },
  // Closed games (1.d4)
  { moves: 'd2d4', name: "Queen's Pawn Opening" },
  { moves: 'd2d4 d7d5', name: "Queen's Pawn Game" },
  { moves: 'd2d4 d7d5 c2c4', name: "Queen's Gambit" },
  { moves: 'd2d4 d7d5 c2c4 d5c4', name: "Queen's Gambit Accepted" },
  { moves: 'd2d4 d7d5 c2c4 e7e6', name: "Queen's Gambit Declined" },
  { moves: 'd2d4 d7d5 c2c4 c7c6', name: 'Slav Defense' },
  { moves: 'd2d4 g8f6', name: 'Indian Defense' },
  { moves: 'd2d4 g8f6 c2c4 g7g6', name: "King's Indian Defense" },
  { moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7', name: "King's Indian, Classical" },
  { moves: 'd2d4 g8f6 c2c4 e7e6', name: "Nimzo / Queen's Indian" },
  { moves: 'd2d4 g8f6 c2c4 e7e6 b1c3 f8b4', name: 'Nimzo-Indian Defense' },
  { moves: 'd2d4 g8f6 c2c4 e7e6 g1f3 b7b6', name: "Queen's Indian Defense" },
  { moves: 'd2d4 g8f6 c2c4 c7c5', name: 'Benoni Defense' },
  { moves: 'd2d4 g8f6 c2c4 c7c5 d4d5', name: 'Modern Benoni' },
  { moves: 'd2d4 g8f6 g1f3 g7g6', name: 'King\'s Indian Attack' },
  { moves: 'd2d4 f7f5', name: 'Dutch Defense' },
  // Flank openings
  { moves: 'c2c4', name: 'English Opening' },
  { moves: 'c2c4 e7e5', name: 'English, Reversed Sicilian' },
  { moves: 'c2c4 c7c5', name: 'Symmetrical English' },
  { moves: 'g1f3', name: "Réti Opening" },
  { moves: 'g1f3 d7d5 c2c4', name: 'Réti Opening, Main Line' },
  { moves: 'g2g3', name: 'King\'s Fianchetto Opening' },
  { moves: 'b2b4', name: 'Sokolsky Opening (Polish)' },
  { moves: 'b1c3', name: 'Van Kruijs / Dunst Opening' },
  { moves: 'f2f4', name: "Bird's Opening" },
]

// Convert move history [{from:[r,c], to:[r,c]}] to algebraic string sequence
function moveToAlg(move) {
  const files = 'abcdefgh'
  const fromFile = files[move.from[1]]
  const fromRank = 8 - move.from[0]
  const toFile = files[move.to[1]]
  const toRank = 8 - move.to[0]
  return `${fromFile}${fromRank}${toFile}${toRank}`
}

export function detectOpening(moveHistory) {
  if (!moveHistory.length) return null
  const sequence = moveHistory.map(moveToAlg).join(' ')
  let best = null
  for (const opening of OPENINGS) {
    if (sequence.startsWith(opening.moves) || opening.moves === sequence) {
      if (!best || opening.moves.length > best.moves.length) {
        best = opening
      }
    }
  }
  return best ? best.name : null
}
