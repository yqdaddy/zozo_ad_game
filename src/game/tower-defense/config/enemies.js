/**
 * 敌人配置
 */
export const ENEMY_CONFIGS = {
  basic: {
    name: '小怪',
    emoji: '👾',
    health: 40,
    speed: 1.2,
    gold: 10,
    attack: 1,
    attackRange: 30,
    attackCooldown: 2000,
    color: '#4CAF50'
  },
  fast: {
    name: '快速怪',
    emoji: '💨',
    health: 25,
    speed: 2.2,
    gold: 15,
    attack: 1,
    attackRange: 25,
    attackCooldown: 1500,
    color: '#03A9F4'
  },
  tank: {
    name: '坦克怪',
    emoji: '🛡️',
    health: 100,
    speed: 0.7,
    gold: 25,
    attack: 2,
    attackRange: 35,
    attackCooldown: 2500,
    color: '#795548'
  },
  zombie: {
    name: '僵尸',
    emoji: '🧟',
    health: 60,
    speed: 0.9,
    gold: 20,
    attack: 2,
    attackRange: 40,
    attackCooldown: 1800,
    color: '#8BC34A'
  },
  zombieBoss: {
    name: '僵尸大Boss',
    emoji: '🧟‍♂️',
    health: 500,
    speed: 0.5,
    gold: 150,
    attack: 5,
    attackRange: 50,
    attackCooldown: 1500,
    color: '#556B2F'
  },
  boss: {
    name: 'Boss',
    emoji: '👹',
    health: 300,
    speed: 0.6,
    gold: 100,
    attack: 3,
    attackRange: 45,
    attackCooldown: 2000,
    color: '#F44336'
  }
}

/**
 * 获取波次敌人配置
 * 难度曲线：初期简单，后期困难
 * @param {Number} wave - 波次数
 */
export function getWaveEnemies(wave) {
  const enemies = []

  // 波次 1-3：入门阶段，只有少量基础怪
  if (wave <= 3) {
    const count = wave + 1  // 2, 3, 4 个
    for (let i = 0; i < count; i++) {
      enemies.push('basic')
    }
    return enemies
  }

  // 波次 4-6：初级阶段，基础怪 + 少量快速怪 + 僵尸
  if (wave <= 6) {
    const basicCount = 3 + wave
    const fastCount = wave - 3
    const zombieCount = wave >= 5 ? wave - 4 : 0
    for (let i = 0; i < basicCount; i++) enemies.push('basic')
    for (let i = 0; i < fastCount; i++) enemies.push('fast')
    for (let i = 0; i < zombieCount; i++) enemies.push('zombie')
    return enemies
  }

  // 波次 7-10：中级阶段，加入坦克怪和更多僵尸
  if (wave <= 10) {
    const basicCount = 4 + wave
    const fastCount = Math.floor(wave / 2)
    const tankCount = wave - 6
    const zombieCount = Math.floor(wave / 2)
    for (let i = 0; i < basicCount; i++) enemies.push('basic')
    for (let i = 0; i < fastCount; i++) enemies.push('fast')
    for (let i = 0; i < tankCount; i++) enemies.push('tank')
    for (let i = 0; i < zombieCount; i++) enemies.push('zombie')
    // 第 10 波出现第一个 Boss
    if (wave === 10) enemies.push('boss')
    return enemies
  }

  // 波次 11+：困难阶段，大量敌人 + 更频繁的 Boss
  const basicCount = 8 + Math.floor(wave * 0.8)
  const fastCount = 3 + Math.floor(wave / 2)
  const tankCount = 2 + Math.floor(wave / 3)
  const zombieCount = 2 + Math.floor(wave / 3)

  for (let i = 0; i < basicCount; i++) enemies.push('basic')
  for (let i = 0; i < fastCount; i++) enemies.push('fast')
  for (let i = 0; i < tankCount; i++) enemies.push('tank')
  for (let i = 0; i < zombieCount; i++) enemies.push('zombie')

  // 每 5 波出现 Boss，15 波后每 4 波出现
  const bossInterval = wave >= 15 ? 4 : 5
  if (wave % bossInterval === 0) {
    enemies.push('boss')
    // 20 波后可能出现双 Boss
    if (wave >= 20 && wave % 10 === 0) {
      enemies.push('boss')
    }
  }

  // 僵尸大Boss：第 8 波首次出现，之后每 6 波出现
  if (wave >= 8 && (wave === 8 || (wave - 8) % 6 === 0)) {
    enemies.push('zombieBoss')
  }

  // 15 波后僵尸大Boss更频繁（每 4 波）
  if (wave >= 15 && wave % 4 === 0 && wave % 6 !== 2) {
    enemies.push('zombieBoss')
  }

  return enemies
}

/**
 * 获取敌人属性（考虑波次加成）
 * 难度曲线：初期加成小，后期加成大
 * @param {String} type - 敌人类型
 * @param {Number} wave - 当前波次
 */
/**
 * @param {String} type - 敌人类型
 * @param {Number} wave - 当前波次
 * @param {Object} levelMul - 关卡难度系数 { healthMul, speedMul }
 */
export function getEnemyStats(type, wave, levelMul = {}) {
  const base = ENEMY_CONFIGS[type]
  const { healthMul = 1, speedMul = 1 } = levelMul

  // 分阶段的生命值加成
  let healthMultiplier
  if (wave <= 3) {
    healthMultiplier = 1 + (wave - 1) * 0.05
  } else if (wave <= 6) {
    healthMultiplier = 1.1 + (wave - 3) * 0.1
  } else if (wave <= 10) {
    healthMultiplier = 1.4 + (wave - 6) * 0.15
  } else {
    healthMultiplier = 2 + (wave - 10) * 0.2
  }

  // 应用关卡难度系数
  healthMultiplier *= healthMul

  // 速度在后期略微提升（最多增加 30%）
  let speedMultiplier = wave > 10 ? Math.min(1.3, 1 + (wave - 10) * 0.03) : 1
  speedMultiplier *= speedMul

  return {
    ...base,
    health: Math.floor(base.health * healthMultiplier),
    maxHealth: Math.floor(base.health * healthMultiplier),
    speed: base.speed * speedMultiplier
  }
}

export default ENEMY_CONFIGS
