/** A monotonic timer that only advances while a round is actively playing. */
export interface ActiveTimer {
    start: (now?: number) => void;
    resume: (now?: number) => void;
    pause: (now?: number) => number;
    read: (now?: number) => number;
}
/** Keep pause, closed-overlay, and hidden-tab time out of leaderboard durations. */
export declare function createActiveTimer(): ActiveTimer;
