/**
 * uni-app Canvas 标准适配器
 * 解决多平台尺寸适配和坐标转换问题
 */
export class CanvasAdapter {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.dpr = 1

    // 逻辑尺寸（用于工具计算）
    this.logicWidth = 0
    this.logicHeight = 0

    // CSS 显示尺寸（用于样式设置）
    this.cssWidth = 0
    this.cssHeight = 0

    // Canvas 物理像素尺寸
    this.physicalWidth = 0
    this.physicalHeight = 0

    // 坐标转换比例
    this.scaleX = 1
    this.scaleY = 1

    // 初始化状态
    this.initialized = false

    // 是否使用旧 Canvas API（小程序兼容性）
    this.useOldApi = false
  }

  /**
   * 初始化 Canvas（统一入口）
   * @param {Object} component - Vue 组件实例 (this)
   * @param {String} canvasId - Canvas 的 id
   * @param {Object} options - 配置项
   */
  async init(component, canvasId, options = {}) {
    const {
      // 是否填满可用空间
      fillContainer = true,
      // 最大重试次数
      maxRetries = 10,
      // 重试间隔（毫秒）
      retryInterval = 50,
      // 期望的尺寸（如果传入则使用，避免从 DOM 获取不准确）
      width = 0,
      height = 0
    } = options

    // 1. 获取 DPR
    // H5 和小程序都需要处理 DPR，确保高分辨率屏幕显示清晰
    const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'
    this.isH5 = isH5
    if (isH5) {
      // H5 环境：使用浏览器的实际 DPR
      this.dpr = window.devicePixelRatio || 1
    } else {
      // 小程序/App 环境：使用 uni API
      const sysInfo = uni.getSystemInfoSync()
      this.dpr = sysInfo.pixelRatio || 2
    }

    // 2. 计算可用空间
    if (width > 0 && height > 0) {
      // 使用传入的期望尺寸
      this.cssWidth = width
      this.cssHeight = height
    } else {
      // 从 DOM 获取容器尺寸
      const containerInfo = await this._getContainerSize(component, canvasId, maxRetries, retryInterval)
      if (!containerInfo) {
        throw new Error('Canvas container not found')
      }
      this.cssWidth = containerInfo.width
      this.cssHeight = containerInfo.height
    }

    // 3. 计算逻辑尺寸（保持宽高比或填满）
    if (fillContainer) {
      this.logicWidth = this.cssWidth
      this.logicHeight = this.cssHeight
    }

    // 4. 计算物理像素尺寸
    this.physicalWidth = Math.floor(this.cssWidth * this.dpr)
    this.physicalHeight = Math.floor(this.cssHeight * this.dpr)

    // 5. 获取 Canvas 节点并配置（带重试）
    await this._setupCanvasWithRetry(component, canvasId, maxRetries, retryInterval)

    // 6. 计算坐标转换比例
    this._updateScale()

    this.initialized = true

    // 调试日志 - 帮助排查渲染问题
    console.log('=== CanvasAdapter 初始化完成 ===')
    console.log('环境:', this.isH5 ? 'H5' : '小程序/App')
    console.log('使用旧API:', this.useOldApi)
    console.log('DPR:', this.dpr)
    console.log('传入尺寸: width=' + width + ', height=' + height)
    console.log('CSS尺寸: ' + this.cssWidth + ' x ' + this.cssHeight)
    console.log('逻辑尺寸: ' + this.logicWidth + ' x ' + this.logicHeight)
    console.log('物理尺寸: ' + this.physicalWidth + ' x ' + this.physicalHeight)
    if (this.canvas && typeof this.canvas.width !== 'undefined') {
      console.log('Canvas实际尺寸: ' + this.canvas.width + ' x ' + this.canvas.height)
    }
    console.log('scaleX=' + this.scaleX + ', scaleY=' + this.scaleY)
    if (this.isH5) {
      console.log('window.devicePixelRatio:', window.devicePixelRatio)
      const canvasEl = document.querySelector('#gameCanvas canvas') || document.querySelector('#gameCanvas')
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect()
        console.log('Canvas DOM rect:', rect.width + ' x ' + rect.height)
        console.log('Canvas CSS style:', canvasEl.style.width, canvasEl.style.height)
      }
    }
    console.log('================================')

    return {
      ctx: this.ctx,
      width: this.logicWidth,
      height: this.logicHeight,
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight
    }
  }

  /**
   * 获取容器尺寸（带重试）
   */
  _getContainerSize(component, canvasId, maxRetries, retryInterval) {
    return new Promise((resolve) => {
      let retries = 0

      const tryGetSize = () => {
        const query = uni.createSelectorQuery().in(component)
        query.select(`#${canvasId}`)
          .boundingClientRect()
          .exec((res) => {
            if (res && res[0] && res[0].width > 0) {
              resolve({
                width: res[0].width,
                height: res[0].height
              })
            } else if (retries < maxRetries) {
              retries++
              setTimeout(tryGetSize, retryInterval)
            } else {
              resolve(null)
            }
          })
      }

      tryGetSize()
    })
  }

  /**
   * 设置 Canvas 节点（带重试）
   */
  _setupCanvasWithRetry(component, canvasId, maxRetries, retryInterval) {
    return new Promise((resolve, reject) => {
      // 小程序环境：使用旧 Canvas API（兼容性更好）
      if (!this.isH5) {
        this.ctx = uni.createCanvasContext(canvasId, component)
        this.canvas = { width: this.physicalWidth, height: this.physicalHeight }
        this.useOldApi = true
        console.log('小程序使用旧 Canvas API')
        resolve()
        return  // 跳过 SelectorQuery
      }

      let retries = 0

      const trySetup = () => {
        const query = uni.createSelectorQuery().in(component)
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              this.canvas = res[0].node
              this.ctx = this.canvas.getContext('2d')

              if (this.isH5) {
                // H5 环境：尝试获取真正的 canvas DOM 元素
                let realCanvas = this.canvas

                // 如果 this.canvas 不是真正的 HTMLCanvasElement，尝试从 DOM 获取
                if (typeof HTMLCanvasElement !== 'undefined' && !(this.canvas instanceof HTMLCanvasElement)) {
                  const domCanvas = document.querySelector(`#${canvasId} canvas`) || document.querySelector(`#${canvasId}`)
                  if (domCanvas && domCanvas.tagName === 'CANVAS') {
                    realCanvas = domCanvas
                    this.canvas = realCanvas
                    this.ctx = realCanvas.getContext('2d')
                  }
                }

                // 设置 canvas 物理尺寸 = CSS尺寸 × DPR（确保高清显示）
                realCanvas.width = this.physicalWidth
                realCanvas.height = this.physicalHeight

                // 设置 CSS 尺寸（确保显示尺寸正确）
                realCanvas.style.width = this.cssWidth + 'px'
                realCanvas.style.height = this.cssHeight + 'px'

                // 重置变换矩阵（不应用 DPR 缩放，uni-app 内部已处理）
                this.ctx.setTransform(1, 0, 0, 1, 0, 0)

                console.log('H5 Canvas 设置完成:')
                console.log('  物理尺寸:', realCanvas.width, 'x', realCanvas.height)
                console.log('  CSS尺寸:', realCanvas.style.width, realCanvas.style.height)
                console.log('  DPR:', this.dpr, '(未应用 scale)')
              }

              resolve()
            } else if (retries < maxRetries) {
              retries++
              setTimeout(trySetup, retryInterval)
            } else {
              reject(new Error('Canvas node not found after retries'))
            }
          })
      }

      trySetup()
    })
  }

  /**
   * 更新坐标转换比例
   */
  _updateScale() {
    this.scaleX = this.logicWidth / this.cssWidth
    this.scaleY = this.logicHeight / this.cssHeight
  }

  /**
   * 核心方法：将触摸坐标转换为 Canvas 逻辑坐标
   * @param {Object} touch - 触摸事件对象
   * @param {Object} event - 原始事件
   * @returns {Object} { x, y } 逻辑坐标
   */
  touchToLogic(touch, event) {
    let x, y

    // 使用运行时检测而非条件编译（.js文件中条件编译可能不生效）
    const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

    if (isH5) {
      // H5 环境
      const rect = event.currentTarget.getBoundingClientRect
        ? event.currentTarget.getBoundingClientRect()
        : { left: 0, top: 0, width: this.cssWidth, height: this.cssHeight }

      // 计算相对于 Canvas 的位置（CSS 像素）
      x = touch.clientX - rect.left
      y = touch.clientY - rect.top

      // 详细调试日志
      console.log('=== touchToLogic 详细调试 ===')
      console.log('touch.clientX:', touch.clientX, 'touch.clientY:', touch.clientY)
      console.log('rect:', { left: rect.left, top: rect.top, width: rect.width, height: rect.height })
      console.log('CSS坐标 x:', x, 'y:', y)
      console.log('Canvas物理尺寸:', this.canvas.width, 'x', this.canvas.height)
      console.log('CSS尺寸:', this.cssWidth, 'x', this.cssHeight)
      console.log('DPR:', this.dpr)
      console.log('=============================')
    } else {
      // 小程序环境 - touch.x/y 是相对于组件的坐标
      x = touch.x * this.scaleX
      y = touch.y * this.scaleY
    }

    return { x, y }
  }

  /**
   * 清空画布
   * @param {String} color - 背景色
   */
  clear(color = '#000') {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.logicWidth, this.logicHeight)
  }

  /**
   * 提交绘制（旧 Canvas API 需要调用 draw）
   */
  commit() {
    if (this.useOldApi && this.ctx && this.ctx.draw) {
      this.ctx.draw()
    }
  }

  /**
   * 处理窗口尺寸变化
   */
  async handleResize(component, canvasId) {
    // 旧 API 不支持动态调整尺寸
    if (this.useOldApi) {
      return false
    }

    const containerInfo = await this._getContainerSize(component, canvasId, 3, 50)
    if (!containerInfo) return false

    // 如果尺寸变化不大，忽略
    if (Math.abs(containerInfo.width - this.cssWidth) < 10 &&
      Math.abs(containerInfo.height - this.cssHeight) < 10) {
      return false
    }

    this.cssWidth = containerInfo.width
    this.cssHeight = containerInfo.height
    this.logicWidth = this.cssWidth
    this.logicHeight = this.cssHeight
    this.physicalWidth = Math.floor(this.cssWidth * this.dpr)
    this.physicalHeight = Math.floor(this.cssHeight * this.dpr)

    if (this.isH5) {
      // H5 环境：设置物理尺寸和 CSS 尺寸
      this.canvas.width = this.physicalWidth
      this.canvas.height = this.physicalHeight
      this.canvas.style.width = this.cssWidth + 'px'
      this.canvas.style.height = this.cssHeight + 'px'
      // 重置变换矩阵（不应用 DPR 缩放）
      this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      // 小程序环境：需要手动处理 DPR
      this.canvas.width = this.physicalWidth
      this.canvas.height = this.physicalHeight
      this.ctx.setTransform(1, 0, 0, 1, 0, 0)
      this.ctx.scale(this.dpr, this.dpr)
    }

    this._updateScale()
    return true
  }
}

export default CanvasAdapter
