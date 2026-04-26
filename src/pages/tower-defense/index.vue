<template>
  <view class="game-container">
    <!-- 主菜单 -->
    <view v-if="screen === 'menu'" class="screen menu-screen">
      <view class="menu-content">
        <!-- 用户档案显示 -->
        <view v-if="currentUser" class="profile-display">
          <text class="profile-avatar">{{ currentUser.avatar || '👤' }}</text>
          <text class="profile-name">{{ currentUser.name }}</text>
        </view>

        <text class="title">🏰 数学塔防</text>
        <text class="subtitle">五年级 + 初一</text>
        <view class="menu-buttons">
          <button class="btn btn-primary" @click="screen = 'levels'">选择关卡</button>
          <button class="btn btn-primary daily-btn" @click="openDailyChallenge">
            每日挑战
            <text v-if="dailyChallengeStats && dailyChallengeStats.todayCompleted" class="daily-done-tag">已完成</text>
          </button>
          <button v-if="saveSlots.some(slot => slot !== null)" class="btn btn-primary" @click="openLoadModal">继续游戏</button>
          <button class="btn btn-secondary" @click="showProfileModal = true">切换档案</button>
          <button class="btn btn-secondary" @click="showHelp = true">工具说明</button>
          <button class="btn btn-secondary" @click="goBack">返回首页</button>
        </view>
        <view class="knowledge-tags">
          <text class="tag">小数运算</text>
          <text class="tag">简易方程</text>
          <text class="tag">多边形面积</text>
          <text class="tag">有理数</text>
          <text class="tag">整式</text>
          <text class="tag">一元一次方程</text>
          <text class="tag">几何初步</text>
        </view>
      </view>
    </view>

    <!-- 关卡选择界面 -->
    <view v-if="screen === 'levels'" class="screen levels-screen">
      <view class="levels-content">
        <text class="screen-title">选择关卡</text>
        <view class="levels-grid">
          <view
            v-for="level in LEVELS"
            :key="level.id"
            class="level-card"
            :class="{ locked: !isLevelUnlocked(level.id, levelProgress) }"
            @click="selectLevel(level)"
          >
            <text class="level-emoji">{{ level.emoji }}</text>
            <text class="level-name">{{ level.name }}</text>
            <view v-if="!isLevelUnlocked(level.id, levelProgress)" class="lock-icon">🔒</view>
            <view v-else-if="levelProgress[level.id]" class="level-stars">
              <text
                v-for="i in 3"
                :key="i"
                class="mini-star"
              >
                {{ i <= (levelProgress[level.id].bestStars || 0) ? '⭐' : '☆' }}
              </text>
            </view>
            <text class="level-waves">{{ level.totalWaves }} 波</text>
          </view>
        </view>
        <button class="btn btn-secondary back-btn" @click="screen = 'menu'">返回</button>
      </view>
    </view>

    <!-- 工具界面 -->
    <view v-if="screen === 'game'" class="screen game-screen">
      <!-- 顶部信息栏 -->
      <view class="game-header safe-area-top" :style="headerStyle">
        <view class="info-left">
          <text class="lives">❤️ {{ gameState.lives }}</text>
          <text class="gold">💰 {{ gameState.gold }}</text>
        </view>
        <view class="info-center">
          <text class="wave">第 {{ gameState.wave }} 波</text>
        </view>
        <view class="info-right">
          <text class="btn-icon" @click="toggleSound">{{ soundEnabled ? '🔊' : '🔇' }}</text>
          <text class="btn-icon" @click="pauseGame">⏸️</text>
          <text class="btn-icon" @click="toggleSpeed">{{ gameState.gameSpeed === 1 ? '⏩' : '⏩⏩' }}</text>
        </view>
      </view>

      <!-- 连击显示 -->
      <view v-if="comboInfo.combo >= 3" class="combo-display">
        <text class="combo-count">🔥 {{ comboInfo.combo }} 连击!</text>
        <text class="combo-multiplier">x{{ comboInfo.multiplier.toFixed(1) }} 奖励</text>
      </view>

      <!-- 工具画布 -->
      <view class="canvas-wrapper" id="canvasWrapper" :style="canvasWrapperStyle">
        <!-- #ifdef H5 -->
        <canvas
          id="gameCanvas"
          type="2d"
          class="game-canvas"
          :style="canvasStyle"
          @touchstart.stop.prevent="handleTouch"
        ></canvas>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <canvas
          canvas-id="gameCanvas"
          id="gameCanvas"
          class="game-canvas"
          :style="canvasStyle"
          @touchstart.stop.prevent="handleTouch"
        ></canvas>
        <!-- #endif -->
      </view>

      <!-- 选中塔信息栏 -->
      <view v-if="selectedTower" class="selected-tower-bar">
        <view class="selected-tower-info">
          <text class="selected-tower-emoji">{{ getTowerEmoji(selectedTower) }}</text>
          <view class="selected-tower-detail">
            <text class="selected-tower-name">{{ getTowerName(selectedTower) }}</text>
            <text class="selected-tower-desc">{{ getTowerDesc(selectedTower) }}</text>
          </view>
        </view>
        <text class="selected-tower-hint">点击绿色区域建造</text>
        <text class="cancel-select" @click="cancelSelect">✕</text>
      </view>

      <!-- 塔操作菜单 -->
      <view v-if="showTowerMenu" class="tower-menu-overlay" @click="closeTowerMenu">
        <view class="tower-menu" :style="towerMenuStyle" @click.stop>
          <view class="tower-menu-header">
            <text class="tower-menu-name">{{ towerMenuInfo.tower?.baseConfig?.emoji }} {{ towerMenuInfo.tower?.baseConfig?.name }} Lv{{ towerMenuInfo.tower?.level }}</text>
          </view>
          <view class="tower-menu-actions">
            <view class="tower-action upgrade-action" @click="upgradeTowerFromMenu">
              <text class="action-icon">⬆️</text>
              <text class="action-label">升级</text>
              <text class="action-cost">💰{{ towerMenuInfo.upgradeCost }}</text>
            </view>
            <view class="tower-action sell-action" @click="sellTowerFromMenu">
              <text class="action-icon">🗑️</text>
              <text class="action-label">拆除</text>
              <text class="action-price">+💰{{ towerMenuInfo.sellPrice }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部塔选择栏 - 横向滚动 -->
      <scroll-view class="tower-bar safe-area-bottom" scroll-x :show-scrollbar="false">
        <view class="tower-bar-inner">
          <view
            v-for="tower in towerList"
            :key="tower.type"
            class="tower-slot"
            :class="{ selected: selectedTower === tower.type, disabled: gameState.gold < tower.cost }"
            @click="selectTower(tower.type)"
          >
            <text class="tower-icon">{{ tower.emoji }}</text>
            <text class="tower-name">{{ tower.name }}</text>
            <text class="tower-cost">💰{{ tower.cost }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 数学题弹窗 -->
    <view v-if="showMathModal" class="modal">
      <view class="modal-content">
        <view class="math-question">
          <text class="question-type">{{ currentQuestion?.type }}</text>
          <text class="question-text">{{ currentQuestion?.question }}</text>
        </view>
        <view class="answer-area">
          <view v-if="showOptions" class="answer-options">
            <view
              v-for="(option, index) in answerOptions"
              :key="index"
              class="option-btn"
              :class="{ correct: feedback && option === currentQuestion?.answer, wrong: feedback && selectedOption === option && option !== currentQuestion?.answer }"
              @click="selectOption(option)"
            >
              <text>{{ option }}</text>
            </view>
          </view>
          <view v-else class="input-with-minus">
            <button class="minus-btn" :class="{ active: isNegative }" @click="toggleNegative">−</button>
            <input
              v-model="userAnswer"
              type="text"
              inputmode="decimal"
              class="answer-input"
              placeholder="输入答案"
              :adjust-position="false"
              @confirm="submitAnswer"
            />
          </view>
        </view>
        <view class="modal-buttons">
          <button v-if="!showOptions" class="btn btn-primary" @click="submitAnswer">确定</button>
          <button class="btn btn-secondary" @click="skipQuestion">跳过 (-20💰)</button>
        </view>
        <text v-if="feedback" class="feedback" :class="feedbackClass">{{ feedback }}</text>
      </view>
    </view>

    <!-- 暂停弹窗 -->
    <view v-if="showPauseModal" class="modal">
      <view class="modal-content">
        <text class="modal-title">工具暂停</text>
        <view class="modal-buttons">
          <button class="btn btn-primary" @click="resumeGame">继续工具</button>
          <button class="btn btn-secondary" @click="openSaveModal">保存游戏</button>
          <button class="btn btn-secondary" @click="restartGame">重新开始</button>
          <button class="btn btn-secondary" @click="quitGame">返回菜单</button>
        </view>
      </view>
    </view>

    <!-- 工具结束弹窗 -->
    <view v-if="showGameOverModal" class="modal game-over-modal">
      <view class="modal-content">
        <text class="result-title">{{ gameResult.win ? '🎉 胜利！' : '💪 挑战结束' }}</text>

        <!-- 星级显示 -->
        <view class="star-rating">
          <text
            v-for="i in 3"
            :key="i"
            class="star"
            :class="{ active: i <= gameResult.stars }"
          >
            {{ i <= gameResult.stars ? '⭐' : '☆' }}
          </text>
        </view>

        <!-- 详细评价 -->
        <view class="rating-details">
          <text v-for="detail in gameResult.starDetails" :key="detail" class="detail-item">{{ detail }}</text>
        </view>

        <!-- 统计数据 -->
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ gameResult.wave }}</text>
            <text class="stat-label">波数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ gameResult.accuracy }}%</text>
            <text class="stat-label">正确率</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ gameResult.maxCombo }}</text>
            <text class="stat-label">最高连击</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ gameResult.score }}</text>
            <text class="stat-label">得分</text>
          </view>
        </view>

        <!-- 新解锁的成就 -->
        <view v-if="gameResult.newAchievements && gameResult.newAchievements.length > 0" class="new-achievements">
          <text class="section-title">🏆 新成就解锁！</text>
          <view
            v-for="achievement in gameResult.newAchievements"
            :key="achievement.id"
            class="achievement-item"
          >
            <text class="achievement-icon">{{ achievement.icon }}</text>
            <view class="achievement-info">
              <text class="achievement-name">{{ achievement.name }}</text>
              <text class="achievement-desc">{{ achievement.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 激励语 -->
        <view class="encouragement">
          <text>{{ gameResult.encouragement }}</text>
        </view>

        <view class="modal-buttons">
          <button class="btn btn-primary" @click="restartGame">再来一局</button>
          <button class="btn btn-secondary" @click="shareResult">分享成绩</button>
          <!-- #ifdef MP-WEIXIN -->
          <button class="btn btn-secondary" open-type="share" @click="prepareChallenge">发起PK挑战</button>
          <!-- #endif -->
          <button class="btn btn-secondary" @click="quitGame">返回菜单</button>
        </view>
      </view>
    </view>

    <!-- 帮助弹窗 -->
    <view v-if="showHelp" class="modal" @click.self="showHelp = false">
      <view class="modal-content help-content">
        <text class="modal-title">工具说明</text>
        <view class="help-section">
          <text class="help-title">🎯 工具目标</text>
          <text class="help-text">阻止怪物到达终点！答对数学题获得金币，建造防御塔消灭敌人。</text>
        </view>
        <view class="help-section">
          <text class="help-title">🏗️ 如何建塔</text>
          <text class="help-text">1. 选择底部的塔类型</text>
          <text class="help-text">2. 点击地图上绿色区域</text>
          <text class="help-text">3. 答对数学题即可建造</text>
        </view>
        <view class="help-section">
          <text class="help-title">💡 防御塔类型</text>
          <text class="help-text">🏹 弓箭塔 - 攻速快，单体伤害</text>
          <text class="help-text">✨ 魔法塔 - 范围攻击，群伤</text>
          <text class="help-text">💣 炮塔 - 高伤害，攻速慢</text>
          <text class="help-text">❄️ 冰冻塔 - 减速敌人</text>
        </view>
        <view class="help-section">
          <text class="help-title">🔥 连击系统</text>
          <text class="help-text">连续答对题目可获得金币加成！</text>
          <text class="help-text">3连击 x1.2 | 5连击 x1.5 | 8连击 x2.0</text>
        </view>
        <button class="btn btn-primary" @click="showHelp = false">知道了</button>
      </view>
    </view>

    <!-- 档案管理弹窗 -->
    <view v-if="showProfileModal" class="modal">
      <view class="modal-content profile-modal">
        <text class="modal-title">档案管理</text>
        <view class="profile-list">
          <view
            v-for="profile in profileList"
            :key="profile.id"
            class="profile-item"
            :class="{ active: currentUser && currentUser.id === profile.id }"
          >
            <view class="profile-info" @click="switchProfile(profile)">
              <text class="profile-avatar-small">{{ profile.avatar || '👤' }}</text>
              <text class="profile-name-small">{{ profile.name }}</text>
            </view>
            <text class="delete-btn" @click="deleteProfile(profile.id)">🗑️</text>
          </view>
        </view>
        <view class="new-profile-form">
          <input
            v-model="newProfileName"
            type="text"
            class="profile-input"
            placeholder="输入新档案名称"
            @confirm="createProfile"
          />
          <button class="btn btn-primary" @click="createProfile">创建档案</button>
        </view>
        <button class="btn btn-secondary" @click="showProfileModal = false">关闭</button>
      </view>
    </view>

    <!-- 签到弹窗 -->
    <view v-if="showSigninModal" class="modal" @click.self="showSigninModal = false">
      <view class="modal-content signin-modal">
        <text class="modal-title">每日签到</text>
        <!-- 签到结果提示 -->
        <view v-if="signinResult" class="signin-result">
          <text class="signin-result-text">{{ signinResult.reward.label }}</text>
          <text class="signin-streak">连续签到 {{ signinResult.currentStreak }} 天</text>
        </view>
        <!-- 7天日历 -->
        <view v-if="signinStatus" class="signin-calendar">
          <view
            v-for="(reward, index) in signinStatus.rewards"
            :key="index"
            class="signin-day"
            :class="{
              signed: index < signinStatus.cycleDay || (index === signinStatus.cycleDay && signinStatus.todaySigned),
              today: !signinStatus.todaySigned && index === signinStatus.cycleDay
            }"
          >
            <text class="signin-day-num">第{{ reward.day }}天</text>
            <text class="signin-day-reward">{{ reward.label }}</text>
            <text v-if="index < signinStatus.cycleDay || (index === signinStatus.cycleDay && signinStatus.todaySigned)" class="signin-check">✓</text>
          </view>
        </view>
        <view class="modal-buttons">
          <button
            v-if="signinStatus && !signinStatus.todaySigned"
            class="btn btn-primary"
            @click="doSignin"
          >签到领奖</button>
          <button class="btn btn-secondary" @click="showSigninModal = false">关闭</button>
        </view>
      </view>
    </view>

    <!-- 每日挑战弹窗 -->
    <view v-if="showDailyChallengeModal" class="modal">
      <view class="modal-content daily-challenge-modal">
        <!-- 未完成：答题界面 -->
        <view v-if="!dailyChallengeFinished && dailyChallenge">
          <text class="modal-title">每日挑战</text>
          <view class="daily-progress">
            <text class="daily-progress-text">第 {{ dailyChallengeIndex + 1 }} / {{ dailyChallenge.totalCount }} 题</text>
            <view class="daily-progress-bar">
              <view class="daily-progress-fill" :style="{ width: (dailyChallengeIndex / dailyChallenge.totalCount * 100) + '%' }"></view>
            </view>
          </view>
          <view v-if="dailyChallenge.questions[dailyChallengeIndex]" class="math-question">
            <text class="question-type">{{ dailyChallenge.questions[dailyChallengeIndex].type }}</text>
            <text class="question-text">{{ dailyChallenge.questions[dailyChallengeIndex].question }}</text>
          </view>
          <view class="answer-options">
            <view
              v-for="(option, i) in (dailyChallenge.questions[dailyChallengeIndex] || {}).options || []"
              :key="i"
              class="option-btn"
              :class="{
                correct: dailyChallengeFeedback && option === dailyChallenge.questions[dailyChallengeIndex].answer,
                wrong: dailyChallengeFeedback && dailyChallengeSelected === option && option !== dailyChallenge.questions[dailyChallengeIndex].answer
              }"
              @click="selectDailyChallengeOption(option)"
            >
              <text>{{ option }}</text>
            </view>
          </view>
          <text v-if="dailyChallengeFeedback" class="feedback" :class="dailyChallengeFeedback === 'correct' ? 'correct' : 'wrong'">
            {{ dailyChallengeFeedback === 'correct' ? '✓ 正确！' : '✗ 答案是 ' + dailyChallenge.questions[dailyChallengeIndex].answer }}
          </text>
        </view>

        <!-- 已完成：结果界面 -->
        <view v-if="dailyChallengeFinished && dailyChallengeResult">
          <text class="modal-title">挑战完成！</text>
          <view class="daily-result-stats">
            <view class="stat-item">
              <text class="stat-value">{{ dailyChallengeResult.correct }} / {{ dailyChallengeResult.total }}</text>
              <text class="stat-label">正确数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ dailyChallengeResult.accuracy }}%</text>
              <text class="stat-label">正确率</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ dailyChallengeResult.timeStr }}</text>
              <text class="stat-label">用时</text>
            </view>
          </view>
          <view v-if="dailyChallengeStats" class="daily-streak-info">
            <text class="daily-streak-text">连续挑战 {{ dailyChallengeStats.streak }} 天</text>
          </view>
          <view class="modal-buttons">
            <button class="btn btn-secondary" @click="shareResult">分享成绩</button>
            <button class="btn btn-secondary" @click="showDailyChallengeModal = false">关闭</button>
          </view>
        </view>

        <!-- 已完成过：查看记录 -->
        <view v-if="!dailyChallenge && dailyChallengeStats && dailyChallengeStats.todayCompleted">
          <text class="modal-title">今日已完成</text>
          <view v-if="dailyChallengeStats.todayResult" class="daily-result-stats">
            <view class="stat-item">
              <text class="stat-value">{{ dailyChallengeStats.todayResult.correct }} / {{ dailyChallengeStats.todayResult.total }}</text>
              <text class="stat-label">正确数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ Math.round(dailyChallengeStats.todayResult.correct / dailyChallengeStats.todayResult.total * 100) }}%</text>
              <text class="stat-label">正确率</text>
            </view>
          </view>
          <view class="daily-streak-info">
            <text class="daily-streak-text">连续挑战 {{ dailyChallengeStats.streak }} 天 | 累计 {{ dailyChallengeStats.totalDays }} 天</text>
          </view>
          <view class="modal-buttons">
            <button class="btn btn-secondary" @click="showDailyChallengeModal = false">关闭</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 保存游戏弹窗 -->
    <view v-if="showSaveModal" class="modal">
      <view class="modal-content save-modal">
        <text class="modal-title">保存游戏</text>
        <view class="save-slots">
          <view
            v-for="(slot, index) in [1, 2, 3]"
            :key="index"
            class="save-slot"
            @click="saveToSlot(slot)"
          >
            <text class="slot-number">存档 {{ slot }}</text>
            <view v-if="saveSlots[slot]" class="slot-info">
              <text class="slot-level">{{ saveSlots[slot].levelName }}</text>
              <text class="slot-wave">第 {{ saveSlots[slot].wave }} 波</text>
              <text class="slot-time">{{ saveSlots[slot].saveTime }}</text>
            </view>
            <text v-else class="slot-empty">空</text>
          </view>
        </view>
        <button class="btn btn-secondary" @click="showSaveModal = false">取消</button>
      </view>
    </view>

    <!-- 加载游戏弹窗 -->
    <view v-if="showLoadModal" class="modal">
      <view class="modal-content load-modal">
        <text class="modal-title">加载游戏</text>
        <view class="save-slots">
          <view
            v-for="(slot, index) in [0, 1, 2, 3]"
            :key="index"
            class="save-slot"
            :class="{ disabled: !saveSlots[slot] }"
            @click="loadFromSlot(slot)"
          >
            <text class="slot-number">{{ slot === 0 ? '自动存档' : `存档 ${slot}` }}</text>
            <view v-if="saveSlots[slot]" class="slot-info">
              <text class="slot-level">{{ saveSlots[slot].levelName }}</text>
              <text class="slot-wave">第 {{ saveSlots[slot].wave }} 波</text>
              <text class="slot-time">{{ saveSlots[slot].saveTime }}</text>
            </view>
            <text v-else class="slot-empty">空</text>
          </view>
        </view>
        <button class="btn btn-secondary" @click="showLoadModal = false">取消</button>
      </view>
    </view>

    <!-- PK挑战来袭弹窗 -->
    <view v-if="showChallengeModal && pendingChallenge" class="modal">
      <view class="modal-content">
        <text class="modal-title">PK挑战来袭！</text>
        <view class="challenge-info">
          <text class="challenge-from">{{ pendingChallenge.challengerName }} 向你发起挑战</text>
          <view class="challenge-stats">
            <view class="stat-item">
              <text class="stat-value">{{ pendingChallenge.score }}</text>
              <text class="stat-label">得分</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ pendingChallenge.wave }}</text>
              <text class="stat-label">波数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ pendingChallenge.accuracy }}%</text>
              <text class="stat-label">正确率</text>
            </view>
          </view>
        </view>
        <view class="modal-buttons">
          <button class="btn btn-primary" @click="acceptChallenge">接受挑战</button>
          <button class="btn btn-secondary" @click="showChallengeModal = false">下次再说</button>
        </view>
      </view>
    </view>

    <!-- PK对比结果弹窗 -->
    <view v-if="showChallengeResultModal && challengeComparison" class="modal">
      <view class="modal-content">
        <text class="modal-title">{{ challengeComparison.winner === 'responder' ? '🎉 你赢了！' : challengeComparison.winner === 'challenger' ? '💪 对手更强' : '🤝 旗鼓相当' }}</text>
        <view class="vs-table">
          <view class="vs-header">
            <text class="vs-label">项目</text>
            <text class="vs-me">我</text>
            <text class="vs-them">对手</text>
          </view>
          <view
            v-for="(item, i) in challengeComparison.comparison"
            :key="i"
            class="vs-row"
          >
            <text class="vs-label">{{ item.label }}</text>
            <text class="vs-me" :class="{ 'vs-winner': item.better === 'responder' }">{{ item.responder }}</text>
            <text class="vs-them" :class="{ 'vs-winner': item.better === 'challenger' }">{{ item.challenger }}</text>
          </view>
        </view>
        <view class="modal-buttons">
          <button class="btn btn-primary" @click="showChallengeResultModal = false">确定</button>
        </view>
      </view>
    </view>

    <!-- 隐藏的海报画布（用于分享图片） -->
    <!-- #ifdef MP-WEIXIN -->
    <canvas canvas-id="posterCanvas" class="poster-canvas"></canvas>
    <!-- #endif -->
    <!-- #ifdef H5 -->
    <canvas id="posterCanvas" type="2d" class="poster-canvas"></canvas>
    <!-- #endif -->
  </view>
</template>

<script>
import { Game, TOWER_LIST, DailySystem, encodeChallenge, decodeChallenge, compareResults, saveSentChallenge, saveChallengeResponse } from '@/game/tower-defense/index.js'
import { CanvasAdapter } from '@/utils/canvas-adapter.js'
import { generateRandomQuestion, generateOptions, checkAnswer } from '@/utils/math.js'
import { storageManager } from '@/utils/storage-manager'
import { LEVELS, getLevelConfig, isLevelUnlocked } from '@/game/tower-defense/config/levels.js'
import { soundManager } from '@/utils/sound-manager'
import { drawGameOverPoster, drawDailyChallengePoster, exportAndSavePoster } from '@/utils/poster-generator'

export default {
  data() {
    return {
      screen: 'menu',
      showHelp: false,
      showMathModal: false,
      showPauseModal: false,
      showGameOverModal: false,
      showTowerMenu: false,

      // 用户档案
      currentUser: null,
      showProfileModal: false,
      newProfileName: '',
      profileList: [],

      // 关卡系统
      LEVELS: LEVELS,
      selectedLevel: null,
      levelProgress: {},

      // 存档系统
      showSaveModal: false,
      showLoadModal: false,
      saveSlots: [null, null, null, null],

      // 工具实例
      game: null,
      canvasAdapter: null,

      // 工具状态（从 Game 同步）
      gameState: {
        lives: 20,
        gold: 100,
        wave: 1,
        gameSpeed: 1,
        isPaused: false,
        isGameOver: false
      },

      // 连击信息
      comboInfo: {
        combo: 0,
        multiplier: 1
      },

      // 塔列表
      towerList: TOWER_LIST,

      // 选中的塔
      selectedTower: null,

      // 画布尺寸
      canvasWidth: 320,
      canvasHeight: 400,

      // 安全区域和胶囊按钮
      statusBarHeight: 0,
      capsuleInfo: { top: 0, height: 0, right: 0 },

      // 数学题相关
      currentQuestion: null,
      userAnswer: '',
      answerOptions: [],
      showOptions: false,
      feedback: '',
      feedbackClass: '',
      selectedOption: null,
      mathCallback: null,
      isNegative: false,

      // 工具结果
      gameResult: {
        win: false,
        wave: 0,
        enemiesKilled: 0,
        questionsCorrect: 0,
        accuracy: 0,
        maxCombo: 0,
        stars: 0,
        starDetails: [],
        newAchievements: [],
        encouragement: ''
      },

      // 塔菜单
      towerMenuInfo: {
        tower: null,
        upgradeCost: 0,
        sellPrice: 0
      },
      towerMenuPosition: { x: 0, y: 0 },

      // 随机出题定时器
      randomQuestionTimer: null,

      // 音效开关
      soundEnabled: true,

      // 签到系统
      dailySystem: null,
      showSigninModal: false,
      signinStatus: null,
      signinResult: null,

      // 每日挑战
      showDailyChallengeModal: false,
      dailyChallenge: null,
      dailyChallengeIndex: 0,
      dailyChallengeCorrect: 0,
      dailyChallengeStartTime: 0,
      dailyChallengeFinished: false,
      dailyChallengeResult: null,
      dailyChallengeStats: null,
      dailyChallengeSelected: null,
      dailyChallengeFeedback: '',

      // PK挑战
      pendingChallenge: null,
      showChallengeModal: false,
      showChallengeResultModal: false,
      challengeComparison: null
    }
  },

  computed: {
    canvasStyle() {
      return {
        width: this.canvasWidth + 'px',
        height: this.canvasHeight + 'px'
      }
    },
    anyModalOpen() {
      return this.showMathModal || this.showPauseModal || this.showGameOverModal || this.showTowerMenu
    },
    towerMenuStyle() {
      const { x, y } = this.towerMenuPosition
      const menuWidth = 280
      const menuHeight = 160
      const screenWidth = this.canvasWidth
      const screenHeight = this.canvasHeight

      // 确保菜单在屏幕范围内
      let left = x
      let top = y

      if (left + menuWidth > screenWidth) {
        left = screenWidth - menuWidth - 20
      }
      if (left < 20) {
        left = 20
      }
      if (top + menuHeight > screenHeight) {
        top = screenHeight - menuHeight - 20
      }
      if (top < 20) {
        top = 20
      }

      return {
        left: left + 'px',
        top: top + 'px'
      }
    },
    canvasWrapperStyle() {
      if (this.anyModalOpen) {
        return { position: 'absolute', left: '-9999px' }
      }
      return {}
    },
    headerStyle() {
      const style = { paddingTop: this.statusBarHeight + 'px' }
      if (this.capsuleInfo.height > 0) {
        style.height = (this.capsuleInfo.top + this.capsuleInfo.height + 8) + 'px'
        style.paddingRight = (this.capsuleInfo.right + 8) + 'px'
      }
      return style
    }
  },

  methods: {
    goBack() {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    },

    getTowerName(type) {
      const tower = this.towerList.find(t => t.type === type)
      return tower ? tower.name : ''
    },

    getTowerEmoji(type) {
      const tower = this.towerList.find(t => t.type === type)
      return tower ? tower.emoji : ''
    },

    getTowerDesc(type) {
      const tower = this.towerList.find(t => t.type === type)
      return tower ? tower.description : ''
    },

    cancelSelect() {
      this.selectedTower = null
      if (this.game) {
        this.game.selectedTower = null
        this.game.events.emit('towerSelected', { type: null })
      }
    },

    // 档案管理方法
    loadProfile() {
      // 加载当前用户
      const userId = storageManager.getCurrentUser()
      const users = storageManager.getUserList()
      this.profileList = users

      if (userId && users.length > 0) {
        this.currentUser = users.find(u => u.id === userId) || users[0]
        if (!this.currentUser.id) {
          this.currentUser = users[0]
          storageManager.setCurrentUser(this.currentUser.id)
        }
      } else if (users.length > 0) {
        this.currentUser = users[0]
        storageManager.setCurrentUser(this.currentUser.id)
      } else {
        // 没有用户，显示档案创建弹窗
        this.showProfileModal = true
      }

      if (this.currentUser) {
        this.loadLevelProgress()
        this.refreshSaveSlots()
        this.initSigninSystem()
      }
    },

    createProfile() {
      if (!this.newProfileName.trim()) {
        uni.showToast({ title: '请输入档案名称', icon: 'none' })
        return
      }

      const newUser = storageManager.addUser({ name: this.newProfileName.trim() })
      this.profileList = storageManager.getUserList()
      this.switchProfile(newUser)
      this.newProfileName = ''
      this.showProfileModal = false
      uni.showToast({ title: '档案创建成功', icon: 'success' })
    },

    switchProfile(user) {
      this.currentUser = user
      storageManager.setCurrentUser(user.id)
      this.loadLevelProgress()
      this.refreshSaveSlots()
      this.initSigninSystem()
      this.showProfileModal = false
      uni.showToast({ title: `切换到 ${user.name}`, icon: 'success' })
    },

    deleteProfile(userId) {
      if (this.profileList.length <= 1) {
        uni.showToast({ title: '至少保留一个档案', icon: 'none' })
        return
      }

      uni.showModal({
        title: '确认删除',
        content: '删除档案将清除所有进度，确定删除吗？',
        success: (res) => {
          if (res.confirm) {
            storageManager.deleteUser(userId)
            this.profileList = storageManager.getUserList()
            if (this.currentUser && this.currentUser.id === userId) {
              this.switchProfile(this.profileList[0])
            }
            uni.showToast({ title: '档案已删除', icon: 'success' })
          }
        }
      })
    },

    // 签到系统
    initSigninSystem() {
      this.dailySystem = new DailySystem()
      this.dailySystem.load()
      this.signinStatus = this.dailySystem.getSigninStatus()
      this.dailyChallengeStats = this.dailySystem.getDailyChallengeStats()

      // 未签到时自动弹窗
      if (!this.signinStatus.todaySigned) {
        this.signinResult = null
        this.showSigninModal = true
      }
    },

    // 每日挑战
    openDailyChallenge() {
      if (!this.dailySystem) return

      this.dailyChallengeStats = this.dailySystem.getDailyChallengeStats()

      if (this.dailyChallengeStats.todayCompleted) {
        // 今日已完成，显示记录
        this.dailyChallenge = null
        this.dailyChallengeFinished = false
        this.showDailyChallengeModal = true
        return
      }

      // 生成今日挑战
      this.dailyChallenge = this.dailySystem.getTodayChallenge()
      this.dailyChallengeIndex = 0
      this.dailyChallengeCorrect = 0
      this.dailyChallengeStartTime = Date.now()
      this.dailyChallengeFinished = false
      this.dailyChallengeResult = null
      this.dailyChallengeSelected = null
      this.dailyChallengeFeedback = ''
      this.showDailyChallengeModal = true
    },

    selectDailyChallengeOption(option) {
      if (this.dailyChallengeFeedback) return
      if (!this.dailyChallenge) return

      const q = this.dailyChallenge.questions[this.dailyChallengeIndex]
      this.dailyChallengeSelected = option

      const isCorrect = option === q.answer
      if (isCorrect) {
        this.dailyChallengeCorrect++
        this.dailyChallengeFeedback = 'correct'
        soundManager.correct()
      } else {
        this.dailyChallengeFeedback = 'wrong'
        soundManager.wrong()
      }

      setTimeout(() => {
        this.dailyChallengeFeedback = ''
        this.dailyChallengeSelected = null
        this.dailyChallengeIndex++

        if (this.dailyChallengeIndex >= this.dailyChallenge.totalCount) {
          this.finishDailyChallenge()
        }
      }, isCorrect ? 600 : 1200)
    },

    finishDailyChallenge() {
      const elapsed = Date.now() - this.dailyChallengeStartTime
      const seconds = Math.round(elapsed / 1000)
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      const timeStr = minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`

      const total = this.dailyChallenge.totalCount
      const correct = this.dailyChallengeCorrect
      const accuracy = Math.round(correct / total * 100)
      const score = correct * 20 + (accuracy >= 80 ? 50 : 0) + (accuracy === 100 ? 100 : 0)

      this.dailyChallengeResult = {
        correct,
        total,
        accuracy,
        time: seconds,
        timeStr,
        score
      }

      // 保存结果
      this.dailySystem.saveDailyChallengeResult(this.dailyChallengeResult)
      this.dailyChallengeStats = this.dailySystem.getDailyChallengeStats()
      this.dailyChallengeFinished = true

      if (accuracy === 100) {
        soundManager.victory()
      } else {
        soundManager.achievement()
      }
    },

    // PK挑战
    prepareChallenge() {
      // 标记正在发起挑战，onShareAppMessage 会使用此标记
      this._isChallengeShare = true
    },

    acceptChallenge() {
      if (!this.pendingChallenge) return
      const levelId = this.pendingChallenge.levelId
      const level = this.LEVELS.find(l => l.id === levelId)
      if (!level) {
        uni.showToast({ title: '关卡不存在', icon: 'none' })
        return
      }
      if (!this.isLevelUnlocked(levelId, this.levelProgress)) {
        uni.showToast({ title: '关卡未解锁', icon: 'none' })
        return
      }
      this.showChallengeModal = false
      soundManager.init()
      this.selectedLevel = level
      this.startGame()
    },

    // 订阅消息（微信小程序）
    requestSubscribeMessage() {
      // #ifdef MP-WEIXIN
      // 防止频繁提示：每3天最多提示一次
      const lastPrompt = storageManager.loadData('subscribe_prompt_time', 0)
      const now = Date.now()
      if (lastPrompt && now - lastPrompt < 3 * 24 * 60 * 60 * 1000) {
        return
      }

      // 需要在微信公众平台配置模板ID后替换
      // 此处使用占位符，实际部署时替换为真实模板ID
      const tmplIds = []
      if (tmplIds.length === 0) return

      wx.requestSubscribeMessage({
        tmplIds,
        success: () => {
          storageManager.saveData('subscribe_prompt_time', now)
        },
        fail: () => {
          storageManager.saveData('subscribe_prompt_time', now)
        }
      })
      // #endif
    },

    handleChallengeResult(myResult) {
      if (!this.pendingChallenge) return
      const comparison = compareResults(this.pendingChallenge, myResult)
      this.challengeComparison = comparison
      saveChallengeResponse(this.pendingChallenge, myResult)
      // 延迟显示PK对比（等游戏结束弹窗关闭后）
      setTimeout(() => {
        this.showChallengeResultModal = true
      }, 500)
    },

    doSignin() {
      if (!this.dailySystem) return
      const result = this.dailySystem.signin()
      if (result.success) {
        this.signinResult = result
        this.signinStatus = this.dailySystem.getSigninStatus()
        soundManager.gold()
        uni.showToast({ title: `签到成功！${result.reward.label}`, icon: 'none', duration: 2000 })
      }
    },

    // 关卡进度管理
    loadLevelProgress() {
      if (!this.currentUser) return
      this.levelProgress = storageManager.loadData('progress', {})
    },

    saveLevelProgress(levelId, result) {
      if (!this.currentUser) return

      const progress = this.levelProgress[levelId] || {}

      // 更新最佳成绩
      if (!progress.bestStars || result.stars > progress.bestStars) {
        progress.bestStars = result.stars
      }
      if (!progress.bestWave || result.wave > progress.bestWave) {
        progress.bestWave = result.wave
      }
      if (!progress.bestScore || result.score > progress.bestScore) {
        progress.bestScore = result.score
      }
      if (result.win) {
        progress.completed = true
      }

      this.levelProgress[levelId] = progress
      storageManager.saveData('progress', this.levelProgress)
    },

    isLevelUnlocked(levelId, progressData) {
      return isLevelUnlocked(levelId, progressData || this.levelProgress)
    },

    // 关卡选择
    selectLevel(level) {
      if (!this.isLevelUnlocked(level.id, this.levelProgress)) {
        uni.showToast({ title: '关卡未解锁', icon: 'none' })
        return
      }

      soundManager.init()
      soundManager.click()
      this.selectedLevel = level
      this.startGame()
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      soundManager.setEnabled(this.soundEnabled)
      soundManager.toggle(this.soundEnabled)
    },

    // 存档管理
    refreshSaveSlots() {
      if (!this.currentUser) return
      // 从存储加载存档信息（saves 是按槽位存储的对象）
      const saves = storageManager.loadData('saves', {})
      const slots = [null, null, null, null]
      for (let i = 0; i <= 3; i++) {
        const save = saves[i]
        if (save) {
          const levelConfig = save.levelId ? getLevelConfig(save.levelId) : null
          slots[i] = {
            levelName: levelConfig ? levelConfig.name : '自由模式',
            wave: save.state ? save.state.wave : 0,
            saveTime: this.formatTime(save.timestamp)
          }
        }
      }
      this.saveSlots = slots
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    openSaveModal() {
      this.refreshSaveSlots()
      this.showSaveModal = true
      this.showPauseModal = false
    },

    openLoadModal() {
      this.refreshSaveSlots()
      this.showLoadModal = true
    },

    saveToSlot(slot) {
      if (!this.game) return

      try {
        this.game.saveGame(slot)
        this.refreshSaveSlots()
        this.showSaveModal = false
        uni.showToast({ title: `已保存到存档 ${slot}`, icon: 'success' })
      } catch (error) {
        console.error('Save failed:', error)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },

    loadFromSlot(slot) {
      if (!this.saveSlots[slot]) {
        uni.showToast({ title: '存档为空', icon: 'none' })
        return
      }

      try {
        const saves = storageManager.loadData('saves', {})
        const saveData = saves[slot]

        if (!saveData) {
          uni.showToast({ title: '存档不存在', icon: 'none' })
          return
        }

        // 设置选中的关卡
        if (saveData.levelId) {
          this.selectedLevel = getLevelConfig(saveData.levelId)
        } else {
          this.selectedLevel = null
        }

        // 关闭加载弹窗
        this.showLoadModal = false

        // 启动游戏并加载存档
        this.startGameAndLoad(saveData)
        uni.showToast({ title: '存档加载成功', icon: 'success' })
      } catch (error) {
        console.error('Load failed:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },

    async startGameAndLoad(saveData) {
      // 先启动游戏
      await this.startGame()

      // 等待游戏初始化完成后加载存档
      setTimeout(() => {
        if (this.game && this.game.saveSystem) {
          this.game.loadGame(saveData)
        }
      }, 200)
    },

    async startGame() {
      const sysInfo = uni.getSystemInfoSync()
      const screenWidth = sysInfo.windowWidth
      const screenHeight = sysInfo.windowHeight

      this.statusBarHeight = sysInfo.statusBarHeight || 0

      // #ifdef MP-WEIXIN
      const menuBtn = wx.getMenuButtonBoundingClientRect()
      this.capsuleInfo = {
        top: menuBtn.top,
        height: menuBtn.height,
        right: screenWidth - menuBtn.left
      }
      const headerHeight = menuBtn.top + menuBtn.height + 8
      // #endif
      // #ifndef MP-WEIXIN
      const headerHeight = 50
      // #endif

      const tipHeight = 40
      const towerBarHeight = 90
      const safeBottom = sysInfo.safeAreaInsets?.bottom || 0

      this.canvasWidth = screenWidth
      this.canvasHeight = screenHeight - headerHeight - tipHeight - towerBarHeight - safeBottom - 20

      this.screen = 'game'
      await this.$nextTick()
      setTimeout(() => this.initGame(), 100)
    },

    async initGame() {
      try {
        // 等待 DOM 完全渲染
        await this.$nextTick()
        // 额外等待一帧，确保浏览器完成布局
        await new Promise(resolve => setTimeout(resolve, 50))

        // 初始化 Canvas 适配器，传入期望尺寸避免获取不准确
        this.canvasAdapter = new CanvasAdapter()
        await this.canvasAdapter.init(this, 'gameCanvas', {
          fillContainer: true,
          width: this.canvasWidth,
          height: this.canvasHeight
        })

        // 创建工具实例，传入关卡配置
        const gameConfig = {}
        if (this.selectedLevel) {
          gameConfig.levelConfig = this.selectedLevel
        }
        this.game = new Game(this.canvasAdapter, gameConfig)

        // 监听工具事件
        this.setupGameEvents()

        // 初始化并启动工具（带5秒延迟）
        this.game.init()
        this.game.startWithDelay()

        // 启动随机出题定时器
        this.startRandomQuestionTimer()

        // 刷新存档槽位信息
        this.refreshSaveSlots()
      } catch (error) {
        console.error('Game init failed:', error)
        setTimeout(() => this.initGame(), 200)
      }
    },

    setupGameEvents() {
      // 状态变化
      this.game.events.on('stateChange', (state) => {
        this.gameState = { ...state }
      })

      // 塔选择
      this.game.events.on('towerSelected', ({ type }) => {
        if (type) soundManager.click()
        this.selectedTower = type
      })

      // 连击变化
      this.game.events.on('comboChange', (info) => {
        this.comboInfo = { ...info }
      })

      // 连击里程碑
      this.game.events.on('showComboMilestone', () => {
        soundManager.combo()
      })

      // 需要数学题
      this.game.events.on('needMathQuestion', ({ difficulty, callback }) => {
        this.showMathQuestion(difficulty, callback)
      })

      // 显示塔菜单
      this.game.events.on('showTowerMenu', ({ tower, upgradeCost, sellPrice }) => {
        soundManager.click()
        this.towerMenuInfo = { tower, upgradeCost, sellPrice }

        const headerHeight = this.capsuleInfo.height > 0
          ? this.capsuleInfo.top + this.capsuleInfo.height + 8
          : 50
        const tipHeight = 40

        this.towerMenuPosition = {
          x: tower.x + 20,
          y: tower.y + headerHeight + tipHeight - 40
        }

        this.showTowerMenu = true
        this.game.pause()
      })

      // 波次开始
      this.game.events.on('waveStart', () => {
        soundManager.waveStart()
      })

      // 建造塔
      this.game.events.on('towerBuilt', () => {
        soundManager.build()
      })

      // 升级塔
      this.game.events.on('towerUpgraded', () => {
        soundManager.upgrade()
      })

      // Toast 提示
      this.game.events.on('showToast', ({ title, icon }) => {
        uni.showToast({ title, icon, duration: 1000 })
      })

      // 怪物死亡
      this.game.events.on('enemyDied', () => {
        soundManager.enemyKill()
      })

      // 怪物到达终点
      this.game.events.on('enemyReachedEnd', () => {
        soundManager.enemyLeak()
      })

      // 金币矿场产金
      this.game.events.on('goldProduced', () => {
        soundManager.gold()
      })

      // 工具结束
      this.game.events.on('gameover', (result) => {
        this.gameResult = result
        this.showGameOverModal = true
        if (result.win) {
          soundManager.victory()
        } else {
          soundManager.defeat()
        }

        // 保存关卡进度
        if (result.levelId) {
          this.saveLevelProgress(result.levelId, result)
        }

        // PK挑战对比
        if (this.pendingChallenge) {
          this.handleChallengeResult(result)
        }

        // 胜利后延迟请求订阅消息
        if (result.win) {
          setTimeout(() => this.requestSubscribeMessage(), 2000)
        }
      })

      // 成就解锁
      this.game.events.on('achievementUnlocked', (achievement) => {
        soundManager.achievement()
        uni.showToast({
          title: `🏆 解锁: ${achievement.name}`,
          icon: 'none',
          duration: 2000
        })
      })
    },

    handleTouch(e) {
      if (!this.game || !this.canvasAdapter) return

      const touch = e.touches[0]
      if (!touch) return

      const { x, y } = this.canvasAdapter.touchToLogic(touch, e)
      this.game.handleTouch(x, y)
    },

    closeTowerMenu() {
      this.showTowerMenu = false
      if (this.game) {
        this.game.resume()
      }
    },

    upgradeTowerFromMenu() {
      if (this.game && this.towerMenuInfo.tower) {
        this.closeTowerMenu()
        this.game.tryUpgradeTower(this.towerMenuInfo.tower)
      }
    },

    sellTowerFromMenu() {
      soundManager.sell()
      if (this.game && this.towerMenuInfo.tower) {
        this.closeTowerMenu()
        this.game.sellTower(this.towerMenuInfo.tower)
      }
    },

    selectTower(type) {
      if (this.game) {
        this.game.selectTower(type)
      }
    },

    showMathQuestion(difficulty, callback) {
      this.game.pause()
      this.mathCallback = callback
      this.currentQuestion = generateRandomQuestion(difficulty)
      this.gameState.questionsAnswered++

      this.userAnswer = ''
      this.feedback = ''
      this.feedbackClass = ''
      this.selectedOption = null
      this.isNegative = false

      if (Math.random() > 0.5 && difficulty <= 2) {
        this.showOptions = true
        this.answerOptions = generateOptions(this.currentQuestion.answer)
      } else {
        this.showOptions = false
        this.answerOptions = []
      }

      this.showMathModal = true
    },

    selectOption(option) {
      if (this.feedback) return
      this.selectedOption = option
      this.checkMathAnswer(option.toString())
    },

    toggleNegative() {
      this.isNegative = !this.isNegative
    },

    submitAnswer() {
      if (!this.userAnswer) return
      // 组合负号和答案
      const finalAnswer = this.isNegative ? '-' + this.userAnswer : this.userAnswer
      this.checkMathAnswer(finalAnswer)
    },

    checkMathAnswer(answer) {
      const isCorrect = checkAnswer(answer, this.currentQuestion.answer)

      if (isCorrect) {
        this.feedback = '✓ 回答正确！'
        this.feedbackClass = 'correct'
        soundManager.correct()
      } else {
        this.feedback = `✗ 答案是 ${this.currentQuestion.answer}`
        this.feedbackClass = 'wrong'
        soundManager.wrong()
      }

      setTimeout(() => {
        this.closeMathModal()
        if (this.mathCallback) {
          this.mathCallback(isCorrect)
        }
      }, isCorrect ? 600 : 1200)
    },

    skipQuestion() {
      if (this.game && this.game.skipQuestion()) {
        this.closeMathModal()
        if (this.mathCallback) {
          this.mathCallback(true)
        }
      } else {
        uni.showToast({ title: '金币不足', icon: 'none' })
      }
    },

    closeMathModal() {
      this.showMathModal = false
      if (this.game) {
        this.game.resume()
        // 重新启动随机出题定时器
        this.startRandomQuestionTimer()
      }
    },

    // 启动随机出题定时器（10-20秒随机间隔）
    startRandomQuestionTimer() {
      this.stopRandomQuestionTimer()
      const delay = 10000 + Math.random() * 10000 // 10-20秒
      this.randomQuestionTimer = setTimeout(() => {
        this.triggerRandomQuestion()
      }, delay)
    },

    // 停止随机出题定时器
    stopRandomQuestionTimer() {
      if (this.randomQuestionTimer) {
        clearTimeout(this.randomQuestionTimer)
        this.randomQuestionTimer = null
      }
    },

    // 触发随机数学题
    triggerRandomQuestion() {
      // 如果游戏不在运行状态，不出题
      if (!this.game || this.gameState.isPaused || this.gameState.isGameOver) {
        return
      }
      // 如果当前已有弹窗，不重复出题
      if (this.showMathModal || this.showPauseModal || this.showGameOverModal) {
        this.startRandomQuestionTimer()
        return
      }

      // 显示随机数学题，回答后给予金币奖励
      this.showMathQuestion(2, (isCorrect) => {
        if (isCorrect) {
          // 答对奖励金币
          this.game.addGold(15)
          uni.showToast({ title: '+15 金币！', icon: 'none', duration: 1000 })
        }
      })
    },

    pauseGame() {
      if (this.game) {
        this.game.pause()
        this.showPauseModal = true
      }
    },

    resumeGame() {
      this.showPauseModal = false
      if (this.game) {
        this.game.resume()
      }
    },

    toggleSpeed() {
      if (this.game) {
        const speed = this.game.toggleSpeed()
        uni.showToast({ title: `${speed}x 速度`, icon: 'none', duration: 800 })
      }
    },

    restartGame() {
      this.showPauseModal = false
      this.showGameOverModal = false
      this.stopRandomQuestionTimer()
      if (this.game) {
        this.game.destroy()
      }
      this.comboInfo = { combo: 0, multiplier: 1 }
      this.selectedTower = null
      this.initGame()
    },

    quitGame() {
      this.showPauseModal = false
      this.showGameOverModal = false
      this.stopRandomQuestionTimer()
      if (this.game) {
        this.game.destroy()
        this.game = null
      }
      this.selectedLevel = null
      this.screen = 'menu'
    },

    shareResult() {
      // #ifdef H5
      this.shareResultH5()
      // #endif

      // #ifdef MP-WEIXIN
      this.shareResultWx()
      // #endif
    },

    shareResultH5() {
      const text = `🏰 我在【数学塔防】中坚守了 ${this.gameResult.wave} 波！答题正确率 ${this.gameResult.accuracy}%！最高连击 ${this.gameResult.maxCombo}！快来挑战吧！`
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
        uni.showToast({ title: '已复制，快去分享吧', icon: 'none' })
      }
    },

    shareResultWx() {
      uni.showLoading({ title: '生成海报...' })

      const ctx = uni.createCanvasContext('posterCanvas', this)
      const userName = this.currentUser ? this.currentUser.name : ''

      if (this.showDailyChallengeModal && this.dailyChallengeResult) {
        drawDailyChallengePoster(ctx, {
          result: this.dailyChallengeResult,
          stats: this.dailyChallengeStats,
          userName
        })
      } else {
        drawGameOverPoster(ctx, {
          gameResult: this.gameResult,
          userName
        })
      }

      ctx.draw(false, () => {
        exportAndSavePoster(this, 'posterCanvas')
      })
    }
  },

  onLoad(options) {
    // 加载用户档案
    this.loadProfile()

    // 解析PK挑战参数
    if (options && options.challenge) {
      const challenge = decodeChallenge(options.challenge)
      if (challenge) {
        this.pendingChallenge = challenge
        // 延迟显示挑战弹窗（等档案加载完成）
        setTimeout(() => {
          this.showChallengeModal = true
        }, 500)
      }
    }
  },

  onHide() {
    if (this.game && !this.game.state.isGameOver) {
      this.game.pause()
    }
  },

  onShow() {
    // 页面显示时不自动恢复，让用户手动继续
  },

  onUnload() {
    this.stopRandomQuestionTimer()
    if (this.game) {
      this.game.destroy()
      this.game = null
    }
  },

  // #ifdef MP-WEIXIN
  onShareAppMessage() {
    const result = this.gameResult

    // PK挑战分享
    if (this._isChallengeShare && this.showGameOverModal && result && result.levelId) {
      this._isChallengeShare = false
      const userName = this.currentUser ? this.currentUser.name : '挑战者'
      const code = encodeChallenge({
        levelId: result.levelId,
        score: result.score || 0,
        stars: result.stars || 0,
        wave: result.wave,
        accuracy: result.accuracy,
        maxCombo: result.maxCombo,
        challengerName: userName
      })
      saveSentChallenge({ levelId: result.levelId, score: result.score })
      return {
        title: `⚔️ ${userName}向你发起数学塔防PK挑战！得分${result.score}，敢来比吗？`,
        path: `/pages/tower-defense/index?challenge=${code}`
      }
    }

    if (this.showGameOverModal && result) {
      return {
        title: `🏰 我在数学塔防坚守了${result.wave}波！正确率${result.accuracy}%！`,
        path: '/pages/tower-defense/index'
      }
    }
    return {
      title: '🏰 数学塔防 - 答题建塔，守护基地！',
      path: '/pages/tower-defense/index'
    }
  },
  onShareTimeline() {
    return {
      title: '🏰 数学塔防 - 边玩边学，快来挑战！'
    }
  }
  // #endif
}
</script>

<style scoped>
.game-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.screen {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 菜单样式 */
.menu-screen {
  justify-content: center;
  align-items: center;
}

.menu-content {
  text-align: center;
  padding: 40rpx;
}

.profile-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
}

.profile-avatar {
  font-size: 64rpx;
  margin-bottom: 12rpx;
}

.profile-name {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
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
  margin-bottom: 60rpx;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.btn {
  padding: 24rpx 60rpx;
  font-size: 32rpx;
  border: none;
  border-radius: 24rpx;
  font-weight: bold;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16rpx;
}

.tag {
  background: rgba(33, 150, 243, 0.2);
  color: #2196F3;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
}

/* 工具界面样式 */
.game-screen {
  height: 100vh;
  overflow: hidden;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: rgba(0, 0, 0, 0.6);
  min-height: 50px;
}

.info-left, .info-right {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.lives, .gold, .wave {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffffff;
}

.btn-icon {
  font-size: 36rpx;
  padding: 8rpx;
}

/* 连击显示 */
.combo-display {
  position: absolute;
  top: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(255, 102, 0, 0.9), rgba(255, 51, 51, 0.9));
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  z-index: 10;
  animation: combo-pulse 0.5s ease-in-out infinite;
}

@keyframes combo-pulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
}

.combo-count {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
}

.combo-multiplier {
  font-size: 24rpx;
  color: #FFD700;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.game-canvas {
  background: #2d5016;
}

/* 选中塔信息栏 */
.selected-tower-bar {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: rgba(76, 175, 80, 0.25);
  border-top: 2rpx solid rgba(76, 175, 80, 0.4);
}

.selected-tower-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 16rpx;
}

.selected-tower-emoji {
  font-size: 40rpx;
}

.selected-tower-detail {
  display: flex;
  flex-direction: column;
}

.selected-tower-name {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: bold;
}

.selected-tower-desc {
  font-size: 22rpx;
  color: #a0c8a0;
}

.selected-tower-hint {
  font-size: 22rpx;
  color: #4CAF50;
  margin-right: 16rpx;
}

.cancel-select {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.6);
  padding: 12rpx;
}

/* 底部塔选择栏 */
.tower-bar {
  background: rgba(0, 0, 0, 0.85);
  white-space: nowrap;
  height: 90px;
}

.tower-bar-inner {
  display: inline-flex;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tower-slot {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 14rpx 20rpx;
  background: #16213e;
  border-radius: 16rpx;
  border: 3rpx solid transparent;
  min-width: 130rpx;
  transition: all 0.2s;
}

.tower-slot.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.25);
  box-shadow: 0 0 12rpx rgba(76, 175, 80, 0.4);
}

.tower-slot.disabled {
  opacity: 0.4;
}

.tower-icon {
  font-size: 44rpx;
}

.tower-name {
  font-size: 22rpx;
  color: #ffffff;
  margin-top: 6rpx;
}

.tower-cost {
  font-size: 22rpx;
  color: #FFD700;
  margin-top: 4rpx;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: #16213e;
  border-radius: 24rpx;
  padding: 40rpx;
  width: 85%;
  max-width: 600rpx;
  text-align: center;
}

.modal-title, .result-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 32rpx;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 32rpx;
}

/* 数学题样式 */
.math-question {
  margin-bottom: 32rpx;
}

.question-type {
  display: inline-block;
  font-size: 24rpx;
  color: #2196F3;
  background: rgba(33, 150, 243, 0.1);
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
  margin-bottom: 24rpx;
}

.question-text {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1.5;
}

.answer-area {
  margin-bottom: 16rpx;
}

.input-with-minus {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.minus-btn {
  width: 80rpx;
  height: 80rpx;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.minus-btn.active {
  background: #F44336;
  border-color: #F44336;
}

.answer-input {
  flex: 1;
  padding: 24rpx;
  font-size: 36rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  color: #ffffff;
}

.answer-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.option-btn {
  padding: 24rpx;
  font-size: 32rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  color: #ffffff;
}

.option-btn.correct {
  background: rgba(76, 175, 80, 0.3);
  border-color: #4CAF50;
}

.option-btn.wrong {
  background: rgba(244, 67, 54, 0.3);
  border-color: #F44336;
}

.feedback {
  display: block;
  margin-top: 24rpx;
  font-size: 28rpx;
}

.feedback.correct {
  color: #4CAF50;
}

.feedback.wrong {
  color: #F44336;
}

/* 工具结束样式 */
.star-rating {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.star {
  font-size: 48rpx;
  color: #555;
}

.star.active {
  color: #FFD700;
  animation: star-pop 0.3s ease-out;
}

@keyframes star-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.rating-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.detail-item {
  font-size: 24rpx;
  color: #a0a0a0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #4CAF50;
}

.stat-label {
  font-size: 24rpx;
  color: #a0a0a0;
  margin-top: 4rpx;
}

.new-achievements {
  background: rgba(255, 215, 0, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 16rpx;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0;
}

.achievement-icon {
  font-size: 36rpx;
}

.achievement-info {
  text-align: left;
}

.achievement-name {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #ffffff;
}

.achievement-desc {
  display: block;
  font-size: 22rpx;
  color: #a0a0a0;
}

.encouragement {
  padding: 20rpx;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.encouragement text {
  font-size: 28rpx;
  color: #4CAF50;
  font-weight: bold;
}

/* 帮助内容 */
.help-content {
  text-align: left;
  max-height: 70vh;
  overflow-y: auto;
}

.help-section {
  margin-bottom: 24rpx;
}

.help-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 12rpx;
}

.help-text {
  display: block;
  font-size: 26rpx;
  color: #a0a0a0;
  margin-bottom: 8rpx;
  line-height: 1.6;
}

/* 关卡选择界面 */
.levels-screen {
  justify-content: center;
  align-items: center;
}

.levels-content {
  padding: 40rpx;
  width: 100%;
  max-width: 750rpx;
}

.screen-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  margin-bottom: 40rpx;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.level-card {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(33, 150, 243, 0.2));
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  position: relative;
  border: 3rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.level-card:active {
  transform: scale(0.95);
}

.level-card.locked {
  opacity: 0.4;
  background: rgba(100, 100, 100, 0.2);
}

.level-emoji {
  display: block;
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.level-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.lock-icon {
  font-size: 48rpx;
  margin: 16rpx 0;
}

.level-stars {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin: 12rpx 0;
}

.mini-star {
  font-size: 24rpx;
}

.level-waves {
  display: block;
  font-size: 22rpx;
  color: #a0a0a0;
}

.back-btn {
  width: 100%;
}

/* 档案管理弹窗 */
.profile-modal {
  max-height: 70vh;
  overflow-y: auto;
}

.profile-list {
  margin-bottom: 32rpx;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
}

.profile-item.active {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.profile-avatar-small {
  font-size: 40rpx;
}

.profile-name-small {
  font-size: 28rpx;
  color: #ffffff;
}

.delete-btn {
  font-size: 32rpx;
  padding: 8rpx;
  opacity: 0.6;
}

.new-profile-form {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.profile-input {
  padding: 24rpx;
  font-size: 28rpx;
  background: rgba(0, 0, 0, 0.3);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  color: #ffffff;
}

/* 存档管理弹窗 */
.save-modal, .load-modal {
  max-height: 70vh;
  overflow-y: auto;
}

.save-slots {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.save-slot {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.save-slot:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.1);
}

.save-slot.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.slot-number {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 12rpx;
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.slot-level {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: bold;
}

.slot-wave {
  font-size: 24rpx;
  color: #a0a0a0;
}

.slot-time {
  font-size: 22rpx;
  color: #888;
}

.slot-empty {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.poster-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 600px;
  height: 900px;
}

/* 塔操作菜单 */
.tower-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 90;
}

.tower-menu {
  position: absolute;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 20rpx;
  padding: 24rpx;
  width: 280px;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
  border: 2rpx solid rgba(76, 175, 80, 0.3);
}

.tower-menu-header {
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.tower-menu-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffffff;
}

.tower-menu-actions {
  display: flex;
  gap: 16rpx;
}

.tower-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.tower-action:active {
  transform: scale(0.95);
}

.upgrade-action {
  border-color: rgba(76, 175, 80, 0.5);
  background: rgba(76, 175, 80, 0.15);
}

.upgrade-action:active {
  background: rgba(76, 175, 80, 0.25);
}

.sell-action {
  border-color: rgba(244, 67, 54, 0.5);
  background: rgba(244, 67, 54, 0.15);
}

.sell-action:active {
  background: rgba(244, 67, 54, 0.25);
}

.action-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.action-label {
  font-size: 24rpx;
  color: #ffffff;
  margin-bottom: 4rpx;
  font-weight: bold;
}

.action-cost, .action-price {
  font-size: 22rpx;
  color: #FFD700;
}

/* 签到弹窗 */
.signin-modal {
  max-height: 80vh;
  overflow-y: auto;
}

.signin-result {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(33, 150, 243, 0.3));
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.signin-result-text {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 8rpx;
}

.signin-streak {
  display: block;
  font-size: 24rpx;
  color: #a0a0a0;
}

.signin-calendar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.signin-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.signin-day.signed {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4CAF50;
}

.signin-day.today {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.15);
}

.signin-day-num {
  font-size: 22rpx;
  color: #a0a0a0;
  margin-bottom: 6rpx;
}

.signin-day-reward {
  font-size: 22rpx;
  color: #FFD700;
  font-weight: bold;
}

.signin-check {
  position: absolute;
  top: 4rpx;
  right: 8rpx;
  font-size: 20rpx;
  color: #4CAF50;
}

/* 每日挑战 */
.daily-btn {
  position: relative;
}

.daily-done-tag {
  font-size: 20rpx;
  background: rgba(255, 215, 0, 0.3);
  color: #FFD700;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  margin-left: 12rpx;
}

.daily-challenge-modal {
  max-height: 80vh;
  overflow-y: auto;
}

.daily-progress {
  margin-bottom: 24rpx;
}

.daily-progress-text {
  display: block;
  font-size: 24rpx;
  color: #a0a0a0;
  margin-bottom: 12rpx;
}

.daily-progress-bar {
  height: 8rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4rpx;
  overflow: hidden;
}

.daily-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.daily-result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.daily-streak-info {
  background: rgba(255, 152, 0, 0.15);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
}

.daily-streak-text {
  font-size: 26rpx;
  color: #FF9800;
  font-weight: bold;
}

/* PK挑战 */
.challenge-info {
  margin-bottom: 24rpx;
}

.challenge-from {
  display: block;
  font-size: 28rpx;
  color: #FF9800;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.challenge-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16rpx;
  padding: 20rpx;
}

/* VS对比表 */
.vs-table {
  margin-bottom: 24rpx;
}

.vs-header, .vs-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 16rpx 12rpx;
  text-align: center;
}

.vs-header {
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8rpx;
}

.vs-header .vs-label {
  color: #a0a0a0;
  font-size: 24rpx;
}

.vs-header .vs-me {
  color: #4CAF50;
  font-size: 24rpx;
  font-weight: bold;
}

.vs-header .vs-them {
  color: #FF9800;
  font-size: 24rpx;
  font-weight: bold;
}

.vs-row .vs-label {
  font-size: 24rpx;
  color: #a0a0a0;
}

.vs-row .vs-me, .vs-row .vs-them {
  font-size: 28rpx;
  color: #ffffff;
}

.vs-winner {
  color: #FFD700 !important;
  font-weight: bold;
}
</style>
