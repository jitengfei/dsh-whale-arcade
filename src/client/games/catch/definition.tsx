import type { GameDefinition, GameIconProps } from '../../runtime/game-contract.ts'
import { HIGH_SCORE_POLICY, type RecordPolicy } from '../../runtime/records.ts'
import { OceanIcon } from '../../shared/OceanIcon.tsx'
import { CatchGame } from './CatchGame.tsx'

function CatchIcon({ className }: GameIconProps) {
  return <span className={className}><OceanIcon kind="star"/></span>
}

export const catchGame = {
  id: 'catch',
  nameKey: 'catch.name',
  descriptionKey: 'catch.desc',
  Icon: CatchIcon,
  View: CatchGame,
  initialHud: { primary: { id: 'score', labelKey: 'score', value: 0 } },
  recordPolicy: HIGH_SCORE_POLICY,
  recordLabelKey: 'score',
} as const satisfies GameDefinition<'catch', RecordPolicy>
