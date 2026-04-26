/**
 * 音效管理器
 * 使用 Web Audio API 合成简单音效，跨平台兼容
 */
class SoundManager {
  constructor() {
    this.enabled = true
    this.volume = 0.5
    this.audioCtx = null
    this._initialized = false
  }

  /**
   * 初始化（需要在用户交互后调用）
   */
  init() {
    if (this._initialized) return

    try {
      // H5
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        this.audioCtx = new AudioCtx()
      }
      // 微信小程序
      else if (typeof wx !== 'undefined' && wx.createWebAudioContext) {
        this.audioCtx = wx.createWebAudioContext()
      }
    } catch (e) {
      console.warn('SoundManager: Web Audio API 不可用', e)
    }

    this._initialized = true
  }

  /**
   * 确保 AudioContext 处于运行状态
   */
  _resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  /**
   * 播放一个音调
   */
  _playTone(frequency, duration, type = 'square', vol = null) {
    if (!this.enabled || !this.audioCtx) return

    this._resume()
    const ctx = this.audioCtx
    const now = ctx.currentTime
    const v = (vol !== null ? vol : this.volume) * 0.3

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, now)

    gain.gain.setValueAtTime(v, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + duration)
  }

  /**
   * 播放多个音调序列
   */
  _playSequence(notes) {
    if (!this.enabled || !this.audioCtx) return

    this._resume()
    const ctx = this.audioCtx
    const now = ctx.currentTime

    notes.forEach(({ freq, start, dur, type, vol }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const v = (vol || this.volume) * 0.3

      osc.type = type || 'square'
      osc.frequency.setValueAtTime(freq, now + start)

      gain.gain.setValueAtTime(v, now + start)
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + start)
      osc.stop(now + start + dur)
    })
  }

  // === 游戏音效 ===

  /** 建造塔 */
  build() {
    this._playSequence([
      { freq: 523, start: 0, dur: 0.08, type: 'square' },
      { freq: 659, start: 0.08, dur: 0.08, type: 'square' },
      { freq: 784, start: 0.16, dur: 0.15, type: 'square' }
    ])
  }

  /** 升级塔 */
  upgrade() {
    this._playSequence([
      { freq: 523, start: 0, dur: 0.06, type: 'square' },
      { freq: 659, start: 0.06, dur: 0.06, type: 'square' },
      { freq: 784, start: 0.12, dur: 0.06, type: 'square' },
      { freq: 1047, start: 0.18, dur: 0.2, type: 'square' }
    ])
  }

  /** 拆除塔 */
  sell() {
    this._playSequence([
      { freq: 600, start: 0, dur: 0.1, type: 'sawtooth' },
      { freq: 400, start: 0.08, dur: 0.15, type: 'sawtooth' }
    ])
  }

  /** 答对 */
  correct() {
    this._playSequence([
      { freq: 880, start: 0, dur: 0.1, type: 'sine' },
      { freq: 1109, start: 0.1, dur: 0.15, type: 'sine' }
    ])
  }

  /** 答错 */
  wrong() {
    this._playSequence([
      { freq: 300, start: 0, dur: 0.15, type: 'sawtooth', vol: 0.3 },
      { freq: 250, start: 0.12, dur: 0.2, type: 'sawtooth', vol: 0.3 }
    ])
  }

  /** 新波次来袭 */
  waveStart() {
    this._playSequence([
      { freq: 440, start: 0, dur: 0.1, type: 'square' },
      { freq: 440, start: 0.15, dur: 0.1, type: 'square' },
      { freq: 660, start: 0.3, dur: 0.2, type: 'square' }
    ])
  }

  /** 怪物被击杀 */
  enemyKill() {
    this._playTone(800, 0.08, 'square', 0.2)
  }

  /** 怪物到达终点（扣血） */
  enemyLeak() {
    this._playSequence([
      { freq: 200, start: 0, dur: 0.15, type: 'sawtooth', vol: 0.4 },
      { freq: 150, start: 0.1, dur: 0.2, type: 'sawtooth', vol: 0.3 }
    ])
  }

  /** 金币获得 */
  gold() {
    this._playTone(1200, 0.06, 'sine', 0.25)
  }

  /** 连击里程碑 */
  combo() {
    this._playSequence([
      { freq: 784, start: 0, dur: 0.06, type: 'square' },
      { freq: 988, start: 0.06, dur: 0.06, type: 'square' },
      { freq: 1175, start: 0.12, dur: 0.12, type: 'square' }
    ])
  }

  /** 游戏胜利 */
  victory() {
    this._playSequence([
      { freq: 523, start: 0, dur: 0.12, type: 'square' },
      { freq: 659, start: 0.12, dur: 0.12, type: 'square' },
      { freq: 784, start: 0.24, dur: 0.12, type: 'square' },
      { freq: 1047, start: 0.36, dur: 0.3, type: 'sine' }
    ])
  }

  /** 游戏失败 */
  defeat() {
    this._playSequence([
      { freq: 392, start: 0, dur: 0.2, type: 'sawtooth', vol: 0.3 },
      { freq: 330, start: 0.2, dur: 0.2, type: 'sawtooth', vol: 0.3 },
      { freq: 262, start: 0.4, dur: 0.4, type: 'sawtooth', vol: 0.25 }
    ])
  }

  /** 按钮点击 */
  click() {
    this._playTone(660, 0.04, 'square', 0.15)
  }

  /** 成就解锁 */
  achievement() {
    this._playSequence([
      { freq: 784, start: 0, dur: 0.1, type: 'sine' },
      { freq: 988, start: 0.1, dur: 0.1, type: 'sine' },
      { freq: 1319, start: 0.2, dur: 0.25, type: 'sine' }
    ])
  }

  /** 切换开关 */
  toggle(on) {
    if (!this.enabled && !on) return
    this._playTone(on ? 880 : 440, 0.06, 'sine', 0.2)
  }

  /** 设置音量 0-1 */
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v))
  }

  /** 开关音效 */
  setEnabled(enabled) {
    this.enabled = enabled
  }
}

export const soundManager = new SoundManager()
export default soundManager
