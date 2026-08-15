import styles from './GomokuGame.module.css'

export type WhaleStoneSide = 'player' | 'ai'

export interface WhaleStoneProps {
  readonly side: WhaleStoneSide
}

/**
 * A compact whale drawn specifically for a gomoku intersection.
 *
 * The shared WhaleMark has details intended for the larger launcher. At stone
 * size those details collapse into a fish-like oval, so this mark deliberately
 * exaggerates the raised fluke, eye, belly, and spout.
 */
export function WhaleStone({ side }: WhaleStoneProps) {
  return <svg
    className={`${styles.stone} ${side === 'player' ? styles.playerStone : styles.aiStone}`}
    data-whale-stone={side}
    viewBox="0 0 48 36"
    aria-hidden="true"
    focusable="false"
  >
    <path
      className={styles.stoneTail}
      d="M15 17C9 16 4 12 4 5l6 4 5-5c3 5 3 10 0 13Z"
      vectorEffect="non-scaling-stroke"
    />
    <path
      className={styles.stoneBody}
      d="M14 13c6-6 18-7 26-2 7 4 8 12 3 17-6 6-21 6-28 0-5-4-5-11-1-15Z"
      vectorEffect="non-scaling-stroke"
    />
    <path
      className={styles.stoneBelly}
      d="M14 24c8 5 21 5 29 0-2 5-8 8-15 8-7 0-12-3-14-8Z"
    />
    <circle className={styles.stoneEye} cx="38" cy="16" r="2.25"/>
    <path
      className={styles.stoneSmile}
      d="M38 24c2 1 4 1 5-1"
      vectorEffect="non-scaling-stroke"
    />
    <path
      className={styles.stoneSpout}
      d="M29 9c-1-3 0-6 2-8m0 8c2-3 5-4 7-2"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
}
