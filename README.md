# dsh-whale-arcade

English | [中文](README.zh.md)

**Fill the short waits for model responses, tool execution, and background tasks with three lightweight games. Open them instantly, close them to return to work, and keep the Agent running without adding anything to the conversation.**

<p align="center">
  <img src="assets/whale-arcade-banner.png" alt="Whale Arcade ocean banner" width="100%">
</p>

Browser-local whale arcade registered in the frame-wide `shell.overlay` list. A persistent whale button opens a compact game catalog without replacing the conversation or blocking the page underneath while closed.

The arcade contains Whale Wave, Blue Whale Treasure, and Whale Coast Run. The whale itself is the transparent, gently floating launcher; its fixed silhouette has an upturned left tail, rounded blue body, white curved belly, single eye, and small spout. All three games share one underwater visual world. Whale Wave generates bounded, reachable cave-center shifts; its opening, speed, and spacing develop gradually, and a large height change receives more approach distance. Treasure gives starfish, fish, crabs, and rare pearl shells distinct scores and speeds; jellyfish and urchins are hazards. Its hazard rate grows gently, while a seven-lane arrival scheduler separates fast and slow objects without rerolling their rarity. Coast Run uses four solid Canvas silhouettes with distinct clearance or width—conches, urchins, coral towers, and wreckage—plus staged unlocks, low-obstacle pairs, and visibly different short, medium, and long gap rhythms. Drawing and forgiving collision both use the same pixel-space geometry, excluding decorative whale tails, spouts, and obstacle extrema. All games use frame-synchronized motion. Whale Wave and Coast Run support click, touch, Space, Up, and W; Treasure supports Left/Right and A/D plus holdable touch controls. Each game shares start, pause, resume, restart, score, and local leaderboard behavior. Scores remain in this browser's `localStorage`; each table keeps ten entries ordered by score descending, duration ascending, then achievement time ascending. Hiding the browser tab pauses an active round.

The package is a pure Web Client plugin. It registers no Host service, performs no RPC, reads no workspace files, and writes no Session event.

All whales, marine life, obstacles, and scenes are implemented in this project with SVG, CSS, or Canvas paths. The package contains no image, audio, font, or code files extracted from DeepSeek, Flappy Bird, Chrome, or other games.

## Install

After publication, users with DeepSeek Harness installed only need to run:

```sh
dsh plugin --profile web add dsh-whale-arcade
dsh web
```

Upgrade or uninstall:

```sh
dsh plugin --profile web update dsh-whale-arcade
dsh plugin --profile web remove dsh-whale-arcade
```

The bundled `cordis.patch.yml` mounts the plugin automatically; no manual Harness configuration is required. Open the Web address printed by the launcher. The whale in the bottom-right corner confirms a successful installation.

## Install from Source

The current version is built with the DeepSeek Harness source branch that contains this directory. It requires Node.js 22.19 or newer. From the repository root, run:

```sh
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install
pnpm run build
pnpm dsh web
```

When the terminal prints the address, open `http://127.0.0.1:3080` in a browser. After updating the source, rerun `pnpm install`, `pnpm run build`, and `pnpm dsh web`.

## Model Experience

None, as the arcade is browser-local presentation and never enters a prompt, message, tool schema, or session log.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **Leaderboards are browser-local** — there is no player identity, cross-device synchronization, shared ranking, or anti-cheat authority.
- **Rounds do not resume after reload** — only completed scores persist; refreshing the page starts from the catalog.
