/**
 * 多用户本地存储管理器
 * 支持多档案切换，每个档案有独立的数据空间
 */

const KEYS = {
  CURRENT_USER: 'td_current_user',
  USER_LIST: 'td_user_list'
}

// emoji 头像池
const AVATARS = ['😀', '😎', '🤓', '🦊', '🐱', '🐶', '🐼', '🦁', '🐸', '🐵', '🦄', '🐲', '🎮', '⭐', '🌟', '🔥']

class StorageManager {
  /**
   * 获取当前活跃用户ID
   * @returns {String|null}
   */
  getCurrentUser() {
    try {
      return uni.getStorageSync(KEYS.CURRENT_USER) || null
    } catch (e) {
      return null
    }
  }

  /**
   * 设置当前活跃用户
   * @param {String} userId
   */
  setCurrentUser(userId) {
    uni.setStorageSync(KEYS.CURRENT_USER, userId)
  }

  /**
   * 获取所有用户列表
   * @returns {Array} [{ id, name, avatar, createdAt }]
   */
  getUserList() {
    try {
      return uni.getStorageSync(KEYS.USER_LIST) || []
    } catch (e) {
      return []
    }
  }

  /**
   * 创建新用户档案
   * @param {Object} options - { name }
   * @returns {Object} 新创建的用户对象
   */
  addUser({ name }) {
    const users = this.getUserList()
    const user = {
      id: 'local_' + Date.now(),
      name: name.trim(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      createdAt: Date.now()
    }
    users.push(user)
    uni.setStorageSync(KEYS.USER_LIST, users)
    return user
  }

  /**
   * 删除用户档案及其所有数据
   * @param {String} userId
   */
  deleteUser(userId) {
    // 删除用户的所有数据
    const keysToDelete = [
      `user_${userId}_saves`,
      `user_${userId}_achievements`,
      `user_${userId}_progress`,
      `user_${userId}_signin`,
      `user_${userId}_daily_challenge`,
      `user_${userId}_subscribe_prompt_time`,
      `user_${userId}_challenge_sent`,
      `user_${userId}_challenge_received`
    ]
    keysToDelete.forEach(key => {
      try {
        uni.removeStorageSync(key)
      } catch (e) {
        // ignore
      }
    })

    // 从用户列表中移除
    const users = this.getUserList().filter(u => u.id !== userId)
    uni.setStorageSync(KEYS.USER_LIST, users)

    // 如果删除的是当前用户，清除当前用户
    if (this.getCurrentUser() === userId) {
      uni.removeStorageSync(KEYS.CURRENT_USER)
    }
  }

  /**
   * 保存数据（带用户前缀）
   * @param {String} key - 数据键名
   * @param {*} data - 要保存的数据
   */
  saveData(key, data) {
    const userId = this.getCurrentUser()
    if (!userId) {
      console.warn('StorageManager: 没有活跃用户，无法保存数据')
      return false
    }
    const fullKey = `user_${userId}_${key}`
    try {
      uni.setStorageSync(fullKey, data)
      return true
    } catch (e) {
      console.error('StorageManager: 保存失败', fullKey, e)
      return false
    }
  }

  /**
   * 读取数据（带用户前缀）
   * @param {String} key - 数据键名
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  loadData(key, defaultValue = null) {
    const userId = this.getCurrentUser()
    if (!userId) {
      return defaultValue
    }
    const fullKey = `user_${userId}_${key}`
    try {
      const data = uni.getStorageSync(fullKey)
      return data || defaultValue
    } catch (e) {
      return defaultValue
    }
  }

  /**
   * 获取用户信息
   * @param {String} userId
   * @returns {Object|null}
   */
  getUser(userId) {
    const users = this.getUserList()
    return users.find(u => u.id === userId) || null
  }
}

// 单例导出
export const storageManager = new StorageManager()
export default storageManager
