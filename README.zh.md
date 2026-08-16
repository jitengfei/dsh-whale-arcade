# dsh-whale-arcade

[English](README.md) | 中文

**在等待模型响应、工具执行或后台任务完成时，用四款轻量小游戏填补短暂的等待时间；随开随玩，关闭后立即回到工作，不进入会话，也不影响 Agent 继续执行。**

<p align="center">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/whale-arcade-banner.png" alt="鲸鱼游戏中心海洋横幅" width="100%">
</p>

`dsh-whale-arcade` 是挂载在 DeepSeek Harness 全局 `shell.overlay` 的浏览器小游戏插件。右下角的小鲸鱼是常驻入口；浮层只占据工作台一角，关闭后游戏会暂停并保留现场，不会中断正在运行的 Agent。

## 当前游戏

| 游戏 | 玩法 | 操作 |
| --- | --- | --- |
| 鲸鱼跃浪 | 在水下洞口间穿行；洞口大小、高度变化、速度和反应距离会逐步变化 | 点击、触摸、空格、↑、W |
| 蓝鲸寻宝 | 横向移动接取海星、小鱼、螃蟹和稀有珍珠贝，避开水母与海胆；不同生物有不同分值和速度 | ←、→、A、D、可长按触屏按钮 |
| 鲸跃海岸线 | 越过海螺、海胆、珊瑚塔和沉船残骸；包含阶段解锁、低障碍组合以及短、中、长三档随机间距 | 点击、触摸、空格、↑、W |
| 鲸海五子棋 | 在 15×15 潮汐棋盘上使用蓝鲸棋子，与本地白鲸对手进行自由五子棋对局；玩家先手，横、竖或斜线连续至少五子获胜，不设禁手；支持轻松、标准、挑战三档难度 | 点击或触摸落子，键盘方向键移动焦点 |

四个游戏均支持开始、暂停、继续和结束后重开。前三款积分游戏会在目录中显示保存在当前浏览器站点（origin）的前十名成绩；同分时按实际游玩用时和达成时间排序。五子棋不写入排行榜；棋盘与所选难度只存在于当前已挂载的游戏中，关闭浮层会暂停并保留现场，返回游戏目录或刷新页面则会重置。手动暂停、关闭浮层或隐藏浏览器标签页时不会累计游玩时间。

## 界面预览

<p align="center">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/screenshots/01-catalog.png" alt="鲸鱼游戏中心目录与本地排行榜" width="760">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/screenshots/02-whale-jump.png" alt="鲸鱼跃浪游戏画面" width="49%">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/screenshots/03-blue-whale-treasure.png" alt="蓝鲸寻宝游戏画面" width="49%">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/screenshots/04-coast-runner.png" alt="鲸跃海岸线游戏画面" width="49%">
  <img src="https://raw.githubusercontent.com/jitengfei/dsh-whale-arcade/main/assets/screenshots/05-ocean-gomoku.png" alt="鲸海五子棋游戏画面" width="49%">
</p>

## 安装

安装前请确认 DeepSeek Harness 能通过 `dsh web` 启动，并且 `pnpm` 位于 `PATH` 中。Harness 的插件命令会调用 `pnpm`。推荐直接安装 npm 中的预构建包：

```sh
dsh plugin --profile web add dsh-whale-arcade
dsh web
```

如果 `dsh web` 已经在运行，请先停止旧进程，再重新启动并刷新浏览器。打开终端打印的 Web 地址；右下角出现鲸鱼入口即表示安装成功。插件自带 `cordis.patch.yml`，无需手工修改 Harness 配置。

还没有 `dsh` 时，请先按 [DeepSeek Harness 官方说明](https://github.com/deepseek-ai/deepseek-harness#run) 运行 Harness；使用 `npx` 的用户也可以执行：

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add dsh-whale-arcade
npx @deepseek-ai/dsh@0.1.0-rc.6 web
```

当前代码已在 DeepSeek Harness `0.1.0-rc.6` 上完成安装与运行验证。Harness 仍处于开发者预览阶段，后续版本可能包含不兼容变更。

如果需要测试尚未发布到 npm 的最新提交，请把包参数换成 `github:jitengfei/dsh-whale-arcade`。

### 更新或卸载

```sh
dsh plugin --profile web update dsh-whale-arcade
dsh plugin --profile web remove dsh-whale-arcade
```

更新或卸载后同样需要重新启动正在运行的 `dsh web`。
只通过 `npx` 使用 Harness 时，请把上述每条命令开头的 `dsh` 替换为 `npx @deepseek-ai/dsh@0.1.0-rc.6`；源码开发段同理。

## 从源码开发

需要 Node.js `22.19+`（仅限 22.x）或 `24+`，以及 pnpm `11.7.0`：

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

`pnpm run check` 会依次执行类型检查、测试、构建和发布产物校验。启动时请打开终端实际打印的地址。

### 扩展游戏

这套扩展机制用于在本仓库源码中增加随插件一起编译的内置游戏。`src/client/game-registry.ts` 是编译期内部注册表，不是面向外部包的动态子游戏 API；第三方包不能在运行时向已构建的插件注入游戏。普通新增只需实现游戏定义并加入注册表，不应为某个游戏在 Shell 中增加专用渲染分支。

#### 最小目录

```text
src/client/games/tide-puzzle/
├── TidePuzzleGame.tsx
├── definition.tsx
├── model.ts
└── TidePuzzleGame.module.css
```

`TidePuzzleGame.tsx` 和 `definition.tsx` 是最小必需文件。规则、物理、关卡生成或 AI 应尽量拆成可独立测试的纯 TypeScript 模块；游戏自己的布局样式也应尽量留在该目录。只有两个以上游戏真正共享的视觉或运行能力才应上移到 `src/client/shared/` 或 `src/client/runtime/`。

#### 定义并注册游戏

`definition.tsx` 把游戏接入目录、通用浮层、生命周期和记录系统。一个不保存成绩的最小定义如下：

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

| 字段 | 作用 |
| --- | --- |
| `id` | 全局唯一且稳定的编译期 ID，也是本地记录的分区键；发布后不要改名 |
| `nameKey`、`descriptionKey` | `src/client/locales.ts` 中同时存在的中英文文案键 |
| `Icon`、`View` | 目录图标与游戏画面组件 |
| `initialHud` | 每局开始时的通用状态栏；最多两个数值槽和一个状态文案 |
| `Setup`、`defaultVariantId` | 可选的开局设置与默认规则标识 |
| `recordPolicy`、`recordLabelKey` | 必需的记录策略，以及排行榜主指标的可选文案键 |

随后在 `src/client/game-registry.ts` 导入定义，并只在有序 `GAMES` 数组中追加一次：

```tsx
import { tidePuzzleGame } from './games/tide-puzzle/definition.tsx'

export const GAMES = [jumpGame, catchGame, runnerGame, gomokuGame, tidePuzzleGame] as const satisfies readonly ArcadeGameDefinition[]
```

目录、游戏浮层和排行榜导航都从 `GAMES` 派生。还需要在 `src/client/locales.ts` 同时补充中文和英文文案；不要在 `WhaleArcade.tsx`、`GameCatalog.tsx`、`GameFrame.tsx` 或 `GameRecords.tsx` 中按游戏 ID 写 `switch` 或条件分支。

#### 生命周期契约

游戏的 `View` 接收 `GameViewProps`，并在四个阶段中保持挂载：

| `phase` | 游戏应做什么 |
| --- | --- |
| `ready` | 显示初始画面并等待 Shell 的开始操作；若有 `Setup`，它会覆盖在画面上 |
| `running` | 处理输入、动画帧、计时器和本地 AI，并通过 `updateHud()` 更新通用状态栏 |
| `paused` | 完全冻结推进和输入，保留现场；关闭浮层或隐藏浏览器标签页也会进入此阶段 |
| `finished` | 停止推进并保留终局，等待 Shell 重开 |

必须遵守以下规则：

- `runId` 是一局游戏的世代标识。选择游戏、开始、重开或放弃都会使它变化；组件应在 `runId` 变化时重置自己的 state、ref、棋盘、物理世界和终局锁。
- 只有 `phase === 'running'` 时才能推进游戏。连续动画优先使用 `useGameLoop(phase === 'running', tick)`；timeout、本地 AI、全局事件监听和按键集合也必须在暂停、换局或卸载时清理。
- `updateHud()` 和 `finish()` 已绑定当前 `runId`，在暂停、结束或陈旧一局中调用会被拒绝。`finish()` 返回 `boolean`；只有返回 `true` 时，游戏才应设置自己的 `ended` 标记或播放一次性终局效果。
- `finish()` 的 `outcome` 可以是 `completed`、`failed`、`won`、`lost` 或 `draw`；`metrics` 只能包含有限数值，例如 `score`、`moves`、`level` 或 `progress`。
- View 通过 `translate(key, params)` 使用插件命名空间中的双语文案；游戏内可见文字和 ARIA 标签都不要硬编码单一语言。
- 有效用时由 Shell 的 session 和 active timer 管理。游戏不要另建一套开始、暂停、继续或成绩提交状态机，也不要自行调用 `recordGameResult()`。

#### Setup 与 `variantId`

需要难度、先后手或规则选择时，可以在 definition 中提供 `Setup`。它只在 `ready` 阶段显示，并通过 `selectVariant()` 选择一个稳定字符串；开始后调用会返回 `false`。多个设置可以编码成规范且向后兼容的字符串，例如 `hard-player-first`，游戏自身仍需为未知值提供安全回退。

`variantId` 只锁定当前 session 中这一局采用的规则，并附加到完成结果以隔离不同规则的记录；它不是磁盘设置。返回目录后再次进入会使用 `defaultVariantId`，刷新页面也不会恢复选择或在途棋局。需要在运行中显示的复杂控制应放在游戏画面内，不应扩充通用顶部栏；顶部栏刻意只提供 `primary`、`secondary` 两个数值槽和一个 `statusKey`。

#### 记录策略

游戏只负责调用 `finish()`，Shell 会根据 definition 的策略统一写入当前 origin 的 `localStorage`：

| 策略 | 持久化 | 现成 Shell 展示 |
| --- | --- | --- |
| `NO_RECORD_POLICY` / `kind: 'none'` | 不写入 | 无最佳值或记录列表 |
| `HIGH_SCORE_POLICY` / `kind: 'leaderboard'` | 按 `rankBy`、`limit` 和可选 `outcomes` 保存 | 目录最佳值、顶部最佳值和排行榜 |
| `kind: 'history'` | 按时间倒序保存有限条历史 | 暂无通用历史界面 |

自定义排行榜的第一条 `rankBy` 规则决定 Shell 展示的主指标；如果结果缺少该指标，它不会进入该榜单。相同 `variantId` 的记录单独排序。`history` 虽然已有存储能力，但若要显示历史，必须先设计适用于多个游戏的通用 Shell 能力，不能给单个游戏硬编码一块专用界面。游戏不得直接读写 `localStorage`，也不得发送远程成绩。

#### 可复用能力与视觉约束

- `src/client/runtime/game-contract.ts` 提供 definition、phase、outcome、HUD、Setup 和 View 契约。
- `game-session.ts`、`active-timer.ts` 与 `use-game-session.ts` 由 Shell 持有，负责一局的状态转换、陈旧调用防护和有效用时；游戏只消费传入的 runtime props。
- `src/client/shared/use-game-loop.ts` 提供暂停感知的 `requestAnimationFrame` 循环，并限制过大的帧间隔。
- `WhaleMark`、`OceanIcon` 和 `Splash` 提供现有鲸鱼、海洋图形与水花。可以复用既有外观；如多个游戏需要新外观，应扩展明确的 shared props 或 CSS 变量，而不是跨 CSS Module 定位内部哈希类名。
- 新画面继续使用 Harness 设计变量，并检查浅色、深色、窄屏、键盘、触摸、焦点可见性和 `prefers-reduced-motion`。运行时素材保持为代码内 SVG、CSS 或 Canvas。

#### Shell、Host 与 Session 边界

普通新游戏应只修改自己的目录、注册表、双语文案、测试和文档。游戏专属状态、输入、物理、棋盘、关卡与本地 AI 都留在 `src/client/games/<id>/`，不得塞进应用 Shell。

本插件的 Node 入口保持空实现；游戏不得新增 Host Service、Cordis 注入、RPC、工作区文件读写、Session 事件、模型请求、提示词、遥测、账号或远程排行榜。联网对战、模型 AI、跨设备同步或刷新后恢复在途棋局都超出当前边界，需要先做独立的架构与隐私设计，而不是绕过 runtime 契约。只有当能力对多个游戏都成立时，才考虑扩展通用 runtime、shared 或 Shell，并同时增加契约测试。

#### 测试、构建与发布检查

新增游戏至少应完成：

1. 为规则、物理、生成器或 AI 增加确定性的纯逻辑测试。
2. 更新注册表契约测试，并增加覆盖开始、暂停、继续、结束、重开和异步清理的 UI 测试。
3. 同步更新 `locales.ts` 的中英文文案、本 README 的中英文游戏表，以及受游戏数量影响的 `package.json` 描述或关键词。
4. 手动检查浅色/深色主题、窄屏、键盘/触摸，以及关闭浮层和隐藏标签页后的暂停行为。

提交前运行：

```sh
pnpm run typecheck
pnpm run test
pnpm run check
pnpm pack
```

`pnpm run check` 会重新生成发布产物并校验浏览器 bundle；`pnpm pack` 还会通过 `prepack` 再执行同一检查。`lib/index.js`、`lib/invariant.js`、`lib/client.js` 和 `lib/types/**/*.d.ts` 是 GitHub 直接安装所依赖的预构建产物，必须随源码改动一起提交，但不要手工编辑。source map、绝对本机路径和未构建源码不应进入发布包。最后通过 `dsh plugin --profile web add .` 安装本地目录，重启 `dsh web` 做一次真实运行检查。

## 数据与实现边界

- 游戏功能全部运行在 Web Client；Node 入口不承载游戏逻辑。
- 不注册 Host 服务，不发起 RPC，不读取工作区文件，也不写入 Session 事件。
- 不发送遥测、模型请求或玩家成绩；只有 `recordPolicy` 允许的完成记录会持久化到当前浏览器站点，在途棋局和 Setup 选择不会写入磁盘。
- 游戏运行时的鲸鱼、海洋生物、障碍物和场景均由 SVG、CSS 或 Canvas 绘制，不加载第三方图片、音频或字体；README 横幅仅用于项目展示，不会进入运行时包。

## 已知限制

- 排行榜仅限当前浏览器站点，没有账号、跨设备同步、共享排名或服务端防作弊。
- 关闭并重新打开浮层会保留已暂停的当前局；返回游戏目录或刷新页面不会恢复在途棋局与 Setup 选择，已完成的本地记录仍会保留。

## 许可证

[MIT](LICENSE)。本项目由社区独立维护。

## 模型体验

无，因为游戏完全在浏览器中运行，不会进入提示词、消息、工具 schema、会话日志或模型上下文。

#### KV Cache 影响

无；插件不会组装或发送模型提供方请求。
