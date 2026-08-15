import { useMemo } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ArcadeGameDefinition } from '../game-registry.ts'
import { NS, type WhaleArcadeKey } from '../locales.ts'
import type { GameSessionBinding } from '../runtime/use-game-session.ts'
import css from '../WhaleArcade.module.css'
import { formatMetric, readRankedRecords } from './record-display.ts'

type T = PropsLocale<typeof NS>['t']

const OUTCOME_KEYS = {
  completed: 'result.completed',
  failed: 'over',
  won: 'result.won',
  lost: 'result.lost',
  draw: 'result.draw',
} as const satisfies Record<NonNullable<GameSessionBinding['state']['result']>['outcome'], WhaleArcadeKey>

export interface GameFrameProps {
  readonly definition: ArcadeGameDefinition
  readonly session: GameSessionBinding
  readonly onBack: () => void
  readonly onClose: () => void
  readonly t: T
}

export function GameFrame({ definition, session, onBack, onClose, t }: GameFrameProps) {
  const { state, runtime } = session
  const records = useMemo(
    () => readRankedRecords(definition, state.variantId),
    [definition, state.phase, state.variantId],
  )
  const View = definition.View
  const Setup = definition.Setup
  const description = runtime.hud.statusKey ?? definition.descriptionKey
  const outcomeKey = state.result === null ? 'over' : OUTCOME_KEYS[state.result.outcome]

  return <div className={css.game} data-phase={state.phase} data-game={definition.id}>
    <div className={css.gameBar}>
      <button type="button" className={css.backButton} onClick={onBack} aria-label={t('back')}>←</button>
      <span
        className={css.hint}
        data-status={runtime.hud.statusKey === undefined ? undefined : true}
        role={runtime.hud.statusKey === undefined ? undefined : 'status'}
        aria-live={runtime.hud.statusKey === undefined ? undefined : 'polite'}
      >{t(description)}</span>
      {runtime.hud.primary !== undefined && <span>{t(runtime.hud.primary.labelKey ?? 'score')} <strong>{formatMetric(runtime.hud.primary, true)}</strong></span>}
      {runtime.hud.secondary !== undefined && <span>{t(runtime.hud.secondary.labelKey ?? 'score')} <strong>{formatMetric(runtime.hud.secondary)}</strong></span>}
      {records !== null && <span>{t('best')} <strong>{formatMetric(records.metric, true)}</strong></span>}
      <button type="button" onClick={() => { if (state.phase === 'paused') session.resume(); else session.pause() }} disabled={state.phase === 'ready' || state.phase === 'finished'}>{state.phase === 'paused' ? t('resume') : t('pause')}</button>
      <button type="button" className={css.closeButton} onClick={onClose} aria-label={t('close')}>×</button>
    </div>
    <View key={definition.id} {...runtime} translate={t}/>
    {(state.phase === 'ready' || state.phase === 'finished') && <div className={css.gameOverlay}>
      <span>{state.phase === 'finished' ? t(outcomeKey) : t(definition.descriptionKey)}</span>
      {state.phase === 'ready' && Setup !== undefined && <Setup variantId={state.variantId} selectVariant={session.selectVariant} translate={t}/>}
      <button type="button" onClick={state.phase === 'finished' ? session.restart : session.start}>{state.phase === 'finished' ? t('restart') : t('play')}</button>
    </div>}
  </div>
}
