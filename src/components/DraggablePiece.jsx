import React, { useRef, useCallback } from 'react'

export default function DraggablePiece({ type, color, row, col, pieceUrl, onDragStart, onDragEnd, boardRef, flipped }) {
  const dragRef = useRef(null)
  const ghostRef = useRef(null)
  const dragging = useRef(false)

  const getSquareFromPoint = useCallback((x, y) => {
    if (!boardRef.current) return null
    const rect = boardRef.current.getBoundingClientRect()
    const relX = x - rect.left
    const relY = y - rect.top
    const size = rect.width / 8
    let c = Math.floor(relX / size)
    let r = Math.floor(relY / size)
    if (flipped) { r = 7 - r; c = 7 - c }
    if (r < 0 || r > 7 || c < 0 || c > 7) return null
    return [r, c]
  }, [boardRef, flipped])

  const createGhost = useCallback((x, y, size) => {
    const ghost = document.createElement('img')
    ghost.src = pieceUrl
    ghost.style.cssText = [
      'position:fixed', `width:${size}px`, `height:${size}px`,
      'pointer-events:none', 'z-index:9999',
      `left:${x - size/2}px`, `top:${y - size/2}px`,
      'filter:drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
      'user-select:none', 'opacity:0.92', 'transition:none',
    ].join(';')
    document.body.appendChild(ghost)
    ghostRef.current = ghost
  }, [pieceUrl])

  const moveGhost = useCallback((x, y) => {
    if (!ghostRef.current) return
    const size = parseInt(ghostRef.current.style.width)
    ghostRef.current.style.left = `${x - size/2}px`
    ghostRef.current.style.top  = `${y - size/2}px`
  }, [])

  const removeGhost = useCallback(() => {
    if (ghostRef.current) { document.body.removeChild(ghostRef.current); ghostRef.current = null }
  }, [])

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
      onDragEnd(target ? target[0] : null, target ? target[1] : null)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [row, col, onDragStart, onDragEnd, createGhost, moveGhost, removeGhost, getSquareFromPoint])

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    dragging.current = true
    const size = dragRef.current?.closest('[data-square]')?.getBoundingClientRect().width || 60
    createGhost(touch.clientX, touch.clientY, size)
    onDragStart(row, col)
    const onTouchMove = (e) => { e.preventDefault(); const t = e.touches[0]; moveGhost(t.clientX, t.clientY) }
    const onTouchEnd = (e) => {
      if (!dragging.current) return
      dragging.current = false
      removeGhost()
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      const t = e.changedTouches[0]
      const target = getSquareFromPoint(t.clientX, t.clientY)
      onDragEnd(target ? target[0] : null, target ? target[1] : null)
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
  }, [row, col, onDragStart, onDragEnd, createGhost, moveGhost, removeGhost, getSquareFromPoint])

  return (
    <img
      ref={dragRef}
      src={pieceUrl}
      alt={`${color} ${type}`}
      width="80" height="80"
      draggable={false}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        width:'88%', height:'88%', objectFit:'contain', display:'block',
        cursor:'grab', filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
        userSelect:'none', touchAction:'none',
      }}
    />
  )
}
