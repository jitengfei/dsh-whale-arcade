window.__ModuleLoader__.load({
	id: "dsh-whale-arcade",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/active-timer.ts
		const currentTime = () => performance.now();
		/** Keep pause, closed-overlay, and hidden-tab time out of leaderboard durations. */
		function createActiveTimer() {
			let accumulated = 0;
			let activeSince = null;
			const read = (now = currentTime()) => accumulated + (activeSince === null ? 0 : Math.max(0, now - activeSince));
			return {
				start(now = currentTime()) {
					accumulated = 0;
					activeSince = now;
				},
				resume(now = currentTime()) {
					if (activeSince === null) activeSince = now;
				},
				pause(now = currentTime()) {
					accumulated = read(now);
					activeSince = null;
					return accumulated;
				},
				read
			};
		}
		//#endregion
		//#region src/client/catch-design.ts
		const REWARDS = [
			{
				kind: "star",
				speed: 28,
				value: 10,
				size: 38,
				hazard: false,
				weight: .4
			},
			{
				kind: "fish",
				speed: 36,
				value: 15,
				size: 34,
				hazard: false,
				weight: .31
			},
			{
				kind: "crab",
				speed: 42,
				value: 20,
				size: 34,
				hazard: false,
				weight: .18
			},
			{
				kind: "pearl",
				speed: 48,
				value: 25,
				size: 30,
				hazard: false,
				weight: .11
			}
		];
		function catchSpawnDelay(elapsedSeconds, random = Math.random) {
			return Math.max(.64, .92 - Math.max(0, elapsedSeconds) * .0047) + (random() - .5) * .24;
		}
		/** Delay, rather than reroll, a pending item until nearby lanes have a readable arrival window. */
		function scheduleCatchSpawn(active, pending, earliestSpawnAt) {
			const flightTime = 84 / pending.speed;
			let spawnAt = earliestSpawnAt;
			for (let attempt = 0; attempt <= active.length; attempt += 1) {
				const arrivalAt = spawnAt + flightTime;
				const conflicts = active.filter((item) => {
					if (Math.abs(item.x - pending.x) > 14) return false;
					const window = item.hazard || pending.hazard ? .55 : .38;
					return Math.abs(item.arrivalAt - arrivalAt) < window;
				});
				if (!conflicts.length) return {
					spawnAt,
					arrivalAt
				};
				const nextReadableTimes = conflicts.map((item) => item.arrivalAt + (item.hazard || pending.hazard ? .55 : .38) - flightTime);
				spawnAt = Math.max(...nextReadableTimes, spawnAt + .01);
			}
			return {
				spawnAt,
				arrivalAt: spawnAt + flightTime
			};
		}
		function createCatchDesign(elapsedSeconds, random = Math.random) {
			const elapsed = Math.max(0, elapsedSeconds);
			const hazardRate = .2 + Math.min(.08, elapsed / 750);
			const roll = random();
			const detail = random();
			const speedScale = 1 + Math.min(.28, elapsed / 240);
			let selected;
			if (roll < hazardRate) selected = detail < .62 ? {
				kind: "jelly",
				speed: 32 * speedScale,
				value: 0,
				size: 40,
				hazard: true
			} : {
				kind: "urchin",
				speed: 47 * speedScale,
				value: 0,
				size: 30,
				hazard: true
			};
			else {
				let cursor = detail;
				const reward = REWARDS.find((item) => {
					cursor -= item.weight;
					return cursor <= 0;
				}) ?? REWARDS[0];
				selected = {
					...reward,
					speed: reward.speed * speedScale
				};
			}
			const lane = Math.min(6, Math.floor(random() * 7));
			return {
				...selected,
				x: 10 + lane * (80 / 6)
			};
		}
		//#endregion
		//#region src/client/catch-physics.ts
		/** Pixel-derived, inset sprite collision that remains stable on narrow screens. */
		function catchCollides(width, height, whaleX, item) {
			if (width <= 0 || height <= 0) return false;
			const whaleCenterX = width * whaleX / 100;
			const whale = {
				left: whaleCenterX - 16,
				right: whaleCenterX + 18,
				top: height - 62,
				bottom: height - 35
			};
			const itemCenterX = width * item.x / 100;
			const itemCenterY = height * item.y / 100;
			const half = item.size * .34;
			return whale.left < itemCenterX + half && whale.right > itemCenterX - half && whale.top < itemCenterY + half && whale.bottom > itemCenterY - half;
		}
		function catchHitOutcome(width, height, whaleX, items) {
			const caught = items.filter((item) => catchCollides(width, height, whaleX, item));
			return {
				caughtIds: caught.map((item) => item.id),
				gained: caught.reduce((total, item) => total + (item.hazard ? 0 : item.value), 0),
				hazardX: caught.find((item) => item.hazard)?.x ?? null,
				splashX: caught[0]?.x ?? null
			};
		}
		//#endregion
		//#region src/client/jump-design.ts
		function jumpSpeed(score) {
			return 26 + Math.min(10, score * .35);
		}
		/** Generate reachable variety: bounded center shifts, shrinking openings, and varied reaction time. */
		function createCave(previousCenter, score, speed, random = Math.random) {
			const opening = Math.max(28, Math.min(38, 36 - score * .18 + (random() - .5) * 4));
			const lower = opening / 2 + 10;
			const upper = 90 - opening / 2;
			const maxShift = 13 + Math.min(11, score * .45);
			const gap = Math.max(lower, Math.min(upper, previousCenter + (random() * 2 - 1) * maxShift));
			return {
				gap,
				opening,
				gapBefore: Math.min(78, Math.max(42, speed * (1.52 + random() * .5) + Math.abs(gap - previousCenter) * .22))
			};
		}
		function positionNextCave(previousX, cave) {
			return previousX + cave.gapBefore;
		}
		//#endregion
		//#region src/client/jump-physics.ts
		function whaleRect$1(width, height, y) {
			const left = width * .14;
			const centerY = height * y / 100;
			return {
				left: left + 15,
				right: left + 42,
				top: centerY - 9,
				bottom: centerY + 12
			};
		}
		function caveHorizontalRect(width, cave) {
			const center = width * cave.x / 100;
			return {
				left: center - 12,
				right: center + 12
			};
		}
		function jumpCollides(width, height, whaleY, cave) {
			if (width <= 0 || height <= 0) return false;
			const whale = whaleRect$1(width, height, whaleY);
			const horizontal = caveHorizontalRect(width, cave);
			if (whale.right <= horizontal.left || whale.left >= horizontal.right) return false;
			const topEdge = height * (cave.gap - cave.opening / 2) / 100;
			const bottomEdge = height * (cave.gap + cave.opening / 2) / 100;
			return whale.top < topEdge - 2 || whale.bottom > bottomEdge + 2;
		}
		function cavePassedWhale(width, cave) {
			if (width <= 0) return false;
			return caveHorizontalRect(width, cave).right < whaleRect$1(width, 1, 50).left;
		}
		//#endregion
		//#region src/client/locales.ts
		/** `whaleArcade` namespace dictionaries. */
		const NS = "whaleArcade";
		const zh = {
			"launcher": "打开鲸鱼游戏中心",
			"title": "鲸鱼游戏中心",
			"subtitle": "潜入深海，玩一小局",
			"close": "关闭游戏中心",
			"back": "返回游戏列表",
			"play": "开始游戏",
			"pause": "暂停",
			"resume": "继续",
			"restart": "重新开始",
			"score": "得分",
			"best": "最高分",
			"leaderboard": "本地排行榜",
			"duration": "有效用时",
			"empty": "完成一局后，这里会出现成绩",
			"over": "本局结束",
			"jump.name": "鲸鱼跃浪",
			"jump.desc": "点击或按空格、↑、W，穿过珊瑚洞穴",
			"catch.name": "蓝鲸寻宝",
			"catch.desc": "接不同分值的海洋伙伴，避开水母和海胆",
			"runner.name": "鲸跃海岸线",
			"runner.desc": "跃过海螺、海胆、珊瑚塔与沉船残骸"
		};
		const en = {
			"launcher": "Open Whale Arcade",
			"title": "Whale Arcade",
			"subtitle": "Dive deep and play a quick round",
			"close": "Close arcade",
			"back": "Back to games",
			"play": "Play",
			"pause": "Pause",
			"resume": "Resume",
			"restart": "Restart",
			"score": "Score",
			"best": "Best",
			"leaderboard": "Local leaderboard",
			"duration": "Active time",
			"empty": "Finish a round to post a score",
			"over": "Round over",
			"jump.name": "Whale Wave",
			"jump.desc": "Click or press Space, ↑, or W to cross coral caves",
			"catch.name": "Blue Whale Treasure",
			"catch.desc": "Catch varied sea friends; avoid jellyfish and urchins",
			"runner.name": "Whale Coast Run",
			"runner.desc": "Clear conches, urchins, coral towers, and wreckage"
		};
		//#endregion
		//#region src/client/leaderboard.ts
		const KEY = "dsh.whale-arcade.scores.v1";
		function normalizeScores(value) {
			if (!Array.isArray(value)) return [];
			return value.filter((entry) => {
				if (typeof entry !== "object" || entry === null) return false;
				const candidate = entry;
				return Number.isFinite(candidate.score) && Number.isFinite(candidate.durationMs) && Number.isFinite(candidate.achievedAt);
			}).sort((a, b) => b.score - a.score || a.durationMs - b.durationMs || a.achievedAt - b.achievedAt).slice(0, 10);
		}
		/** Read the ten highest scores for one game. */
		function readScores(game) {
			try {
				return normalizeScores(JSON.parse(localStorage.getItem(KEY) ?? "{}")[game]);
			} catch {
				return [];
			}
		}
		/** Insert a completed score and return the newly ordered table. */
		function recordScore(game, entry) {
			const all = {};
			for (const id of [
				"jump",
				"catch",
				"runner"
			]) all[id] = readScores(id);
			const table = normalizeScores([...all[game] ?? [], entry]);
			all[game] = table;
			try {
				localStorage.setItem(KEY, JSON.stringify(all));
			} catch {}
			return table;
		}
		//#endregion
		//#region src/client/runner-design.ts
		const GAP_WEIGHTS = [
			{
				value: "short",
				weight: .3
			},
			{
				value: "medium",
				weight: .45
			},
			{
				value: "long",
				weight: .25
			}
		];
		const KIND_WEIGHTS = {
			intro: [{
				value: "conch",
				weight: .58
			}, {
				value: "urchin",
				weight: .42
			}],
			mixed: [
				{
					value: "conch",
					weight: .3
				},
				{
					value: "urchin",
					weight: .3
				},
				{
					value: "coral",
					weight: .22
				},
				{
					value: "wreck",
					weight: .18
				}
			],
			advanced: [
				{
					value: "conch",
					weight: .23
				},
				{
					value: "urchin",
					weight: .22
				},
				{
					value: "coral",
					weight: .3
				},
				{
					value: "wreck",
					weight: .25
				}
			]
		};
		const EARLY_GAPS = {
			short: {
				min: 1.35,
				max: 1.6
			},
			medium: {
				min: 1.75,
				max: 2.05
			},
			long: {
				min: 2.2,
				max: 2.5
			}
		};
		const LATE_GAPS = {
			short: {
				min: .9,
				max: 1.08
			},
			medium: {
				min: 1.18,
				max: 1.42
			},
			long: {
				min: 1.55,
				max: 1.85
			}
		};
		function unit(value) {
			return Math.min(1 - Number.EPSILON, Math.max(0, value));
		}
		function weightedPick(entries, roll) {
			const fallback = entries.at(-1);
			if (!fallback) throw new RangeError("runner choices must not be empty");
			const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
			let cursor = unit(roll) * total;
			for (const entry of entries) {
				if (cursor < entry.weight) return entry.value;
				cursor -= entry.weight;
			}
			return fallback.value;
		}
		function withoutThirdRepeat(entries, history) {
			const last = history.at(-1);
			if (last === void 0 || history.at(-2) !== last) return entries;
			const filtered = entries.filter((entry) => entry.value !== last);
			return filtered.length > 0 ? filtered : entries;
		}
		function runnerSpeed(elapsedSeconds) {
			return 34 + 16 * (1 - Math.exp(-Math.max(0, elapsedSeconds) / 42));
		}
		function runnerStage(elapsedSeconds) {
			if (elapsedSeconds < 12) return "intro";
			if (elapsedSeconds < 35) return "mixed";
			return "advanced";
		}
		function runnerGapRange(elapsedSeconds, band) {
			const difficulty = Math.min(1, Math.max(0, elapsedSeconds) / 90);
			const early = EARLY_GAPS[band];
			const late = LATE_GAPS[band];
			return {
				min: early.min + (late.min - early.min) * difficulty,
				max: early.max + (late.max - early.max) * difficulty
			};
		}
		/** Generate one obstacle wave with staged variety and a reaction-time-derived spatial gap. */
		function createRunnerWave(elapsedSeconds, speed, history = {}, random = Math.random) {
			const gapRoll = random();
			const kindRoll = random();
			const groupRoll = random();
			const companionRoll = random();
			const distanceRoll = random();
			const stage = runnerStage(elapsedSeconds);
			const gapBand = weightedPick(withoutThirdRepeat(GAP_WEIGHTS, history.recentGapBands ?? []), gapRoll);
			const primaryKind = weightedPick(withoutThirdRepeat(KIND_WEIGHTS[stage], history.recentKinds ?? []), kindRoll);
			const grouped = stage === "advanced" && (primaryKind === "conch" || primaryKind === "urchin") && groupRoll < .4;
			const kinds = [primaryKind];
			if (grouped) {
				const companion = companionRoll < .55 ? primaryKind === "conch" ? "urchin" : "conch" : primaryKind;
				kinds.push(companion);
			}
			const range = runnerGapRange(elapsedSeconds, gapBand);
			const reactionSeconds = range.min + (range.max - range.min) * unit(distanceRoll) + (grouped ? .28 : primaryKind === "coral" ? .14 : primaryKind === "wreck" ? .1 : 0);
			const gapAfter = Math.min(96, Math.max(30, Math.max(0, speed) * reactionSeconds));
			return {
				obstacles: kinds.map((kind, index) => ({
					x: 112 + index * 10,
					kind,
					gapAfter
				})),
				primaryKind,
				gapBand,
				gapAfter,
				reactionSeconds
			};
		}
		//#endregion
		//#region src/client/runner-physics.ts
		/**
		* One geometry source is shared by Canvas drawing and collision detection.
		* Shape coordinates are local to the obstacle's visual top-left corner.
		*/
		const RUNNER_OBSTACLES = {
			conch: {
				visualWidth: 24,
				visualHeight: 18,
				hitShapes: [{
					type: "rect",
					x: 2,
					y: 2,
					width: 20,
					height: 16
				}]
			},
			urchin: {
				visualWidth: 30,
				visualHeight: 28,
				hitShapes: [{
					type: "circle",
					x: 15,
					y: 15,
					radius: 11.5
				}]
			},
			coral: {
				visualWidth: 28,
				visualHeight: 40,
				hitShapes: [
					{
						type: "rect",
						x: 9,
						y: 2,
						width: 10,
						height: 38
					},
					{
						type: "rect",
						x: 4,
						y: 12,
						width: 20,
						height: 10
					},
					{
						type: "rect",
						x: 15,
						y: 7,
						width: 9,
						height: 12
					}
				]
			},
			wreck: {
				visualWidth: 46,
				visualHeight: 25,
				hitShapes: [{
					type: "rect",
					x: 3,
					y: 11,
					width: 40,
					height: 12
				}, {
					type: "rect",
					x: 12,
					y: 5,
					width: 22,
					height: 8
				}]
			}
		};
		function whaleRect(width, height, whaleY) {
			const centerX = width * .18;
			const centerY = height * .84 - 18 - height * whaleY / 100;
			return {
				left: centerX - 14,
				right: centerX + 23,
				top: centerY - 9,
				bottom: centerY + 16
			};
		}
		function obstacleOrigin(width, height, obstacle) {
			const geometry = RUNNER_OBSTACLES[obstacle.kind];
			return {
				left: width * obstacle.x / 100 - geometry.visualWidth / 2,
				top: height * .84 - geometry.visualHeight
			};
		}
		function overlaps(first, second) {
			return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
		}
		function rectCollides(whale, origin, shape) {
			return overlaps(whale, {
				left: origin.left + shape.x,
				right: origin.left + shape.x + shape.width,
				top: origin.top + shape.y,
				bottom: origin.top + shape.y + shape.height
			});
		}
		function circleCollides(whale, origin, shape) {
			const centerX = origin.left + shape.x;
			const centerY = origin.top + shape.y;
			const closestX = Math.max(whale.left, Math.min(centerX, whale.right));
			const closestY = Math.max(whale.top, Math.min(centerY, whale.bottom));
			return (closestX - centerX) ** 2 + (closestY - centerY) ** 2 < shape.radius ** 2;
		}
		/** Friendly collision shapes expressed in the same pixel coordinates as the Canvas scene. */
		function runnerCollides(width, height, whaleY, obstacle) {
			if (width <= 0 || height <= 0) return false;
			const whale = whaleRect(width, height, whaleY);
			const origin = obstacleOrigin(width, height, obstacle);
			return RUNNER_OBSTACLES[obstacle.kind].hitShapes.some((shape) => shape.type === "rect" ? rectCollides(whale, origin, shape) : circleCollides(whale, origin, shape));
		}
		//#endregion
		//#region \0dsh-css:src/client/WhaleArcade.module.css.mjs
		const css = "._46FRGq_root{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);flex-direction:column;align-items:flex-end;gap:12px;display:flex;position:absolute;bottom:22px;right:24px}._46FRGq_launcher{width:58px;height:48px;color:var(--dsw-alias-state-business-primary);filter:drop-shadow(0 5px 5px var(--dsw-alias-interactive-bg-active));cursor:pointer;transition:transform var(--ds-transition-duration-slow) var(--ds-ease-in-out);background:0 0;border:0;padding:0;animation:4.6s ease-in-out infinite _46FRGq_whaleFloat;position:relative}._46FRGq_launcher:hover{transform:translateY(-4px)scale(1.06)}._46FRGq_launcher svg{z-index:1;width:100%;height:100%;position:relative}._46FRGq_whaleBody{fill:var(--dsw-alias-state-business-primary)}._46FRGq_whaleBelly{fill:var(--dsw-alias-bg-layer-2);opacity:.92}._46FRGq_whaleTail{fill:var(--dsw-alias-state-business-primary)}._46FRGq_whaleEye{fill:var(--dsw-alias-label-primary-inverted)}._46FRGq_whaleSmile,._46FRGq_whaleSpout{fill:none;stroke:var(--dsw-alias-label-primary-inverted);stroke-width:2px;stroke-linecap:round}._46FRGq_whaleSpout{stroke:var(--dsw-alias-state-business-primary)}._46FRGq_panel{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:min(560px,100vw - 32px);max-height:min(700px,100vh - 100px);box-shadow:var(--dsw-shadow-lv3);border-radius:22px;padding:18px;overflow:auto}._46FRGq_panel[hidden]{display:none}._46FRGq_panel[data-in-game]{padding:12px}._46FRGq_panel header,._46FRGq_gameTitle,._46FRGq_gameBar{justify-content:space-between;align-items:center;gap:12px;display:flex}._46FRGq_panel h2{font:var(--dsw-font-l-20);margin:0}._46FRGq_panel header p{color:var(--dsw-alias-label-secondary);margin:3px 0 0}._46FRGq_panel button{color:inherit;font:inherit}._46FRGq_iconButton{background:var(--dsw-alias-interactive-bg-hover);cursor:pointer;border:0;border-radius:50%;width:32px;height:32px;font-size:22px!important}._46FRGq_catalog{grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px;display:grid}._46FRGq_catalog>button{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:pointer;border-radius:14px;flex-direction:column;align-items:center;gap:7px;min-width:0;padding:13px 8px;display:flex}._46FRGq_catalog>button:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3);transform:translateY(-2px)}._46FRGq_catalog small{min-height:48px;color:var(--dsw-alias-label-secondary);line-height:16px}._46FRGq_catalog b{color:var(--dsw-alias-state-business-primary);font:var(--dsw-font-xxs-12)}._46FRGq_catalogIcon{width:50px;height:40px;color:var(--dsw-alias-state-business-primary);place-items:center;display:grid;position:relative}._46FRGq_catalogIcon svg{width:44px;height:36px}._46FRGq_catalogIcon ._46FRGq_miniWave{border-top:3px solid var(--dsw-alias-state-business-primary);opacity:.45;border-radius:50%;width:44px;height:7px;position:absolute;bottom:1px}._46FRGq_gameBar button,._46FRGq_gameOverlay button{background:var(--dsw-alias-interactive-bg-hover);cursor:pointer;border:0;border-radius:9px;padding:7px 11px}._46FRGq_gameBar button:not(:disabled):hover,._46FRGq_gameOverlay button:hover{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover-accent)}._46FRGq_game{background:var(--dsw-alias-bg-layer-2);border-radius:14px;position:relative;overflow:hidden}._46FRGq_gameBar{min-height:42px;color:var(--dsw-alias-label-secondary);white-space:nowrap;padding:0 2px 9px}._46FRGq_gameBar strong{color:var(--dsw-alias-label-primary)}._46FRGq_gameBar ._46FRGq_hint{text-overflow:ellipsis;flex:1;min-width:0;overflow:hidden}._46FRGq_backButton,._46FRGq_closeButton{width:32px;padding-inline:0!important;font-size:18px!important}._46FRGq_closeButton{border-radius:50%!important}._46FRGq_gameOverlay{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-mask-drop);backdrop-filter:blur(2px);z-index:20;place-content:center;justify-items:center;gap:12px;display:grid;position:absolute;inset:51px 1px 1px}._46FRGq_oceanBoard{border:1px solid var(--dsw-alias-border-l2);cursor:pointer;background:linear-gradient(180deg, var(--dsw-alias-bg-layer-2), var(--dsw-alias-state-business-tertiary));border-radius:14px;outline:none;width:100%;height:300px;padding:0;display:block;position:relative;overflow:hidden}._46FRGq_oceanBoard:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary)}._46FRGq_gameWhale,._46FRGq_catcher,._46FRGq_runnerWhale{width:50px;height:38px;color:var(--dsw-alias-state-business-primary);z-index:5;will-change:transform, top, left, bottom;position:absolute}._46FRGq_gameWhale{left:14%;transform:translateY(-50%)}._46FRGq_gameWhale svg,._46FRGq_catcher svg,._46FRGq_runnerWhale svg{width:100%;height:100%;filter:drop-shadow(0 5px 4px var(--dsw-alias-interactive-bg-active))}._46FRGq_jumpingWhale{transform:rotate(-8deg)}._46FRGq_catcher{bottom:30px;transform:translate(-50%)}._46FRGq_runnerWhale{width:52px;left:13%;transform:rotate(-3deg)}._46FRGq_rockGate{z-index:4;width:24px;position:absolute;top:0;bottom:0;transform:translate(-50%)}._46FRGq_rockGate i{background:var(--dsw-alias-border-l3);opacity:.48;width:32px;position:absolute;left:-4px}._46FRGq_rockGate i:after{content:\"\";border:3px solid var(--dsw-alias-state-error-secondary);opacity:.55;border-width:0 3px;border-radius:50%;width:18px;height:22px;position:absolute;left:7px}._46FRGq_rockGate i:first-child{clip-path:polygon(0 0,100% 0,78% 22%,91% 43%,70% 60%,100% 100%,0 100%,25% 63%,5% 42%,31% 22%);border-radius:0 0 48% 26%;top:0}._46FRGq_rockGate i:first-child:after{bottom:4px}._46FRGq_rockGate i:last-child{clip-path:polygon(0 0,100% 0,76% 32%,94% 49%,68% 66%,100% 100%,0 100%,29% 69%,5% 50%,27% 31%);border-radius:32% 42% 0 0;bottom:0}._46FRGq_rockGate i:last-child:after{top:5px}._46FRGq_oceanWaves{z-index:3;pointer-events:none;height:34px;position:absolute;bottom:-7px;left:-4%;right:-4%}._46FRGq_oceanWaves i{background:var(--dsw-alias-border-l3);opacity:.28;clip-path:polygon(0 42%,9% 25%,19% 44%,30% 31%,41% 48%,53% 28%,65% 45%,78% 26%,89% 43%,100% 29%,100% 100%,0 100%);position:absolute;inset:0}._46FRGq_oceanWaves i:last-child{opacity:.2;transform:translate(5%)}._46FRGq_skyBubbles i{border:2px solid var(--dsw-alias-state-business-primary);opacity:.18;border-radius:50%;animation:4s ease-in infinite _46FRGq_bubbles;position:absolute}._46FRGq_skyBubbles i:first-child{width:8px;height:8px;bottom:15%;left:35%}._46FRGq_skyBubbles i:nth-child(2){width:13px;height:13px;animation-delay:1.3s;bottom:4%;left:61%}._46FRGq_skyBubbles i:nth-child(3){width:6px;height:6px;animation-delay:2.1s;bottom:18%;left:83%}._46FRGq_lightRays{background:linear-gradient(112deg, transparent 18%, var(--dsw-alias-interactive-bg-hover) 20%, transparent 39%, var(--dsw-alias-interactive-bg-hover) 42%, transparent 65%);opacity:.55;position:absolute;inset:0}._46FRGq_falling{z-index:4;will-change:top;width:38px;height:38px;position:absolute;transform:translate(-50%,-50%)}._46FRGq_falling svg,._46FRGq_obstacle svg{width:100%;height:100%;overflow:visible}._46FRGq_itemValue{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);white-space:nowrap;position:absolute;top:-9px;left:50%;transform:translate(-50%)}._46FRGq_star{fill:var(--dsw-alias-state-warn-primary)}._46FRGq_objectDot{fill:var(--dsw-alias-label-primary)}._46FRGq_pearlShellBack{fill:var(--dsw-alias-state-warn-tertiary);stroke:var(--dsw-alias-state-warn-secondary);stroke-width:2px}._46FRGq_pearlShellFront{fill:var(--dsw-alias-state-warn-secondary);opacity:.8}._46FRGq_pearl{fill:var(--dsw-alias-label-primary-inverted);stroke:var(--dsw-alias-state-business-primary);stroke-width:2px}._46FRGq_fishBody{fill:var(--dsw-alias-state-business-primary);opacity:.76}._46FRGq_fishTail{fill:var(--dsw-alias-state-business-primary);opacity:.52}._46FRGq_crabBody{fill:var(--dsw-alias-state-error-secondary);opacity:.78}._46FRGq_crabLine{fill:none;stroke:var(--dsw-alias-state-error-secondary);stroke-width:3px;stroke-linecap:round}._46FRGq_urchinSpines{fill:var(--dsw-alias-label-secondary);opacity:.7}._46FRGq_urchinBody{fill:var(--dsw-alias-label-tertiary)}._46FRGq_jellyCap{fill:var(--dsw-alias-state-error-primary);opacity:.72}._46FRGq_objectLine{fill:none;stroke:var(--dsw-alias-label-secondary);stroke-width:3px;stroke-linecap:round}._46FRGq_coral{fill:none;stroke:var(--dsw-alias-state-error-secondary);stroke-width:8px;stroke-linecap:round;stroke-linejoin:round}._46FRGq_shell{fill:var(--dsw-alias-state-warn-secondary);opacity:.78}._46FRGq_touchControls{z-index:9;justify-content:center;gap:8px;display:flex;position:absolute;bottom:3px;left:0;right:0}._46FRGq_touchControls button{background:var(--dsw-alias-button-floating-fill);cursor:pointer;border:0;border-radius:10px;width:62px;height:30px}._46FRGq_runnerBoard{background:var(--dsw-alias-bg-layer-2)}._46FRGq_runnerCanvas{width:100%;height:100%;display:block}._46FRGq_splash{z-index:12;pointer-events:none;width:2px;height:2px;position:absolute}._46FRGq_splash i{background:var(--dsw-alias-state-business-primary);border-radius:50%;width:7px;height:11px;animation:.55s ease-out forwards _46FRGq_splash;position:absolute}._46FRGq_splash i:first-child{--splash-x:-27px;--splash-y:-25px}._46FRGq_splash i:nth-child(2){--splash-x:-11px;--splash-y:-36px;animation-delay:40ms}._46FRGq_splash i:nth-child(3){--splash-x:13px;--splash-y:-34px;animation-delay:20ms}._46FRGq_splash i:nth-child(4){--splash-x:29px;--splash-y:-20px}._46FRGq_scores{border-top:1px solid var(--dsw-alias-border-l1);margin-top:16px;padding-top:13px}._46FRGq_scoresHeader{justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;display:flex}._46FRGq_scores h3{font:var(--dsw-font-s-strong-14);white-space:nowrap;margin:0}._46FRGq_scoreTabs{background:var(--dsw-alias-bg-layer-1);border-radius:9px;gap:3px;min-width:0;padding:2px;display:flex}._46FRGq_scoreTabs button{min-width:0;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;cursor:pointer;font:var(--dsw-font-xxs-12);background:0 0;border:0;border-radius:7px;padding:4px 7px;overflow:hidden}._46FRGq_scoreTabs button[aria-pressed=true]{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover-accent)}._46FRGq_scores ol{margin:0;padding:0;list-style:none}._46FRGq_scores li{border-radius:7px;grid-template-columns:36px 1fr auto;gap:8px;padding:5px 8px;display:grid}._46FRGq_scores li:nth-child(odd){background:var(--dsw-alias-interactive-bg-hover)}._46FRGq_scores li strong{color:var(--dsw-alias-label-primary);font-weight:500}._46FRGq_scores time,._46FRGq_empty{color:var(--dsw-alias-label-secondary)}._46FRGq_empty{text-align:center;margin:12px 0 3px}@keyframes _46FRGq_bubbles{0%{transform:translateY(0)scale(.7)}to{opacity:0;transform:translateY(-230px)scale(1.15)}}@keyframes _46FRGq_splash{to{transform:translate(var(--splash-x), var(--splash-y)) scale(.25);opacity:0}}@keyframes _46FRGq_whaleFloat{0%,to{translate:0}50%{translate:0 -5px}}@media (width<=560px){._46FRGq_root{bottom:12px;right:12px}._46FRGq_catalog{grid-template-columns:1fr}._46FRGq_catalog>button{text-align:left;grid-template-columns:60px 1fr auto;display:grid}._46FRGq_catalog small{min-height:0}._46FRGq_hint{display:none}._46FRGq_gameBar{gap:7px}._46FRGq_scoresHeader{flex-direction:column;align-items:flex-start}._46FRGq_scoreTabs{width:100%}._46FRGq_scoreTabs button{flex:1}}@media (prefers-reduced-motion:reduce){._46FRGq_launcher,._46FRGq_oceanWaves i,._46FRGq_skyBubbles i,._46FRGq_splash i{transition:none;animation:none}}";
		const tagId = "dsh-whale-arcade/WhaleArcade.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-whale-arcade";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WhaleArcade_module_css_default = {
			"backButton": "_46FRGq_backButton",
			"bubbles": "_46FRGq_bubbles",
			"catalog": "_46FRGq_catalog",
			"catalogIcon": "_46FRGq_catalogIcon",
			"catcher": "_46FRGq_catcher",
			"closeButton": "_46FRGq_closeButton",
			"coral": "_46FRGq_coral",
			"crabBody": "_46FRGq_crabBody",
			"crabLine": "_46FRGq_crabLine",
			"empty": "_46FRGq_empty",
			"falling": "_46FRGq_falling",
			"fishBody": "_46FRGq_fishBody",
			"fishTail": "_46FRGq_fishTail",
			"game": "_46FRGq_game",
			"gameBar": "_46FRGq_gameBar",
			"gameOverlay": "_46FRGq_gameOverlay",
			"gameTitle": "_46FRGq_gameTitle",
			"gameWhale": "_46FRGq_gameWhale",
			"hint": "_46FRGq_hint",
			"iconButton": "_46FRGq_iconButton",
			"itemValue": "_46FRGq_itemValue",
			"jellyCap": "_46FRGq_jellyCap",
			"jumpingWhale": "_46FRGq_jumpingWhale",
			"launcher": "_46FRGq_launcher",
			"lightRays": "_46FRGq_lightRays",
			"miniWave": "_46FRGq_miniWave",
			"objectDot": "_46FRGq_objectDot",
			"objectLine": "_46FRGq_objectLine",
			"obstacle": "_46FRGq_obstacle",
			"oceanBoard": "_46FRGq_oceanBoard",
			"oceanWaves": "_46FRGq_oceanWaves",
			"panel": "_46FRGq_panel",
			"pearl": "_46FRGq_pearl",
			"pearlShellBack": "_46FRGq_pearlShellBack",
			"pearlShellFront": "_46FRGq_pearlShellFront",
			"rockGate": "_46FRGq_rockGate",
			"root": "_46FRGq_root",
			"runnerBoard": "_46FRGq_runnerBoard",
			"runnerCanvas": "_46FRGq_runnerCanvas",
			"runnerWhale": "_46FRGq_runnerWhale",
			"scoreTabs": "_46FRGq_scoreTabs",
			"scores": "_46FRGq_scores",
			"scoresHeader": "_46FRGq_scoresHeader",
			"shell": "_46FRGq_shell",
			"skyBubbles": "_46FRGq_skyBubbles",
			"splash": "_46FRGq_splash",
			"star": "_46FRGq_star",
			"touchControls": "_46FRGq_touchControls",
			"urchinBody": "_46FRGq_urchinBody",
			"urchinSpines": "_46FRGq_urchinSpines",
			"whaleBelly": "_46FRGq_whaleBelly",
			"whaleBody": "_46FRGq_whaleBody",
			"whaleEye": "_46FRGq_whaleEye",
			"whaleFloat": "_46FRGq_whaleFloat",
			"whaleSmile": "_46FRGq_whaleSmile",
			"whaleSpout": "_46FRGq_whaleSpout",
			"whaleTail": "_46FRGq_whaleTail"
		};
		//#endregion
		//#region src/client/WhaleArcade.tsx
		function WhaleMark({ jumping = false }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 96 64",
				"aria-hidden": "true",
				className: jumping ? WhaleArcade_module_css_default.jumpingWhale : void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.whaleTail,
						d: "M29 27C20 25 14 18 15 9l8 6 7-5c3 7 3 12-1 17Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.whaleBody,
						d: "M28 23c9-10 28-12 43-5 13 6 17 20 8 30-10 11-36 11-49 0-8-7-9-18-2-25Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.whaleBelly,
						d: "M29 41c14 8 35 9 51 0-4 10-16 15-30 14-10 0-18-5-21-14Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.whaleEye,
						cx: "70",
						cy: "28",
						r: "2.4"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.whaleSmile,
						d: "M71 40c3 1 6 1 8-1"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.whaleSpout,
						d: "M56 14c-2-5 0-9 3-11m-1 11c3-4 6-5 9-4"
					})
				]
			});
		}
		function OceanIcon({ kind }) {
			if (kind === "jelly") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 48 56",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					className: WhaleArcade_module_css_default.jellyCap,
					d: "M6 25C6 10 14 3 24 3s18 7 18 22Z"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					className: WhaleArcade_module_css_default.objectLine,
					d: "M10 25c0 7 6 7 6 14s-5 8-5 13m13-27c0 8 5 8 5 15s-4 8-4 12m13-27c0 7-5 8-5 14s5 7 5 13"
				})]
			});
			if (kind === "coral") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 48 60",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					className: WhaleArcade_module_css_default.coral,
					d: "M22 57V26c0-8-7-8-7-15M22 35c8 0 13-6 13-15m-13 28c-9 0-15-5-15-13m28-15V9m-20 2V4M7 35v-8"
				})
			});
			if (kind === "shell") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 52 45",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					className: WhaleArcade_module_css_default.shell,
					d: "M4 38C5 17 13 5 26 5s21 12 22 33Z"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					className: WhaleArcade_module_css_default.objectLine,
					d: "M26 7v29M15 10l7 27M37 10l-7 27M7 25l15 12m23-12L30 37"
				})]
			});
			if (kind === "fish") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 56 38",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.fishBody,
						d: "M12 19C20 5 39 6 47 19c-8 13-27 14-35 0Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.fishTail,
						d: "M13 19 3 8v22Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.objectDot,
						cx: "39",
						cy: "15",
						r: "2"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.objectLine,
						d: "M28 9c-2 5-2 14 0 20"
					})
				]
			});
			if (kind === "crab") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 56 44",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.crabBody,
						d: "M14 24c2-11 26-11 28 0 1 9-6 15-14 15s-15-6-14-15Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.crabLine,
						d: "M15 24 7 18 3 11m38 13 8-6 4-7M15 29 6 34m35-5 9 5M20 16l-2-8m18 8 2-8"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.objectDot,
						cx: "21",
						cy: "22",
						r: "1.5"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.objectDot,
						cx: "35",
						cy: "22",
						r: "1.5"
					})
				]
			});
			if (kind === "urchin") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 48 48",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					className: WhaleArcade_module_css_default.urchinSpines,
					d: "m24 2 3 13 8-11-3 14L45 9 35 21l15-3-14 8 14 5-15-1 10 11-13-8 3 14-8-12-3 13-3-13-8 11 3-14-13 8 10-11-15 2 14-6L0 18l15 3L4 9l13 9-4-14 8 11Z"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
					className: WhaleArcade_module_css_default.urchinBody,
					cx: "24",
					cy: "25",
					r: "11"
				})]
			});
			if (kind === "star") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 50 50",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.star,
						d: "m25 3 6 14 15 1-12 10 4 16-13-8-13 8 4-16L4 18l15-1Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.objectDot,
						cx: "20",
						cy: "24",
						r: "1.5"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.objectDot,
						cx: "30",
						cy: "24",
						r: "1.5"
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 52 48",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.pearlShellBack,
						d: "M6 28C8 12 16 5 26 5s18 7 20 23Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.objectLine,
						d: "M26 7v20M15 10l8 18m14-18-8 18"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						className: WhaleArcade_module_css_default.pearlShellFront,
						d: "M5 29c7-5 35-5 42 0-3 11-11 15-21 15S8 40 5 29Z"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						className: WhaleArcade_module_css_default.pearl,
						cx: "26",
						cy: "27",
						r: "8"
					})
				]
			});
		}
		function Splash({ splash }) {
			return splash && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: WhaleArcade_module_css_default.splash,
				style: {
					left: `${splash.x}%`,
					top: `${splash.y}%`
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})
				]
			}, splash.id);
		}
		function useFrame(active, tick) {
			const tickRef = (0, react.useRef)(tick);
			tickRef.current = tick;
			(0, react.useEffect)(() => {
				if (!active) return;
				let frame = 0;
				let previous = performance.now();
				const loop = (now) => {
					const dt = Math.min(34, now - previous) / 1e3;
					previous = now;
					tickRef.current(dt);
					frame = requestAnimationFrame(loop);
				};
				frame = requestAnimationFrame(loop);
				return () => {
					cancelAnimationFrame(frame);
				};
			}, [active]);
		}
		const GAME_COPY = {
			jump: {
				icon: "wave",
				name: "jump.name",
				desc: "jump.desc"
			},
			catch: {
				icon: "star",
				name: "catch.name",
				desc: "catch.desc"
			},
			runner: {
				icon: "coral",
				name: "runner.name",
				desc: "runner.desc"
			}
		};
		function CatalogIcon({ kind }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: WhaleArcade_module_css_default.catalogIcon,
				children: kind === "wave" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WhaleMark, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: WhaleArcade_module_css_default.miniWave })] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OceanIcon, { kind })
			});
		}
		function formatDuration(durationMs) {
			const seconds = Math.max(0, Math.round(durationMs / 1e3));
			return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
		}
		function Leaderboard({ game, onGame, t }) {
			const scores = readScores(game);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: WhaleArcade_module_css_default.scores,
				"aria-label": t("leaderboard"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: WhaleArcade_module_css_default.scoresHeader,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("leaderboard") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WhaleArcade_module_css_default.scoreTabs,
						role: "group",
						"aria-label": t("leaderboard"),
						children: Object.keys(GAME_COPY).map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": id === game,
							onClick: () => {
								onGame(id);
							},
							children: t(GAME_COPY[id].name)
						}, id))
					})]
				}), scores.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", { children: scores.map((entry, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["#", index + 1] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
						"aria-label": `${t("score")} ${entry.score}`,
						children: entry.score
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
						dateTime: `PT${entry.durationMs / 1e3}S`,
						title: t("duration"),
						children: formatDuration(entry.durationMs)
					})
				] }, `${entry.achievedAt}-${index}`)) }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: WhaleArcade_module_css_default.empty,
					children: t("empty")
				})]
			});
		}
		function GameChrome({ game, phase, score, getDuration, onPhase, onScore, onBack, onClose, renderGame, t }) {
			const finish = (0, react.useCallback)((finalScore) => {
				try {
					recordScore(game, {
						score: finalScore,
						durationMs: getDuration(),
						achievedAt: Date.now()
					});
				} finally {
					onScore(finalScore);
					onPhase("over");
				}
			}, [
				game,
				getDuration,
				onPhase,
				onScore
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WhaleArcade_module_css_default.game,
				"data-phase": phase,
				"data-game": game,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.gameBar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WhaleArcade_module_css_default.backButton,
								onClick: onBack,
								"aria-label": t("back"),
								children: "←"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: WhaleArcade_module_css_default.hint,
								children: t(GAME_COPY[game].desc)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("score"),
								" ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(score).padStart(5, "0") })
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("best"),
								" ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(readScores(game)[0]?.score ?? 0).padStart(5, "0") })
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									onPhase(phase === "paused" ? "playing" : "paused");
								},
								disabled: phase === "ready" || phase === "over",
								children: phase === "paused" ? t("resume") : t("pause")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WhaleArcade_module_css_default.closeButton,
								onClick: onClose,
								"aria-label": t("close"),
								children: "×"
							})
						]
					}),
					renderGame(finish),
					(phase === "ready" || phase === "over") && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.gameOverlay,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: phase === "over" ? t("over") : t(GAME_COPY[game].desc) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								onScore(0);
								onPhase("playing");
							},
							children: phase === "over" ? t("restart") : t("play")
						})]
					})
				]
			});
		}
		function JumpGame({ phase, round, score, onScore, finish }) {
			const board = (0, react.useRef)(null);
			const scoreRef = (0, react.useRef)(score);
			scoreRef.current = score;
			const whaleRef = (0, react.useRef)({
				y: 45,
				velocity: 0
			});
			const rocksRef = (0, react.useRef)([{
				id: 0,
				x: 112,
				gap: 46,
				opening: 34,
				gapBefore: 0,
				scored: false
			}]);
			const ended = (0, react.useRef)(false);
			const [whale, setWhale] = (0, react.useState)(whaleRef.current);
			const [rocks, setRocks] = (0, react.useState)(rocksRef.current);
			const [splash, setSplash] = (0, react.useState)(null);
			const flap = (0, react.useCallback)(() => {
				if (phase === "playing") {
					whaleRef.current = {
						...whaleRef.current,
						velocity: -49
					};
					setWhale(whaleRef.current);
				}
			}, [phase]);
			(0, react.useEffect)(() => {
				if (phase === "playing") board.current?.focus();
			}, [phase]);
			(0, react.useEffect)(() => {
				ended.current = false;
				whaleRef.current = {
					y: 45,
					velocity: 0
				};
				rocksRef.current = [{
					id: round,
					x: 112,
					gap: 46,
					opening: 34,
					gapBefore: 0,
					scored: false
				}];
				setWhale(whaleRef.current);
				setRocks(rocksRef.current);
				setSplash(null);
			}, [round]);
			const end = (x, y) => {
				if (!ended.current) {
					ended.current = true;
					setSplash({
						id: performance.now(),
						x,
						y
					});
					finish(scoreRef.current);
				}
			};
			useFrame(phase === "playing", (dt) => {
				const current = whaleRef.current;
				const velocity = current.velocity + 92 * dt;
				const rawY = current.y + velocity * dt;
				const y = Math.min(84, Math.max(6, rawY));
				whaleRef.current = {
					y,
					velocity
				};
				setWhale(whaleRef.current);
				let impact = rawY < 6 || rawY > 84 ? {
					x: 18,
					y: Math.min(88, Math.max(5, rawY))
				} : null;
				const speed = jumpSpeed(scoreRef.current);
				const width = board.current?.clientWidth ?? 0;
				const height = board.current?.clientHeight ?? 0;
				let gained = 0;
				const moved = rocksRef.current.map((rock) => {
					const next = {
						...rock,
						x: rock.x - speed * dt
					};
					if (!impact && jumpCollides(width, height, y, next)) impact = {
						x: 20,
						y
					};
					if (!next.scored && cavePassedWhale(width, next)) {
						gained += 1;
						return {
							...next,
							scored: true
						};
					}
					return next;
				}).filter((rock) => rock.x > -14);
				const last = moved.at(-1);
				if (!last || last.x < 112) {
					const cave = createCave(last?.gap ?? 46, scoreRef.current, speed);
					moved.push({
						id: performance.now(),
						x: last ? positionNextCave(last.x, cave) : 112,
						...cave,
						scored: false
					});
				}
				rocksRef.current = moved;
				setRocks(moved);
				if (gained) {
					scoreRef.current += gained;
					onScore(scoreRef.current);
				}
				if (impact) end(impact.x, impact.y);
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				ref: board,
				type: "button",
				className: WhaleArcade_module_css_default.oceanBoard,
				onClick: flap,
				onKeyDown: (event) => {
					if (!event.repeat && [
						"Space",
						"ArrowUp",
						"KeyW"
					].includes(event.code)) {
						event.preventDefault();
						flap();
					}
				},
				"aria-label": "Whale wave game",
				"data-whale-game": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.skyBubbles,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: WhaleArcade_module_css_default.gameWhale,
						style: { top: `${whale.y}%` },
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WhaleMark, { jumping: whale.velocity < 0 })
					}),
					rocks.map((rock) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: WhaleArcade_module_css_default.rockGate,
						style: { left: `${rock.x}%` },
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { style: { height: `${rock.gap - rock.opening / 2}%` } }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { style: { top: `${rock.gap + rock.opening / 2}%` } })]
					}, rock.id)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.oceanWaves,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Splash, { splash })
				]
			});
		}
		function CatchGame({ phase, round, score, onScore, finish }) {
			const board = (0, react.useRef)(null);
			const keys = (0, react.useRef)(/* @__PURE__ */ new Set());
			const touchDirection = (0, react.useRef)(0);
			const scoreRef = (0, react.useRef)(score);
			scoreRef.current = score;
			const whaleRef = (0, react.useRef)(50);
			const ended = (0, react.useRef)(false);
			const itemsRef = (0, react.useRef)([]);
			const pending = (0, react.useRef)(null);
			const nextSpawnAt = (0, react.useRef)(.55);
			const elapsed = (0, react.useRef)(0);
			const itemId = (0, react.useRef)(0);
			const [whaleX, setWhaleX] = (0, react.useState)(50);
			const [items, setItems] = (0, react.useState)([]);
			const [splash, setSplash] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (phase === "playing") board.current?.focus();
				else {
					keys.current.clear();
					touchDirection.current = 0;
				}
			}, [phase]);
			(0, react.useEffect)(() => {
				const release = (event) => {
					keys.current.delete(event.code);
				};
				const clear = () => {
					keys.current.clear();
					touchDirection.current = 0;
				};
				window.addEventListener("keyup", release);
				window.addEventListener("blur", clear);
				return () => {
					window.removeEventListener("keyup", release);
					window.removeEventListener("blur", clear);
				};
			}, []);
			(0, react.useEffect)(() => {
				ended.current = false;
				whaleRef.current = 50;
				itemsRef.current = [];
				pending.current = null;
				nextSpawnAt.current = .55;
				elapsed.current = 0;
				itemId.current = 0;
				setWhaleX(50);
				setItems([]);
				setSplash(null);
			}, [round]);
			const end = (x) => {
				if (!ended.current) {
					ended.current = true;
					setSplash({
						id: performance.now(),
						x,
						y: 82
					});
					finish(scoreRef.current);
				}
			};
			useFrame(phase === "playing", (dt) => {
				const keyboardDirection = Number(keys.current.has("ArrowRight") || keys.current.has("KeyD")) - Number(keys.current.has("ArrowLeft") || keys.current.has("KeyA"));
				const direction = Math.sign(keyboardDirection + touchDirection.current);
				if (direction) {
					whaleRef.current = Math.min(91, Math.max(9, whaleRef.current + direction * 62 * dt));
					setWhaleX(whaleRef.current);
				}
				elapsed.current += dt;
				let nextItems = itemsRef.current;
				if (elapsed.current >= nextSpawnAt.current) {
					const design = pending.current ?? createCatchDesign(elapsed.current);
					const scheduled = scheduleCatchSpawn(nextItems.filter((item) => item.y < 76), design, elapsed.current);
					if (scheduled.spawnAt <= elapsed.current + .001) {
						itemId.current += 1;
						nextItems = [...nextItems, {
							...design,
							id: itemId.current,
							y: -8,
							arrivalAt: scheduled.arrivalAt
						}];
						pending.current = null;
						nextSpawnAt.current = elapsed.current + catchSpawnDelay(elapsed.current);
					} else {
						pending.current = design;
						nextSpawnAt.current = scheduled.spawnAt;
					}
				}
				const width = board.current?.clientWidth ?? 0;
				const height = board.current?.clientHeight ?? 0;
				const movedItems = nextItems.map((item) => ({
					...item,
					y: item.y + item.speed * dt
				}));
				const outcome = catchHitOutcome(width, height, whaleRef.current, movedItems);
				const caughtIds = new Set(outcome.caughtIds);
				const remaining = movedItems.filter((item) => !caughtIds.has(item.id) && item.y <= 105);
				itemsRef.current = remaining;
				setItems(remaining);
				if (outcome.splashX !== null) setSplash({
					id: performance.now(),
					x: outcome.splashX,
					y: 82
				});
				if (outcome.gained) {
					scoreRef.current += outcome.gained;
					onScore(scoreRef.current);
				}
				if (outcome.hazardX !== null) end(outcome.hazardX);
			});
			const move = (amount) => {
				if (phase === "playing") {
					whaleRef.current = Math.min(91, Math.max(9, whaleRef.current + amount));
					setWhaleX(whaleRef.current);
				}
			};
			const releaseTouch = () => {
				touchDirection.current = 0;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: board,
				className: WhaleArcade_module_css_default.oceanBoard,
				tabIndex: 0,
				"data-whale-game": true,
				onKeyDown: (event) => {
					if ([
						"ArrowLeft",
						"ArrowRight",
						"KeyA",
						"KeyD"
					].includes(event.code)) {
						keys.current.add(event.code);
						event.preventDefault();
					}
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: WhaleArcade_module_css_default.lightRays }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.skyBubbles,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})
						]
					}),
					items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: WhaleArcade_module_css_default.falling,
						style: {
							left: `${item.x}%`,
							top: `${item.y}%`,
							width: item.size,
							height: item.size
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(OceanIcon, { kind: item.kind }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", {
							className: WhaleArcade_module_css_default.itemValue,
							children: item.hazard ? "!" : `+${item.value}`
						})]
					}, item.id)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: WhaleArcade_module_css_default.catcher,
						style: { left: `${whaleX}%` },
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WhaleMark, {})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.oceanWaves,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Splash, { splash }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: WhaleArcade_module_css_default.touchControls,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onPointerDown: (event) => {
								event.currentTarget.setPointerCapture(event.pointerId);
								touchDirection.current = -1;
								move(-2);
							},
							onPointerUp: releaseTouch,
							onPointerCancel: releaseTouch,
							onLostPointerCapture: releaseTouch,
							children: "←"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onPointerDown: (event) => {
								event.currentTarget.setPointerCapture(event.pointerId);
								touchDirection.current = 1;
								move(2);
							},
							onPointerUp: releaseTouch,
							onPointerCancel: releaseTouch,
							onLostPointerCapture: releaseTouch,
							children: "→"
						})]
					})
				]
			});
		}
		function RunnerScene({ whaleY, obstacles, splash }) {
			const canvas = (0, react.useRef)(null);
			const [sizeRevision, setSizeRevision] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				const element = canvas.current;
				if (!element || typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(() => {
					setSizeRevision((value) => value + 1);
				});
				observer.observe(element);
				return () => {
					observer.disconnect();
				};
			}, []);
			(0, react.useEffect)(() => {
				const element = canvas.current;
				if (!element) return;
				const ratio = Math.min(2, window.devicePixelRatio || 1);
				const width = element.clientWidth;
				const height = element.clientHeight;
				if (element.width !== width * ratio || element.height !== height * ratio) {
					element.width = width * ratio;
					element.height = height * ratio;
				}
				const context = element.getContext("2d");
				if (!context) return;
				context.setTransform(ratio, 0, 0, ratio, 0, 0);
				context.clearRect(0, 0, width, height);
				const styles = getComputedStyle(element);
				const blue = styles.getPropertyValue("--dsw-alias-state-business-primary").trim();
				const surface = styles.getPropertyValue("--dsw-alias-border-l3").trim();
				const water = styles.getPropertyValue("--dsw-alias-state-business-tertiary").trim();
				const background = styles.getPropertyValue("--dsw-alias-bg-layer-2").trim();
				const error = styles.getPropertyValue("--dsw-alias-state-error-secondary").trim();
				const now = performance.now();
				const seaY = height * .84;
				context.fillStyle = background;
				context.fillRect(0, 0, width, height);
				context.fillStyle = water;
				context.globalAlpha = .2;
				context.fillRect(0, 0, width, height);
				context.globalAlpha = 1;
				context.strokeStyle = water;
				context.globalAlpha = .42;
				context.lineWidth = 8;
				for (const offset of [0, width * .43]) {
					context.beginPath();
					context.moveTo(offset, 0);
					context.lineTo(offset + width * .24, height * .72);
					context.stroke();
				}
				context.globalAlpha = 1;
				const wave = (base, amplitude, speed) => {
					context.beginPath();
					context.moveTo(0, base);
					for (let x = 0; x <= width + 12; x += 12) context.lineTo(x, base + Math.sin(x / 31 + now / speed) * amplitude);
					context.lineTo(width, height);
					context.lineTo(0, height);
					context.closePath();
				};
				wave(seaY + 4, 2.5, 620);
				context.fillStyle = surface;
				context.globalAlpha = .3;
				context.fill();
				wave(seaY, 1.5, 760);
				context.strokeStyle = blue;
				context.lineWidth = 1;
				context.globalAlpha = .3;
				context.stroke();
				context.globalAlpha = 1;
				const whaleX = width * .18;
				const whaleTop = seaY - 18 - height * whaleY / 100;
				context.save();
				context.translate(whaleX, whaleTop);
				context.scale(.43, .43);
				context.fillStyle = blue;
				context.beginPath();
				context.moveTo(-25, -4);
				context.bezierCurveTo(-36, -7, -43, -16, -41, -27);
				context.lineTo(-31, -19);
				context.lineTo(-22, -26);
				context.bezierCurveTo(-18, -17, -19, -10, -25, -4);
				context.fill();
				context.beginPath();
				context.moveTo(-24, -8);
				context.bezierCurveTo(-10, -24, 19, -27, 41, -16);
				context.bezierCurveTo(59, -7, 64, 14, 50, 28);
				context.bezierCurveTo(34, 45, -7, 45, -27, 28);
				context.bezierCurveTo(-39, 17, -39, 2, -24, -8);
				context.fill();
				context.fillStyle = background;
				context.beginPath();
				context.moveTo(-25, 19);
				context.bezierCurveTo(-4, 33, 27, 35, 52, 19);
				context.bezierCurveTo(45, 35, 25, 42, 4, 38);
				context.bezierCurveTo(-11, 35, -21, 28, -25, 19);
				context.fill();
				context.beginPath();
				context.arc(42, -7, 3.2, 0, Math.PI * 2);
				context.fill();
				context.strokeStyle = blue;
				context.lineWidth = 2.8;
				context.lineCap = "round";
				context.beginPath();
				context.moveTo(17, -25);
				context.quadraticCurveTo(13, -35, 19, -42);
				context.moveTo(20, -27);
				context.quadraticCurveTo(27, -37, 33, -34);
				context.stroke();
				context.restore();
				for (const obstacle of obstacles) {
					const geometry = RUNNER_OBSTACLES[obstacle.kind];
					const left = width * obstacle.x / 100 - geometry.visualWidth / 2;
					const top = seaY - geometry.visualHeight;
					context.save();
					context.translate(left, top);
					context.lineCap = "round";
					context.lineJoin = "round";
					if (obstacle.kind === "conch") {
						context.fillStyle = blue;
						context.strokeStyle = blue;
						context.globalAlpha = .36;
						context.lineWidth = 1.4;
						context.beginPath();
						context.moveTo(1, 16);
						context.bezierCurveTo(2, 5, 8, 1, 14, 2);
						context.bezierCurveTo(22, 3, 24, 10, 21, 16);
						context.closePath();
						context.fill();
						context.globalAlpha = .7;
						context.stroke();
						context.beginPath();
						context.arc(13, 10, 5, -.5, Math.PI * 1.75);
						context.arc(13, 10, 2.2, Math.PI * 1.75, 0);
						context.stroke();
					} else if (obstacle.kind === "urchin") {
						context.strokeStyle = blue;
						context.fillStyle = blue;
						context.globalAlpha = .55;
						context.lineWidth = 1.6;
						for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
							context.beginPath();
							context.moveTo(15 + Math.cos(angle) * 9, 15 + Math.sin(angle) * 9);
							context.lineTo(15 + Math.cos(angle) * 14, 15 + Math.sin(angle) * 14);
							context.stroke();
						}
						context.globalAlpha = .32;
						context.beginPath();
						context.arc(15, 15, 10, 0, Math.PI * 2);
						context.fill();
						context.globalAlpha = .7;
						context.stroke();
					} else if (obstacle.kind === "coral") {
						context.strokeStyle = error;
						context.globalAlpha = .62;
						context.lineWidth = 6;
						context.beginPath();
						context.moveTo(14, 37);
						context.lineTo(14, 5);
						context.moveTo(14, 21);
						context.quadraticCurveTo(4, 21, 5, 12);
						context.moveTo(14, 16);
						context.quadraticCurveTo(24, 16, 23, 7);
						context.moveTo(14, 29);
						context.quadraticCurveTo(24, 29, 24, 22);
						context.stroke();
					} else {
						context.fillStyle = blue;
						context.strokeStyle = blue;
						context.globalAlpha = .34;
						context.lineWidth = 1.5;
						context.beginPath();
						context.moveTo(2, 12);
						context.lineTo(44, 10);
						context.lineTo(38, 23);
						context.lineTo(9, 23);
						context.closePath();
						context.fill();
						context.globalAlpha = .7;
						context.stroke();
						context.beginPath();
						context.moveTo(22, 11);
						context.lineTo(22, 2);
						context.lineTo(34, 9);
						context.closePath();
						context.stroke();
						context.moveTo(10, 16);
						context.lineTo(37, 15);
						context.stroke();
					}
					context.restore();
					context.globalAlpha = 1;
				}
				if (splash) {
					const age = Math.min(1, (now - splash.id) / 560);
					context.strokeStyle = blue;
					context.globalAlpha = 1 - age;
					context.lineWidth = 1.5;
					context.beginPath();
					context.ellipse(width * splash.x / 100, seaY, 8 + age * 28, 2 + age * 6, 0, 0, Math.PI * 2);
					context.stroke();
					for (const direction of [
						-1,
						-.4,
						.4,
						1
					]) {
						context.beginPath();
						context.arc(width * splash.x / 100 + direction * age * 24, seaY - Math.sin(age * Math.PI) * (17 + Math.abs(direction) * 10), 2.2, 0, Math.PI * 2);
						context.fillStyle = blue;
						context.fill();
					}
					context.globalAlpha = 1;
				}
			}, [
				obstacles,
				sizeRevision,
				splash,
				whaleY
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				ref: canvas,
				className: WhaleArcade_module_css_default.runnerCanvas,
				"aria-hidden": "true"
			});
		}
		function RunnerGame({ phase, round, score, onScore, finish }) {
			const board = (0, react.useRef)(null);
			const scoreRef = (0, react.useRef)(score);
			scoreRef.current = score;
			const whaleRef = (0, react.useRef)({
				y: 0,
				velocity: 0
			});
			const obstaclesRef = (0, react.useRef)([]);
			const ended = (0, react.useRef)(false);
			const elapsedRef = (0, react.useRef)(0);
			const travelRef = (0, react.useRef)(0);
			const obstacleId = (0, react.useRef)(0);
			const kindHistory = (0, react.useRef)([]);
			const gapHistory = (0, react.useRef)([]);
			const [whale, setWhale] = (0, react.useState)(whaleRef.current);
			const [obstacles, setObstacles] = (0, react.useState)([]);
			const [splash, setSplash] = (0, react.useState)(null);
			const jump = (0, react.useCallback)(() => {
				if (phase === "playing" && whaleRef.current.y === 0) {
					whaleRef.current = {
						y: 0,
						velocity: 72
					};
					setWhale(whaleRef.current);
				}
			}, [phase]);
			(0, react.useEffect)(() => {
				if (phase === "playing") board.current?.focus();
			}, [phase]);
			(0, react.useEffect)(() => {
				ended.current = false;
				whaleRef.current = {
					y: 0,
					velocity: 0
				};
				obstaclesRef.current = [];
				elapsedRef.current = 0;
				travelRef.current = 0;
				obstacleId.current = 0;
				kindHistory.current = [];
				gapHistory.current = [];
				setWhale(whaleRef.current);
				setObstacles([]);
				setSplash(null);
			}, [round]);
			const end = () => {
				if (!ended.current) {
					ended.current = true;
					setSplash({
						id: performance.now(),
						x: 24,
						y: 76 - whaleRef.current.y
					});
					finish(scoreRef.current);
				}
			};
			useFrame(phase === "playing", (dt) => {
				elapsedRef.current += dt;
				const speed = runnerSpeed(elapsedRef.current);
				travelRef.current += speed * dt * .3;
				const nextScore = Math.floor(travelRef.current);
				if (nextScore !== scoreRef.current) {
					scoreRef.current = nextScore;
					onScore(nextScore);
				}
				const current = whaleRef.current;
				const velocity = current.velocity - 145 * dt;
				const y = Math.max(0, current.y + velocity * dt);
				whaleRef.current = {
					y,
					velocity: y === 0 ? 0 : velocity
				};
				setWhale(whaleRef.current);
				if (current.y > 1 && y === 0) setSplash({
					id: performance.now(),
					x: 19,
					y: 80
				});
				const moved = obstaclesRef.current.map((item) => ({
					...item,
					x: item.x - speed * dt
				})).filter((item) => item.x > -15);
				const last = moved.at(-1);
				if (!last || last.x < 112 - last.gapAfter) {
					const wave = createRunnerWave(elapsedRef.current, speed, {
						recentKinds: kindHistory.current,
						recentGapBands: gapHistory.current
					});
					moved.push(...wave.obstacles.map((item) => {
						obstacleId.current += 1;
						return {
							...item,
							id: obstacleId.current
						};
					}));
					kindHistory.current = [...kindHistory.current.slice(-1), wave.primaryKind];
					gapHistory.current = [...gapHistory.current.slice(-1), wave.gapBand];
				}
				obstaclesRef.current = moved;
				setObstacles(moved);
				const width = board.current?.clientWidth ?? 0;
				const height = board.current?.clientHeight ?? 0;
				if (moved.some((item) => runnerCollides(width, height, whaleRef.current.y, item))) end();
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				ref: board,
				type: "button",
				className: `${WhaleArcade_module_css_default.oceanBoard} ${WhaleArcade_module_css_default.runnerBoard}`,
				onClick: jump,
				onKeyDown: (event) => {
					if (!event.repeat && [
						"Space",
						"ArrowUp",
						"KeyW"
					].includes(event.code)) {
						event.preventDefault();
						jump();
					}
				},
				"data-whale-game": true,
				"aria-label": "Whale ocean runner",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunnerScene, {
					whaleY: whale.y,
					obstacles,
					splash
				})
			});
		}
		function WhaleArcade({ t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [game, setGame] = (0, react.useState)(null);
			const [phase, setPhase] = (0, react.useState)("ready");
			const [score, setScore] = (0, react.useState)(0);
			const [round, setRound] = (0, react.useState)(0);
			const [leaderboardGame, setLeaderboardGame] = (0, react.useState)("jump");
			const phaseRef = (0, react.useRef)("ready");
			const activeTimer = (0, react.useRef)(createActiveTimer());
			const launcher = (0, react.useRef)(null);
			const updatePhase = (0, react.useCallback)((next) => {
				const current = phaseRef.current;
				if (current === next) return;
				if (current === "playing") activeTimer.current.pause();
				if (next === "playing") {
					if (current === "paused") activeTimer.current.resume();
					else {
						activeTimer.current.start();
						setRound((value) => value + 1);
					}
				}
				phaseRef.current = next;
				setPhase(next);
			}, []);
			const select = (id) => {
				setGame(id);
				setLeaderboardGame(id);
				phaseRef.current = "ready";
				setPhase("ready");
				setScore(0);
			};
			const close = (0, react.useCallback)(() => {
				if (phaseRef.current === "playing") updatePhase("paused");
				setOpen(false);
				launcher.current?.focus();
			}, [updatePhase]);
			const back = (0, react.useCallback)(() => {
				updatePhase("ready");
				setGame(null);
			}, [updatePhase]);
			const getDuration = (0, react.useCallback)(() => Math.round(activeTimer.current.read()), []);
			(0, react.useEffect)(() => {
				const hidden = () => {
					if (document.hidden && phaseRef.current === "playing") updatePhase("paused");
				};
				document.addEventListener("visibilitychange", hidden);
				return () => {
					document.removeEventListener("visibilitychange", hidden);
				};
			}, [updatePhase]);
			const gameBody = (0, react.useMemo)(() => (finish) => {
				if (game === "jump") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(JumpGame, {
					phase,
					round,
					score,
					onScore: setScore,
					finish
				});
				if (game === "catch") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CatchGame, {
					phase,
					round,
					score,
					onScore: setScore,
					finish
				});
				if (game === "runner") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RunnerGame, {
					phase,
					round,
					score,
					onScore: setScore,
					finish
				});
				return null;
			}, [
				game,
				phase,
				round,
				score
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: WhaleArcade_module_css_default.root,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: WhaleArcade_module_css_default.panel,
					"data-in-game": game !== null || void 0,
					role: "dialog",
					"aria-label": t("title"),
					hidden: !open,
					children: [game === null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("subtitle") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WhaleArcade_module_css_default.iconButton,
						onClick: close,
						"aria-label": t("close"),
						children: "×"
					})] }), game === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: WhaleArcade_module_css_default.catalog,
						children: Object.keys(GAME_COPY).map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								select(id);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CatalogIcon, { kind: GAME_COPY[id].icon }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(GAME_COPY[id].name) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(GAME_COPY[id].desc) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", { children: [
									t("best"),
									" ",
									readScores(id)[0]?.score ?? 0
								] })
							]
						}, id))
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Leaderboard, {
						game: leaderboardGame,
						onGame: setLeaderboardGame,
						t
					})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GameChrome, {
						game,
						phase,
						score,
						getDuration,
						onPhase: updatePhase,
						onScore: setScore,
						onBack: back,
						onClose: close,
						t,
						renderGame: gameBody
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					ref: launcher,
					type: "button",
					className: WhaleArcade_module_css_default.launcher,
					onClick: () => {
						if (open) close();
						else setOpen(true);
					},
					"aria-label": t("launcher"),
					"aria-expanded": open,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WhaleMark, {})
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services for locale and shell-overlay registration. */
		const inject = ["slots", "locale"];
		/** Register the floating arcade in the frame-wide overlay. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-whale-arcade: dictionaries");
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "whale-arcade",
				order: 100,
				locale: NS
			}, WhaleArcade));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
