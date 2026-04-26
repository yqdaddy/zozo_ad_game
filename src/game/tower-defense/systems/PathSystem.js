/**
 * 路径生成与管理系统
 */
export class PathSystem {
  constructor(game) {
    this.game = game
    this.path = []
    this.pathGrid = []
  }

  /**
   * 生成蛇形路径
   */
  generate() {
    const { cols, rows, gridSize } = this.game.config
    const canvasHeight = this.game.canvasAdapter.logicHeight

    console.log('=== PathSystem 生成路径 ===')
    console.log('cols:', cols, 'rows:', rows, 'gridSize:', gridSize)

    this.path = []
    this.pathGrid = []

    // 初始化网格
    for (let i = 0; i < rows; i++) {
      this.pathGrid.push(new Array(cols).fill(false))
    }
    console.log('pathGrid 大小:', this.pathGrid.length, 'x', this.pathGrid[0]?.length)

    let currentRow = 0
    let currentCol = 0
    let direction = 1  // 1 = 向右, -1 = 向左

    // 起点
    this.path.push({ x: gridSize / 2, y: gridSize / 2 })
    this.pathGrid[0][0] = true

    while (currentRow < rows - 1) {
      // 水平移动
      while ((direction === 1 && currentCol < cols - 1) || (direction === -1 && currentCol > 0)) {
        currentCol += direction
        if (currentRow < rows && currentCol >= 0 && currentCol < cols) {
          this.pathGrid[currentRow][currentCol] = true
          this.path.push({
            x: currentCol * gridSize + gridSize / 2,
            y: currentRow * gridSize + gridSize / 2
          })
        }
      }

      // 向下移动（2 格）
      for (let i = 0; i < 2 && currentRow < rows - 1; i++) {
        currentRow++
        if (currentRow < rows) {
          this.pathGrid[currentRow][currentCol] = true
          this.path.push({
            x: currentCol * gridSize + gridSize / 2,
            y: currentRow * gridSize + gridSize / 2
          })
        }
      }

      direction *= -1
    }

    // 终点（超出画布底部）
    this.path.push({
      x: this.path[this.path.length - 1].x,
      y: canvasHeight + 20
    })

    // 打印路径网格（用于调试）
    console.log('路径网格:')
    for (let row = 0; row < this.pathGrid.length; row++) {
      const rowStr = this.pathGrid[row].map(v => v ? '█' : '·').join('')
      console.log(`Row ${row}: ${rowStr}`)
    }
    console.log('=== PathSystem 生成完成 ===')
  }

  /**
   * 检查某个网格是否在路径上
   */
  isOnPath(gridX, gridY) {
    // 调试日志
    console.log(`isOnPath(${gridX}, ${gridY}):`, {
      pathGridLength: this.pathGrid.length,
      rowExists: !!this.pathGrid[gridY],
      value: this.pathGrid[gridY] ? this.pathGrid[gridY][gridX] : 'row不存在'
    })

    if (gridY < 0 || gridY >= this.pathGrid.length) return false
    if (gridX < 0 || gridX >= this.game.config.cols) return false
    return this.pathGrid[gridY] && this.pathGrid[gridY][gridX]
  }

  /**
   * 设置路径（存档恢复用）
   */
  setPath(pathData, pathGridData) {
    this.path = pathData
    this.pathGrid = pathGridData
  }

  /**
   * 获取路径
   */
  getPath() {
    return this.path
  }

  /**
   * 渲染路径
   */
  render(ctx) {
    const { gridSize, cols } = this.game.config

    // 绘制路径格子
    ctx.fillStyle = '#6B5344'
    for (let row = 0; row < this.pathGrid.length; row++) {
      for (let col = 0; col < cols; col++) {
        if (this.pathGrid[row] && this.pathGrid[row][col]) {
          ctx.fillRect(
            col * gridSize + 1,
            row * gridSize + 1,
            gridSize - 2,
            gridSize - 2
          )
        }
      }
    }
  }
}

export default PathSystem
