/**
 * 数学题库 - 五年级上册 + 初一
 * 五年级：小数乘法、小数除法、简易方程、多边形面积
 * 初一：有理数运算、整式运算、一元一次方程、几何初步
 */

// 难度级别
export const DIFFICULTY = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3
}

// 题目类型
export const TYPES = {
  DECIMAL_MULTIPLY: '小数乘法',
  DECIMAL_DIVIDE: '小数除法',
  EQUATION: '简易方程',
  AREA: '多边形面积',
  // 初一内容
  RATIONAL_NUMBER: '有理数运算',
  ALGEBRAIC: '整式运算',
  LINEAR_EQUATION: '一元一次方程',
  GEOMETRY: '几何初步'
}

/**
 * 生成随机小数（保留指定位数）
 */
export function randomDecimal(min, max, decimals = 1) {
  const num = Math.random() * (max - min) + min
  return parseFloat(num.toFixed(decimals))
}

/**
 * 生成随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 四舍五入到指定小数位
 */
export function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * 打乱数组
 */
export function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * 生成小数乘法题目
 */
export function generateDecimalMultiply(difficulty) {
  let a, b

  switch (difficulty) {
    case DIFFICULTY.EASY:
      a = randomDecimal(0.1, 9.9, 1)
      b = randomInt(2, 9)
      break
    case DIFFICULTY.MEDIUM:
      a = randomDecimal(0.1, 9.9, 1)
      b = randomDecimal(0.1, 9.9, 1)
      break
    case DIFFICULTY.HARD:
      a = randomDecimal(0.01, 9.99, 2)
      b = randomDecimal(0.1, 9.9, 1)
      break
  }

  const answer = round(a * b, 3)

  return {
    type: TYPES.DECIMAL_MULTIPLY,
    question: `${a} × ${b} = ?`,
    answer: answer,
    hint: '提示：先忽略小数点计算，再确定小数点位置',
    difficulty: difficulty
  }
}

/**
 * 生成小数除法题目
 */
export function generateDecimalDivide(difficulty) {
  let a, b, answer

  switch (difficulty) {
    case DIFFICULTY.EASY:
      b = randomInt(2, 9)
      answer = randomDecimal(0.5, 9.5, 1)
      a = round(b * answer, 1)
      break
    case DIFFICULTY.MEDIUM:
      b = randomInt(2, 9)
      answer = randomDecimal(0.1, 9.9, 1)
      a = round(b * answer, 2)
      break
    case DIFFICULTY.HARD:
      b = randomDecimal(0.2, 5, 1)
      answer = randomDecimal(1, 10, 1)
      a = round(b * answer, 2)
      break
  }

  return {
    type: TYPES.DECIMAL_DIVIDE,
    question: `${a} ÷ ${b} = ?`,
    answer: answer,
    hint: '提示：把除数转化成整数再计算',
    difficulty: difficulty
  }
}

/**
 * 生成简易方程题目
 */
export function generateEquation(difficulty) {
  let x, a, b, question, answer

  switch (difficulty) {
    case DIFFICULTY.EASY:
      x = randomInt(1, 50)
      a = randomInt(1, 30)
      if (Math.random() > 0.5) {
        b = x + a
        question = `x + ${a} = ${b}，求 x = ?`
        answer = x
      } else {
        b = x + a
        question = `x - ${a} = ${x}，求 x = ?`
        answer = x + a
      }
      break
    case DIFFICULTY.MEDIUM:
      a = randomInt(2, 9)
      x = randomInt(2, 20)
      if (Math.random() > 0.5) {
        b = a * x
        question = `${a} × x = ${b}，求 x = ?`
        answer = x
      } else {
        x = a * randomInt(2, 10)
        b = x / a
        question = `x ÷ ${a} = ${b}，求 x = ?`
        answer = x
      }
      break
    case DIFFICULTY.HARD:
      a = randomInt(2, 5)
      x = randomInt(2, 15)
      b = randomInt(1, 20)
      const c = a * x + b
      question = `${a}x + ${b} = ${c}，求 x = ?`
      answer = x
      break
  }

  return {
    type: TYPES.EQUATION,
    question: question,
    answer: answer,
    hint: '提示：通过移项和运算找出未知数的值',
    difficulty: difficulty
  }
}

/**
 * 生成多边形面积题目
 */
export function generateArea(difficulty) {
  let question, answer, shape

  switch (difficulty) {
    case DIFFICULTY.EASY:
      if (Math.random() > 0.5) {
        const length = randomInt(3, 12)
        const width = randomInt(2, 10)
        question = `长方形的长是${length}cm，宽是${width}cm，面积是多少cm²？`
        answer = length * width
        shape = '长方形'
      } else {
        const side = randomInt(3, 12)
        question = `正方形的边长是${side}cm，面积是多少cm²？`
        answer = side * side
        shape = '正方形'
      }
      break
    case DIFFICULTY.MEDIUM:
      if (Math.random() > 0.5) {
        const base = randomInt(4, 15)
        const height = randomInt(3, 12)
        question = `平行四边形的底是${base}cm，高是${height}cm，面积是多少cm²？`
        answer = base * height
        shape = '平行四边形'
      } else {
        const base = randomInt(4, 16)
        const height = randomInt(2, 12)
        const actualBase = base % 2 === 0 ? base : base + 1
        question = `三角形的底是${actualBase}cm，高是${height}cm，面积是多少cm²？`
        answer = (actualBase * height) / 2
        shape = '三角形'
      }
      break
    case DIFFICULTY.HARD:
      const top = randomInt(3, 10)
      const bottom = randomInt(top + 2, 18)
      const height = randomInt(2, 10)
      const sum = top + bottom
      question = `梯形的上底是${top}cm，下底是${bottom}cm，高是${height}cm，面积是多少cm²？`
      answer = ((top + bottom) * height) / 2
      shape = '梯形'
      break
  }

  return {
    type: TYPES.AREA,
    question: question,
    answer: answer,
    hint: getAreaHint(shape),
    difficulty: difficulty
  }
}

/**
 * 获取面积公式提示
 */
function getAreaHint(shape) {
  const hints = {
    '长方形': '长方形面积 = 长 × 宽',
    '正方形': '正方形面积 = 边长 × 边长',
    '平行四边形': '平行四边形面积 = 底 × 高',
    '三角形': '三角形面积 = 底 × 高 ÷ 2',
    '梯形': '梯形面积 = (上底 + 下底) × 高 ÷ 2'
  }
  return hints[shape] || ''
}

// ===================== 初一数学 =====================

/**
 * 生成有理数运算题目（含负数）
 */
export function generateRationalNumber(difficulty) {
  let a, b, question, answer, op

  switch (difficulty) {
    case DIFFICULTY.EASY:
      // 简单的正负数加减
      a = randomInt(-20, 20)
      b = randomInt(-20, 20)
      if (Math.random() > 0.5) {
        op = '+'
        answer = a + b
        question = b >= 0 ? `(${a}) + ${b} = ?` : `(${a}) + (${b}) = ?`
      } else {
        op = '-'
        answer = a - b
        question = b >= 0 ? `(${a}) - ${b} = ?` : `(${a}) - (${b}) = ?`
      }
      break
    case DIFFICULTY.MEDIUM:
      // 负数乘除
      a = randomInt(-12, 12)
      b = randomInt(-12, 12)
      if (b === 0) b = randomInt(1, 10)
      if (Math.random() > 0.5) {
        op = '×'
        answer = a * b
        question = `(${a}) × (${b}) = ?`
      } else {
        // 确保整除
        answer = randomInt(-10, 10)
        a = answer * b
        op = '÷'
        question = `(${a}) ÷ (${b}) = ?`
      }
      break
    case DIFFICULTY.HARD:
      // 混合运算
      a = randomInt(-10, 10)
      b = randomInt(-10, 10)
      const c = randomInt(1, 5)
      if (Math.random() > 0.5) {
        answer = a + b * c
        question = `(${a}) + (${b}) × ${c} = ?`
      } else {
        answer = a * b - c
        question = `(${a}) × (${b}) - ${c} = ?`
      }
      break
  }

  return {
    type: TYPES.RATIONAL_NUMBER,
    question: question,
    answer: answer,
    hint: '提示：负负得正，异号相加取绝对值大的符号',
    difficulty: difficulty
  }
}

/**
 * 生成整式运算题目
 */
export function generateAlgebraic(difficulty) {
  let question, answer

  switch (difficulty) {
    case DIFFICULTY.EASY:
      // 合并同类项
      const a1 = randomInt(2, 10)
      const a2 = randomInt(1, 8)
      answer = a1 + a2
      question = `${a1}x + ${a2}x = ?x`
      break
    case DIFFICULTY.MEDIUM:
      // 去括号合并
      const b1 = randomInt(2, 8)
      const b2 = randomInt(1, 6)
      const b3 = randomInt(1, 5)
      if (Math.random() > 0.5) {
        answer = b1 + b2 - b3
        question = `${b1}a + (${b2}a - ${b3}a) = ?a`
      } else {
        answer = b1 - b2 + b3
        question = `${b1}a - (${b2}a - ${b3}a) = ?a`
      }
      break
    case DIFFICULTY.HARD:
      // 多项式运算
      const c1 = randomInt(2, 6)
      const c2 = randomInt(1, 5)
      const c3 = randomInt(1, 4)
      const c4 = randomInt(1, 4)
      answer = c1 * c2 + c3 * c4
      question = `${c1} × ${c2}m + ${c3} × ${c4}m = ?m`
      break
  }

  return {
    type: TYPES.ALGEBRAIC,
    question: question,
    answer: answer,
    hint: '提示：合并同类项，系数相加减',
    difficulty: difficulty
  }
}

/**
 * 生成一元一次方程题目（初一难度）
 */
export function generateLinearEquation(difficulty) {
  let x, question, answer

  switch (difficulty) {
    case DIFFICULTY.EASY:
      // 2x + 3 = 11 类型
      x = randomInt(2, 15)
      const a1 = randomInt(2, 6)
      const b1 = randomInt(1, 10)
      const c1 = a1 * x + b1
      question = `${a1}x + ${b1} = ${c1}，求 x = ?`
      answer = x
      break
    case DIFFICULTY.MEDIUM:
      // 3x - 5 = 2x + 7 类型
      x = randomInt(3, 20)
      const a2 = randomInt(3, 8)
      const b2 = randomInt(1, 10)
      const a3 = randomInt(1, a2 - 1)
      const c2 = (a2 - a3) * x + b2
      question = `${a2}x - ${b2} = ${a3}x + ${c2 - b2}，求 x = ?`
      answer = x
      break
    case DIFFICULTY.HARD:
      // 带分数或括号：2(x+3) = 5x - 6
      x = randomInt(2, 12)
      const k = randomInt(2, 4)
      const m = randomInt(1, 5)
      const n = randomInt(2, 5)
      // k(x + m) = nx + result => kx + km = nx + result
      // (k-n)x = result - km => result = (k-n)x + km
      if (k > n) {
        const result = (k - n) * x + k * m
        question = `${k}(x + ${m}) = ${n}x + ${result}，求 x = ?`
      } else {
        const result = k * m - (n - k) * x
        question = `${k}(x + ${m}) = ${n}x + ${result}，求 x = ?`
      }
      answer = x
      break
  }

  return {
    type: TYPES.LINEAR_EQUATION,
    question: question,
    answer: answer,
    hint: '提示：移项变号，合并同类项，系数化为1',
    difficulty: difficulty
  }
}

/**
 * 生成几何初步题目（角度、线段）
 */
export function generateGeometry(difficulty) {
  let question, answer

  switch (difficulty) {
    case DIFFICULTY.EASY:
      // 补角或余角
      if (Math.random() > 0.5) {
        const angle = randomInt(30, 150)
        answer = 180 - angle
        question = `一个角是${angle}°，它的补角是多少度？`
      } else {
        const angle = randomInt(10, 80)
        answer = 90 - angle
        question = `一个角是${angle}°，它的余角是多少度？`
      }
      break
    case DIFFICULTY.MEDIUM:
      // 对顶角、邻补角
      if (Math.random() > 0.5) {
        const angle = randomInt(20, 160)
        answer = angle
        question = `两条直线相交，一个角是${angle}°，它的对顶角是多少度？`
      } else {
        const angle = randomInt(30, 150)
        answer = 180 - angle
        question = `两条直线相交，一个角是${angle}°，它的邻补角是多少度？`
      }
      break
    case DIFFICULTY.HARD:
      // 三角形内角和
      const angle1 = randomInt(30, 80)
      const angle2 = randomInt(30, 100 - angle1)
      answer = 180 - angle1 - angle2
      question = `三角形的两个角分别是${angle1}°和${angle2}°，第三个角是多少度？`
      break
  }

  return {
    type: TYPES.GEOMETRY,
    question: question,
    answer: answer,
    hint: '提示：补角和为180°，余角和为90°，三角形内角和180°',
    difficulty: difficulty
  }
}

/**
 * 随机生成题目（包含初一内容）
 */
export function generateRandomQuestion(difficulty) {
  const generators = [
    // 五年级
    generateDecimalMultiply,
    generateDecimalDivide,
    generateEquation,
    generateArea,
    // 初一
    generateRationalNumber,
    generateAlgebraic,
    generateLinearEquation,
    generateGeometry
  ]
  const randomGenerator = generators[Math.floor(Math.random() * generators.length)]
  return randomGenerator(difficulty)
}

/**
 * 生成选择题选项
 */
export function generateOptions(correctAnswer, count = 4) {
  const options = [correctAnswer]
  const isDecimal = !Number.isInteger(correctAnswer)

  while (options.length < count) {
    let wrongAnswer
    const variation = Math.random()

    if (variation < 0.25) {
      wrongAnswer = isDecimal
        ? round(correctAnswer + (Math.random() - 0.5) * 2, 2)
        : correctAnswer + randomInt(-5, 5)
    } else if (variation < 0.5) {
      wrongAnswer = Math.random() > 0.5
        ? round(correctAnswer * 2, 2)
        : round(correctAnswer / 2, 2)
    } else if (variation < 0.75) {
      wrongAnswer = isDecimal
        ? round(correctAnswer * 10, 2)
        : correctAnswer * 10
    } else {
      wrongAnswer = isDecimal
        ? round(correctAnswer * (0.5 + Math.random()), 2)
        : randomInt(1, Math.max(correctAnswer * 2, 10))
    }

    if (wrongAnswer !== correctAnswer && wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer)
    }
  }

  return shuffleArray(options)
}

/**
 * 验证答案
 */
export function checkAnswer(userAnswer, correctAnswer, tolerance = 0.01) {
  const user = parseFloat(userAnswer)
  if (isNaN(user)) return false
  return Math.abs(user - correctAnswer) < tolerance
}
