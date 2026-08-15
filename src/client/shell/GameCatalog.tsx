import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { GAMES, type GameId, type RegisteredArcadeGameDefinition } from '../game-registry.ts'
import { NS } from '../locales.ts'
import css from '../WhaleArcade.module.css'
import { formatMetric, readRankedRecords } from './record-display.ts'

type T = PropsLocale<typeof NS>['t']

export interface GameCatalogProps {
  readonly onSelect: (game: GameId) => void
  readonly t: T
}

export function GameCatalog({ onSelect, t }: GameCatalogProps) {
  const registered: readonly RegisteredArcadeGameDefinition[] = GAMES
  return <div className={css.catalog}>{registered.map((definition) => {
    const records = readRankedRecords(definition, definition.defaultVariantId)
    return <button type="button" key={definition.id} onClick={() => { onSelect(definition.id) }}>
      <definition.Icon className={css.catalogIcon ?? ''}/>
      <strong>{t(definition.nameKey)}</strong>
      <small>{t(definition.descriptionKey)}</small>
      {records !== null && <b>{t('best')} {formatMetric(records.metric)}</b>}
    </button>
  })}</div>
}
