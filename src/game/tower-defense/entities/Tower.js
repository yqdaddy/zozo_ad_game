/**
 * 防御塔类
 */
import { Entity } from './Entity.js'
import { TOWER_CONFIGS, getUpgradedStats, getUpgradeCost } from '../config/towers.js'

export class Tower extends Entity {
  constructor(game, gridX, gridY, type) {
    const config = TOWER_CONFIGS[type]
    const { gridSize } = game.config

    super(
      game,
      gridX * gridSize + gridSize / 2,
      gridY * gridSize + gridSize / 2
    )

    this.type = type
    this.gridX = gridX
    this.gridY = gridY
    this.level = 1

    // 基础配置
    this.baseConfig = { ...config }

    // 生命值
    this.health = config.health || 100
    this.maxHealth = config.health || 100

    // 战斗属性
    this.damage = config.damage
    this.range = config.range
    this.fireRate = config.fireRate
    this.projectileSpeed = config.projectileSpeed
    this.lastFireTime = 0

    // 特殊效果
    this.splash = config.splash || 0
    this.slowEffect = config.slowEffect || 0
    this.slowDuration = config.slowDuration || 0

    // 金币矿场属性
    this.isGoldMine = config.isGoldMine || false
    if (this.isGoldMine) {
      this.goldPerCycle = config.goldPerCycle || 12
      this.productionInterval = config.productionInterval || 10000
      this.productionTimer = 0
    }

    // 视觉属性
    this.emoji = config.emoji
    this.color = config.color
    this.projectileColor = config.projectileColor
    this.angle = 0
    this.target = null
  }

  /**
   * 更新
   */
  update(dt) {
    // 金币矿场：产金逻辑
    if (this.isGoldMine) {
      this.productionTimer += dt * this.game.state.gameSpeed
      if (this.productionTimer >= this.productionInterval) {
        this.productionTimer -= this.productionInterval
        const amount = Math.floor(this.goldPerCycle * (1 + (this.level - 1) * 0.5))
        this.game.addGold(amount)
        this.game.createGoldEffect(this.x, this.y)
        this.game.events.emit('goldProduced', { amount })
      }
      return
    }

    // 寻找目标
    this.findTarget()

    // 瞄准目标
    if (this.target) {
      this.angle = Math.atan2(
        this.target.y - this.y,
        this.target.x - this.x
      )

      // 开火检测
      const now = Date.now()
      const adjustedFireRate = this.fireRate / this.game.state.gameSpeed
      if (now - this.lastFireTime > adjustedFireRate) {
        this.fire()
        this.lastFireTime = now
      }
    }
  }

  /**
   * 寻找最近的敌人
   */
  findTarget() {
    let nearestEnemy = null
    let minDist = this.range

    for (const enemy of this.game.enemies) {
      const dist = this.distanceTo(enemy)
      if (dist < minDist) {
        minDist = dist
        nearestEnemy = enemy
      }
    }

    this.target = nearestEnemy
  }

  /**
   * 发射子弹
   */
  fire() {
    if (!this.target) return

    this.game.createProjectile({
      x: this.x,
      y: this.y,
      targetId: this.target.id,
      damage: this.damage,
      speed: this.projectileSpeed,
      color: this.projectileColor,
      splash: this.splash,
      slowEffect: this.slowEffect,
      slowDuration: this.slowDuration,
      size: this.splash ? 6 : 4
    })
  }

  /**
   * 升级
   */
  upgrade() {
    this.level++
    const newStats = getUpgradedStats(this.baseConfig, this.level)
    this.damage = newStats.damage
    this.range = newStats.range
    this.fireRate = newStats.fireRate
  }

  /**
   * 获取升级费用
   */
  getUpgradeCost() {
    if (this.isGoldMine) {
      return Math.floor(this.baseConfig.cost * this.level * 1.0)
    }
    return getUpgradeCost(this.baseConfig.cost, this.level)
  }

  /**
   * 受到伤害
   */
  takeDamage(damage) {
    this.health -= damage
    if (this.health <= 0) {
      this.health = 0
      this.isDead = true
      this.game.events.emit('towerDestroyed', this)
    }
  }

  /**
   * 渲染
   */
  render(ctx) {
    const { gridSize } = this.game.config
    const size = gridSize - 8

    // 攻击范围（未选择塔时显示）
    if (!this.game.selectedTower) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 塔底座
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // 塔的朝向指示
    if (this.target) {
      ctx.strokeStyle = this.projectileColor || '#fff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(
        this.x + Math.cos(this.angle) * (size / 2 + 5),
        this.y + Math.sin(this.angle) * (size / 2 + 5)
      )
      ctx.stroke()
      ctx.lineWidth = 1
    }

    // 塔的 emoji
    ctx.font = `${size * 0.55}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.emoji, this.x, this.y)

    // 金币矿场进度环
    if (this.isGoldMine) {
      const progress = this.productionTimer / this.productionInterval
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(this.x, this.y, size / 2 + 3, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
      ctx.stroke()
      ctx.lineWidth = 1
    }

    // 等级标识
    if (this.level > 1) {
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 10px Arial'
      ctx.fillText(`Lv${this.level}`, this.x, this.y - size / 2 - 6)
    }

    // 血条（只在受伤时显示）
    if (this.health < this.maxHealth) {
      const hpWidth = size * 0.8
      const hpHeight = 4
      const hpX = this.x - hpWidth / 2
      const hpY = this.y + size / 2 + 4

      // 血条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(hpX, hpY, hpWidth, hpHeight)

      // 当前血量
      const hpRatio = this.health / this.maxHealth
      ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336'
      ctx.fillRect(hpX, hpY, hpWidth * hpRatio, hpHeight)
    }
  }
}

export default Tower
