# 游戏系统 API 文档

## 1. Game.js — 主控制器

**路径**：`src/game/tower-defense/core/Game.js`

### 构造函数

```js
new Game(canvasAdapter, config = {})
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `canvasAdapter` | CanvasAdapter | Canvas适配器实例 |
| `config.gridSize` | Number | 网格大小（默认40，init时会自动计算） |
| `config.cols` | Number | 列数（默认8） |
| `config.rows` | Number | 行数（默认10，init时自动计算） |
| `config.levelConfig` | Object | 关卡配置（来自levels.js） |

### 状态属性

```js
game.state = {
  lives: 20,            // 生命值
  gold: 100,            // 金币
  wave: 1,              // 当前波次
  gameSpeed: 1,         // 游戏速度（1或2）
  score: 0,             // 得分
  isPaused: false,
  isGameOver: false,
  questionsAnswered: 0,  // 答题总数
  questionsCorrect: 0,   // 正确数
  enemiesKilled: 0,
  waveInProgress: false  // 当前波正在出怪
}
```

### 实体集合

| 属性 | 类型 | 说明 |
|------|------|------|
| `towers` | Tower[] | 所有防御塔 |
| `enemies` | Enemy[] | 所有敌人 |
| `projectiles` | Projectile[] | 所有子弹 |
| `particles` | Particle[] | 所有粒子特效 |

### 子系统

| 属性 | 类型 | 说明 |
|------|------|------|
| `events` | EventBus | 事件总线 |
| `pathSystem` | PathSystem | 路径系统 |
| `comboSystem` | ComboSystem | 连击系统 |
| `difficultySystem` | DifficultySystem | 难度系统 |
| `achievementSystem` | AchievementSystem | 成就系统 |
| `saveSystem` | SaveSystem | 存档系统 |
| `gameLoop` | GameLoop | 游戏循环 |

### 核心方法

| 方法 | 说明 |
|------|------|
| `init()` | 计算网格、生成路径、首次渲染 |
| `start()` | 重置+生成路径+开始第一波+启动循环 |
| `reset()` | 重置所有状态为初始值 |
| `update(dt)` | 每帧更新所有实体和系统 |
| `render()` | 每帧渲染到Canvas |
| `handleTouch(x, y)` | 处理点击（逻辑坐标） |
| `selectTower(type)` | 选择塔类型 |
| `tryBuildTower(gridX, gridY)` | 尝试建塔（触发答题） |
| `buildTower(gridX, gridY, multiplier)` | 建造塔（答对后） |
| `tryUpgradeTower(tower)` | 尝试升级（触发答题） |
| `upgradeTower(tower, cost)` | 执行升级 |
| `getSellPrice(tower)` | 计算售价（50%投资） |
| `sellTower(tower)` | 拆除塔，返回金币 |
| `addGold(amount)` | 增加金币 |
| `startWave()` | 开始新一波 |
| `spawnEnemy(type)` | 生成单个敌人 |
| `saveGame(slot)` | 保存到槽位 |
| `loadGame(saveData)` | 从存档恢复 |
| `pause()` / `resume()` | 暂停/恢复 |
| `toggleSpeed()` | 切换1x/2x速度 |
| `gameOver(win)` | 游戏结束，计算结果 |
| `destroy()` | 销毁游戏，清理资源 |

### 粒子特效方法

| 方法 | 用途 |
|------|------|
| `createBuildEffect(x, y)` | 建造/升级时绿色粒子 |
| `createHitEffect(x, y, color)` | 子弹命中粒子 |
| `createDeathEffect(x, y, color)` | 敌人死亡粒子 |
| `createSplashEffect(x, y, radius)` | 溅射范围粒子 |
| `createGoldEffect(x, y)` | 矿场产金粒子 |
| `createProjectile(options)` | 创建子弹 |

---

## 2. EventBus.js — 事件总线

**路径**：`src/game/tower-defense/core/EventBus.js`

```js
const bus = new EventBus()
bus.on('event', callback)       // 监听
bus.once('event', callback)     // 监听一次
bus.off('event', callback?)     // 取消监听（不传callback则移除所有）
bus.emit('event', ...args)      // 触发
bus.clear()                     // 清除所有
```

---

## 3. GameLoop.js — 游戏循环

**路径**：`src/game/tower-defense/core/GameLoop.js`

### 核心机制
- 使用 `requestAnimationFrame`（H5）或 `setTimeout`（小程序）
- 计算 deltaTime（毫秒），限制最大100ms（防止切换标签页后时间跳跃）
- 暂停时只渲染不更新

| 方法 | 说明 |
|------|------|
| `start()` | 开始循环 |
| `pause()` | 暂停（继续渲染） |
| `resume()` | 恢复 |
| `stop()` | 完全停止 |
| `getFPS()` | 获取当前FPS |

---

## 4. PathSystem.js — 路径系统

**路径**：`src/game/tower-defense/systems/PathSystem.js`

### 路径生成算法
蛇形路径：从左上角开始，水平扫过一行，下移2格，反向扫过，重复直到底部。

### 数据结构
- `path[]` — 坐标点数组 `[{ x, y }, ...]`，敌人沿此路径移动
- `pathGrid[][]` — 二维布尔数组，标记哪些格子是路径（不可建塔）

| 方法 | 说明 |
|------|------|
| `generate()` | 生成蛇形路径 |
| `isOnPath(gridX, gridY)` | 检查格子是否在路径上 |
| `getPath()` | 获取路径点数组 |
| `setPath(pathData, pathGridData)` | 设置路径（存档恢复用） |
| `render(ctx)` | 绘制棕色路径格子 |

---

## 5. ComboSystem.js — 连击系统

**路径**：`src/game/tower-defense/systems/ComboSystem.js`

### 连击里程碑

| 连击数 | 金币折扣倍率 | 消息 |
|--------|------------|------|
| 3 | 1.2x | 🔥 连击 x3！ |
| 5 | 1.5x | 💥 超级连击 x5！ |
| 8 | 2.0x | 🌟 完美连击 x8！ |
| 12 | 2.5x | ⭐ 学霸模式！ |

- **超时**：5秒不答题，连击归零
- **倍率用途**：建塔时实际金币消耗 = `cost / multiplier`

| 方法 | 说明 |
|------|------|
| `onCorrectAnswer()` | 答对，连击+1，返回当前倍率 |
| `onWrongAnswer()` | 答错，重置连击 |
| `getMultiplier()` | 获取当前倍率 |
| `resetCombo()` | 重置 |
| `update(dt)` | 更新动画 |
| `render(ctx)` | 渲染连击计数和里程碑动画 |
| `destroy()` | 清理定时器 |

---

## 6. DifficultySystem.js — 自适应难度

**路径**：`src/game/tower-defense/systems/DifficultySystem.js`

### 难度调整规则
- **范围**：1.0 ~ 3.0（浮点数）
- **目标正确率**：70%
- **滑动窗口**：最近10次答题
- **调整幅度**：±0.15
- **调整条件**：正确率 > 85% 升难度，< 55% 降难度
- **随机性**：20%概率降1级（给孩子喘息空间）
- **关卡约束**：受 `mathDiffRange` 限制

| 方法 | 说明 |
|------|------|
| `recordAnswer(correct)` | 记录答题结果并调整 |
| `getQuestionDifficulty()` | 获取整数难度 1-3 |
| `setMathDiffRange([min, max])` | 设置关卡范围限制 |
| `getAccuracy()` | 获取当前正确率 |
| `getDifficultyLabel()` | 获取 `{ label, color }` |
| `reset()` | 重置 |

---

## 7. AchievementSystem.js — 成就与星级

**路径**：`src/game/tower-defense/systems/AchievementSystem.js`

### 11个成就

| ID | 名称 | 条件 |
|----|------|------|
| `first_correct` | 初露锋芒 | 答对1题 |
| `streak_5` | 连胜小将 | 连击5 |
| `streak_10` | 学霸之路 | 连击10 |
| `accuracy_90` | 精准大师 | 正确率≥90%（≥10题） |
| `wave_5` | 初级守护者 | 到第5波 |
| `wave_10` | 中级守护者 | 到第10波 |
| `perfect_life` | 金身不破 | 满血通过5波 |
| `builder_10` | 建筑新手 | 建10座塔 |
| `max_level` | 塔王 | 塔升到5级 |
| `score_1000` | 千分俱乐部 | 1000分 |
| `no_skip` | 诚实守信 | 不跳题（≥10题） |

### 星级计算（最高3星）

| 维度 | 1星 | 0.5星 |
|------|-----|-------|
| 波数 | ≥10 | ≥5 |
| 正确率 | ≥90% | ≥70% |
| 连击 | ≥8 | ≥5 |

| 方法 | 说明 |
|------|------|
| `updateStat(key, value)` | 更新统计并检查成就 |
| `checkAchievements()` | 检查解锁条件 |
| `calculateStars()` | 计算星级 → `{ stars, details }` |
| `getEncouragement()` | 获取激励语 |
| `getAllAchievements()` | 所有成就（含解锁状态） |
| `reset()` | 重置本局统计 |

---

## 8. SaveSystem.js — 存档系统

**路径**：`src/game/tower-defense/systems/SaveSystem.js`

### 存档槽位
- 槽位0：自动存档（每波结束）
- 槽位1-3：手动存档

### 存档数据结构

```js
{
  timestamp, version: '1.0', slot,
  levelId,
  state: { lives, gold, wave, score, questionsAnswered, questionsCorrect, enemiesKilled },
  towers: [{ gridX, gridY, type, level, health }],
  difficulty: { current, history },
  combo: { combo, maxCombo },
  path: [{ x, y }],
  pathGrid: [[bool]]
}
```

| 方法 | 说明 |
|------|------|
| `autoSave()` | 自动存档到槽位0 |
| `saveToSlot(slot)` | 保存到指定槽位 |
| `loadFromSlot(slot)` | 加载存档数据 |
| `getSlotInfo(slot)` | 获取槽位摘要 |
| `getAllSlotInfo()` | 获取所有槽位信息 |
| `deleteSlot(slot)` | 删除存档 |
