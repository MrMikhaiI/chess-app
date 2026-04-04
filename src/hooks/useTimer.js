import { useEffect, useRef, useCallback } from 'react'

// increment in seconds added after each move
export function useTimer({ times, setTimes, currentPlayer, gameStatus, increment }) {
  const intervalRef = useRef(null)
  const activeRef = useRef(currentPlayer)

  useEffect(() => { activeRef.current = currentPlayer }, [currentPlayer])

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const start = useCallback(() => {
    stop()
    intervalRef.current = setInterval(() => {
      setTimes(prev => {
        const player = activeRef.current
        const next = prev[player] - 100
        return { ...prev, [player]: next }
      })
    }, 100)
  }, [stop, setTimes])

  // start/stop based on game status
  useEffect(() => {
    if (gameStatus === 'playing' && times !== null) {
      start()
    } else {
      stop()
    }
    return stop
  }, [gameStatus, times !== null, start, stop])

  // when currentPlayer changes: add increment to the player who just moved
  const prevPlayerRef = useRef(null)
  useEffect(() => {
    if (prevPlayerRef.current && prevPlayerRef.current !== currentPlayer && increment > 0) {
      setTimes(prev => ({
        ...prev,
        [prevPlayerRef.current]: prev[prevPlayerRef.current] + increment * 1000
      }))
    }
    prevPlayerRef.current = currentPlayer
  }, [currentPlayer, increment, setTimes])

  return { stop }
}
