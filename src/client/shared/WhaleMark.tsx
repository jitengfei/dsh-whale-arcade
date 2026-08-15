import css from '../WhaleArcade.module.css'

export interface WhaleMarkProps {
  jumping?: boolean
  className?: string
}

export function WhaleMark({ jumping = false, className }: WhaleMarkProps) {
  const classes = [jumping ? css.jumpingWhale : '', className ?? ''].filter(Boolean).join(' ')
  return <svg viewBox="0 0 96 64" aria-hidden="true" className={classes || undefined}>
    <path className={css.whaleTail} d="M29 27C20 25 14 18 15 9l8 6 7-5c3 7 3 12-1 17Z"/>
    <path className={css.whaleBody} d="M28 23c9-10 28-12 43-5 13 6 17 20 8 30-10 11-36 11-49 0-8-7-9-18-2-25Z"/>
    <path className={css.whaleBelly} d="M29 41c14 8 35 9 51 0-4 10-16 15-30 14-10 0-18-5-21-14Z"/>
    <circle className={css.whaleEye} cx="70" cy="28" r="2.4"/>
    <path className={css.whaleSmile} d="M71 40c3 1 6 1 8-1"/>
    <path className={css.whaleSpout} d="M56 14c-2-5 0-9 3-11m-1 11c3-4 6-5 9-4"/>
  </svg>
}
