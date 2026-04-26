/**
 * PK挑战系统
 * 将游戏结果编码为 Base64，通过微信分享的 query 参数传递
 * 无需后端，纯客户端实现
 */
import { storageManager } from '@/utils/storage-manager'

/**
 * 编码挑战数据为 Base64 字符串
 * @param {Object} data - 挑战数据
 * @returns {String} Base64 编码的挑战码
 */
export function encodeChallenge({ levelId, score, stars, wave, accuracy, maxCombo, challengerName }) {
  const obj = {
    l: levelId,
    s: score,
    st: stars,
    w: wave,
    a: accuracy,
    c: maxCombo,
    n: challengerName,
    t: Date.now()
  }
  try {
    const json = JSON.stringify(obj)
    // 使用 encodeURIComponent + btoa 处理中文
    return btoa(encodeURIComponent(json))
  } catch (e) {
    console.error('encodeChallenge failed:', e)
    return ''
  }
}

/**
 * 解码 Base64 挑战码
 * @param {String} base64Str - Base64 编码的挑战码
 * @returns {Object|null} 解码后的挑战数据
 */
export function decodeChallenge(base64Str) {
  try {
    const json = decodeURIComponent(atob(base64Str))
    const obj = JSON.parse(json)
    return {
      levelId: obj.l,
      score: obj.s,
      stars: obj.st,
      wave: obj.w,
      accuracy: obj.a,
      maxCombo: obj.c,
      challengerName: obj.n,
      timestamp: obj.t
    }
  } catch (e) {
    console.error('decodeChallenge failed:', e)
    return null
  }
}

/**
 * 保存发起的挑战记录
 */
export function saveSentChallenge(challengeData) {
  const history = storageManager.loadData('challenge_sent', [])
  history.unshift({
    ...challengeData,
    sentAt: Date.now()
  })
  // 只保留最近20条
  if (history.length > 20) history.length = 20
  storageManager.saveData('challenge_sent', history)
}

/**
 * 保存接收到的挑战及自己的应战结果
 */
export function saveChallengeResponse(challengeData, myResult) {
  const history = storageManager.loadData('challenge_received', [])
  history.unshift({
    challenge: challengeData,
    myResult,
    respondedAt: Date.now()
  })
  if (history.length > 20) history.length = 20
  storageManager.saveData('challenge_received', history)
}

/**
 * 比较挑战结果
 * @returns {{ winner: 'challenger'|'responder'|'tie', comparison: Array }}
 */
export function compareResults(challengeData, myResult) {
  const items = [
    {
      label: '得分',
      challenger: challengeData.score,
      responder: myResult.score,
      better: myResult.score > challengeData.score ? 'responder' : myResult.score < challengeData.score ? 'challenger' : 'tie'
    },
    {
      label: '波数',
      challenger: challengeData.wave,
      responder: myResult.wave,
      better: myResult.wave > challengeData.wave ? 'responder' : myResult.wave < challengeData.wave ? 'challenger' : 'tie'
    },
    {
      label: '正确率',
      challenger: challengeData.accuracy + '%',
      responder: myResult.accuracy + '%',
      better: myResult.accuracy > challengeData.accuracy ? 'responder' : myResult.accuracy < challengeData.accuracy ? 'challenger' : 'tie'
    },
    {
      label: '最高连击',
      challenger: challengeData.maxCombo,
      responder: myResult.maxCombo,
      better: myResult.maxCombo > challengeData.maxCombo ? 'responder' : myResult.maxCombo < challengeData.maxCombo ? 'challenger' : 'tie'
    }
  ]

  // 综合判定：得分优先
  let winner = 'tie'
  if (myResult.score > challengeData.score) {
    winner = 'responder'
  } else if (myResult.score < challengeData.score) {
    winner = 'challenger'
  }

  return { winner, comparison: items }
}
