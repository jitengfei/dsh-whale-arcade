import { useCallback, useEffect, useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { findGame, GAMES, type GameId, type RegisteredArcadeGameDefinition } from './game-registry.ts'
import { NS } from './locales.ts'
import { recordGameResult } from './runtime/records.ts'
import { useGameSession } from './runtime/use-game-session.ts'
import { GameCatalog } from './shell/GameCatalog.tsx'
import { GameFrame } from './shell/GameFrame.tsx'
import { GameRecords } from './shell/GameRecords.tsx'
import { WhaleMark } from './shared/WhaleMark.tsx'
import css from './WhaleArcade.module.css'

type Props = PropsRuntime<'shell.overlay'> & PropsLocale<typeof NS>

const REGISTERED_GAMES: readonly RegisteredArcadeGameDefinition[] = GAMES
const FIRST_LEADERBOARD = REGISTERED_GAMES.find(definition => definition.recordPolicy.kind === 'leaderboard')
type RecordsSelection = { readonly game: GameId; readonly variantId?: string }

function recordsSelection(definition: RegisteredArcadeGameDefinition, variantId = definition.defaultVariantId): RecordsSelection {
  return {
    game: definition.id,
    ...(variantId === undefined ? {} : { variantId }),
  }
}

/** Floating catalog and neutral host for every registered local game. */
export function WhaleArcade({ t }: Props) {
  const [open, setOpen] = useState(false)
  const [game, setGame] = useState<GameId | null>(null)
  const [records, setRecords] = useState<RecordsSelection | null>(
    FIRST_LEADERBOARD === undefined ? null : recordsSelection(FIRST_LEADERBOARD),
  )
  const gameRef = useRef<RegisteredArcadeGameDefinition | null>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const session = useGameSession({
    onFinish(completed) {
      const definition = gameRef.current
      if (definition === null) return
      recordGameResult(definition.id, definition.recordPolicy, {
        result: completed.result,
        durationMs: Math.round(completed.durationMs),
      })
      if (definition.recordPolicy.kind === 'leaderboard') {
        setRecords(recordsSelection(definition, completed.result.variantId))
      }
    },
  })

  const select = useCallback((id: GameId) => {
    const definition = findGame(id)
    gameRef.current = definition
    session.prepare({
      ...(definition.initialHud === undefined ? {} : { initialHud: definition.initialHud }),
      ...(definition.defaultVariantId === undefined ? {} : { variantId: definition.defaultVariantId }),
    })
    setGame(id)
    if (definition.recordPolicy.kind === 'leaderboard') setRecords(recordsSelection(definition))
  }, [session.prepare])

  const close = useCallback(() => {
    session.pause()
    setOpen(false)
    launcher.current?.focus()
  }, [session.pause])

  const back = useCallback(() => {
    session.abandon()
    gameRef.current = null
    setGame(null)
    launcher.current?.focus()
  }, [session.abandon])

  useEffect(() => {
    const pauseHiddenGame = () => {
      if (document.hidden) session.pause()
    }
    document.addEventListener('visibilitychange', pauseHiddenGame)
    return () => {
      document.removeEventListener('visibilitychange', pauseHiddenGame)
    }
  }, [session.pause])

  const definition = game === null ? null : findGame(game)

  return <div className={css.root}>
    <div className={css.panel} data-in-game={game !== null || undefined} role="dialog" aria-label={t('title')} hidden={!open}>
      {definition === null && <header><div><h2>{t('title')}</h2><p>{t('subtitle')}</p></div><button type="button" className={css.iconButton} onClick={close} aria-label={t('close')}>×</button></header>}
      {definition === null
        ? <><GameCatalog onSelect={select} t={t}/>{records !== null && <GameRecords
          game={records.game}
          {...(records.variantId === undefined ? {} : { variantId: records.variantId })}
          onGame={(id) => { setRecords(recordsSelection(findGame(id))) }}
          t={t}
        />}</>
        : <GameFrame definition={definition} session={session} onBack={back} onClose={close} t={t}/>}
    </div>
    <button ref={launcher} type="button" className={css.launcher} onClick={() => { if (open) close(); else setOpen(true) }} aria-label={t('launcher')} aria-expanded={open}><WhaleMark/></button>
  </div>
}
