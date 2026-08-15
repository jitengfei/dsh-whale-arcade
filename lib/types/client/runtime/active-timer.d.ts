export type Now = () => number;
export interface ActiveTimer {
    start: () => void;
    resume: () => void;
    pause: () => number;
    reset: () => void;
    read: () => number;
}
/** A monotonic timer that excludes every paused interval. */
export declare function createActiveTimer(now?: Now): ActiveTimer;
