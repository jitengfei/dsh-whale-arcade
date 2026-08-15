/* eslint-disable @stylistic/max-len, @stylistic/semi */
import { useEffect, useRef, useState } from 'react'
import type { GameViewProps } from '../../runtime/game-contract.ts'
import { OceanIcon } from '../../shared/OceanIcon.tsx'
import { Splash, type SplashState } from '../../shared/Splash.tsx'
import { useGameLoop } from '../../shared/use-game-loop.ts'
import { WhaleMark } from '../../shared/WhaleMark.tsx'
import css from '../../WhaleArcade.module.css'
import { catchSpawnDelay, createCatchDesign, scheduleCatchSpawn, type CatchDesign } from './design.ts'
import { catchHitOutcome } from './physics.ts'

type CatchItem = CatchDesign & { id: number; y: number; arrivalAt: number }

export function CatchGame({ phase, runId, updateHud, finish }: GameViewProps) {
  const board = useRef<HTMLDivElement>(null); const keys = useRef(new Set<string>()); const touchDirection = useRef(0); const scoreRef = useRef(0); const whaleRef = useRef(50); const ended = useRef(false)
  const itemsRef = useRef<CatchItem[]>([]); const pending = useRef<CatchDesign | null>(null); const nextSpawnAt = useRef(.55); const elapsed = useRef(0); const itemId = useRef(0)
  const [whaleX, setWhaleX] = useState(50); const [items, setItems] = useState<CatchItem[]>([]); const [splash, setSplash] = useState<SplashState | null>(null)
  useEffect(() => { if (phase === 'running') board.current?.focus(); else { keys.current.clear(); touchDirection.current = 0 } }, [phase])
  useEffect(() => {
    const release = (event: KeyboardEvent) =>{  keys.current.delete(event.code); }
    const clear = () => { keys.current.clear(); touchDirection.current = 0 }
    window.addEventListener('keyup', release); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keyup', release); window.removeEventListener('blur', clear) }
  }, [])
  useEffect(() => { ended.current = false; scoreRef.current = 0; whaleRef.current = 50; itemsRef.current = []; pending.current = null; nextSpawnAt.current = .55; elapsed.current = 0; itemId.current = 0; setWhaleX(50); setItems([]); setSplash(null); updateHud({ primary: { id: 'score', value: 0 } }) }, [runId, updateHud])
  const end = (x: number) => {
    if (ended.current || !finish({ outcome: 'failed', metrics: { score: scoreRef.current } })) return
    ended.current = true
    setSplash({ id: performance.now(), x, y: 82 })
  }
  useGameLoop(phase === 'running', (dt) => {
    const keyboardDirection = Number(keys.current.has('ArrowRight') || keys.current.has('KeyD')) - Number(keys.current.has('ArrowLeft') || keys.current.has('KeyA'))
    const direction = Math.sign(keyboardDirection + touchDirection.current)
    if (direction) { whaleRef.current = Math.min(91, Math.max(9, whaleRef.current + direction * 62 * dt)); setWhaleX(whaleRef.current) }
    elapsed.current += dt
    let nextItems = itemsRef.current
    if (elapsed.current >= nextSpawnAt.current) {
      const design = pending.current ?? createCatchDesign(elapsed.current); const scheduled = scheduleCatchSpawn(nextItems.filter(item => item.y < 76), design, elapsed.current)
      if (scheduled.spawnAt <= elapsed.current + .001) {
        itemId.current += 1; nextItems = [...nextItems, { ...design, id: itemId.current, y: -8, arrivalAt: scheduled.arrivalAt }]
        pending.current = null; nextSpawnAt.current = elapsed.current + catchSpawnDelay(elapsed.current)
      } else { pending.current = design; nextSpawnAt.current = scheduled.spawnAt }
    }
    const width = board.current?.clientWidth ?? 0; const height = board.current?.clientHeight ?? 0
    const movedItems = nextItems.map(item => ({ ...item, y: item.y + item.speed * dt })); const outcome = catchHitOutcome(width, height, whaleRef.current, movedItems); const caughtIds = new Set(outcome.caughtIds)
    const remaining = movedItems.filter(item => !caughtIds.has(item.id) && item.y <= 105)
    itemsRef.current = remaining; setItems(remaining)
    if (outcome.splashX !== null) setSplash({ id: performance.now(), x: outcome.splashX, y: 82 })
    if (outcome.gained) { scoreRef.current += outcome.gained; updateHud({ primary: { id: 'score', value: scoreRef.current } }) }
    if (outcome.hazardX !== null) end(outcome.hazardX)
  })
  const move = (amount: number) => { if (phase === 'running') { whaleRef.current = Math.min(91, Math.max(9, whaleRef.current + amount)); setWhaleX(whaleRef.current) } }
  const releaseTouch = () =>{  touchDirection.current = 0; }
  return <div ref={board} className={css.oceanBoard} tabIndex={0} data-whale-game onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) { keys.current.add(event.code); event.preventDefault() } }}>
    <div className={css.lightRays}/><div className={css.skyBubbles}><i/><i/><i/></div>{items.map(item => <span key={item.id} className={css.falling} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size }}><OceanIcon kind={item.kind}/><b className={css.itemValue}>{item.hazard ? '!' : `+${item.value}`}</b></span>)}
    <span className={css.catcher} style={{ left: `${whaleX}%` }}><WhaleMark/></span><div className={css.oceanWaves}><i/><i/></div><Splash splash={splash}/><div className={css.touchControls}><button type="button" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); touchDirection.current = -1; move(-2) }} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch}>←</button><button type="button" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); touchDirection.current = 1; move(2) }} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch}>→</button></div>
  </div>
}
