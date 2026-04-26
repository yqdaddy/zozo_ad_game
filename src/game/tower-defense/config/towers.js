/**
 * 防御塔配置
 */
export const TOWER_CONFIGS = {
  archer: {
    name: '弓箭塔',
    emoji: '🏹',
    cost: 50,
    health: 100,
    damage: 15,
    range: 80,
    fireRate: 600,
    projectileSpeed: 10,
    color: '#8B4513',
    projectileColor: '#FFD700',
    description: '攻速快，单体伤害'
  },
  magic: {
    name: '魔法塔',
    emoji: '✨',
    cost: 80,
    health: 80,
    damage: 20,
    range: 70,
    fireRate: 1000,
    projectileSpeed: 8,
    color: '#9C27B0',
    projectileColor: '#E040FB',
    splash: 30,
    description: '范围攻击，群伤'
  },
  cannon: {
    name: '炮塔',
    emoji: '💣',
    cost: 100,
    health: 150,
    damage: 40,
    range: 75,
    fireRate: 1500,
    projectileSpeed: 6,
    color: '#555555',
    projectileColor: '#FF5722',
    description: '高伤害，攻速慢'
  },
  ice: {
    name: '冰冻塔',
    emoji: '❄️',
    cost: 70,
    health: 80,
    damage: 8,
    range: 70,
    fireRate: 800,
    projectileSpeed: 9,
    color: '#00BCD4',
    projectileColor: '#80DEEA',
    slowEffect: 0.5,
    slowDuration: 2000,
    description: '减速敌人'
  },
  goldMine: {
    name: '金币矿场',
    emoji: '⛏️',
    cost: 120,
    health: 80,
    damage: 0,
    range: 0,
    fireRate: 0,
    projectileSpeed: 0,
    color: '#FFD700',
    projectileColor: '#FFD700',
    description: '每10秒生产金币',
    isGoldMine: true,
    goldPerCycle: 12,
    productionInterval: 10000
  }
}

/**
 * 塔列表（用于 UI 显示）
 */
export const TOWER_LIST = Object.keys(TOWER_CONFIGS).map(type => ({
  type,
  ...TOWER_CONFIGS[type]
}))

/**
 * 获取升级后的属性
 */
export function getUpgradedStats(baseConfig, level) {
  return {
    damage: Math.floor(baseConfig.damage * Math.pow(1.3, level - 1)),
    range: Math.floor(baseConfig.range * Math.pow(1.1, level - 1)),
    fireRate: Math.floor(baseConfig.fireRate * Math.pow(0.9, level - 1))
  }
}

/**
 * 获取升级费用
 */
export function getUpgradeCost(baseCost, level) {
  return Math.floor(baseCost * level * 0.7)
}

export default TOWER_CONFIGS
