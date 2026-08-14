export interface CatchCollisionItem {
    x: number;
    y: number;
    size: number;
}
export interface CatchHitItem extends CatchCollisionItem {
    id: number;
    value: number;
    hazard: boolean;
}
/** Pixel-derived, inset sprite collision that remains stable on narrow screens. */
export declare function catchCollides(width: number, height: number, whaleX: number, item: CatchCollisionItem): boolean;
interface CatchHitOutcome {
    caughtIds: number[];
    gained: number;
    hazardX: number | null;
    splashX: number | null;
}
export declare function catchHitOutcome(width: number, height: number, whaleX: number, items: readonly CatchHitItem[]): CatchHitOutcome;
export {};
//# sourceMappingURL=catch-physics.d.ts.map