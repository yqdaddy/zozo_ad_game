# 跨平台适配文档

## 1. 平台差异概述

本项目同时支持 **H5（Web浏览器）** 和 **微信小程序** 两个平台。

| 特性 | H5 | 微信小程序 |
|------|-----|-----------|
| Canvas API | 标准 `type="2d"` | 旧版 `uni.createCanvasContext` |
| DPR处理 | `window.devicePixelRatio` | `uni.getSystemInfoSync().pixelRatio` |
| 触摸坐标 | `getBoundingClientRect` | `touch.x/y` 相对坐标 |
| 音频 | `new AudioContext()` | `wx.createWebAudioContext()` |
| 分享 | 复制到剪贴板 | `onShareAppMessage` / 海报保存 |
| 存储 | `uni.getStorageSync` | `uni.getStorageSync` |
| 原生组件层级 | 无问题 | Canvas 在原生层，覆盖 WebView |

## 2. 条件编译

uni-app 支持条件编译标记，在编译时自动移除不适用的代码。

### 模板中

```html
<!-- #ifdef H5 -->
<view>仅H5显示</view>
<!-- #endif -->

<!-- #ifdef MP-WEIXIN -->
<view>仅微信小程序显示</view>
<!-- #endif -->
```

### JS中

```js
// #ifdef H5
window.open('https://...', '_blank')
// #endif

// #ifdef MP-WEIXIN
wx.requestSubscribeMessage({ ... })
// #endif
```

### 注意

`.js` 工具文件中的条件编译可能不生效，应使用**运行时检测**：

```js
const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'
if (isH5) {
  // H5 逻辑
} else {
  // 小程序逻辑
}
```

## 3. Canvas 适配器

**路径**：`src/utils/canvas-adapter.js`

### CanvasAdapter 类

统一封装 H5 和小程序的 Canvas 差异。

### 初始化

```js
const adapter = new CanvasAdapter()
await adapter.init(component, 'gameCanvas', {
  fillContainer: true,
  maxRetries: 10,
  retryInterval: 50,
  width: 0,   // 0=自动获取容器尺寸
  height: 0
})
```

### 三层尺寸

```
CSS尺寸 (cssWidth × cssHeight)
  → 页面布局使用

逻辑尺寸 (logicWidth × logicHeight)
  → 游戏计算使用（= CSS尺寸）

物理尺寸 (physicalWidth × physicalHeight)
  → Canvas 实际像素（= CSS × DPR）
```

### 平台差异处理

| 场景 | H5 | 微信小程序 |
|------|-----|-----------|
| 获取Canvas | `SelectorQuery.fields({ node: true })` | `uni.createCanvasContext(id, component)` |
| 设置尺寸 | `canvas.width = physicalWidth` | 旧API不需要 |
| DPR缩放 | `setTransform(1,0,0,1,0,0)` 不缩放 | 旧API自动处理 |
| 提交渲染 | 自动（立即生效） | `ctx.draw()` |
| 触摸转换 | `clientX - rect.left` | `touch.x * scaleX` |

### 关键方法

| 方法 | 说明 |
|------|------|
| `init(component, canvasId, options)` | 初始化（带重试） |
| `touchToLogic(touch, event)` | 触摸坐标 → 逻辑坐标 |
| `clear(color)` | 清空画布 |
| `commit()` | 提交绘制（小程序旧API需要） |
| `handleResize(component, canvasId)` | 处理窗口resize |

## 4. 音效适配

**路径**：`src/utils/sound-manager.js`

使用 **Web Audio API** 合成音效，无需音频文件。

### 平台初始化

```js
// H5
const AudioCtx = window.AudioContext || window.webkitAudioContext
this.audioCtx = new AudioCtx()

// 微信小程序
this.audioCtx = wx.createWebAudioContext()
```

### 音效列表

| 方法 | 用途 | 波形 |
|------|------|------|
| `build()` | 建造塔 | square 上升 |
| `upgrade()` | 升级塔 | square 四音 |
| `sell()` | 拆除塔 | sawtooth 下降 |
| `correct()` | 答对 | sine 上升 |
| `wrong()` | 答错 | sawtooth 下降 |
| `waveStart()` | 新波次 | square 警报 |
| `enemyKill()` | 击杀 | square 短促 |
| `enemyLeak()` | 漏怪 | sawtooth 低沉 |
| `gold()` | 获金币 | sine 高亮 |
| `combo()` | 连击 | square 上升 |
| `victory()` | 胜利 | sine 凯旋 |
| `defeat()` | 失败 | sawtooth 低沉 |
| `click()` | 点击 | square 短促 |
| `achievement()` | 成就 | sine 三音 |
| `toggle(on)` | 开关 | sine |

### 使用

```js
import { soundManager } from '@/utils/sound-manager'
soundManager.init()        // 需在用户交互后调用
soundManager.build()       // 播放建造音效
soundManager.setVolume(0.5)
soundManager.setEnabled(false)
```

## 5. 分享功能适配

### H5

```js
// 复制文本到剪贴板
navigator.clipboard.writeText(text)
```

### 微信小程序

```js
// 转发给好友
onShareAppMessage() {
  return { title: '...', path: '/pages/tower-defense/index' }
}

// 分享到朋友圈
onShareTimeline() {
  return { title: '...' }
}

// 生成海报保存到相册
const ctx = uni.createCanvasContext('posterCanvas', this)
// ... 绘制海报内容 ...
ctx.draw(false, () => {
  uni.canvasToTempFilePath({
    canvasId: 'posterCanvas',
    success: (res) => {
      uni.saveImageToPhotosAlbum({ filePath: res.tempFilePath })
    }
  }, this)
})
```

## 6. 存储适配

`uni.getStorageSync` / `uni.setStorageSync` 在两个平台均可用，无需额外适配。

限制：
- 微信小程序单个key上限 1MB
- 总存储上限 10MB
- 同步操作，大数据量时注意性能

## 7. 小程序特有问题

### Canvas 原生组件层级

微信小程序中 Canvas 是原生组件，会覆盖在 WebView 层之上。

**解决方案**：使用 `cover-view` 替代 `view` 做Canvas上的覆盖层，或将模态框放在Canvas外部。

### 8位16进制颜色不支持

微信小程序 Canvas 不支持 `#RRGGBBAA` 格式。

**解决方案**：使用 `ctx.globalAlpha` 设置透明度，然后用标准6位颜色。

```js
// 错误
ctx.fillStyle = '#E040FB66'

// 正确
ctx.globalAlpha = 0.4
ctx.fillStyle = '#E040FB'
ctx.beginPath()
ctx.arc(x, y, r, 0, Math.PI * 2)
ctx.fill()
ctx.globalAlpha = 1  // 恢复
```
