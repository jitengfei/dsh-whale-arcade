/* eslint-disable @stylistic/max-len */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameViewProps } from '../../runtime/game-contract.ts'
import { Splash, type SplashState } from '../../shared/Splash.tsx'
import { useGameLoop } from '../../shared/use-game-loop.ts'
import { WhaleMark } from '../../shared/WhaleMark.tsx'
import css from '../../WhaleArcade.module.css'
import { createCave, jumpSpeed, positionNextCave } from './design.ts'
import { cavePassedWhale, jumpCollides } from './physics.ts'

export function JumpGame({ phase, runId, updateHud, finish }: GameViewProps) {
  const board = useRef<HTMLButtonElement>(null); const scoreRef = useRef(0)
  const whaleRef = useRef({ y: 45, velocity: 0 }); const rocksRef = useRef([{ id: 0, x: 112, gap: 46, opening: 34, gapBefore: 0, scored: false }]); const ended = useRef(false)
  const [whale, setWhale] = useState(whaleRef.current); const [rocks, setRocks] = useState(rocksRef.current); const [splash, setSplash] = useState<SplashState | null>(null)
  const flap = useCallback(() => { if (phase === 'running') { whaleRef.current = { ...whaleRef.current, velocity: -49 }; setWhale(whaleRef.current) } }, [phase])
  useEffect(() => { if (phase === 'running') board.current?.focus() }, [phase])
  useEffect(() => { ended.current = false; scoreRef.current = 0; whaleRef.current = { y: 45, velocity: 0 }; rocksRef.current = [{ id: runId, x: 112, gap: 46, opening: 34, gapBefore: 0, scored: false }]; setWhale(whaleRef.current); setRocks(rocksRef.current); setSplash(null); updateHud({ primary: { id: 'score', value: 0 } }) }, [runId, updateHud])
  const end = (x: number, y: number) => {
    if (ended.current || !finish({ outcome: 'failed', metrics: { score: scoreRef.current } })) return
    ended.current = true
    setSplash({ id: performance.now(), x, y })
  }
  useGameLoop(phase === 'running', (dt) => {
    const current = whaleRef.current; const velocity = current.velocity + 92 * dt; const rawY = current.y + velocity * dt; const y = Math.min(84, Math.max(6, rawY))
    whaleRef.current = { y, velocity }; setWhale(whaleRef.current)
    let impact: { x: number; y: number } | null = rawY < 6 || rawY > 84 ? { x: 18, y: Math.min(88, Math.max(5, rawY)) } : null
    const speed = jumpSpeed(scoreRef.current); const width = board.current?.clientWidth ?? 0; const height = board.current?.clientHeight ?? 0; let gained = 0
    const moved = rocksRef.current.map((rock) => {
      const next = { ...rock, x: rock.x - speed * dt }
      if (!impact && jumpCollides(width, height, y, next)) impact = { x: 20, y }
      if (!next.scored && cavePassedWhale(width, next)) { gained += 1; return { ...next, scored: true } }
      return next
    }).filter(rock => rock.x > -14)
    const last = moved.at(-1)
    if (!last || last.x < 112) { const cave = createCave(last?.gap ?? 46, scoreRef.current, speed); moved.push({ id: performance.now(), x: last ? positionNextCave(last.x, cave) : 112, ...cave, scored: false }) }
    rocksRef.current = moved; setRocks(moved)
    if (gained) { scoreRef.current += gained; updateHud({ primary: { id: 'score', value: scoreRef.current } }) }
    if (impact) end(impact.x, impact.y)
  })
  return <button ref={board} type="button" className={css.oceanBoard} onClick={flap} onKeyDown={(event) => { if (!event.repeat && ['Space', 'ArrowUp', 'KeyW'].includes(event.code)) { event.preventDefault(); flap() } }} aria-label="Whale wave game" data-whale-game>
    <div className={css.skyBubbles}><i/><i/><i/></div><span className={css.gameWhale} style={{ top: `${whale.y}%` }}><WhaleMark jumping={whale.velocity < 0}/></span>
    {rocks.map(rock => <span key={rock.id} className={css.rockGate} style={{ left: `${rock.x}%` }}><i style={{ height: `${rock.gap - rock.opening / 2}%` }}/><i style={{ top: `${rock.gap + rock.opening / 2}%` }}/></span>)}<div className={css.oceanWaves}><i/><i/></div><Splash splash={splash}/>
  </button>
}
