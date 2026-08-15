import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameViewProps } from '../../runtime/game-contract.ts'
import type { SplashState } from '../../shared/Splash.tsx'
import { useGameLoop } from '../../shared/use-game-loop.ts'
import css from '../../WhaleArcade.module.css'
import { createRunnerWave, runnerSpeed, type RunnerGapBand } from './design.ts'
import { runnerCollides, type RunnerObstacleKind } from './physics.ts'
import { RunnerScene, type RunnerObstacle } from './RunnerScene.tsx'

export function RunnerGame({ phase, runId, updateHud, finish }: GameViewProps) {
  const board = useRef<HTMLButtonElement>(null)
  const scoreRef = useRef(0)
  const whaleRef = useRef({ y: 0, velocity: 0 })
  const obstaclesRef = useRef<RunnerObstacle[]>([])
  const ended = useRef(false)
  const elapsedRef = useRef(0)
  const travelRef = useRef(0)
  const obstacleId = useRef(0)
  const kindHistory = useRef<RunnerObstacleKind[]>([])
  const gapHistory = useRef<RunnerGapBand[]>([])
  const [whale, setWhale] = useState(whaleRef.current)
  const [obstacles, setObstacles] = useState<RunnerObstacle[]>([])
  const [splash, setSplash] = useState<SplashState | null>(null)

  const jump = useCallback(() => {
    if (phase === 'running' && whaleRef.current.y === 0) {
      whaleRef.current = { y: 0, velocity: 72 }
      setWhale(whaleRef.current)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'running') board.current?.focus()
  }, [phase])

  useEffect(() => {
    ended.current = false
    scoreRef.current = 0
    whaleRef.current = { y: 0, velocity: 0 }
    obstaclesRef.current = []
    elapsedRef.current = 0
    travelRef.current = 0
    obstacleId.current = 0
    kindHistory.current = []
    gapHistory.current = []
    setWhale(whaleRef.current)
    setObstacles([])
    setSplash(null)
    updateHud({ primary: { id: 'score', value: 0 } })
  }, [runId, updateHud])

  const end = () => {
    if (ended.current || !finish({ outcome: 'failed', metrics: { score: scoreRef.current } })) return
    ended.current = true
    setSplash({ id: performance.now(), x: 24, y: 76 - whaleRef.current.y })
  }

  useGameLoop(phase === 'running', (dt) => {
    elapsedRef.current += dt
    const speed = runnerSpeed(elapsedRef.current)
    travelRef.current += speed * dt * .3
    const nextScore = Math.floor(travelRef.current)
    if (nextScore !== scoreRef.current) {
      scoreRef.current = nextScore
      updateHud({ primary: { id: 'score', value: nextScore } })
    }
    const current = whaleRef.current
    const velocity = current.velocity - 145 * dt
    const y = Math.max(0, current.y + velocity * dt)
    whaleRef.current = { y, velocity: y === 0 ? 0 : velocity }
    setWhale(whaleRef.current)
    if (current.y > 1 && y === 0) setSplash({ id: performance.now(), x: 19, y: 80 })
    const moved = obstaclesRef.current.map(item => ({ ...item, x: item.x - speed * dt })).filter(item => item.x > -15)
    const last = moved.at(-1)
    if (!last || last.x < 112 - last.gapAfter) {
      const wave = createRunnerWave(elapsedRef.current, speed, {
        recentKinds: kindHistory.current,
        recentGapBands: gapHistory.current,
      })
      moved.push(...wave.obstacles.map((item) => {
        obstacleId.current += 1
        return { ...item, id: obstacleId.current }
      }))
      kindHistory.current = [...kindHistory.current.slice(-1), wave.primaryKind]
      gapHistory.current = [...gapHistory.current.slice(-1), wave.gapBand]
    }
    obstaclesRef.current = moved
    setObstacles(moved)
    const width = board.current?.clientWidth ?? 0
    const height = board.current?.clientHeight ?? 0
    if (moved.some(item => runnerCollides(width, height, whaleRef.current.y, item))) end()
  })

  return <button ref={board} type="button" className={`${css.oceanBoard} ${css.runnerBoard}`} onClick={jump} onKeyDown={(event) => {
    if (!event.repeat && ['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
      event.preventDefault()
      jump()
    }
  }} data-whale-game aria-label="Whale ocean runner">
    <RunnerScene whaleY={whale.y} obstacles={obstacles} splash={splash}/>
  </button>
}
