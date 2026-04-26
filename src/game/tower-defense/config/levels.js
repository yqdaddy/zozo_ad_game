/**
 * 关卡配置
 */
export const LEVELS = [
  {
    id: 1,
    name: '新手训练',
    emoji: '🌱',
    description: '学习基础操作',
    startingLives: 30,
    startingGold: 150,
    totalWaves: 5,
    enemyHealthMul: 0.7,
    enemySpeedMul: 0.85,
    mathDiffRange: [1, 1],
    unlockCondition: null
  },
  {
    id: 2,
    name: '初次挑战',
    emoji: '⚔️',
    description: '敌人变得更强了',
    startingLives: 25,
    startingGold: 120,
    totalWaves: 8,
    enemyHealthMul: 0.85,
    enemySpeedMul: 0.9,
    mathDiffRange: [1, 2],
    unlockCondition: { levelId: 1, stars: 1 }
  },
  {
    id: 3,
    name: '数学战场',
    emoji: '📐',
    description: '数学题更有挑战',
    startingLives: 20,
    startingGold: 100,
    totalWaves: 10,
    enemyHealthMul: 1.0,
    enemySpeedMul: 1.0,
    mathDiffRange: [1, 2],
    unlockCondition: { levelId: 2, stars: 1 }
  },
  {
    id: 4,
    name: '精英防线',
    emoji: '🛡️',
    description: '精英怪物出没',
    startingLives: 20,
    startingGold: 100,
    totalWaves: 12,
    enemyHealthMul: 1.15,
    enemySpeedMul: 1.05,
    mathDiffRange: [1, 3],
    unlockCondition: { levelId: 3, stars: 1 }
  },
  {
    id: 5,
    name: '地狱难度',
    emoji: '🔥',
    description: '只有高手才能通过',
    startingLives: 15,
    startingGold: 80,
    totalWaves: 15,
    enemyHealthMul: 1.3,
    enemySpeedMul: 1.15,
    mathDiffRange: [2, 3],
    unlockCondition: { levelId: 4, stars: 2 }
  },
  {
    id: 6,
    name: '终极Boss',
    emoji: '💀',
    description: '最终的考验',
    startingLives: 10,
    startingGold: 80,
    totalWaves: 20,
    enemyHealthMul: 1.5,
    enemySpeedMul: 1.2,
    mathDiffRange: [2, 3],
    unlockCondition: { levelId: 5, stars: 2 }
  }
]

/**
 * 获取关卡配置
 */
export function getLevelConfig(id) {
  return LEVELS.find(l => l.id === id) || LEVELS[0]
}

/**
 * 检查关卡是否解锁
 * @param {Number} id - 关卡ID
 * @param {Object} progressData - { levelId: { bestStars, completed } }
 */
export function isLevelUnlocked(id, progressData = {}) {
  const level = LEVELS.find(l => l.id === id)
  if (!level) return false
  if (!level.unlockCondition) return true

  const { levelId, stars } = level.unlockCondition
  const progress = progressData[levelId]
  if (!progress) return false
  return progress.completed && progress.bestStars >= stars
}

export default LEVELS
