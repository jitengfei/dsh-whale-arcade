export interface SplashState {
    id: number;
    x: number;
    y: number;
}
export interface SplashProps {
    splash: SplashState | null;
}
export declare function Splash({ splash }: SplashProps): import("react").JSX.Element | null;
