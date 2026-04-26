<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header" :style="{ paddingTop: navPaddingTop + 'px' }">
      <text class="title">🎮 数学工具集合</text>
      <text class="subtitle">边玩边学，快乐成长</text>
    </view>

    <!-- 工具列表 -->
    <view class="game-list">
      <view
        v-for="game in games"
        :key="game.id"
        class="game-card"
        :class="{ 'coming-soon': game.comingSoon }"
        @click="openGame(game)"
      >
        <view class="game-icon">{{ game.icon }}</view>
        <view class="game-info">
          <text class="game-title">{{ game.title }}</text>
          <text class="game-desc">{{ game.description }}</text>
          <view class="game-tags">
            <text
              v-for="tag in game.tags"
              :key="tag"
              class="tag"
            >{{ tag }}</text>
          </view>
        </view>
        <view v-if="game.comingSoon" class="coming-soon-badge">
          <text>即将上线</text>
        </view>
        <view v-else class="arrow">›</view>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <text class="footer-text">适合小学生的数学学习工具</text>
      <text class="version">v1.0.0</text>
      <!-- #ifdef H5 -->
      <navigator url="" open-type="navigate" class="icp-link" @click.prevent="openICP">
        <text class="icp-text">粤ICP备18152027号</text>
      </navigator>
      <!-- #endif -->
    </view>
  </view>
</template>

<script>
import { soundManager } from '@/utils/sound-manager'

export default {
  data() {
    return {
      navPaddingTop: 0,
      games: [
        {
          id: 'tower-defense',
          icon: '🏰',
          title: '数学塔防',
          description: '用数学知识守护基地，答题建塔！',
          tags: ['五年级', '初一', '有理数', '方程'],
          path: '/pages/tower-defense/index',
          comingSoon: false
        },
        {
          id: 'math-runner',
          icon: '🏃',
          title: '算术跑酷',
          description: '快速心算，躲避障碍，冲刺终点！',
          tags: ['四年级', '四则运算'],
          path: '',
          comingSoon: true
        },
        {
          id: 'fraction-puzzle',
          icon: '🧩',
          title: '分数拼图',
          description: '拼出正确的分数，解锁美丽图案！',
          tags: ['五年级', '分数'],
          path: '',
          comingSoon: true
        },
        {
          id: 'geometry-builder',
          icon: '📐',
          title: '几何建造师',
          description: '认识图形，计算面积，建造城市！',
          tags: ['六年级', '几何'],
          path: '',
          comingSoon: true
        }
      ]
    }
  },
  onLoad() {
    // #ifdef MP-WEIXIN
    const menuBtn = wx.getMenuButtonBoundingClientRect()
    this.navPaddingTop = menuBtn.top + menuBtn.height + 8
    // #endif
  },
  methods: {
    openICP() {
      // #ifdef H5
      window.open('https://beian.miit.gov.cn/', '_blank')
      // #endif
    },
    openGame(game) {
      soundManager.init()
      soundManager.click()
      if (game.comingSoon) {
        uni.showToast({
          title: '敬请期待',
          icon: 'none'
        })
        return
      }
      uni.navigateTo({
        url: game.path
      })
    }
  },

  // #ifdef MP-WEIXIN
  onShareAppMessage() {
    return {
      title: '数学工具集合 - 边玩边学，快乐成长！',
      path: '/pages/index/index'
    }
  },
  onShareTimeline() {
    return {
      title: '数学工具集合 - 边玩边学，快乐成长！'
    }
  }
  // #endif
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
}

.header {
  text-align: center;
  padding: 60rpx 0 40rpx;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #a0a0a0;
  margin-top: 16rpx;
}

.game-list {
  padding: 20rpx 0;
}

.game-card {
  display: flex;
  align-items: center;
  background: rgba(22, 33, 62, 0.9);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.game-card:active {
  transform: scale(0.98);
  border-color: #4CAF50;
}

.game-card.coming-soon {
  opacity: 0.6;
}

.game-icon {
  font-size: 80rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.game-info {
  flex: 1;
  overflow: hidden;
}

.game-title {
  display: block;
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.game-desc {
  display: block;
  font-size: 24rpx;
  color: #a0a0a0;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.tag {
  font-size: 20rpx;
  color: #2196F3;
  background: rgba(33, 150, 243, 0.15);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(33, 150, 243, 0.3);
}

.arrow {
  font-size: 48rpx;
  color: #4CAF50;
  margin-left: 16rpx;
}

.coming-soon-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: linear-gradient(135deg, #FF9800, #F57C00);
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.coming-soon-badge text {
  font-size: 20rpx;
  color: #ffffff;
}

.footer {
  text-align: center;
  padding: 60rpx 0 40rpx;
}

.footer-text {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.version {
  display: block;
  font-size: 20rpx;
  color: #444;
  margin-top: 10rpx;
}

.icp-link {
  display: block;
  margin-top: 20rpx;
}

.icp-text {
  font-size: 22rpx;
  color: #666;
}
</style>
