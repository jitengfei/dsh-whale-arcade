/** A monotonic timer that only advances while a round is actively playing. */
export interface ActiveTimer {
  start: (now?: number) => void
  resume: (now?: number) => void
  pause: (now?: number) => number
  read: (now?: number) => number
}

const currentTime = () => performance.now()

/** Keep pause, closed-overlay, and hidden-tab time out of leaderboard durations. */
export function createActiveTimer(): ActiveTimer {
  let accumulated = 0
  let activeSince: number | null = null

  const read = (now = currentTime()) => accumulated + (activeSince === null ? 0 : Math.max(0, now - activeSince))

  return {
    start(now = currentTime()) { accumulated = 0; activeSince = now },
    resume(now = currentTime()) { if (activeSince === null) activeSince = now },
    pause(now = currentTime()) { accumulated = read(now); activeSince = null; return accumulated },
    read,
  }
}
