/**
 * 敌人类
 */
import { Entity } from './Entity.js'
import { ENEMY_CONFIGS, getEnemyStats } from '../config/enemies.js'

export class Enemy extends Entity {
  constructor(game, type, path, wave, levelMul = {}) {
    const startPos = path[0]
    super(game, startPos.x, startPos.y)

    const stats = getEnemyStats(type, wave, levelMul)

    this.type = type
    this.path = path
    this.pathIndex = 0

    // 生命值
    this.health = stats.health
    this.maxHealth = stats.maxHealth

    // 移动
    this.baseSpeed = stats.speed
    this.speed = this.baseSpeed
    this.slowUntil = 0

    // 奖励
    this.gold = stats.gold

    // 攻击力
    this.attack = stats.attack || 1

    // 视觉
    this.emoji = stats.emoji
    this.color = stats.color
  }

  /**
   * 更新
   */
  update(dt) {
    // 减速效果
    const now = Date.now()
    if (this.slowUntil > now) {
      this.speed = this.baseSpeed * 0.5
    } else {
      this.speed = this.baseSpeed
    }

    // 沿路径移动
    this.moveAlongPath(dt)

    // 死亡检测
    if (this.health <= 0) {
      this.die()
    }
  }

  /**
   * 沿路径移动
   */
  moveAlongPath(dt) {
    if (this.pathIndex >= this.path.length - 1) {
      // 到达终点
      this.reachEnd()
      return
    }

    const target = this.path[this.pathIndex + 1]
    const dx = target.x - this.x
    const dy = target.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 移动速度转换（dt 是毫秒，speed 是每帧像素）
    // 标准帧时间 16.67ms，根据实际 dt 调整
    const moveSpeed = this.speed * (dt / 16.67) * this.game.state.gameSpeed

    if (dist < moveSpeed * 2) {
      this.pathIndex++
    } else {
      this.x += (dx / dist) * moveSpeed
      this.y += (dy / dist) * moveSpeed
    }
  }

  /**
   * 受到伤害
   */
  takeDamage(damage) {
    this.health -= damage
    if (this.health <= 0) {
      this.health = 0
    }
  }

  /**
   * 应用减速效果
   */
  applySlow(duration) {
    this.slowUntil = Date.now() + duration
  }

  /**
   * 死亡
   */
  die() {
    this.isDead = true
    this.game.state.gold += this.gold
    this.game.state.score += this.gold * 10
    this.game.state.enemiesKilled++

    // 创建死亡特效
    this.game.createDeathEffect(this.x, this.y, this.color)

    // 触发事件
    this.game.events.emit('enemyDied', this)
  }

  /**
   * 到达终点
   */
  reachEnd() {
    this.isDead = true
    // 根据攻击力扣减生命值
    this.game.state.lives -= this.attack

    // 触发事件
    this.game.events.emit('enemyReachedEnd', this)

    if (this.game.state.lives <= 0) {
      this.game.state.lives = 0
      this.game.gameOver(false)
    }
  }

  /**
   * 渲染
   */
  render(ctx) {
    const { gridSize } = this.game.config
    const size = gridSize * 0.6

    // 减速效果光环
    if (this.slowUntil > Date.now()) {
      ctx.fillStyle = 'rgba(0, 188, 212, 0.3)'
      ctx.beginPath()
      ctx.arc(this.x, this.y, size / 2 + 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // 敌人身体
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // 敌人 emoji
    ctx.font = `${size * 0.7}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.emoji, this.x, this.y)

    // 血条背景
    const hpWidth = size * 1.2
    const hpHeight = 4
    const hpX = this.x - hpWidth / 2
    const hpY = this.y - size / 2 - 8

    ctx.fillStyle = '#333'
    ctx.fillRect(hpX, hpY, hpWidth, hpHeight)

    // 血条
    const hpPercent = Math.max(0, this.health / this.maxHealth)
    ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336'
    ctx.fillRect(hpX, hpY, hpWidth * hpPercent, hpHeight)
  }
}

export default Enemy
