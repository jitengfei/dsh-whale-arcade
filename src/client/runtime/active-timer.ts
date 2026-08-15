export type Now = () => number

export interface ActiveTimer {
  start: () => void
  resume: () => void
  pause: () => number
  reset: () => void
  read: () => number
}

const defaultNow: Now = () => performance.now()

/** A monotonic timer that excludes every paused interval. */
export function createActiveTimer(now: Now = defaultNow): ActiveTimer {
  let accumulated = 0
  let activeSince: number | null = null

  const read = () => accumulated + (activeSince === null ? 0 : Math.max(0, now() - activeSince))

  return {
    start() {
      accumulated = 0
      activeSince = now()
    },
    resume() {
      if (activeSince === null) activeSince = now()
    },
    pause() {
      accumulated = read()
      activeSince = null
      return accumulated
    },
    reset() {
      accumulated = 0
      activeSince = null
    },
    read,
  }
}
