# dsh-whale-arcade

English | [中文](README.zh.md)

**Fill short waits for model responses, tool execution, and background tasks with four lightweight games. Open one instantly, close it to return to work, and keep the Agent running without adding anything to the conversation.**

<p align="center">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/whale-arcade-banner.png" alt="Whale Arcade ocean banner" width="100%">
</p>

`dsh-whale-arcade` is a browser-game plugin mounted in DeepSeek Harness's global `shell.overlay`. The small whale in the bottom-right corner is its persistent launcher. The panel occupies only one corner of the workspace; closing it pauses and preserves the current round without interrupting the Agent.

## Included Games

| Game | Play | Controls |
| --- | --- | --- |
| Whale Wave | Swim through underwater openings whose size, height shift, speed, and approach distance develop gradually | Click, touch, Space, Up, W |
| Blue Whale Treasure | Move horizontally to collect starfish, fish, crabs, and rare pearl shells while avoiding jellyfish and urchins; creatures have different scores and speeds | Left, Right, A, D, holdable touch controls |
| Whale Coast Run | Clear conches, urchins, coral towers, and wreckage with staged unlocks, low-obstacle pairs, and randomized short, medium, and long gaps | Click, touch, Space, Up, W |
| Ocean Gomoku | Play freestyle Gomoku with blue-whale stones against a local beluga rival on a 15×15 tide board; the player moves first, an unbroken horizontal, vertical, or diagonal line of at least five wins, and there are no forbidden-move rules; includes Easy, Normal, and Challenge difficulty | Click or touch to place; arrow keys move focus |

All four games support start, pause, resume, and restart after a round. The three score games expose Top 10 tables stored for the current browser origin; ties are ordered by active play time and achievement time. Gomoku does not write a leaderboard. Its board and selected difficulty exist only while that game remains mounted: closing the panel pauses and preserves them, while returning to the catalog or reloading resets them. Manual pauses, closing the panel, and hiding the browser tab do not count toward play time.

## Install

Before installing, confirm that DeepSeek Harness starts with `dsh web` and that `pnpm` is available on `PATH`. Harness invokes `pnpm` for plugin management.

The plugin currently installs directly from GitHub and is not published to npm:

```sh
dsh plugin --profile web add github:jitengfei/dsh-whale-arcade
dsh web
```

If `dsh web` is already running, stop the old process, restart it, and refresh the browser. Open the Web address printed in the terminal. The whale in the bottom-right corner confirms a successful installation. The included `cordis.patch.yml` mounts the plugin automatically; no manual Harness configuration is required.

If `dsh` is not installed, first follow the [official DeepSeek Harness run instructions](https://github.com/deepseek-ai/deepseek-harness#run). Users who run Harness through `npx` can instead use:

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add github:jitengfei/dsh-whale-arcade
npx @deepseek-ai/dsh@0.1.0-rc.6 web
```

The current code has been installed and run against DeepSeek Harness `0.1.0-rc.6`. Harness remains a developer preview, and later versions may introduce incompatible changes.

### Update or Remove

```sh
dsh plugin --profile web update dsh-whale-arcade
dsh plugin --profile web remove dsh-whale-arcade
```

Restart a running `dsh web` process after updating or removing the plugin.
If you only use Harness through `npx`, replace the leading `dsh` in each command above with `npx @deepseek-ai/dsh@0.1.0-rc.6`; the same applies to the source-development commands below.

## Develop from Source

Development requires Node.js `22.19+` within the 22.x line or `24+`, plus pnpm `11.7.0`:

```sh
git clone https://github.com/jitengfei/dsh-whale-arcade.git
cd dsh-whale-arcade
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
pnpm run check
dsh plugin --profile web add .
dsh web
```

`pnpm run check` runs type checking, tests, a clean build, and release-artifact validation. Open the address actually printed by the launcher.

### Adding a Game

This extension mechanism adds built-in games to this repository and compiles them into the plugin. `src/client/game-registry.ts` is a compile-time internal registry, not a dynamic subgame API for external packages; a third-party package cannot inject a game into an already-built plugin at runtime. An ordinary addition implements one game definition and registers it without introducing a game-specific rendering branch in the shell.

#### Minimal Layout

```text
src/client/games/tide-puzzle/
├── TidePuzzleGame.tsx
├── definition.tsx
├── model.ts
└── TidePuzzleGame.module.css
```

`TidePuzzleGame.tsx` and `definition.tsx` are the minimum required files. Keep rules, physics, level generation, or AI in pure TypeScript modules that can be tested independently, and keep game-specific layout styles in this directory when possible. Move a visual or runtime facility into `src/client/shared/` or `src/client/runtime/` only when at least two games genuinely share it.

#### Define and Register the Game

`definition.tsx` connects the game to the catalog, generic panel, lifecycle, and record system. A minimal definition with no persisted records looks like this:

```tsx
import type { GameDefinition, GameIconProps } from '../../runtime/game-contract.ts'
import { NO_RECORD_POLICY, type RecordPolicy } from '../../runtime/records.ts'
import { TidePuzzleGame } from './TidePuzzleGame.tsx'

function TidePuzzleIcon({ className }: GameIconProps) {
  return <span className={className} aria-hidden="true">◌</span>
}

export const tidePuzzleGame = {
  id: 'tide-puzzle',
  nameKey: 'tidePuzzle.name',
  descriptionKey: 'tidePuzzle.desc',
  Icon: TidePuzzleIcon,
  View: TidePuzzleGame,
  initialHud: { primary: { id: 'moves', labelKey: 'moves', value: 0 } },
  recordPolicy: NO_RECORD_POLICY,
} as const satisfies GameDefinition<'tide-puzzle', RecordPolicy>
```

| Field | Purpose |
| --- | --- |
| `id` | A globally unique, stable compile-time ID and the local-record partition key; do not rename it after release |
| `nameKey`, `descriptionKey` | Keys that exist in both dictionaries in `src/client/locales.ts` |
| `Icon`, `View` | The catalog icon and game-view component |
| `initialHud` | The generic top bar at the start of each run, with at most two numeric slots and one status message |
| `Setup`, `defaultVariantId` | Optional pre-run controls and the default rule identity |
| `recordPolicy`, `recordLabelKey` | The required record policy and an optional label key for the leaderboard's primary metric |

Then import the definition in `src/client/game-registry.ts` and append it exactly once to the ordered `GAMES` array:

```tsx
import { tidePuzzleGame } from './games/tide-puzzle/definition.tsx'

export const GAMES = [jumpGame, catchGame, runnerGame, gomokuGame, tidePuzzleGame] as const satisfies readonly ArcadeGameDefinition[]
```

The catalog, game panel, and leaderboard navigation all derive from `GAMES`. Add both Chinese and English copy to `src/client/locales.ts`; do not add game-ID switches or conditionals to `WhaleArcade.tsx`, `GameCatalog.tsx`, `GameFrame.tsx`, or `GameRecords.tsx`.

#### Lifecycle Contract

A game `View` receives `GameViewProps` and remains mounted throughout all four phases:

| `phase` | Required game behavior |
| --- | --- |
| `ready` | Render the initial scene and wait for the shell to start; an optional `Setup` is overlaid on the scene |
| `running` | Process input, animation frames, timers, and local AI, and update the generic top bar through `updateHud()` |
| `paused` | Freeze all progression and input while preserving the scene; closing the panel or hiding the browser tab also enters this phase |
| `finished` | Stop progression and retain the final scene while waiting for the shell to restart |

The following rules are mandatory:

- `runId` is the generation identifier for one run. Selecting a game, starting, restarting, or abandoning changes it; reset the component's state, refs, board, physics world, and completion lock whenever `runId` changes.
- Progress only while `phase === 'running'`. Prefer `useGameLoop(phase === 'running', tick)` for continuous animation. Timeouts, local AI, global event listeners, and pressed-key sets must also be cleaned up when paused, replaced by another run, or unmounted.
- `updateHud()` and `finish()` are bound to the current `runId` and reject calls from a paused, finished, or stale run. `finish()` returns a `boolean`; set a local `ended` flag or play a one-shot completion effect only when it returns `true`.
- `finish()` accepts `completed`, `failed`, `won`, `lost`, or `draw` as its `outcome`. Its `metrics` may contain only finite numbers such as `score`, `moves`, `level`, or `progress`.
- The View receives `translate(key, params)` for copy in the plugin namespace. Do not hard-code one language in visible game text or ARIA labels.
- The shell session and active timer own active play time. A game must not create a second start, pause, resume, or score-submission state machine, and it must not call `recordGameResult()` itself.

#### Setup and `variantId`

A game that needs difficulty, turn order, or rule selection may provide `Setup` in its definition. Setup appears only during `ready` and selects one stable string through `selectVariant()`; calls after the run starts return `false`. Multiple choices can be encoded in a normalized, backward-compatible value such as `hard-player-first`, and the game must still provide a safe fallback for an unknown value.

`variantId` only locks the rules used by the current run in the current session. It is attached to a completed result so records for different rules remain separate; it is not a setting persisted to disk. Entering the game again after returning to the catalog uses `defaultVariantId`, and a reload restores neither the selection nor an in-progress run. Complex controls needed during play belong inside the game view rather than in the generic top bar, which deliberately exposes only `primary` and `secondary` numeric slots plus one `statusKey`.

#### Record Policies

The game only calls `finish()`. The shell applies the definition's policy and writes to the current origin's `localStorage` when allowed:

| Policy | Persistence | Built-in shell presentation |
| --- | --- | --- |
| `NO_RECORD_POLICY` / `kind: 'none'` | Nothing is written | No best value or record list |
| `HIGH_SCORE_POLICY` / `kind: 'leaderboard'` | Retains entries according to `rankBy`, `limit`, and optional `outcomes` | Catalog best, top-bar best, and leaderboard |
| `kind: 'history'` | Retains a bounded, newest-first history | No generic history UI yet |

The first `rankBy` rule in a custom leaderboard determines the primary metric displayed by the shell; a result missing that metric does not enter that table. Records with different `variantId` values are ranked separately. Although `history` storage exists, presenting it requires a generic shell capability designed for multiple games, not a hard-coded panel for one game. A game must not read or write `localStorage` directly, and it must not send scores remotely.

#### Reusable Facilities and Visual Constraints

- `src/client/runtime/game-contract.ts` defines the game definition, phases, outcomes, HUD, Setup, and View contracts.
- `game-session.ts`, `active-timer.ts`, and `use-game-session.ts` are shell-owned and provide run transitions, stale-call protection, and active play time. Games only consume the runtime props they receive.
- `src/client/shared/use-game-loop.ts` provides a pause-aware `requestAnimationFrame` loop and caps oversized frame deltas.
- `WhaleMark`, `OceanIcon`, and `Splash` provide the existing whale, ocean graphics, and splash effect. Reuse their supported appearance; if several games need a new treatment, extend explicit shared props or CSS custom properties instead of reaching across CSS Modules for internal hashed class names.
- New scenes should continue using Harness design tokens and be checked in light and dark themes, narrow layouts, keyboard and touch input, visible focus, and `prefers-reduced-motion`. Runtime art remains code-owned SVG, CSS, or Canvas.

#### Shell, Host, and Session Boundaries

An ordinary game should modify only its own directory, the registry, bilingual copy, tests, and documentation. Game-specific state, input, physics, boards, levels, and local AI stay under `src/client/games/<id>/` and do not belong in the application shell.

The plugin's Node entry remains inert. Games must not add a Host service, Cordis injection, RPC, workspace file access, Session events, model requests, prompts, telemetry, accounts, or remote leaderboards. Network play, model-powered AI, cross-device synchronization, and restoration of in-progress games after reload are outside the current boundary and require a separate architecture and privacy design rather than bypassing the runtime contract. Consider extending generic runtime, shared, or shell code only when a capability applies to multiple games, and add contract tests with that extension.

#### Tests, Build, and Release Checks

A new game must at least:

1. Add deterministic pure-logic tests for its rules, physics, generator, or AI.
2. Update the registry contract test and add a UI test covering start, pause, resume, finish, restart, and asynchronous cleanup.
3. Update both locale dictionaries, both README game tables, and any game-count-sensitive `package.json` description or keywords.
4. Manually check light and dark themes, narrow layouts, keyboard and touch input, and pause behavior after closing the panel or hiding the browser tab.

Run the following before committing:

```sh
pnpm run typecheck
pnpm run test
pnpm run check
pnpm pack
```

`pnpm run check` regenerates the release output and validates the browser bundle; `pnpm pack` runs the same check again through `prepack`. `lib/index.js`, `lib/invariant.js`, `lib/client.js`, and `lib/types/**/*.d.ts` are prebuilt artifacts required for direct GitHub installation. Commit them with the source changes, but never edit them by hand. Source maps, absolute local paths, and unbuilt source must not enter the release package. Finally, install the local directory with `dsh plugin --profile web add .`, restart `dsh web`, and perform one real runtime check.

## Data and Runtime Boundaries

- All game behavior runs in the Web Client; the Node entry contains no game logic.
- The plugin registers no Host service, performs no RPC, reads no workspace files, and writes no Session events.
- It sends no telemetry, model requests, or player scores. Only completed records allowed by `recordPolicy` persist for the current browser origin; in-progress games and Setup selections are not written to disk.
- Runtime whales, marine life, obstacles, and scenes are drawn with SVG, CSS, or Canvas. The game loads no third-party images, audio, or fonts; the README banner is presentation-only and is not included in the runtime package.

## Known Limitations

- Leaderboards are limited to the current browser origin. There are no accounts, cross-device synchronization, shared rankings, or server-side anti-cheat.
- Closing and reopening the panel preserves the paused current run. Returning to the catalog or reloading restores neither an in-progress run nor its Setup selection; completed local records remain available.

## License

[MIT](LICENSE). Independently maintained by the community.

## Model Experience

None, as the arcade runs entirely in the browser and never enters prompts, messages, tool schemas, session logs, or model context.

#### KV Cache effect

None; the plugin never assembles or sends model-provider requests.
