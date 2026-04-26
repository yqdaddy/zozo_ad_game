# 数学塔防游戏 - 架构文档

## 1. 项目概述

**项目名称**：数学工具集合（数学塔防）
**技术栈**：uni-app + Vue + Canvas 2D
**目标平台**：H5（Web）、微信小程序
**AppID**：wxa65aae633501c125

## 2. 目录结构

```
src/
├── main.js                           # 应用入口
├── App.vue                           # 全局样式
├── manifest.json                     # 应用配置（AppID等）
├── pages.json                        # 页面路由配置
├── pages/
│   ├── index/index.vue              # 首页（游戏列表）
│   └── tower-defense/index.vue      # 塔防游戏页面（~2300行）
├── game/tower-defense/              # 游戏核心代码
│   ├── index.js                     # 模块统一导出
│   ├── core/
│   │   ├── Game.js                  # 主控制器
│   │   ├── EventBus.js              # 事件总线
│   │   └── GameLoop.js              # 游戏循环
│   ├── entities/
│   │   ├── Entity.js                # 实体基类
│   │   ├── Tower.js                 # 防御塔
│   │   ├── Enemy.js                 # 敌人
│   │   ├── Projectile.js           # 子弹
│   │   └── Particle.js             # 粒子特效
│   ├── systems/
│   │   ├── PathSystem.js            # 路径生成
│   │   ├── ComboSystem.js           # 连击系统
│   │   ├── DifficultySystem.js      # 自适应难度
│   │   ├── AchievementSystem.js     # 成就与星级
│   │   └── SaveSystem.js            # 存档系统
│   └── config/
│       ├── towers.js                # 防御塔配置
│       ├── enemies.js               # 敌人配置
│       └── levels.js                # 关卡配置
└── utils/
    ├── math.js                      # 数学题库（8种题型）
    ├── canvas-adapter.js            # Canvas跨平台适配器
    ├── storage-manager.js           # 多用户本地存储
    └── sound-manager.js             # Web Audio音效合成
```

## 3. 模块依赖关系

```
┌─────────────────────────────────────────────────┐
│           tower-defense/index.vue                │
│        （页面层：UI、事件监听、用户交互）           │
└──────────┬──────────────┬───────────────────────┘
           │              │
    ┌──────▼──────┐  ┌────▼─────────┐
    │   Game.js   │  │ storageManager│
    │  (主控制器)  │  │ soundManager │
    └──┬──────────┘  └──────────────┘
       │
  ┌────┼──────────────────────────┐
  │    │  子系统                    │
  │ ┌──▼──────────┐ ┌───────────┐ │
  │ │ PathSystem   │ │ComboSystem│ │
  │ │ Difficulty   │ │Achievement│ │
  │ │ SaveSystem   │ │           │ │
  │ └──────────────┘ └───────────┘ │
  │    │  实体                      │
  │ ┌──▼──────────┐ ┌───────────┐ │
  │ │ Tower[]      │ │ Enemy[]   │ │
  │ │ Projectile[] │ │ Particle[]│ │
  │ └──────────────┘ └───────────┘ │
  │                                │
  │ ┌────────────┐ ┌─────────────┐│
  │ │CanvasAdapter│ │  EventBus   ││
  │ │ (渲染适配)  │ │ (事件通信)  ││
  │ └────────────┘ └─────────────┘│
  │ ┌────────────┐                 │
  │ │ GameLoop   │                 │
  │ │ (帧循环)   │                 │
  │ └────────────┘                 │
  └────────────────────────────────┘
```

## 4. 核心数据流

### 4.1 游戏主循环

```
GameLoop.loop()
  ├── Game.update(dt)          每帧更新
  │   ├── ComboSystem.update()
  │   ├── Tower[].update()     → findTarget → fire → Projectile
  │   ├── Enemy[].update()     → moveAlongPath → reachEnd / die
  │   ├── Projectile[].update()→ chase → hit → damage + effects
  │   ├── Particle[].update()  → move → fade → isDead
  │   └── checkWaveComplete()  → autoSave / nextWave / gameOver
  └── Game.render()            每帧渲染
      ├── 背景 + 网格线
      ├── PathSystem.render()
      ├── 可放置预览（selectedTower）
      ├── Tower[].render()
      ├── Enemy[].render()
      ├── Projectile[].render()
      ├── Particle[].render()
      ├── ComboSystem.render()
      └── CanvasAdapter.commit()  // 小程序需要 ctx.draw()
```

### 4.2 建塔流程

```
用户选择塔类型
  → Game.selectTower(type)
  → 检查金币是否足够

用户点击网格
  → CanvasAdapter.touchToLogic(touch)  → 转换为逻辑坐标
  → Game.handleTouch(x, y)
  → 计算 gridX, gridY
  → 检查：路径上？已有塔？
  ├── 已有塔 → emit('showTowerMenu')  → 升级/拆除弹窗
  ├── 空地+已选塔 → tryBuildTower()
  │   → 获取难度 → emit('needMathQuestion')
  │   → Vue 显示数学题模态框
  │   → 用户答题 → callback(correct)
  │   ├── 答对 → ComboSystem.onCorrectAnswer()
  │   │       → DifficultySystem.recordAnswer(true)
  │   │       → buildTower() → 扣金币、创建Tower、特效
  │   └── 答错 → ComboSystem.onWrongAnswer()
  │           → DifficultySystem.recordAnswer(false)
  └── 空地+未选塔 → toast '请先选择防御塔'
```

### 4.3 敌人生命周期

```
startWave()
  → getWaveEnemies(wave) → 生成敌人类型列表
  → shuffleArray() → 随机打乱
  → spawnEnemies() → 定时生成

Enemy.update(dt)
  → 检查减速效果
  → moveAlongPath(dt)
  ├── 到达路径终点 → reachEnd()
  │   → 扣减 lives（按 attack 值）
  │   → emit('enemyReachedEnd')
  │   → lives <= 0 → gameOver(false)
  └── health <= 0 → die()
      → 奖励金币、得分
      → createDeathEffect()
      → emit('enemyDied')
```

## 5. 事件系统

所有模块通过 `EventBus` 解耦通信。

### 5.1 事件列表

| 事件名 | 触发者 | 数据 | 监听者 |
|--------|--------|------|--------|
| `stateChange` | Game | `{ lives, gold, wave, score, ... }` | Vue页面 |
| `needMathQuestion` | Game | `{ difficulty, callback }` | Vue页面 |
| `towerSelected` | Game | `{ type }` | Vue页面 |
| `towerBuilt` | Game | `{ tower }` | Vue页面(音效) |
| `towerUpgraded` | Game | `{ tower }` | Vue页面(音效) |
| `showTowerMenu` | Game | `{ tower, upgradeCost, sellPrice }` | Vue页面 |
| `showToast` | Game | `{ title, icon }` | Vue页面 |
| `comboChange` | ComboSystem | `{ combo, multiplier }` | Vue页面 |
| `showComboMilestone` | ComboSystem | `{ combo, bonus, message }` | Vue页面 |
| `comboBreak` | ComboSystem | `{ combo }` | Vue页面 |
| `difficultyChange` | DifficultySystem | `{ difficulty, accuracy }` | - |
| `waveStart` | Game | `{ wave }` | Vue页面(音效) |
| `enemyDied` | Enemy | Enemy实例 | Vue页面(音效) |
| `enemyReachedEnd` | Enemy | Enemy实例 | Vue页面(音效) |
| `goldProduced` | Tower(矿场) | `{ amount }` | Vue页面(音效) |
| `achievementUnlocked` | AchievementSystem | `{ id, name, desc, icon }` | Vue页面 |
| `gameover` | Game | `{ win, stars, wave, accuracy, ... }` | Vue页面 |
| `towerDestroyed` | Tower | Tower实例 | - |

## 6. 坐标系统

### 6.1 三层坐标

| 层级 | 说明 | 示例 |
|------|------|------|
| **CSS像素** | 页面布局使用 | `cssWidth × cssHeight` |
| **逻辑坐标** | 游戏计算使用 | `logicWidth × logicHeight`（= CSS尺寸） |
| **物理像素** | Canvas实际渲染 | `physicalWidth × physicalHeight`（= CSS × DPR） |

### 6.2 网格系统

- **固定8列**，行数根据画布高度动态计算
- `gridSize = Math.floor(logicWidth / 8)`
- 网格坐标：`gridX = Math.floor(x / gridSize)`，`gridY = Math.floor(y / gridSize)`
- 实体中心坐标：`x = gridX * gridSize + gridSize / 2`

### 6.3 触摸坐标转换

```
H5:   touch.clientX - canvas.getBoundingClientRect().left
小程序: touch.x * scaleX, touch.y * scaleY
```

## 7. 存储架构

### 7.1 存储键命名规则

| 键 | 格式 | 说明 |
|----|------|------|
| 当前用户 | `td_current_user` | 用户ID字符串 |
| 用户列表 | `td_user_list` | `[{ id, name, avatar, createdAt }]` |
| 游戏存档 | `user_{userId}_saves` | `{ 0: auto, 1-3: manual }` |
| 关卡进度 | `user_{userId}_progress` | `{ levelId: { bestStars, completed } }` |
| 成就数据 | `user_{userId}_achievements` | `['first_correct', ...]` |

### 7.2 storageManager API

所有读写操作自动添加 `user_{userId}_` 前缀，确保多档案数据隔离。

## 8. 页面结构

### 8.1 首页 (index/index.vue)

- 游戏列表（数学塔防 + 3个即将上线）
- 微信分享支持
- ICP备案链接（H5）

### 8.2 塔防页面 (tower-defense/index.vue)

**三个屏幕状态**：
1. `menu` — 主菜单（档案管理、关卡选择入口、设置）
2. `levels` — 关卡选择（6关，逐步解锁，星级显示）
3. `game` — 游戏进行中

**模态框**：数学题、暂停、游戏结束、帮助、档案管理、存档/读档、塔操作菜单

**底部栏**：水平滚动的塔选择栏（5种塔）+ 选中塔信息栏
