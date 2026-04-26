# 游戏实体文档

## 1. Entity.js — 基类

**路径**：`src/game/tower-defense/entities/Entity.js`

所有游戏实体的基类。

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `game` | Game | 游戏主控制器引用 |
| `x` | Number | 逻辑X坐标 |
| `y` | Number | 逻辑Y坐标 |
| `isDead` | Boolean | 标记死亡（下帧移除） |
| `id` | Number | 唯一ID（Date.now() + Math.random()） |

### 方法

| 方法 | 说明 |
|------|------|
| `update(dt)` | 每帧更新（子类重写） |
| `render(ctx)` | 每帧渲染（子类重写） |
| `distanceTo(other)` | 计算到另一实体的距离 |
| `distanceToPoint(x, y)` | 计算到指定点的距离 |
| `kill()` | 标记为死亡 |

---

## 2. Tower.js — 防御塔

**路径**：`src/game/tower-defense/entities/Tower.js`

### 构造函数

```js
new Tower(game, gridX, gridY, type)
```

`type` 可选值：`'archer'`、`'magic'`、`'cannon'`、`'ice'`、`'goldMine'`

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | String | 塔类型 |
| `gridX` / `gridY` | Number | 网格坐标 |
| `level` | Number | 等级（1起步） |
| `baseConfig` | Object | 原始配置副本 |
| `damage` | Number | 当前伤害 |
| `range` | Number | 攻击范围（像素） |
| `fireRate` | Number | 射击间隔（毫秒） |
| `health` / `maxHealth` | Number | 生命值 |
| `splash` | Number | 溅射半径（magic塔） |
| `slowEffect` | Number | 减速比例（ice塔） |
| `slowDuration` | Number | 减速持续时间 |
| `isGoldMine` | Boolean | 是否为金币矿场 |
| `goldPerCycle` | Number | 每周期产金量（矿场） |
| `productionInterval` | Number | 产金间隔ms（矿场） |
| `productionTimer` | Number | 产金计时器（矿场） |
| `emoji` | String | 显示的emoji |
| `color` | String | 底座颜色 |
| `angle` | Number | 朝向角度 |
| `target` | Enemy | 当前瞄准目标 |

### 方法

| 方法 | 说明 |
|------|------|
| `update(dt)` | 矿场：产金逻辑；战斗塔：寻敌+开火 |
| `findTarget()` | 寻找范围内最近敌人 |
| `fire()` | 创建子弹（Projectile） |
| `upgrade()` | 升级（伤害×1.3，范围×1.1，射速×0.9） |
| `getUpgradeCost()` | 获取升级费用 |
| `takeDamage(damage)` | 受伤（可被摧毁） |
| `render(ctx)` | 绘制底座、emoji、等级、血条、矿场进度环 |

### 金币矿场特殊行为

```
productionTimer += dt * gameSpeed
当 timer >= interval:
  timer -= interval
  产金量 = goldPerCycle * (1 + (level-1) * 0.5)
  game.addGold(amount)
  game.createGoldEffect(x, y)
  emit('goldProduced', { amount })
```

---

## 3. Enemy.js — 敌人

**路径**：`src/game/tower-defense/entities/Enemy.js`

### 构造函数

```js
new Enemy(game, type, path, wave, levelMul = {})
```

| 参数 | 说明 |
|------|------|
| `type` | `'basic'`/`'fast'`/`'tank'`/`'zombie'`/`'zombieBoss'`/`'boss'` |
| `path` | 路径点数组（来自PathSystem） |
| `wave` | 当前波次（影响属性缩放） |
| `levelMul` | `{ healthMul, speedMul }` 关卡难度系数 |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | String | 敌人类型 |
| `path` | Array | 路径点 |
| `pathIndex` | Number | 当前路径进度 |
| `health` / `maxHealth` | Number | 生命值 |
| `baseSpeed` / `speed` | Number | 移动速度 |
| `slowUntil` | Number | 减速结束时间戳 |
| `gold` | Number | 击杀金币奖励 |
| `attack` | Number | 到达终点扣血量 |
| `emoji` | String | 显示emoji |
| `color` | String | 身体颜色 |

### 方法

| 方法 | 说明 |
|------|------|
| `update(dt)` | 检查减速 → 移动 → 死亡检测 |
| `moveAlongPath(dt)` | 沿路径移动（考虑dt和gameSpeed） |
| `takeDamage(damage)` | 受伤 |
| `applySlow(duration)` | 应用减速效果（速度×0.5） |
| `die()` | 死亡：奖励金币+得分+特效+事件 |
| `reachEnd()` | 到达终点：扣血+检查游戏结束 |
| `render(ctx)` | 绘制身体、emoji、血条、减速光环 |

### 移动速度计算

```js
moveSpeed = speed * (dt / 16.67) * gameSpeed
```

---

## 4. Projectile.js — 子弹

**路径**：`src/game/tower-defense/entities/Projectile.js`

### 构造函数

```js
new Projectile(game, {
  x, y,           // 起始位置（塔的位置）
  targetId,       // 目标敌人ID
  damage,         // 伤害值
  speed,          // 飞行速度（默认8）
  color,          // 颜色（默认#FFD700）
  size,           // 大小（默认4）
  splash,         // 溅射半径（0=无溅射）
  slowEffect,     // 减速效果
  slowDuration    // 减速持续时间
})
```

### 行为

1. **追踪**：每帧计算朝向目标方向移动
2. **命中**：距离目标 < 12px 时触发
   - 造成伤害 `target.takeDamage(damage)`
   - 减速效果 `target.applySlow(duration)`
   - 溅射伤害：范围内其他敌人受50%伤害
3. **目标丢失**：目标已死亡，创建命中特效后自毁

### 渲染
- 外层半透明光晕（globalAlpha=0.4）
- 内层实心圆

---

## 5. Particle.js — 粒子特效

**路径**：`src/game/tower-defense/entities/Particle.js`

### 构造函数

```js
new Particle(game, {
  x, y,          // 初始位置
  vx, vy,        // 速度分量
  life,          // 生命帧数（默认30）
  color,         // 颜色（默认白色）
  size           // 大小（默认3）
})
```

### 行为
- 每帧按速度移动（不受gameSpeed影响）
- 生命值按帧衰减
- 渲染时透明度 = life / maxLife，大小也随之缩小
- life <= 0 时标记死亡

### 使用场景

| 特效 | 粒子数 | 颜色 | 说明 |
|------|--------|------|------|
| buildEffect | 12 | #4CAF50 | 环形扩散 |
| hitEffect | 6 | 子弹颜色 | 随机扩散 |
| deathEffect | 10 | 敌人颜色 | 大范围扩散 |
| splashEffect | 16 | #E040FB | 环形溅射 |
| goldEffect | 8 | #FFD700 | 向上飘散 |
