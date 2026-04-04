import React, { useRef, useCallback } from 'react'

const BASE = 'https://lichess1.org/assets/piece/cburnett'
const PIECE_NAMES = {
  white: { king:'wK', queen:'wQ', rook:'wR', bishop:'wB', knight:'wN', pawn:'wP' },
  black: { king:'bK', queen:'bQ', rook:'bR', bishop:'bB', knight:'bN', pawn:'bP' },
}

export default function DraggablePiece({ type, color, row, col, onDragStart, onDragEnd, boardRef }) {
  const dragRef = useRef(null)
  const ghostRef = useRef(null)
  const dragging = useRef(false)

  const getSquareFromPoint = useCallback((x, y) => {
    if (!boardRef.current) return null
    const rect = boardRef.current.getBoundingClientRect()
    const relX = x - rect.left
    const relY = y - rect.top
    const size = rect.width / 8
    const c = Math.floor(relX / size)
    const r = Math.floor(relY / size)
    if (r < 0 || r > 7 || c < 0 || c > 7) return null
    return [r, c]
  }, [boardRef])

  const createGhost = useCallback((x, y, size) => {
    const ghost = document.createElement('img')
    ghost.src = `${BASE}/${PIECE_NAMES[color][type]}.svg`
    ghost.style.cssText = [
      'position:fixed',
      `width:${size}px`,
      `height:${size}px`,
      'pointer-events:none',
      'z-index:9999',
      `left:${x - size/2}px`,
      `top:${y - size/2}px`,
      'filter:drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
      'transition:none',
      'user-select:none',
      'opacity:0.92',
    ].join(';')
    document.body.appendChild(ghost)
    ghostRef.current = ghost
  }, [color, type])

  const moveGhost = useCallback((x, y) => {
    if (!ghostRef.current) return
    const size = parseInt(ghostRef.current.style.width)
    ghostRef.current.style.left = `${x - size/2}px`
    ghostRef.current.style.top  = `${y - size/2}px`
  }, [])

  const removeGhost = useCallback(() => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current)
      ghostRef.current = null
    }
  }, [])

  // ---- Mouse ----
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragging.current = true
    const size = dragRef.current?.closest('[data-square]')?.getBoundingClientRect().width || 80
    createGhost(e.clientX, e.clientY, size)
    onDragStart(row, col)

    const onMouseMove = (e) => moveGhost(e.clientX, e.clientY)
    const onMouseUp = (e) => {
      if (!dragging.current) return
      dragging.current = false
      removeGhost()
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      const target = getSquareFromPoint(e.clientX, e.clientY)
      if (target) onDragEnd(target[0], target[1])
      else onDragEnd(null, null)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [row, col, onDragStart, onDragEnd, createGhost, moveGhost, removeGhost, getSquareFromPoint])

  // ---- Touch ----
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    dragging.current = true
    const size = dragRef.current?.closest('[data-square]')?.getBoundingClientRect().width || 60
    createGhost(touch.clientX, touch.clientY, size)
    onDragStart(row, col)

    const onTouchMove = (e) => {
      e.preventDefault()
      const t = e.touches[0]
      moveGhost(t.clientX, t.clientY)
    }
    const onTouchEnd = (e) => {
      if (!dragging.current) return
      dragging.current = false
      removeGhost()
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      const t = e.changedTouches[0]
      const target = getSquareFromPoint(t.clientX, t.clientY)
      if (target) onDragEnd(target[0], target[1])
      else onDragEnd(null, null)
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
  }, [row, col, onDragStart, onDragEnd, createGhost, moveGhost, removeGhost, getSquareFromPoint])

  const name = PIECE_NAMES[color][type]
  return (
    <img
      ref={dragRef}
      src={`${BASE}/${name}.svg`}
      alt={`${color} ${type}`}
      width="80"
      height="80"
      draggable={false}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        width: '88%', height: '88%', objectFit: 'contain',
        display: 'block', cursor: 'grab',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
        userSelect: 'none', touchAction: 'none',
      }}
    />
  )
}
