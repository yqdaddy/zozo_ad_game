/**
 * 工具循环 - 包含 deltaTime 机制
 */
export class GameLoop {
  constructor(game) {
    this.game = game
    this.running = false
    this.paused = false
    this.lastTime = 0
    this.animationId = null

    // 帧率控制
    this.targetFPS = 60
    this.frameInterval = 1000 / this.targetFPS

    // 性能统计
    this.fps = 0
    this.frameCount = 0
    this.fpsTimer = 0
  }

  /**
   * 获取当前时间（兼容小程序）
   */
  _now() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now()
    }
    return Date.now()
  }

  /**
   * 请求下一帧（兼容小程序）
   */
  _requestFrame(callback) {
    if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame(callback)
    }
    return setTimeout(callback, this.frameInterval)
  }

  /**
   * 取消帧请求（兼容小程序）
   */
  _cancelFrame(id) {
    if (typeof cancelAnimationFrame !== 'undefined') {
      return cancelAnimationFrame(id)
    }
    return clearTimeout(id)
  }

  /**
   * 开始工具循环
   */
  start() {
    this.running = true
    this.paused = false
    this.lastTime = this._now()
    this.loop()
  }

  /**
   * 暂停工具循环（继续渲染但不更新）
   */
  pause() {
    this.paused = true
  }

  /**
   * 恢复工具循环
   */
  resume() {
    this.paused = false
    this.lastTime = this._now()
  }

  /**
   * 停止工具循环
   */
  stop() {
    this.running = false
    if (this.animationId) {
      this._cancelFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * 工具循环主体
   */
  loop() {
    if (!this.running) return

    const currentTime = this._now()
    const dt = currentTime - this.lastTime
    this.lastTime = currentTime

    // 防止 dt 过大（切换标签页后回来）
    const clampedDt = Math.min(dt, 100)

    // 更新 FPS 统计
    this.updateFPS(dt)

    // 暂停时只渲染，不更新
    if (!this.paused) {
      this.game.update(clampedDt)
    }
    this.game.render()

    this.animationId = this._requestFrame(() => this.loop())
  }

  /**
   * 更新 FPS 统计
   */
  updateFPS(dt) {
    this.frameCount++
    this.fpsTimer += dt
    if (this.fpsTimer >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / this.fpsTimer)
      this.frameCount = 0
      this.fpsTimer = 0
    }
  }

  /**
   * 获取当前 FPS
   */
  getFPS() {
    return this.fps
  }
}

export default GameLoop
