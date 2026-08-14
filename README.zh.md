# dsh-whale-arcade

[English](README.md) | 中文

**在等待模型响应、工具执行或后台任务完成时，用三款轻量小游戏填补短暂的等待时间；随开随玩，关闭后立即回到工作，不进入会话，也不影响 Agent 继续执行。**

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

三个游戏均支持开始、暂停、继续和失败后重开。游戏目录会显示每款游戏保存在当前浏览器站点（origin）中的前十名成绩；同分时按实际游玩用时和达成时间排序。手动暂停、关闭浮层或隐藏浏览器标签页时不会累计游玩时间。

## 安装

安装前请确认 DeepSeek Harness 能通过 `dsh web` 启动，并且 `pnpm` 位于 `PATH` 中。Harness 的插件命令会调用 `pnpm`。

本插件目前直接从 GitHub 安装，尚未发布 npm 包：

```sh
dsh plugin --profile web add github:jitengfei/dsh-whale-arcade
dsh web
```

如果 `dsh web` 已经在运行，请先停止旧进程，再重新启动并刷新浏览器。打开终端打印的 Web 地址；右下角出现鲸鱼入口即表示安装成功。插件自带 `cordis.patch.yml`，无需手工修改 Harness 配置。

还没有 `dsh` 时，请先按 [DeepSeek Harness 官方说明](https://github.com/deepseek-ai/deepseek-harness#run) 运行 Harness；使用 `npx` 的用户也可以执行：

```sh
npx @deepseek-ai/dsh@0.1.0-rc.6 plugin --profile web add github:jitengfei/dsh-whale-arcade
npx @deepseek-ai/dsh@0.1.0-rc.6 web
```

当前代码已在 DeepSeek Harness `0.1.0-rc.6` 上完成安装与运行验证。Harness 仍处于开发者预览阶段，后续版本可能包含不兼容变更。

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

## 数据与实现边界

- 游戏功能全部运行在 Web Client；Node 入口不承载游戏逻辑。
- 不注册 Host 服务，不发起 RPC，不读取工作区文件，也不写入 Session 事件。
- 不发送遥测、模型请求或玩家成绩；唯一持久化数据是当前浏览器站点中的本地成绩。
- 游戏运行时的鲸鱼、海洋生物、障碍物和场景均由 SVG、CSS 或 Canvas 绘制，不加载第三方图片、音频或字体；README 横幅仅用于项目展示，不会进入运行时包。

## 已知限制

- 排行榜仅限当前浏览器站点，没有账号、跨设备同步、共享排名或服务端防作弊。
- 刷新页面不会恢复正在进行的一局；再次打开鲸鱼入口时会回到游戏目录，已完成的本地成绩仍会保留。

## 许可证

[MIT](LICENSE)。本项目由社区独立维护。

## 模型体验

无，因为游戏完全在浏览器中运行，不会进入提示词、消息、工具 schema、会话日志或模型上下文。

#### KV Cache 影响

无；插件不会组装或发送模型提供方请求。
