/**
 * 海报生成器 - 3种模板
 * 1. 游戏结束海报
 * 2. 每日挑战海报
 * 3. 成就解锁海报
 *
 * 使用微信旧版 Canvas API（uni.createCanvasContext）
 */

const W = 600
const H = 900

/**
 * 绘制圆角矩形
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/**
 * 绘制深色渐变背景
 */
function drawBackground(ctx) {
  const grd = ctx.createLinearGradient(0, 0, 0, H)
  grd.addColorStop(0, '#1a1a2e')
  grd.addColorStop(1, '#16213e')
  ctx.setFillStyle(grd)
  ctx.fillRect(0, 0, W, H)
}

/**
 * 绘制底部品牌
 */
function drawBranding(ctx, userName) {
  ctx.setFillStyle('rgba(255,255,255,0.3)')
  ctx.setFontSize(20)
  ctx.setTextAlign('center')
  ctx.fillText('— 数学塔防 · 边玩边学 —', W / 2, 780)

  if (userName) {
    ctx.setFillStyle('rgba(255,255,255,0.2)')
    ctx.setFontSize(18)
    ctx.fillText(`玩家: ${userName}`, W / 2, 820)
  }
}

/**
 * 绘制分隔线
 */
function drawDivider(ctx, y) {
  ctx.setStrokeStyle('rgba(255,255,255,0.15)')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(60, y)
  ctx.lineTo(W - 60, y)
  ctx.stroke()
}

/**
 * 绘制2x2数据网格
 */
function drawDataGrid(ctx, items, startY) {
  // 卡片背景
  ctx.setFillStyle('rgba(0,0,0,0.3)')
  roundRect(ctx, 40, startY - 40, W - 80, 320, 20)
  ctx.fill()

  const colW = (W - 80) / 2
  const startX = 40
  items.forEach((item, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = startX + colW * col + colW / 2
    const cy = startY + row * 150

    ctx.setFillStyle(item.color)
    ctx.setFontSize(48)
    ctx.setTextAlign('center')
    ctx.fillText(String(item.value), cx, cy)

    ctx.setFillStyle('rgba(255,255,255,0.6)')
    ctx.setFontSize(24)
    ctx.fillText(item.label, cx, cy + 40)
  })
}

/**
 * 模板1：游戏结束海报
 */
export function drawGameOverPoster(ctx, { gameResult, userName }) {
  drawBackground(ctx)

  // 标题
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(40)
  ctx.setTextAlign('center')
  ctx.fillText('🏰 数学塔防', W / 2, 80)

  // 结果
  ctx.setFontSize(32)
  ctx.setFillStyle(gameResult.win ? '#4CAF50' : '#FF9800')
  ctx.fillText(gameResult.win ? '🎉 胜利！' : '💪 挑战结束', W / 2, 140)

  // 星级
  const stars = gameResult.stars || 0
  let starText = ''
  for (let i = 1; i <= 3; i++) {
    starText += i <= stars ? '⭐' : '☆'
  }
  ctx.setFontSize(44)
  ctx.setFillStyle('#FFD700')
  ctx.fillText(starText, W / 2, 210)

  drawDivider(ctx, 250)

  // 数据
  drawDataGrid(ctx, [
    { label: '波数', value: gameResult.wave, color: '#4CAF50' },
    { label: '正确率', value: gameResult.accuracy + '%', color: '#2196F3' },
    { label: '最高连击', value: gameResult.maxCombo, color: '#FF9800' },
    { label: '得分', value: gameResult.score || 0, color: '#E040FB' }
  ], 320)

  // 激励语
  ctx.setFillStyle('rgba(76,175,80,0.2)')
  roundRect(ctx, 40, 640, W - 80, 70, 16)
  ctx.fill()

  ctx.setFillStyle('#4CAF50')
  ctx.setFontSize(24)
  ctx.setTextAlign('center')
  ctx.fillText(gameResult.encouragement || '继续加油！', W / 2, 685)

  drawBranding(ctx, userName)
}

/**
 * 模板2：每日挑战海报
 */
export function drawDailyChallengePoster(ctx, { result, stats, userName }) {
  drawBackground(ctx)

  // 标题
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(40)
  ctx.setTextAlign('center')
  ctx.fillText('📝 每日挑战', W / 2, 80)

  // 日期
  ctx.setFontSize(24)
  ctx.setFillStyle('#a0a0a0')
  const today = new Date()
  ctx.fillText(`${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`, W / 2, 130)

  // 正确率大字
  ctx.setFontSize(80)
  const acc = result.accuracy || 0
  ctx.setFillStyle(acc >= 80 ? '#4CAF50' : acc >= 60 ? '#FF9800' : '#F44336')
  ctx.fillText(acc + '%', W / 2, 240)

  ctx.setFontSize(24)
  ctx.setFillStyle('rgba(255,255,255,0.5)')
  ctx.fillText('正确率', W / 2, 275)

  drawDivider(ctx, 310)

  // 数据
  const colW = (W - 80) / 3
  const items = [
    { label: '正确数', value: `${result.correct}/${result.total}`, color: '#4CAF50' },
    { label: '用时', value: result.timeStr || '--', color: '#2196F3' },
    { label: '连续天数', value: stats ? stats.streak : 0, color: '#FF9800' }
  ]

  ctx.setFillStyle('rgba(0,0,0,0.3)')
  roundRect(ctx, 40, 340, W - 80, 160, 20)
  ctx.fill()

  items.forEach((item, i) => {
    const cx = 40 + colW * i + colW / 2

    ctx.setFillStyle(item.color)
    ctx.setFontSize(40)
    ctx.setTextAlign('center')
    ctx.fillText(String(item.value), cx, 400)

    ctx.setFillStyle('rgba(255,255,255,0.6)')
    ctx.setFontSize(22)
    ctx.fillText(item.label, cx, 440)
  })

  // 总累计
  if (stats) {
    ctx.setFillStyle('rgba(255,152,0,0.15)')
    roundRect(ctx, 40, 540, W - 80, 80, 16)
    ctx.fill()

    ctx.setFillStyle('#FF9800')
    ctx.setFontSize(26)
    ctx.setTextAlign('center')
    ctx.fillText(`累计挑战 ${stats.totalDays} 天 | 总正确率 ${stats.accuracy}%`, W / 2, 590)
  }

  // 挑战语
  ctx.setFillStyle('rgba(76,175,80,0.2)')
  roundRect(ctx, 40, 660, W - 80, 70, 16)
  ctx.fill()

  ctx.setFillStyle('#4CAF50')
  ctx.setFontSize(24)
  ctx.setTextAlign('center')
  const msg = acc === 100 ? '满分通关！你是数学天才！' : acc >= 80 ? '很棒！继续保持！' : '加油！明天再来挑战！'
  ctx.fillText(msg, W / 2, 705)

  drawBranding(ctx, userName)
}

/**
 * 模板3：成就解锁海报
 */
export function drawAchievementPoster(ctx, { achievement, totalUnlocked, totalAchievements, userName }) {
  drawBackground(ctx)

  // 标题
  ctx.setFillStyle('#FFD700')
  ctx.setFontSize(36)
  ctx.setTextAlign('center')
  ctx.fillText('🏆 成就解锁', W / 2, 80)

  // 成就图标（大）
  ctx.setFontSize(100)
  ctx.fillText(achievement.icon || '🏆', W / 2, 230)

  // 成就名称
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(40)
  ctx.fillText(achievement.name, W / 2, 310)

  // 成就描述
  ctx.setFillStyle('rgba(255,255,255,0.6)')
  ctx.setFontSize(26)
  ctx.fillText(achievement.desc || '', W / 2, 360)

  drawDivider(ctx, 400)

  // 解锁进度
  ctx.setFillStyle('rgba(0,0,0,0.3)')
  roundRect(ctx, 40, 430, W - 80, 120, 20)
  ctx.fill()

  ctx.setFillStyle('#FFD700')
  ctx.setFontSize(48)
  ctx.setTextAlign('center')
  ctx.fillText(`${totalUnlocked} / ${totalAchievements}`, W / 2, 490)

  ctx.setFillStyle('rgba(255,255,255,0.5)')
  ctx.setFontSize(22)
  ctx.fillText('成就收集进度', W / 2, 530)

  // 激励
  ctx.setFillStyle('rgba(255,215,0,0.15)')
  roundRect(ctx, 40, 590, W - 80, 70, 16)
  ctx.fill()

  ctx.setFillStyle('#FFD700')
  ctx.setFontSize(24)
  ctx.setTextAlign('center')
  ctx.fillText('继续努力，解锁更多成就！', W / 2, 635)

  drawBranding(ctx, userName)
}

/**
 * 导出海报并保存到相册（微信小程序）
 * @param {Object} component - Vue 组件实例（this）
 * @param {String} canvasId - canvas-id
 */
export function exportAndSavePoster(component, canvasId = 'posterCanvas') {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      uni.canvasToTempFilePath({
        canvasId,
        width: W,
        height: H,
        destWidth: W * 2,
        destHeight: H * 2,
        success: (res) => {
          uni.hideLoading()
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.showToast({ title: '已保存到相册', icon: 'success' })
              resolve(res.tempFilePath)
            },
            fail: (err) => {
              if (err.errMsg && err.errMsg.includes('auth deny')) {
                uni.showModal({
                  title: '提示',
                  content: '需要授权保存图片到相册',
                  success: (modalRes) => {
                    if (modalRes.confirm) uni.openSetting()
                  }
                })
              } else {
                uni.previewImage({ urls: [res.tempFilePath] })
              }
              resolve(res.tempFilePath)
            }
          })
        },
        fail: (err) => {
          uni.hideLoading()
          uni.showToast({ title: '生成图片失败', icon: 'none' })
          reject(err)
        }
      }, component)
    }, 300)
  })
}

export const POSTER_SIZE = { width: W, height: H }
