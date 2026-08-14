# dsh-whale-arcade

English | [中文](README.zh.md)

**Fill short waits for model responses, tool execution, and background tasks with three lightweight games. Open one instantly, close it to return to work, and keep the Agent running without adding anything to the conversation.**

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

All three games support start, pause, resume, and restart after game over. The catalog displays the local Top 10 for each game, stored for the current browser origin. Ties are ordered by active play time and achievement time. Manual pauses, closing the panel, and hiding the browser tab do not count toward play time.

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

## Data and Runtime Boundaries

- All game behavior runs in the Web Client; the Node entry contains no game logic.
- The plugin registers no Host service, performs no RPC, reads no workspace files, and writes no Session events.
- It sends no telemetry, model requests, or player scores. Its only persistent data is the local scoreboard for the current browser origin.
- Runtime whales, marine life, obstacles, and scenes are drawn with SVG, CSS, or Canvas. The game loads no third-party images, audio, or fonts; the README banner is presentation-only and is not included in the runtime package.

## Known Limitations

- Leaderboards are limited to the current browser origin. There are no accounts, cross-device synchronization, shared rankings, or server-side anti-cheat.
- Reloading does not restore an active round. Opening the whale again returns to the catalog, while completed local scores remain available.

## License

[MIT](LICENSE). Independently maintained by the community.

## Model Experience

None, as the arcade runs entirely in the browser and never enters prompts, messages, tool schemas, session logs, or model context.

#### KV Cache effect

None; the plugin never assembles or sends model-provider requests.
