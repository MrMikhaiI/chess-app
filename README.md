# ♛ Chess App

A fully featured chess game built with **React** and **Vite**.

## Features

- ✅ Full chess rules (all pieces, special moves)
- ✅ Castling (king-side and queen-side)
- ✅ En passant
- ✅ Pawn promotion
- ✅ Check & checkmate detection
- ✅ Stalemate detection
- ✅ Move highlighting
- ✅ Captured pieces display
- ✅ Move history
- ✅ Two players on one device
- ✅ Responsive design (mobile-friendly)

## Tech Stack

- React 18
- Vite
- CSS Modules

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Play Online

👉 [Play on GitHub Pages](https://mrmikhaii.github.io/chess-app/)

## Project Structure

```
src/
├── components/
│   ├── Board.jsx
│   ├── Square.jsx
│   ├── GameInfo.jsx
│   └── PromotionModal.jsx
├── engine/
│   ├── board.js
│   ├── moves.js
│   ├── gameState.js
│   └── pieces.js
└── App.jsx
```

## How to Play

1. Click a piece to select it (legal moves highlighted)
2. Click a highlighted square to move
3. When a pawn reaches the last rank, choose a promotion piece
4. "New Game" button resets the board

---

Made with ♟ by Mikhail
