import type { CaveDesign } from './jump-design.ts'

export interface CavePosition extends CaveDesign { x: number }

interface Rect { left: number; right: number; top: number; bottom: number }

function whaleRect(width: number, height: number, y: number): Rect {
  const left = width * .14
  const centerY = height * y / 100
  return { left: left + 15, right: left + 42, top: centerY - 9, bottom: centerY + 12 }
}

function caveHorizontalRect(width: number, cave: CavePosition): Pick<Rect, 'left' | 'right'> {
  const center = width * cave.x / 100
  return { left: center - 12, right: center + 12 }
}

export function jumpCollides(width: number, height: number, whaleY: number, cave: CavePosition): boolean {
  if (width <= 0 || height <= 0) return false
  const whale = whaleRect(width, height, whaleY)
  const horizontal = caveHorizontalRect(width, cave)
  if (whale.right <= horizontal.left || whale.left >= horizontal.right) return false
  const topEdge = height * (cave.gap - cave.opening / 2) / 100
  const bottomEdge = height * (cave.gap + cave.opening / 2) / 100
  return whale.top < topEdge - 2 || whale.bottom > bottomEdge + 2
}

export function cavePassedWhale(width: number, cave: CavePosition): boolean {
  if (width <= 0) return false
  return caveHorizontalRect(width, cave).right < whaleRect(width, 1, 50).left
}
