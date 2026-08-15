export type CatchKind = 'pearl' | 'star' | 'fish' | 'crab' | 'jelly' | 'urchin'

export interface CatchDesign {
  kind: CatchKind
  speed: number
  value: number
  size: number
  hazard: boolean
  x: number
}

export interface CatchArrival {
  arrivalAt: number
  hazard: boolean
  x: number
}

const REWARDS = [
  { kind: 'star', speed: 28, value: 10, size: 38, hazard: false, weight: .4 },
  { kind: 'fish', speed: 36, value: 15, size: 34, hazard: false, weight: .31 },
  { kind: 'crab', speed: 42, value: 20, size: 34, hazard: false, weight: .18 },
  { kind: 'pearl', speed: 48, value: 25, size: 30, hazard: false, weight: .11 },
] as const

export function catchSpawnDelay(elapsedSeconds: number, random: () => number = Math.random): number {
  // .64 is the late-game mean; jitter deliberately creates a .52-.76s rhythm.
  const base = Math.max(.64, .92 - Math.max(0, elapsedSeconds) * .0047)
  return base + (random() - .5) * .24
}

/** Delay, rather than reroll, a pending item until nearby lanes have a readable arrival window. */
export function scheduleCatchSpawn(
  active: readonly CatchArrival[],
  pending: CatchDesign,
  earliestSpawnAt: number,
): { spawnAt: number; arrivalAt: number } {
  const flightTime = 84 / pending.speed
  let spawnAt = earliestSpawnAt
  for (let attempt = 0; attempt <= active.length; attempt += 1) {
    const arrivalAt = spawnAt + flightTime
    const conflicts = active.filter((item) => {
      if (Math.abs(item.x - pending.x) > 14) return false
      const window = item.hazard || pending.hazard ? .55 : .38
      return Math.abs(item.arrivalAt - arrivalAt) < window
    })
    if (!conflicts.length) return { spawnAt, arrivalAt }
    const nextReadableTimes = conflicts.map(item => item.arrivalAt
      + (item.hazard || pending.hazard ? .55 : .38) - flightTime)
    spawnAt = Math.max(...nextReadableTimes, spawnAt + .01)
  }
  return { spawnAt, arrivalAt: spawnAt + flightTime }
}

export function createCatchDesign(elapsedSeconds: number, random: () => number = Math.random): CatchDesign {
  const elapsed = Math.max(0, elapsedSeconds)
  const hazardRate = .2 + Math.min(.08, elapsed / 750)
  const roll = random(); const detail = random(); const speedScale = 1 + Math.min(.28, elapsed / 240)
  let selected: Omit<CatchDesign, 'x'>
  if (roll < hazardRate) selected = detail < .62
    ? { kind: 'jelly', speed: 32 * speedScale, value: 0, size: 40, hazard: true }
    : { kind: 'urchin', speed: 47 * speedScale, value: 0, size: 30, hazard: true }
  else {
    let cursor = detail
    const reward = REWARDS.find((item) => { cursor -= item.weight; return cursor <= 0 }) ?? REWARDS[0]
    selected = { ...reward, speed: reward.speed * speedScale }
  }
  // Seven stable lanes keep sprites fully visible and make movement readable.
  const lane = Math.min(6, Math.floor(random() * 7))
  return { ...selected, x: 10 + lane * (80 / 6) }
}
