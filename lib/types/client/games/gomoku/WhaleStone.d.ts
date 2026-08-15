export type WhaleStoneSide = 'player' | 'ai';
export interface WhaleStoneProps {
    readonly side: WhaleStoneSide;
}
/**
 * A compact whale drawn specifically for a gomoku intersection.
 *
 * The shared WhaleMark has details intended for the larger launcher. At stone
 * size those details collapse into a fish-like oval, so this mark deliberately
 * exaggerates the raised fluke, eye, belly, and spout.
 */
export declare function WhaleStone({ side }: WhaleStoneProps): import("react").JSX.Element;
