# ♛ Chess App

A fully featured chess game built with **React** and **Vite**.

![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat&logo=vite)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

## ♟ Play Online

👉 **[mrmikhaii.github.io/chess-app](https://mrmikhaii.github.io/chess-app/)**

---

## Features

### ⚙️ Chess Rules
- Full legal move generation for all pieces
- Castling (king-side and queen-side)
- En passant
- Pawn promotion with piece selector
- Check, checkmate & stalemate detection

### ⏱ Timer & Time Controls
- Classic time controls: `1+0`, `3+0`, `3+2`, `5+0`, `5+3`, `10+0`, `10+5`, `∞`
- Individual countdown for each player
- Increment added after every move
- Low-time warning (< 10s) with pulsing red clock
- Loss on time with winner announcement

### 📋 Move Notation
- Full algebraic notation — `e4`, `Nf3`, `Nxe5`, `O-O`, `e8=Q`, `+`, `#`
- Disambiguation for ambiguous pieces (e.g. `Nbd2`)
- Clickable move list — jump to any position in the game

### 🎨 UI & UX
- Drag & drop piece movement
- Move highlighting (selected square + legal move dots)
- Last move highlight
- Captured pieces display
- Opening name detection (ECO)
- 7 piece sets (Cburnett, Merida, Alpha, …)
- Flip board button
- Resign button
- 🎊 Confetti on checkmate, resign or timeout
- Responsive design (desktop & mobile)

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 18 |
| **Build tool** | Vite 5 |
| **Styles** | CSS Modules |
| **Piece images** | Lichess CDN |
| **Confetti** | canvas-confetti |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── Board.jsx
│   ├── Square.jsx
│   ├── GameInfo.jsx        # Move list, captured pieces
│   ├── BoardControls.jsx   # Flip, piece set, resign
│   ├── TimeControl.jsx     # Clocks & time control selector
│   ├── OpeningBanner.jsx
│   └── PromotionModal.jsx
├── engine/
│   ├── board.js
│   ├── moves.js            # Legal move generation
│   ├── gameState.js        # Check / checkmate / stalemate
│   └── openings.js         # ECO opening detection
├── hooks/
│   ├── useSound.js
│   └── useTimer.js         # Per-player countdown + increment
├── utils/
│   └── notation.js         # Algebraic notation builder
└── App.jsx
```

---

## How to Play

1. **Select** a piece by clicking or dragging it — legal moves are highlighted
2. **Move** by clicking a highlighted square or dropping the piece
3. **Promotion** — choose a piece when a pawn reaches the last rank
4. **Timer** — pick a time control above the board; the clock starts on the first move
5. **Notation** — click any move in the list to review the position
6. **New Game** — resets the board and clocks

---

Made with ♟ by Mikhail
