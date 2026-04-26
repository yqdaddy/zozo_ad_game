/**
 * 子弹类
 */
import { Entity } from './Entity.js'

export class Projectile extends Entity {
  constructor(game, options) {
    super(game, options.x, options.y)

    this.targetId = options.targetId
    this.damage = options.damage
    this.speed = options.speed || 8
    this.color = options.color || '#FFD700'
    this.size = options.size || 4

    // 特殊效果
    this.splash = options.splash || 0
    this.slowEffect = options.slowEffect || 0
    this.slowDuration = options.slowDuration || 0
  }

  /**
   * 更新
   */
  update(dt) {
    // 查找目标
    const target = this.game.enemies.find(e => e.id === this.targetId)

    if (!target) {
      // 目标已死亡，创建命中特效并销毁子弹
      this.game.createHitEffect(this.x, this.y, this.color)
      this.isDead = true
      return
    }

    // 计算朝向目标移动
    const dx = target.x - this.x
    const dy = target.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 移动速度转换
    const moveSpeed = this.speed * (dt / 16.67) * this.game.state.gameSpeed

    if (dist < 12) {
      // 命中目标
      this.hit(target)
    } else {
      // 继续追踪
      this.x += (dx / dist) * moveSpeed
      this.y += (dy / dist) * moveSpeed
    }
  }

  /**
   * 命中目标
   */
  hit(target) {
    // 造成伤害
    target.takeDamage(this.damage)

    // 减速效果
    if (this.slowEffect) {
      target.applySlow(this.slowDuration)
    }

    // 溅射伤害
    if (this.splash) {
      this.game.enemies.forEach(enemy => {
        if (enemy.id !== target.id) {
          const splashDist = Math.sqrt(
            Math.pow(enemy.x - target.x, 2) +
            Math.pow(enemy.y - target.y, 2)
          )
          if (splashDist < this.splash) {
            enemy.takeDamage(this.damage * 0.5)
          }
        }
      })
      this.game.createSplashEffect(target.x, target.y, this.splash)
    }

    // 命中特效
    this.game.createHitEffect(this.x, this.y, this.color)

    // 销毁子弹
    this.isDead = true
  }

  /**
   * 渲染
   */
  render(ctx) {
    // 子弹拖尾
    ctx.globalAlpha = 0.4
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // 子弹本体
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

export default Projectile
