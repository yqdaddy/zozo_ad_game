/**
 * 游戏存档系统
 * 支持3个手动存档槽 + 1个自动存档槽
 */
import { storageManager } from '@/utils/storage-manager'

export class SaveSystem {
  constructor(game) {
    this.game = game
    this.version = '1.0'
  }

  /**
   * 自动存档（每波结束后调用）
   */
  autoSave() {
    this.saveToSlot(0)
  }

  /**
   * 保存到指定槽位
   * @param {Number} slot - 0=自动, 1-3=手动
   */
  saveToSlot(slot) {
    const game = this.game
    const saveData = {
      timestamp: Date.now(),
      version: this.version,
      slot,
      levelId: game.levelConfig ? game.levelConfig.id : null,
      state: {
        lives: game.state.lives,
        gold: game.state.gold,
        wave: game.state.wave,
        score: game.state.score,
        questionsAnswered: game.state.questionsAnswered,
        questionsCorrect: game.state.questionsCorrect,
        enemiesKilled: game.state.enemiesKilled
      },
      towers: game.towers.map(t => ({
        gridX: t.gridX,
        gridY: t.gridY,
        type: t.type,
        level: t.level,
        health: t.health
      })),
      difficulty: {
        current: game.difficultySystem.currentDifficulty,
        history: [...game.difficultySystem.history]
      },
      combo: {
        combo: game.comboSystem.combo,
        maxCombo: game.comboSystem.maxCombo
      },
      path: game.pathSystem.path.map(p => ({ x: p.x, y: p.y })),
      pathGrid: game.pathSystem.pathGrid.map(row => [...row])
    }

    const saves = storageManager.loadData('saves', {})
    saves[slot] = saveData
    storageManager.saveData('saves', saves)
  }

  /**
   * 从指定槽位读取
   * @param {Number} slot
   * @returns {Object|null} 存档数据
   */
  loadFromSlot(slot) {
    const saves = storageManager.loadData('saves', {})
    return saves[slot] || null
  }

  /**
   * 获取槽位信息摘要
   * @param {Number} slot
   * @returns {Object|null}
   */
  getSlotInfo(slot) {
    const save = this.loadFromSlot(slot)
    if (!save) return null
    return {
      slot,
      timestamp: save.timestamp,
      wave: save.state.wave,
      gold: save.state.gold,
      lives: save.state.lives,
      score: save.state.score,
      levelId: save.levelId,
      towerCount: save.towers.length,
      dateStr: new Date(save.timestamp).toLocaleString()
    }
  }

  /**
   * 获取所有槽位信息
   * @returns {Array}
   */
  getAllSlotInfo() {
    const slots = []
    for (let i = 0; i <= 3; i++) {
      slots.push(this.getSlotInfo(i))
    }
    return slots
  }

  /**
   * 删除指定槽位
   */
  deleteSlot(slot) {
    const saves = storageManager.loadData('saves', {})
    delete saves[slot]
    storageManager.saveData('saves', saves)
  }
}

export default SaveSystem
