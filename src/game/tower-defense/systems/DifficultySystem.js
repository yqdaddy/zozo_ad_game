/**
 * 动态难度调整系统
 */
export class DifficultySystem {
  constructor(game) {
    this.game = game

    // 难度级别（1-3，支持小数）
    this.currentDifficulty = 1.0
    this.minDifficulty = 1
    this.maxDifficulty = 3

    // 关卡数学题难度范围约束
    this.mathDiffRange = null

    // 答题历史（滑动窗口）
    this.history = []
    this.windowSize = 10

    // 难度调整参数
    this.adjustSpeed = 0.15  // 每次调整幅度
    this.targetAccuracy = 0.7  // 目标正确率 70%
  }

  /**
   * 记录答题结果
   */
  recordAnswer(correct) {
    this.history.push(correct)
    if (this.history.length > this.windowSize) {
      this.history.shift()
    }

    this.adjustDifficulty()
  }

  /**
   * 调整难度
   */
  adjustDifficulty() {
    if (this.history.length < 5) return  // 样本太少不调整

    const accuracy = this.getAccuracy()

    if (accuracy > this.targetAccuracy + 0.15) {
      // 正确率高于 85%，提升难度
      this.currentDifficulty = Math.min(
        this.maxDifficulty,
        this.currentDifficulty + this.adjustSpeed
      )
    } else if (accuracy < this.targetAccuracy - 0.15) {
      // 正确率低于 55%，降低难度
      this.currentDifficulty = Math.max(
        this.minDifficulty,
        this.currentDifficulty - this.adjustSpeed
      )
    }

    this.game.events.emit('difficultyChange', {
      difficulty: this.currentDifficulty,
      accuracy: accuracy
    })
  }

  /**
   * 获取当前正确率
   */
  getAccuracy() {
    if (this.history.length === 0) return 0.5
    const correct = this.history.filter(x => x).length
    return correct / this.history.length
  }

  /**
   * 获取题目难度（整数 1-3）
   */
  /**
   * 设置关卡数学题难度范围
   */
  setMathDiffRange(range) {
    this.mathDiffRange = range
  }

  getQuestionDifficulty() {
    // 添加随机性，偶尔出简单题保持信心
    let baseLevel = Math.round(this.currentDifficulty)

    if (Math.random() < 0.2) {
      // 20% 概率降一级难度（给孩子喘息空间）
      baseLevel = Math.max(1, baseLevel - 1)
    }

    // 受关卡数学题范围约束
    if (this.mathDiffRange) {
      baseLevel = Math.max(this.mathDiffRange[0], Math.min(this.mathDiffRange[1], baseLevel))
    }

    return baseLevel
  }

  /**
   * 获取波次难度加成
   */
  getWaveMultiplier() {
    return 1 + (this.currentDifficulty - 1) * 0.2
  }

  /**
   * 获取难度描述
   */
  getDifficultyLabel() {
    if (this.currentDifficulty < 1.5) return { label: '入门', color: '#4CAF50' }
    if (this.currentDifficulty < 2.5) return { label: '挑战', color: '#FF9800' }
    return { label: '高手', color: '#F44336' }
  }

  /**
   * 重置
   */
  reset() {
    this.currentDifficulty = 1.0
    this.history = []
    this.mathDiffRange = null
  }
}

export default DifficultySystem
