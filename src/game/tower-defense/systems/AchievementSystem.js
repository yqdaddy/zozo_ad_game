import { storageManager } from '@/utils/storage-manager'

/**
 * 成就与星级系统
 */
export class AchievementSystem {
  constructor(game) {
    this.game = game

    // 成就定义
    this.achievements = [
      // 答题类
      { id: 'first_correct', name: '初露锋芒', desc: '答对第一道题', icon: '🌱', condition: (s) => s.correctCount >= 1 },
      { id: 'streak_5', name: '连胜小将', desc: '连续答对5题', icon: '🔥', condition: (s) => s.maxCombo >= 5 },
      { id: 'streak_10', name: '学霸之路', desc: '连续答对10题', icon: '⭐', condition: (s) => s.maxCombo >= 10 },
      { id: 'accuracy_90', name: '精准大师', desc: '正确率达到90%', icon: '🎯', condition: (s) => s.accuracy >= 0.9 && s.questionsAnswered >= 10 },

      // 防守类
      { id: 'wave_5', name: '初级守护者', desc: '坚守到第5波', icon: '🛡️', condition: (s) => s.wave >= 5 },
      { id: 'wave_10', name: '中级守护者', desc: '坚守到第10波', icon: '🏰', condition: (s) => s.wave >= 10 },
      { id: 'perfect_life', name: '金身不破', desc: '生命值保持满血通过5波', icon: '💖', condition: (s) => s.perfectWaves >= 5 },

      // 建造类
      { id: 'builder_10', name: '建筑新手', desc: '建造10座塔', icon: '🏗️', condition: (s) => s.towersBuilt >= 10 },
      { id: 'max_level', name: '塔王', desc: '将塔升到5级', icon: '👑', condition: (s) => s.maxTowerLevel >= 5 },

      // 综合类
      { id: 'score_1000', name: '千分俱乐部', desc: '单局获得1000分', icon: '💎', condition: (s) => s.score >= 1000 },
      { id: 'no_skip', name: '诚实守信', desc: '一局不跳过任何题目', icon: '✊', condition: (s) => s.skipCount === 0 && s.questionsAnswered >= 10 }
    ]

    // 已解锁成就（从本地存储读取）
    this.unlocked = this.loadUnlocked()

    // 本局统计
    this.sessionStats = this.getDefaultStats()

    // 新解锁的成就（本局）
    this.newlyUnlocked = []
  }

  /**
   * 获取默认统计
   */
  getDefaultStats() {
    return {
      correctCount: 0,
      wrongCount: 0,
      maxCombo: 0,
      wave: 1,
      perfectWaves: 0,
      towersBuilt: 0,
      maxTowerLevel: 1,
      score: 0,
      skipCount: 0,
      questionsAnswered: 0,
      accuracy: 0
    }
  }

  /**
   * 重置本局统计
   */
  reset() {
    this.sessionStats = this.getDefaultStats()
    this.newlyUnlocked = []
  }

  /**
   * 更新统计
   */
  updateStat(key, value) {
    if (typeof value === 'function') {
      this.sessionStats[key] = value(this.sessionStats[key])
    } else {
      this.sessionStats[key] = value
    }

    // 更新正确率
    if (this.sessionStats.questionsAnswered > 0) {
      this.sessionStats.accuracy =
        this.sessionStats.correctCount / this.sessionStats.questionsAnswered
    }

    this.checkAchievements()
  }

  /**
   * 检查成就解锁
   */
  checkAchievements() {
    const stats = this.sessionStats

    for (const achievement of this.achievements) {
      if (this.unlocked.includes(achievement.id)) continue

      try {
        if (achievement.condition(stats)) {
          this.unlock(achievement)
        }
      } catch (e) {
        console.error('Achievement condition error:', achievement.id, e)
      }
    }
  }

  /**
   * 解锁成就
   */
  unlock(achievement) {
    this.unlocked.push(achievement.id)
    this.newlyUnlocked.push(achievement)
    this.saveUnlocked()

    this.game.events.emit('achievementUnlocked', achievement)
  }

  /**
   * 计算星级
   */
  calculateStars() {
    const { wave, correctCount, questionsAnswered, maxCombo } = this.sessionStats
    const accuracy = questionsAnswered > 0 ? correctCount / questionsAnswered : 0

    let stars = 0
    let details = []

    // 波数贡献（最多 1 星）
    if (wave >= 10) {
      stars += 1
      details.push('🌟 坚守10波以上')
    } else if (wave >= 5) {
      stars += 0.5
      details.push('⭐ 坚守5波以上')
    }

    // 正确率贡献（最多 1 星）
    if (accuracy >= 0.9) {
      stars += 1
      details.push('🌟 正确率90%+')
    } else if (accuracy >= 0.7) {
      stars += 0.5
      details.push('⭐ 正确率70%+')
    }

    // 连击贡献（最多 1 星）
    if (maxCombo >= 8) {
      stars += 1
      details.push('🌟 最高连击8+')
    } else if (maxCombo >= 5) {
      stars += 0.5
      details.push('⭐ 最高连击5+')
    }

    return {
      stars: Math.min(3, Math.floor(stars)),
      details
    }
  }

  /**
   * 获取激励语
   */
  getEncouragement() {
    const { accuracy, wave } = this.sessionStats

    if (accuracy >= 0.9) {
      return '太棒了！你是数学小天才！🧠'
    } else if (accuracy >= 0.7) {
      return '做得很好！继续保持！💪'
    } else if (wave >= 5) {
      return '坚持就是胜利！再接再厉！🌈'
    } else {
      return '没关系，每次尝试都是进步！🌱'
    }
  }

  /**
   * 本地存储操作
   */
  loadUnlocked() {
    return storageManager.loadData('achievements', [])
  }

  saveUnlocked() {
    storageManager.saveData('achievements', this.unlocked)
  }

  /**
   * 获取所有成就（包含解锁状态）
   */
  getAllAchievements() {
    return this.achievements.map(a => ({
      ...a,
      unlocked: this.unlocked.includes(a.id)
    }))
  }
}

export default AchievementSystem
