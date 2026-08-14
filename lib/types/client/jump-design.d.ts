export interface CaveDesign {
    gap: number;
    opening: number;
    gapBefore: number;
}
export declare function jumpSpeed(score: number): number;
/** Generate reachable variety: bounded center shifts, shrinking openings, and varied reaction time. */
export declare function createCave(previousCenter: number, score: number, speed: number, random?: () => number): CaveDesign;
export declare function positionNextCave(previousX: number, cave: CaveDesign): number;
//# sourceMappingURL=jump-design.d.ts.map