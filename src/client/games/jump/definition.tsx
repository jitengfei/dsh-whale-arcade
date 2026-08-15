import type { GameDefinition, GameIconProps } from '../../runtime/game-contract.ts'
import { HIGH_SCORE_POLICY, type RecordPolicy } from '../../runtime/records.ts'
import { WhaleMark } from '../../shared/WhaleMark.tsx'
import css from '../../WhaleArcade.module.css'
import { JumpGame } from './JumpGame.tsx'

function JumpIcon({ className }: GameIconProps) {
  return <span className={className}><WhaleMark/><i className={css.miniWave}/></span>
}

export const jumpGame = {
  id: 'jump',
  nameKey: 'jump.name',
  descriptionKey: 'jump.desc',
  Icon: JumpIcon,
  View: JumpGame,
  initialHud: { primary: { id: 'score', labelKey: 'score', value: 0 } },
  recordPolicy: HIGH_SCORE_POLICY,
  recordLabelKey: 'score',
} as const satisfies GameDefinition<'jump', RecordPolicy>
