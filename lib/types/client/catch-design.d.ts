export type CatchKind = 'pearl' | 'star' | 'fish' | 'crab' | 'jelly' | 'urchin';
export interface CatchDesign {
    kind: CatchKind;
    speed: number;
    value: number;
    size: number;
    hazard: boolean;
    x: number;
}
export interface CatchArrival {
    arrivalAt: number;
    hazard: boolean;
    x: number;
}
export declare function catchSpawnDelay(elapsedSeconds: number, random?: () => number): number;
/** Delay, rather than reroll, a pending item until nearby lanes have a readable arrival window. */
export declare function scheduleCatchSpawn(active: readonly CatchArrival[], pending: CatchDesign, earliestSpawnAt: number): {
    spawnAt: number;
    arrivalAt: number;
};
export declare function createCatchDesign(elapsedSeconds: number, random?: () => number): CatchDesign;
//# sourceMappingURL=catch-design.d.ts.map