export type RunnerObstacleKind = 'conch' | 'urchin' | 'coral' | 'wreck'

export type RunnerHitShape =
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'circle'; x: number; y: number; radius: number }

export interface RunnerObstacleGeometry {
  visualWidth: number
  visualHeight: number
  hitShapes: readonly RunnerHitShape[]
}

/**
 * One geometry source is shared by Canvas drawing and collision detection.
 * Shape coordinates are local to the obstacle's visual top-left corner.
 */
export const RUNNER_OBSTACLES: Readonly<Record<RunnerObstacleKind, RunnerObstacleGeometry>> = {
  conch: {
    visualWidth: 24,
    visualHeight: 18,
    hitShapes: [{ type: 'rect', x: 2, y: 2, width: 20, height: 16 }],
  },
  urchin: {
    visualWidth: 30,
    visualHeight: 28,
    // The decorative spines stay outside the friendly circular hit area.
    hitShapes: [{ type: 'circle', x: 15, y: 15, radius: 11.5 }],
  },
  coral: {
    visualWidth: 28,
    visualHeight: 40,
    hitShapes: [
      { type: 'rect', x: 9, y: 2, width: 10, height: 38 },
      { type: 'rect', x: 4, y: 12, width: 20, height: 10 },
      { type: 'rect', x: 15, y: 7, width: 9, height: 12 },
    ],
  },
  wreck: {
    visualWidth: 46,
    visualHeight: 25,
    hitShapes: [
      { type: 'rect', x: 3, y: 11, width: 40, height: 12 },
      { type: 'rect', x: 12, y: 5, width: 22, height: 8 },
    ],
  },
}

export interface RunnerObstacleModel {
  x: number
  kind: RunnerObstacleKind
}

interface Rect { left: number; right: number; top: number; bottom: number }

function whaleRect(width: number, height: number, whaleY: number): Rect {
  const centerX = width * .18
  const centerY = height * .84 - 18 - height * whaleY / 100
  // Inset the visible tail, spout, and belly for predictable, forgiving play.
  return { left: centerX - 14, right: centerX + 23, top: centerY - 9, bottom: centerY + 16 }
}

function obstacleOrigin(
  width: number,
  height: number,
  obstacle: RunnerObstacleModel,
): { left: number; top: number } {
  const geometry = RUNNER_OBSTACLES[obstacle.kind]
  return {
    left: width * obstacle.x / 100 - geometry.visualWidth / 2,
    top: height * .84 - geometry.visualHeight,
  }
}

function overlaps(first: Rect, second: Rect): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top
}

function rectCollides(
  whale: Rect,
  origin: { left: number; top: number },
  shape: Extract<RunnerHitShape, { type: 'rect' }>,
): boolean {
  return overlaps(whale, {
    left: origin.left + shape.x,
    right: origin.left + shape.x + shape.width,
    top: origin.top + shape.y,
    bottom: origin.top + shape.y + shape.height,
  })
}

function circleCollides(
  whale: Rect,
  origin: { left: number; top: number },
  shape: Extract<RunnerHitShape, { type: 'circle' }>,
): boolean {
  const centerX = origin.left + shape.x
  const centerY = origin.top + shape.y
  const closestX = Math.max(whale.left, Math.min(centerX, whale.right))
  const closestY = Math.max(whale.top, Math.min(centerY, whale.bottom))
  return (closestX - centerX) ** 2 + (closestY - centerY) ** 2 < shape.radius ** 2
}

/** Friendly collision shapes expressed in the same pixel coordinates as the Canvas scene. */
export function runnerCollides(
  width: number,
  height: number,
  whaleY: number,
  obstacle: RunnerObstacleModel,
): boolean {
  if (width <= 0 || height <= 0) return false
  const whale = whaleRect(width, height, whaleY)
  const origin = obstacleOrigin(width, height, obstacle)
  return RUNNER_OBSTACLES[obstacle.kind].hitShapes.some(shape => shape.type === 'rect'
    ? rectCollides(whale, origin, shape)
    : circleCollides(whale, origin, shape))
}
