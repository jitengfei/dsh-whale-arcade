/* eslint-disable @stylistic/max-len, @stylistic/member-delimiter-style, @stylistic/semi */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { catchSpawnDelay, createCatchDesign, scheduleCatchSpawn, type CatchDesign } from './catch-design.ts'
import { catchHitOutcome } from './catch-physics.ts'
import { createCave, jumpSpeed, positionNextCave } from './jump-design.ts'
import { cavePassedWhale, jumpCollides } from './jump-physics.ts'
import { NS } from './locales.ts'
import { readScores, recordScore, type GameId } from './leaderboard.ts'
import { createRunnerWave, runnerSpeed, type RunnerGapBand } from './runner-design.ts'
import { RUNNER_OBSTACLES, runnerCollides, type RunnerObstacleKind, type RunnerObstacleModel } from './runner-physics.ts'
import css from './WhaleArcade.module.css'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<typeof NS>
type Phase = 'ready' | 'playing' | 'paused' | 'over'
type SplashState = { id: number; x: number; y: number }

function WhaleMark({ jumping = false }: { jumping?: boolean }) {
  return <svg viewBox="0 0 96 64" aria-hidden="true" className={jumping ? css.jumpingWhale : undefined}>
    <path className={css.whaleTail} d="M29 27C20 25 14 18 15 9l8 6 7-5c3 7 3 12-1 17Z"/>
    <path className={css.whaleBody} d="M28 23c9-10 28-12 43-5 13 6 17 20 8 30-10 11-36 11-49 0-8-7-9-18-2-25Z"/>
    <path className={css.whaleBelly} d="M29 41c14 8 35 9 51 0-4 10-16 15-30 14-10 0-18-5-21-14Z"/>
    <circle className={css.whaleEye} cx="70" cy="28" r="2.4"/><path className={css.whaleSmile} d="M71 40c3 1 6 1 8-1"/><path className={css.whaleSpout} d="M56 14c-2-5 0-9 3-11m-1 11c3-4 6-5 9-4"/>
  </svg>
}

type OceanKind = 'pearl' | 'star' | 'fish' | 'crab' | 'jelly' | 'urchin' | 'coral' | 'shell'
function OceanIcon({ kind }: { kind: OceanKind }) {
  if (kind === 'jelly') return <svg viewBox="0 0 48 56" aria-hidden="true"><path className={css.jellyCap} d="M6 25C6 10 14 3 24 3s18 7 18 22Z"/><path className={css.objectLine} d="M10 25c0 7 6 7 6 14s-5 8-5 13m13-27c0 8 5 8 5 15s-4 8-4 12m13-27c0 7-5 8-5 14s5 7 5 13"/></svg>
  if (kind === 'coral') return <svg viewBox="0 0 48 60" aria-hidden="true"><path className={css.coral} d="M22 57V26c0-8-7-8-7-15M22 35c8 0 13-6 13-15m-13 28c-9 0-15-5-15-13m28-15V9m-20 2V4M7 35v-8"/></svg>
  if (kind === 'shell') return <svg viewBox="0 0 52 45" aria-hidden="true"><path className={css.shell} d="M4 38C5 17 13 5 26 5s21 12 22 33Z"/><path className={css.objectLine} d="M26 7v29M15 10l7 27M37 10l-7 27M7 25l15 12m23-12L30 37"/></svg>
  if (kind === 'fish') return <svg viewBox="0 0 56 38" aria-hidden="true"><path className={css.fishBody} d="M12 19C20 5 39 6 47 19c-8 13-27 14-35 0Z"/><path className={css.fishTail} d="M13 19 3 8v22Z"/><circle className={css.objectDot} cx="39" cy="15" r="2"/><path className={css.objectLine} d="M28 9c-2 5-2 14 0 20"/></svg>
  if (kind === 'crab') return <svg viewBox="0 0 56 44" aria-hidden="true"><path className={css.crabBody} d="M14 24c2-11 26-11 28 0 1 9-6 15-14 15s-15-6-14-15Z"/><path className={css.crabLine} d="M15 24 7 18 3 11m38 13 8-6 4-7M15 29 6 34m35-5 9 5M20 16l-2-8m18 8 2-8"/><circle className={css.objectDot} cx="21" cy="22" r="1.5"/><circle className={css.objectDot} cx="35" cy="22" r="1.5"/></svg>
  if (kind === 'urchin') return <svg viewBox="0 0 48 48" aria-hidden="true"><path className={css.urchinSpines} d="m24 2 3 13 8-11-3 14L45 9 35 21l15-3-14 8 14 5-15-1 10 11-13-8 3 14-8-12-3 13-3-13-8 11 3-14-13 8 10-11-15 2 14-6L0 18l15 3L4 9l13 9-4-14 8 11Z"/><circle className={css.urchinBody} cx="24" cy="25" r="11"/></svg>
  if (kind === 'star') return <svg viewBox="0 0 50 50" aria-hidden="true"><path className={css.star} d="m25 3 6 14 15 1-12 10 4 16-13-8-13 8 4-16L4 18l15-1Z"/><circle className={css.objectDot} cx="20" cy="24" r="1.5"/><circle className={css.objectDot} cx="30" cy="24" r="1.5"/></svg>
  return <svg viewBox="0 0 52 48" aria-hidden="true"><path className={css.pearlShellBack} d="M6 28C8 12 16 5 26 5s18 7 20 23Z"/><path className={css.objectLine} d="M26 7v20M15 10l8 18m14-18-8 18"/><path className={css.pearlShellFront} d="M5 29c7-5 35-5 42 0-3 11-11 15-21 15S8 40 5 29Z"/><circle className={css.pearl} cx="26" cy="27" r="8"/></svg>
}

function Splash({ splash }: { splash: SplashState | null }) {
  return splash && <span key={splash.id} className={css.splash} style={{ left: `${splash.x}%`, top: `${splash.y}%` }}><i/><i/><i/><i/></span>
}

function useFrame(active: boolean, tick: (dt: number) => void) {
  const tickRef = useRef(tick); tickRef.current = tick
  useEffect(() => {
    if (!active) return
    let frame = 0; let previous = performance.now()
    const loop = (now: number) => { const dt = Math.min(34, now - previous) / 1000; previous = now; tickRef.current(dt); frame = requestAnimationFrame(loop) }
    frame = requestAnimationFrame(loop)
    return () =>{  cancelAnimationFrame(frame); }
  }, [active])
}

const GAME_COPY = {
  jump: { icon: 'wave', name: 'jump.name', desc: 'jump.desc' },
  catch: { icon: 'star', name: 'catch.name', desc: 'catch.desc' },
  runner: { icon: 'coral', name: 'runner.name', desc: 'runner.desc' },
} as const

function CatalogIcon({ kind }: { kind: 'wave' | 'star' | 'coral' }) {
  return <span className={css.catalogIcon}>{kind === 'wave' ? <><WhaleMark/><i className={css.miniWave}/></> : <OceanIcon kind={kind}/>}</span>
}

function GameChrome({ game, phase, score, startedAt, onPhase, onScore, onBack, onClose, renderGame, t }: {
  game: GameId, phase: Phase, score: number, startedAt: number, onPhase: (phase: Phase) => void, onScore: (score: number) => void
  onBack: () => void, onClose: () => void
  renderGame: (finish: (score: number) => void) => React.ReactNode, t: Props['t']
}) {
  const finish = useCallback((finalScore: number) => {
    recordScore(game, { score: finalScore, durationMs: Date.now() - startedAt, achievedAt: Date.now() }); onScore(finalScore); onPhase('over')
  }, [game, onPhase, onScore, startedAt])
  return <div className={css.game} data-phase={phase} data-game={game}>
    <div className={css.gameBar}><button type="button" className={css.backButton} onClick={onBack} aria-label={t('back')}>←</button><span className={css.hint}>{t(GAME_COPY[game].desc)}</span><span>{t('score')} <strong>{String(score).padStart(5, '0')}</strong></span><span>{t('best')} <strong>{String(readScores(game)[0]?.score ?? 0).padStart(5, '0')}</strong></span><button type="button" onClick={() =>{  onPhase(phase === 'paused' ? 'playing' : 'paused'); }} disabled={phase === 'ready' || phase === 'over'}>{phase === 'paused' ? t('resume') : t('pause')}</button><button type="button" className={css.closeButton} onClick={onClose} aria-label={t('close')}>×</button></div>
    {renderGame(finish)}
    {(phase === 'ready' || phase === 'over') && <div className={css.gameOverlay}><span>{phase === 'over' ? t('over') : t(GAME_COPY[game].desc)}</span><button type="button" onClick={() => { onScore(0); onPhase('playing') }}>{phase === 'over' ? t('restart') : t('play')}</button></div>}
  </div>
}

function JumpGame({ phase, round, score, onScore, finish }: { phase: Phase; round: number; score: number; onScore: (n: number) => void; finish: (n: number) => void }) {
  const board = useRef<HTMLButtonElement>(null); const scoreRef = useRef(score); scoreRef.current = score
  const whaleRef = useRef({ y: 45, velocity: 0 }); const rocksRef = useRef([{ id: 0, x: 112, gap: 46, opening: 34, gapBefore: 0, scored: false }]); const ended = useRef(false)
  const [whale, setWhale] = useState(whaleRef.current); const [rocks, setRocks] = useState(rocksRef.current); const [splash, setSplash] = useState<SplashState | null>(null)
  const flap = useCallback(() => { if (phase === 'playing') { whaleRef.current = { ...whaleRef.current, velocity: -49 }; setWhale(whaleRef.current) } }, [phase])
  useEffect(() => { if (phase === 'playing') board.current?.focus() }, [phase])
  useEffect(() => { ended.current = false; whaleRef.current = { y: 45, velocity: 0 }; rocksRef.current = [{ id: round, x: 112, gap: 46, opening: 34, gapBefore: 0, scored: false }]; setWhale(whaleRef.current); setRocks(rocksRef.current); setSplash(null) }, [round])
  const end = (x: number, y: number) => { if (!ended.current) { ended.current = true; setSplash({ id: performance.now(), x, y }); finish(scoreRef.current) } }
  useFrame(phase === 'playing', (dt) => {
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
    if (gained) { scoreRef.current += gained; onScore(scoreRef.current) }
    if (impact) end(impact.x, impact.y)
  })
  return <button ref={board} type="button" className={css.oceanBoard} onClick={flap} onKeyDown={(event) => { if (!event.repeat && ['Space', 'ArrowUp', 'KeyW'].includes(event.code)) { event.preventDefault(); flap() } }} aria-label="Whale wave game" data-whale-game>
    <div className={css.skyBubbles}><i/><i/><i/></div><span className={css.gameWhale} style={{ top: `${whale.y}%` }}><WhaleMark jumping={whale.velocity < 0}/></span>
    {rocks.map(rock => <span key={rock.id} className={css.rockGate} style={{ left: `${rock.x}%` }}><i style={{ height: `${rock.gap - rock.opening / 2}%` }}/><i style={{ top: `${rock.gap + rock.opening / 2}%` }}/></span>)}<div className={css.oceanWaves}><i/><i/></div><Splash splash={splash}/>
  </button>
}

type CatchItem = CatchDesign & { id: number; y: number; arrivalAt: number }
function CatchGame({ phase, round, score, onScore, finish }: { phase: Phase; round: number; score: number; onScore: (n: number) => void; finish: (n: number) => void }) {
  const board = useRef<HTMLDivElement>(null); const keys = useRef(new Set<string>()); const touchDirection = useRef(0); const scoreRef = useRef(score); scoreRef.current = score; const whaleRef = useRef(50); const ended = useRef(false)
  const itemsRef = useRef<CatchItem[]>([]); const pending = useRef<CatchDesign | null>(null); const nextSpawnAt = useRef(.55); const elapsed = useRef(0); const itemId = useRef(0)
  const [whaleX, setWhaleX] = useState(50); const [items, setItems] = useState<CatchItem[]>([]); const [splash, setSplash] = useState<SplashState | null>(null)
  useEffect(() => { if (phase === 'playing') board.current?.focus(); else { keys.current.clear(); touchDirection.current = 0 } }, [phase])
  useEffect(() => {
    const release = (event: KeyboardEvent) =>{  keys.current.delete(event.code); }
    const clear = () => { keys.current.clear(); touchDirection.current = 0 }
    window.addEventListener('keyup', release); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keyup', release); window.removeEventListener('blur', clear) }
  }, [])
  useEffect(() => { ended.current = false; whaleRef.current = 50; itemsRef.current = []; pending.current = null; nextSpawnAt.current = .55; elapsed.current = 0; itemId.current = 0; setWhaleX(50); setItems([]); setSplash(null) }, [round])
  const end = (x: number) => { if (!ended.current) { ended.current = true; setSplash({ id: performance.now(), x, y: 82 }); finish(scoreRef.current) } }
  useFrame(phase === 'playing', (dt) => {
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
    if (outcome.gained) { scoreRef.current += outcome.gained; onScore(scoreRef.current) }
    if (outcome.hazardX !== null) end(outcome.hazardX)
  })
  const move = (amount: number) => { if (phase === 'playing') { whaleRef.current = Math.min(91, Math.max(9, whaleRef.current + amount)); setWhaleX(whaleRef.current) } }
  const releaseTouch = () =>{  touchDirection.current = 0; }
  return <div ref={board} className={css.oceanBoard} tabIndex={0} data-whale-game onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) { keys.current.add(event.code); event.preventDefault() } }}>
    <div className={css.lightRays}/><div className={css.skyBubbles}><i/><i/><i/></div>{items.map(item => <span key={item.id} className={css.falling} style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, height: item.size }}><OceanIcon kind={item.kind}/><b className={css.itemValue}>{item.hazard ? '!' : `+${item.value}`}</b></span>)}
    <span className={css.catcher} style={{ left: `${whaleX}%` }}><WhaleMark/></span><div className={css.oceanWaves}><i/><i/></div><Splash splash={splash}/><div className={css.touchControls}><button type="button" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); touchDirection.current = -1; move(-2) }} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch}>←</button><button type="button" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); touchDirection.current = 1; move(2) }} onPointerUp={releaseTouch} onPointerCancel={releaseTouch} onLostPointerCapture={releaseTouch}>→</button></div>
  </div>
}

type RunnerObstacle = RunnerObstacleModel & { id: number; gapAfter: number }

function RunnerScene({ whaleY, obstacles, splash }: { whaleY: number; obstacles: RunnerObstacle[]; splash: SplashState | null }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const ratio = Math.min(2, window.devicePixelRatio || 1)
    const width = element.clientWidth; const height = element.clientHeight
    if (element.width !== width * ratio || element.height !== height * ratio) { element.width = width * ratio; element.height = height * ratio }
    const context = element.getContext('2d'); if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height)
    const styles = getComputedStyle(element)
    const blue = styles.getPropertyValue('--dsw-alias-state-business-primary').trim()
    const surface = styles.getPropertyValue('--dsw-alias-border-l3').trim()
    const water = styles.getPropertyValue('--dsw-alias-state-business-tertiary').trim()
    const background = styles.getPropertyValue('--dsw-alias-bg-layer-2').trim()
    const error = styles.getPropertyValue('--dsw-alias-state-error-secondary').trim()
    const now = performance.now(); const seaY = height * .84
    context.fillStyle = background; context.fillRect(0, 0, width, height); context.fillStyle = water; context.globalAlpha = .2; context.fillRect(0, 0, width, height); context.globalAlpha = 1
    context.strokeStyle = water; context.globalAlpha = .42; context.lineWidth = 8
    for (const offset of [0, width * .43]) { context.beginPath(); context.moveTo(offset, 0); context.lineTo(offset + width * .24, height * .72); context.stroke() }
    context.globalAlpha = 1
    const wave = (base: number, amplitude: number, speed: number) => {
      context.beginPath(); context.moveTo(0, base)
      for (let x = 0; x <= width + 12; x += 12) context.lineTo(x, base + Math.sin(x / 31 + now / speed) * amplitude)
      context.lineTo(width, height); context.lineTo(0, height); context.closePath()
    }
    wave(seaY + 4, 2.5, 620); context.fillStyle = surface; context.globalAlpha = .3; context.fill()
    wave(seaY, 1.5, 760); context.strokeStyle = blue; context.lineWidth = 1; context.globalAlpha = .3; context.stroke()
    context.globalAlpha = 1
    const whaleX = width * .18; const whaleTop = seaY - 18 - height * whaleY / 100
    context.save(); context.translate(whaleX, whaleTop); context.scale(.43, .43)
    context.fillStyle = blue; context.beginPath(); context.moveTo(-25, -4); context.bezierCurveTo(-36, -7, -43, -16, -41, -27); context.lineTo(-31, -19); context.lineTo(-22, -26); context.bezierCurveTo(-18, -17, -19, -10, -25, -4); context.fill()
    context.beginPath(); context.moveTo(-24, -8); context.bezierCurveTo(-10, -24, 19, -27, 41, -16); context.bezierCurveTo(59, -7, 64, 14, 50, 28); context.bezierCurveTo(34, 45, -7, 45, -27, 28); context.bezierCurveTo(-39, 17, -39, 2, -24, -8); context.fill()
    context.fillStyle = background; context.beginPath(); context.moveTo(-25, 19); context.bezierCurveTo(-4, 33, 27, 35, 52, 19); context.bezierCurveTo(45, 35, 25, 42, 4, 38); context.bezierCurveTo(-11, 35, -21, 28, -25, 19); context.fill()
    context.beginPath(); context.arc(42, -7, 3.2, 0, Math.PI * 2); context.fill()
    context.strokeStyle = blue; context.lineWidth = 2.8; context.lineCap = 'round'; context.beginPath(); context.moveTo(17, -25); context.quadraticCurveTo(13, -35, 19, -42); context.moveTo(20, -27); context.quadraticCurveTo(27, -37, 33, -34); context.stroke(); context.restore()
    for (const obstacle of obstacles) {
      const geometry = RUNNER_OBSTACLES[obstacle.kind]; const left = width * obstacle.x / 100 - geometry.visualWidth / 2; const top = seaY - geometry.visualHeight
      context.save(); context.translate(left, top); context.lineCap = 'round'; context.lineJoin = 'round'
      if (obstacle.kind === 'conch') {
        context.fillStyle = blue; context.strokeStyle = blue; context.globalAlpha = .36; context.lineWidth = 1.4
        context.beginPath(); context.moveTo(1, 16); context.bezierCurveTo(2, 5, 8, 1, 14, 2); context.bezierCurveTo(22, 3, 24, 10, 21, 16); context.closePath(); context.fill(); context.globalAlpha = .7; context.stroke()
        context.beginPath(); context.arc(13, 10, 5, -.5, Math.PI * 1.75); context.arc(13, 10, 2.2, Math.PI * 1.75, 0); context.stroke()
      } else if (obstacle.kind === 'urchin') {
        context.strokeStyle = blue; context.fillStyle = blue; context.globalAlpha = .55; context.lineWidth = 1.6
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) { context.beginPath(); context.moveTo(15 + Math.cos(angle) * 9, 15 + Math.sin(angle) * 9); context.lineTo(15 + Math.cos(angle) * 14, 15 + Math.sin(angle) * 14); context.stroke() }
        context.globalAlpha = .32; context.beginPath(); context.arc(15, 15, 10, 0, Math.PI * 2); context.fill(); context.globalAlpha = .7; context.stroke()
      } else if (obstacle.kind === 'coral') {
        context.strokeStyle = error; context.globalAlpha = .62; context.lineWidth = 6
        context.beginPath(); context.moveTo(14, 37); context.lineTo(14, 5); context.moveTo(14, 21); context.quadraticCurveTo(4, 21, 5, 12); context.moveTo(14, 16); context.quadraticCurveTo(24, 16, 23, 7); context.moveTo(14, 29); context.quadraticCurveTo(24, 29, 24, 22); context.stroke()
      } else {
        context.fillStyle = blue; context.strokeStyle = blue; context.globalAlpha = .34; context.lineWidth = 1.5
        context.beginPath(); context.moveTo(2, 12); context.lineTo(44, 10); context.lineTo(38, 23); context.lineTo(9, 23); context.closePath(); context.fill(); context.globalAlpha = .7; context.stroke()
        context.beginPath(); context.moveTo(22, 11); context.lineTo(22, 2); context.lineTo(34, 9); context.closePath(); context.stroke(); context.moveTo(10, 16); context.lineTo(37, 15); context.stroke()
      }
      context.restore(); context.globalAlpha = 1
    }
    if (splash) {
      const age = Math.min(1, (now - splash.id) / 560); context.strokeStyle = blue; context.globalAlpha = 1 - age; context.lineWidth = 1.5
      context.beginPath(); context.ellipse(width * splash.x / 100, seaY, 8 + age * 28, 2 + age * 6, 0, 0, Math.PI * 2); context.stroke()
      for (const direction of [-1, -.4, .4, 1]) { context.beginPath(); context.arc(width * splash.x / 100 + direction * age * 24, seaY - Math.sin(age * Math.PI) * (17 + Math.abs(direction) * 10), 2.2, 0, Math.PI * 2); context.fillStyle = blue; context.fill() }
      context.globalAlpha = 1
    }
  }, [obstacles, splash, whaleY])
  return <canvas ref={canvas} className={css.runnerCanvas} aria-hidden="true"/>
}

function RunnerGame({ phase, round, score, onScore, finish }: { phase: Phase; round: number; score: number; onScore: (n: number) => void; finish: (n: number) => void }) {
  const board = useRef<HTMLButtonElement>(null); const scoreRef = useRef(score); scoreRef.current = score; const whaleRef = useRef({ y: 0, velocity: 0 }); const obstaclesRef = useRef<RunnerObstacle[]>([]); const ended = useRef(false); const elapsedRef = useRef(0); const travelRef = useRef(0); const obstacleId = useRef(0); const kindHistory = useRef<RunnerObstacleKind[]>([]); const gapHistory = useRef<RunnerGapBand[]>([])
  const [whale, setWhale] = useState(whaleRef.current); const [obstacles, setObstacles] = useState<RunnerObstacle[]>([]); const [splash, setSplash] = useState<SplashState | null>(null)
  const jump = useCallback(() => { if (phase === 'playing' && whaleRef.current.y === 0) { whaleRef.current = { y: 0, velocity: 72 }; setWhale(whaleRef.current) } }, [phase])
  useEffect(() => { if (phase === 'playing') board.current?.focus() }, [phase])
  useEffect(() => { ended.current = false; whaleRef.current = { y: 0, velocity: 0 }; obstaclesRef.current = []; elapsedRef.current = 0; travelRef.current = 0; obstacleId.current = 0; kindHistory.current = []; gapHistory.current = []; setWhale(whaleRef.current); setObstacles([]); setSplash(null) }, [round])
  const end = () => { if (!ended.current) { ended.current = true; setSplash({ id: performance.now(), x: 24, y: 76 - whaleRef.current.y }); finish(scoreRef.current) } }
  useFrame(phase === 'playing', (dt) => {
    elapsedRef.current += dt; const speed = runnerSpeed(elapsedRef.current); travelRef.current += speed * dt * .3
    const nextScore = Math.floor(travelRef.current)
    if (nextScore !== scoreRef.current) { scoreRef.current = nextScore; onScore(nextScore) }
    const current = whaleRef.current; const velocity = current.velocity - 145 * dt; const y = Math.max(0, current.y + velocity * dt)
    whaleRef.current = { y, velocity: y === 0 ? 0 : velocity }; setWhale(whaleRef.current); if (current.y > 1 && y === 0) setSplash({ id: performance.now(), x: 19, y: 80 })
    const moved = obstaclesRef.current.map(item => ({ ...item, x: item.x - speed * dt })).filter(item => item.x > -15); const last = moved.at(-1)
    if (!last || last.x < 112 - last.gapAfter) {
      const wave = createRunnerWave(elapsedRef.current, speed, { recentKinds: kindHistory.current, recentGapBands: gapHistory.current })
      moved.push(...wave.obstacles.map((item) => { obstacleId.current += 1; return { ...item, id: obstacleId.current } }))
      kindHistory.current = [...kindHistory.current.slice(-1), wave.primaryKind]; gapHistory.current = [...gapHistory.current.slice(-1), wave.gapBand]
    }
    obstaclesRef.current = moved; setObstacles(moved)
    const width = board.current?.clientWidth ?? 0; const height = board.current?.clientHeight ?? 0
    if (moved.some(item => runnerCollides(width, height, whaleRef.current.y, item))) end()
  })
  return <button ref={board} type="button" className={`${css.oceanBoard} ${css.runnerBoard}`} onClick={jump} onKeyDown={(event) => { if (!event.repeat && ['Space', 'ArrowUp', 'KeyW'].includes(event.code)) { event.preventDefault(); jump() } }} data-whale-game aria-label="Whale ocean runner">
    <RunnerScene whaleY={whale.y} obstacles={obstacles} splash={splash}/>
  </button>
}

export function WhaleArcade({ t }: Props) {
  const [open, setOpen] = useState(false); const [game, setGame] = useState<GameId | null>(null); const [phase, setPhase] = useState<Phase>('ready'); const [score, setScore] = useState(0); const [round, setRound] = useState(0); const startedAt = useRef(Date.now())
  const select = (id: GameId) => { setGame(id); setPhase('ready'); setScore(0) }
  const close = () => { setOpen(false); setPhase(value => value === 'playing' ? 'paused' : value) }
  const updatePhase = (next: Phase) => { if (next === 'playing' && phase !== 'paused') { startedAt.current = Date.now(); setRound(value => value + 1) } setPhase(next) }
  useEffect(() => { const hidden = () => { if (document.hidden) setPhase(value => value === 'playing' ? 'paused' : value) }; document.addEventListener('visibilitychange', hidden); return () =>{  document.removeEventListener('visibilitychange', hidden); } }, [])
  const gameBody = useMemo(() => (finish: (n: number) => void) => {
    if (game === 'jump') return <JumpGame phase={phase} round={round} score={score} onScore={setScore} finish={finish}/>
    if (game === 'catch') return <CatchGame phase={phase} round={round} score={score} onScore={setScore} finish={finish}/>
    if (game === 'runner') return <RunnerGame phase={phase} round={round} score={score} onScore={setScore} finish={finish}/>
    return null
  }, [game, phase, round, score])
  return <div className={css.root}>
    {open && <div className={css.panel} data-in-game={game !== null || undefined} role="dialog" aria-label={t('title')}>{game === null && <header><div><h2>{t('title')}</h2><p>{t('subtitle')}</p></div><button type="button" className={css.iconButton} onClick={close} aria-label={t('close')}>×</button></header>}
      {game === null ? <div className={css.catalog}>{(Object.keys(GAME_COPY) as GameId[]).map(id => <button type="button" key={id} onClick={() =>{  select(id); }}><CatalogIcon kind={GAME_COPY[id].icon}/><strong>{t(GAME_COPY[id].name)}</strong><small>{t(GAME_COPY[id].desc)}</small><b>{t('best')} {readScores(id)[0]?.score ?? 0}</b></button>)}</div>
        : <GameChrome game={game} phase={phase} score={score} startedAt={startedAt.current} onPhase={updatePhase} onScore={setScore} onBack={() => { setGame(null); setPhase('ready') }} onClose={close} t={t} renderGame={gameBody}/>}
    </div>}
    <button type="button" className={css.launcher} onClick={() => { if (open) close(); else setOpen(true) }} aria-label={t('launcher')} aria-expanded={open}><WhaleMark/></button>
  </div>
}
