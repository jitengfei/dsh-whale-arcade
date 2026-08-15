import type { ArcadeGameDefinition } from '../game-registry.ts';
import type { HudMetric } from '../runtime/game-contract.ts';
import { type GameRecord } from '../runtime/records.ts';
export interface RankedRecords {
    readonly metric: HudMetric;
    readonly rows: readonly GameRecord[];
}
/** Convert a game's first ranking rule into the shell's neutral metric display. */
export declare function readRankedRecords(definition: ArcadeGameDefinition, variantId?: string): RankedRecords | null;
export declare function rankedRecordValue(record: GameRecord, definition: ArcadeGameDefinition): HudMetric | null;
export declare function formatDuration(durationMs: number): string;
export declare function formatMetric(metric: HudMetric, padScore?: boolean): string;
