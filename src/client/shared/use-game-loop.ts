import { useEffect, useRef } from 'react'

export function useGameLoop(active: boolean, tick: (dt: number) => void) {
  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    if (!active) return

    let frame = 0
    let stopped = false
    let previous = performance.now()
    const loop = (now: number) => {
      if (stopped) return
      const dt = Math.min(34, now - previous) / 1000
      previous = now
      frame = requestAnimationFrame(loop)
      tickRef.current(dt)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  }, [active])
}
