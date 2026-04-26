/**
 * 数学塔防工具 - 入口文件
 */
import { Game } from './core/Game.js'
import { GameLoop } from './core/GameLoop.js'
import { EventBus } from './core/EventBus.js'
import { Tower } from './entities/Tower.js'
import { Enemy } from './entities/Enemy.js'
import { Projectile } from './entities/Projectile.js'
import { Particle } from './entities/Particle.js'
import { PathSystem } from './systems/PathSystem.js'
import { ComboSystem } from './systems/ComboSystem.js'
import { DifficultySystem } from './systems/DifficultySystem.js'
import { AchievementSystem } from './systems/AchievementSystem.js'
import { SaveSystem } from './systems/SaveSystem.js'
import { DailySystem } from './systems/DailySystem.js'
import { encodeChallenge, decodeChallenge, compareResults, saveSentChallenge, saveChallengeResponse } from './systems/ChallengeSystem.js'
import { TOWER_CONFIGS, TOWER_LIST, getUpgradedStats, getUpgradeCost } from './config/towers.js'
import { ENEMY_CONFIGS, getWaveEnemies, getEnemyStats } from './config/enemies.js'
import { LEVELS, getLevelConfig, isLevelUnlocked } from './config/levels.js'

export {
  Game,
  GameLoop,
  EventBus,
  Tower,
  Enemy,
  Projectile,
  Particle,
  PathSystem,
  ComboSystem,
  DifficultySystem,
  AchievementSystem,
  SaveSystem,
  DailySystem,
  encodeChallenge,
  decodeChallenge,
  compareResults,
  saveSentChallenge,
  saveChallengeResponse,
  TOWER_CONFIGS,
  TOWER_LIST,
  getUpgradedStats,
  getUpgradeCost,
  ENEMY_CONFIGS,
  getWaveEnemies,
  getEnemyStats,
  LEVELS,
  getLevelConfig,
  isLevelUnlocked
}

export default Game
