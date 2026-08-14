/** `whaleArcade` namespace dictionaries. */
export const NS = 'whaleArcade'

export const zh = {
  'launcher': '打开鲸鱼游戏中心',
  'title': '鲸鱼游戏中心',
  'subtitle': '潜入深海，玩一小局',
  'close': '关闭游戏中心',
  'back': '返回游戏列表',
  'play': '开始游戏',
  'pause': '暂停',
  'resume': '继续',
  'restart': '重新开始',
  'score': '得分',
  'best': '最高分',
  'leaderboard': '本地排行榜',
  'empty': '完成一局后，这里会出现成绩',
  'over': '本局结束',
  'jump.name': '鲸鱼跃浪',
  'jump.desc': '点击或按空格、↑、W，穿过珊瑚洞穴',
  'catch.name': '蓝鲸寻宝',
  'catch.desc': '接不同分值的海洋伙伴，避开水母和海胆',
  'runner.name': '鲸跃海岸线',
  'runner.desc': '跃过海螺、海胆、珊瑚塔与沉船残骸',
} as const

export type WhaleArcadeKey = keyof typeof zh

export const en: Record<WhaleArcadeKey, string> = {
  'launcher': 'Open Whale Arcade', 'title': 'Whale Arcade', 'subtitle': 'Dive deep and play a quick round',
  'close': 'Close arcade', 'back': 'Back to games', 'play': 'Play', 'pause': 'Pause', 'resume': 'Resume',
  'restart': 'Restart', 'score': 'Score', 'best': 'Best', 'leaderboard': 'Local leaderboard',
  'empty': 'Finish a round to post a score', 'over': 'Round over',
  'jump.name': 'Whale Wave', 'jump.desc': 'Click or press Space, ↑, or W to cross coral caves',
  'catch.name': 'Blue Whale Treasure', 'catch.desc': 'Catch varied sea friends; avoid jellyfish and urchins',
  'runner.name': 'Whale Coast Run', 'runner.desc': 'Clear conches, urchins, coral towers, and wreckage',
}
