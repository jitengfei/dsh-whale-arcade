import type { GameDefinition, GameIconProps, GameSetupProps } from '../../runtime/game-contract.ts'
import { NO_RECORD_POLICY, type RecordPolicy } from '../../runtime/records.ts'
import { GOMOKU_VARIANTS, type GomokuDifficulty } from './ai.ts'
import styles from './GomokuGame.module.css'
import { GomokuGame } from './GomokuGame.tsx'
import { WhaleStone } from './WhaleStone.tsx'

const DIFFICULTIES = [
  { id: 'easy', label: 'gomoku.difficulty.easy' },
  { id: 'normal', label: 'gomoku.difficulty.normal' },
  { id: 'hard', label: 'gomoku.difficulty.hard' },
] as const satisfies readonly { readonly id: GomokuDifficulty; readonly label: 'gomoku.difficulty.easy' | 'gomoku.difficulty.normal' | 'gomoku.difficulty.hard' }[]

function GomokuIcon({ className }: GameIconProps) {
  return <span className={`${className ?? ''} ${styles.catalogIcon}`} aria-hidden="true">
    <i className={styles.catalogGrid}/>
    <i className={`${styles.catalogWhale} ${styles.catalogPlayer}`}><WhaleStone side="player"/></i>
    <i className={`${styles.catalogWhale} ${styles.catalogAi}`}><WhaleStone side="ai"/></i>
  </span>
}

function GomokuSetup({ variantId, selectVariant, translate }: GameSetupProps) {
  return <div className={styles.setup} role="group" aria-label={translate('gomoku.difficulty')}>
    <span>{translate('gomoku.difficulty')}</span>
    <div>{DIFFICULTIES.map(option => <button
      type="button"
      key={option.id}
      data-selected={variantId === GOMOKU_VARIANTS[option.id] || undefined}
      aria-pressed={variantId === GOMOKU_VARIANTS[option.id]}
      onClick={() => { selectVariant(GOMOKU_VARIANTS[option.id]) }}
    >{translate(option.label)}</button>)}</div>
  </div>
}

export const gomokuGame = {
  id: 'gomoku',
  nameKey: 'gomoku.name',
  descriptionKey: 'gomoku.desc',
  Icon: GomokuIcon,
  Setup: GomokuSetup,
  View: GomokuGame,
  defaultVariantId: GOMOKU_VARIANTS.normal,
  initialHud: {
    primary: { id: 'moves', labelKey: 'gomoku.stones', value: 0 },
    statusKey: 'gomoku.turn.player',
  },
  recordPolicy: NO_RECORD_POLICY,
} as const satisfies GameDefinition<'gomoku', RecordPolicy>
