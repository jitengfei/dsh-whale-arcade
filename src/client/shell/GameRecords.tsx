import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { GAMES, findGame, type ArcadeGameDefinition, type GameId } from '../game-registry.ts'
import { NS } from '../locales.ts'
import css from '../WhaleArcade.module.css'
import { formatDuration, formatMetric, rankedRecordValue, readRankedRecords } from './record-display.ts'

type T = PropsLocale<typeof NS>['t']

export interface GameRecordsProps {
  readonly game: GameId
  readonly variantId?: string
  readonly onGame: (game: GameId) => void
  readonly t: T
}

export function GameRecords({ game, variantId, onGame, t }: GameRecordsProps) {
  const definition = findGame(game)
  const ranked = readRankedRecords(definition, variantId)
  const registered: readonly (ArcadeGameDefinition & { readonly id: GameId })[] = GAMES
  const games = registered.filter(candidate => candidate.recordPolicy.kind === 'leaderboard')

  return <section className={css.scores} aria-label={t('leaderboard')}>
    <div className={css.scoresHeader}><h3>{t('leaderboard')}</h3><div className={css.scoreTabs} role="group" aria-label={t('leaderboard')}>
      {games.map(candidate => <button type="button" key={candidate.id} aria-pressed={candidate.id === game} onClick={() => { onGame(candidate.id) }}>{t(candidate.nameKey)}</button>)}
    </div></div>
    {ranked !== null && ranked.rows.length > 0
      ? <ol>{ranked.rows.map((entry, index) => {
        const primary = rankedRecordValue(entry, definition)
        const primaryLabel = primary === null ? undefined : `${t(primary.labelKey ?? 'score')} ${primary.value}`
        return <li key={`${entry.achievedAt}-${index}`}>
          <span>#{index + 1}</span>
          <strong aria-label={primaryLabel}>{primary === null ? '—' : formatMetric(primary)}</strong>
          <time dateTime={`PT${entry.durationMs / 1000}S`} title={t('duration')}>{formatDuration(entry.durationMs)}</time>
        </li>
      })}</ol>
      : <p className={css.empty}>{t('empty')}</p>}
  </section>
}
