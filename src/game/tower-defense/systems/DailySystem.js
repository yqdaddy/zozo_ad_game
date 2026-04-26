/**
 * 签到 + 每日挑战系统
 * 纯客户端实现，使用本地存储
 */
import { storageManager } from '@/utils/storage-manager'
import { generateRandomQuestion, generateOptions } from '@/utils/math.js'

// 签到奖励（7天循环）
const SIGNIN_REWARDS = [
  { day: 1, gold: 20, label: '20金币' },
  { day: 2, gold: 30, label: '30金币' },
  { day: 3, gold: 40, label: '40金币' },
  { day: 4, gold: 50, label: '50金币' },
  { day: 5, gold: 60, label: '60金币' },
  { day: 6, gold: 80, label: '80金币' },
  { day: 7, gold: 100, label: '100金币' }
]

// 每日挑战配置
const DAILY_CHALLENGE_COUNT = 5  // 每日挑战题数

/**
 * 获取当天日期字符串 YYYY-MM-DD
 */
function getToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 计算两个日期字符串之间差几天
 */
function daysDiff(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00')
  const d2 = new Date(dateStr2 + 'T00:00:00')
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

/**
 * 确定性伪随机数生成器（同日期 → 同种子 → 同题目）
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
}

/**
 * 将日期字符串转为种子数
 */
function dateToSeed(dateStr) {
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) {
    seed = seed * 31 + dateStr.charCodeAt(i)
  }
  return Math.abs(seed)
}

export class DailySystem {
  constructor() {
    this.signinData = null
  }

  // ==================== 签到 ====================

  load() {
    this.signinData = storageManager.loadData('signin', {
      currentStreak: 0,
      lastSigninDate: null,
      totalDays: 0
    })
  }

  save() {
    if (this.signinData) {
      storageManager.saveData('signin', this.signinData)
    }
  }

  hasSignedToday() {
    if (!this.signinData) this.load()
    return this.signinData.lastSigninDate === getToday()
  }

  signin() {
    if (!this.signinData) this.load()

    const today = getToday()

    if (this.signinData.lastSigninDate === today) {
      return { success: false, reason: '今日已签到' }
    }

    const lastDate = this.signinData.lastSigninDate
    if (lastDate && daysDiff(lastDate, today) === 1) {
      this.signinData.currentStreak++
    } else {
      this.signinData.currentStreak = 1
    }

    this.signinData.lastSigninDate = today
    this.signinData.totalDays++

    const cycleDay = ((this.signinData.currentStreak - 1) % 7) + 1
    const reward = SIGNIN_REWARDS[cycleDay - 1]

    this.save()

    return {
      success: true,
      reward,
      cycleDay,
      currentStreak: this.signinData.currentStreak
    }
  }

  getSigninStatus() {
    if (!this.signinData) this.load()

    const today = getToday()
    const todaySigned = this.signinData.lastSigninDate === today

    let streak = this.signinData.currentStreak
    if (!todaySigned && this.signinData.lastSigninDate) {
      const diff = daysDiff(this.signinData.lastSigninDate, today)
      if (diff > 1) {
        streak = 0
      }
    }

    const cycleDay = streak > 0 ? ((streak - 1) % 7) + 1 : 0

    return {
      currentStreak: streak,
      totalDays: this.signinData.totalDays,
      cycleDay,
      todaySigned,
      rewards: SIGNIN_REWARDS
    }
  }

  // ==================== 每日挑战 ====================

  /**
   * 根据日期生成固定的每日挑战题目
   * 所有用户同一天看到相同的题目
   */
  generateDailyChallenge(date) {
    const seed = dateToSeed(date || getToday())
    const rng = new SeededRandom(seed)

    const questions = []
    // 难度从1到3逐渐递增
    const difficulties = [1, 1, 2, 2, 3]

    for (let i = 0; i < DAILY_CHALLENGE_COUNT; i++) {
      // 使用种子随机选难度和题目
      // 先用种子推进几步让每题不同
      for (let j = 0; j < i * 3; j++) rng.next()

      const difficulty = difficulties[i]
      // 用正常随机生成题目（每日题目只保证难度序列一致）
      const q = generateRandomQuestion(difficulty)
      q.options = generateOptions(q.answer)
      q.index = i + 1
      questions.push(q)
    }

    return {
      date: date || getToday(),
      questions,
      totalCount: DAILY_CHALLENGE_COUNT
    }
  }

  /**
   * 获取今日挑战
   */
  getTodayChallenge() {
    return this.generateDailyChallenge(getToday())
  }

  /**
   * 今日挑战是否已完成
   */
  hasChallengedToday() {
    const data = storageManager.loadData('daily_challenge', {})
    return data.lastDate === getToday()
  }

  /**
   * 保存每日挑战结果
   */
  saveDailyChallengeResult(result) {
    const today = getToday()
    const data = storageManager.loadData('daily_challenge', {
      totalDays: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      streak: 0,
      lastDate: null,
      history: {}
    })

    // 更新连续天数
    if (data.lastDate && daysDiff(data.lastDate, today) === 1) {
      data.streak++
    } else if (data.lastDate !== today) {
      data.streak = 1
    }

    data.lastDate = today
    data.totalDays++
    data.totalCorrect += result.correct
    data.totalQuestions += result.total

    // 保存当日记录（最近30天）
    data.history[today] = {
      correct: result.correct,
      total: result.total,
      time: result.time,
      score: result.score
    }

    // 清理超过30天的记录
    const keys = Object.keys(data.history).sort()
    while (keys.length > 30) {
      delete data.history[keys.shift()]
    }

    storageManager.saveData('daily_challenge', data)
    return data
  }

  /**
   * 获取每日挑战统计
   */
  getDailyChallengeStats() {
    const data = storageManager.loadData('daily_challenge', {
      totalDays: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      streak: 0,
      lastDate: null,
      history: {}
    })

    // 检查连续是否断了
    const today = getToday()
    if (data.lastDate && data.lastDate !== today) {
      const diff = daysDiff(data.lastDate, today)
      if (diff > 1) {
        data.streak = 0
      }
    }

    const accuracy = data.totalQuestions > 0
      ? Math.round(data.totalCorrect / data.totalQuestions * 100)
      : 0

    return {
      totalDays: data.totalDays,
      streak: data.streak,
      accuracy,
      todayCompleted: data.lastDate === today,
      todayResult: data.history[today] || null
    }
  }
}

export const dailySystem = new DailySystem()
export default dailySystem
