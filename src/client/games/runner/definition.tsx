import type { GameDefinition, GameIconProps } from '../../runtime/game-contract.ts'
import { HIGH_SCORE_POLICY, type RecordPolicy } from '../../runtime/records.ts'
import { OceanIcon } from '../../shared/OceanIcon.tsx'
import { RunnerGame } from './RunnerGame.tsx'

function RunnerIcon({ className }: GameIconProps) {
  return <span className={className}><OceanIcon kind="coral"/></span>
}

export const runnerGame = {
  id: 'runner',
  nameKey: 'runner.name',
  descriptionKey: 'runner.desc',
  Icon: RunnerIcon,
  View: RunnerGame,
  initialHud: { primary: { id: 'score', labelKey: 'score', value: 0 } },
  recordPolicy: HIGH_SCORE_POLICY,
  recordLabelKey: 'score',
} as const satisfies GameDefinition<'runner', RecordPolicy>
