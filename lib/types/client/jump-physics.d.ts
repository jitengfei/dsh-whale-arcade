import type { CaveDesign } from './jump-design.ts';
export interface CavePosition extends CaveDesign {
    x: number;
}
export declare function jumpCollides(width: number, height: number, whaleY: number, cave: CavePosition): boolean;
export declare function cavePassedWhale(width: number, cave: CavePosition): boolean;
