/**
 * 事件总线 - 用于工具模块间通信
 */
export class EventBus {
  constructor() {
    this.events = new Map()
  }

  /**
   * 监听事件
   * @param {String} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
    return this
  }

  /**
   * 监听一次
   * @param {String} event - 事件名
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  /**
   * 取消监听
   * @param {String} event - 事件名
   * @param {Function} callback - 回调函数（可选）
   */
  off(event, callback) {
    if (!callback) {
      this.events.delete(event)
    } else {
      const callbacks = this.events.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index !== -1) {
          callbacks.splice(index, 1)
        }
      }
    }
    return this
  }

  /**
   * 触发事件
   * @param {String} event - 事件名
   * @param  {...any} args - 参数
   */
  emit(event, ...args) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(...args)
        } catch (e) {
          console.error(`Event ${event} handler error:`, e)
        }
      })
    }
    return this
  }

  /**
   * 清除所有事件
   */
  clear() {
    this.events.clear()
    return this
  }
}

export default EventBus
