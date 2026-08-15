export type OceanKind = 'pearl' | 'star' | 'fish' | 'crab' | 'jelly' | 'urchin' | 'coral' | 'shell';
export interface OceanIconProps {
    kind: OceanKind;
}
export declare function OceanIcon({ kind }: OceanIconProps): import("react").JSX.Element;
