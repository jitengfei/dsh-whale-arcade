export interface CatchCollisionItem { x: number; y: number; size: number }
export interface CatchHitItem extends CatchCollisionItem { id: number; value: number; hazard: boolean }

/** Pixel-derived, inset sprite collision that remains stable on narrow screens. */
export function catchCollides(width: number, height: number, whaleX: number, item: CatchCollisionItem): boolean {
  if (width <= 0 || height <= 0) return false
  const whaleCenterX = width * whaleX / 100
  const whale = { left: whaleCenterX - 16, right: whaleCenterX + 18, top: height - 62, bottom: height - 35 }
  const itemCenterX = width * item.x / 100
  const itemCenterY = height * item.y / 100
  const half = item.size * .34
  return whale.left < itemCenterX + half
    && whale.right > itemCenterX - half
    && whale.top < itemCenterY + half
    && whale.bottom > itemCenterY - half
}

interface CatchHitOutcome { caughtIds: number[]; gained: number; hazardX: number | null; splashX: number | null }

export function catchHitOutcome(
  width: number,
  height: number,
  whaleX: number,
  items: readonly CatchHitItem[],
): CatchHitOutcome {
  const caught = items.filter(item => catchCollides(width, height, whaleX, item))
  return {
    caughtIds: caught.map(item => item.id),
    gained: caught.reduce((total, item) => total + (item.hazard ? 0 : item.value), 0),
    hazardX: caught.find(item => item.hazard)?.x ?? null,
    splashX: caught[0]?.x ?? null,
  }
}
