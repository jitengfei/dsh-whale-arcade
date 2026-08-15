import css from '../WhaleArcade.module.css'

export type OceanKind = 'pearl' | 'star' | 'fish' | 'crab' | 'jelly' | 'urchin' | 'coral' | 'shell'

export interface OceanIconProps {
  kind: OceanKind
}

export function OceanIcon({ kind }: OceanIconProps) {
  if (kind === 'jelly') return <svg viewBox="0 0 48 56" aria-hidden="true"><path className={css.jellyCap} d="M6 25C6 10 14 3 24 3s18 7 18 22Z"/><path className={css.objectLine} d="M10 25c0 7 6 7 6 14s-5 8-5 13m13-27c0 8 5 8 5 15s-4 8-4 12m13-27c0 7-5 8-5 14s5 7 5 13"/></svg>
  if (kind === 'coral') return <svg viewBox="0 0 48 60" aria-hidden="true"><path className={css.coral} d="M22 57V26c0-8-7-8-7-15M22 35c8 0 13-6 13-15m-13 28c-9 0-15-5-15-13m28-15V9m-20 2V4M7 35v-8"/></svg>
  if (kind === 'shell') return <svg viewBox="0 0 52 45" aria-hidden="true"><path className={css.shell} d="M4 38C5 17 13 5 26 5s21 12 22 33Z"/><path className={css.objectLine} d="M26 7v29M15 10l7 27M37 10l-7 27M7 25l15 12m23-12L30 37"/></svg>
  if (kind === 'fish') return <svg viewBox="0 0 56 38" aria-hidden="true"><path className={css.fishBody} d="M12 19C20 5 39 6 47 19c-8 13-27 14-35 0Z"/><path className={css.fishTail} d="M13 19 3 8v22Z"/><circle className={css.objectDot} cx="39" cy="15" r="2"/><path className={css.objectLine} d="M28 9c-2 5-2 14 0 20"/></svg>
  if (kind === 'crab') return <svg viewBox="0 0 56 44" aria-hidden="true"><path className={css.crabBody} d="M14 24c2-11 26-11 28 0 1 9-6 15-14 15s-15-6-14-15Z"/><path className={css.crabLine} d="M15 24 7 18 3 11m38 13 8-6 4-7M15 29 6 34m35-5 9 5M20 16l-2-8m18 8 2-8"/><circle className={css.objectDot} cx="21" cy="22" r="1.5"/><circle className={css.objectDot} cx="35" cy="22" r="1.5"/></svg>
  if (kind === 'urchin') return <svg viewBox="0 0 48 48" aria-hidden="true"><path className={css.urchinSpines} d="m24 2 3 13 8-11-3 14L45 9 35 21l15-3-14 8 14 5-15-1 10 11-13-8 3 14-8-12-3 13-3-13-8 11 3-14-13 8 10-11-15 2 14-6L0 18l15 3L4 9l13 9-4-14 8 11Z"/><circle className={css.urchinBody} cx="24" cy="25" r="11"/></svg>
  if (kind === 'star') return <svg viewBox="0 0 50 50" aria-hidden="true"><path className={css.star} d="m25 3 6 14 15 1-12 10 4 16-13-8-13 8 4-16L4 18l15-1Z"/><circle className={css.objectDot} cx="20" cy="24" r="1.5"/><circle className={css.objectDot} cx="30" cy="24" r="1.5"/></svg>
  return <svg viewBox="0 0 52 48" aria-hidden="true"><path className={css.pearlShellBack} d="M6 28C8 12 16 5 26 5s18 7 20 23Z"/><path className={css.objectLine} d="M26 7v20M15 10l8 18m14-18-8 18"/><path className={css.pearlShellFront} d="M5 29c7-5 35-5 42 0-3 11-11 15-21 15S8 40 5 29Z"/><circle className={css.pearl} cx="26" cy="27" r="8"/></svg>
}
