# 数学题库系统文档

**路径**：`src/utils/math.js`

## 1. 概述

题库覆盖**五年级上册**和**初一**数学内容，共8种题型，3个难度级别。

## 2. 难度级别

```js
DIFFICULTY.EASY   = 1  // 简单
DIFFICULTY.MEDIUM = 2  // 中等
DIFFICULTY.HARD   = 3  // 困难
```

## 3. 题型总览

### 五年级

| 题型 | 函数 | 简单 | 中等 | 困难 |
|------|------|------|------|------|
| 小数乘法 | `generateDecimalMultiply` | 一位小数×整数 | 一位小数×一位小数 | 两位小数×一位小数 |
| 小数除法 | `generateDecimalDivide` | 整数÷整数=一位小数 | 整数÷整数=两位小数 | 小数÷小数 |
| 简易方程 | `generateEquation` | x+a=b 或 x-a=b | ax=b 或 x÷a=b | ax+b=c |
| 多边形面积 | `generateArea` | 长方形/正方形 | 平行四边形/三角形 | 梯形 |

### 初一

| 题型 | 函数 | 简单 | 中等 | 困难 |
|------|------|------|------|------|
| 有理数运算 | `generateRationalNumber` | 正负数加减 | 负数乘除 | 混合运算 |
| 整式运算 | `generateAlgebraic` | 合并同类项 | 去括号合并 | 多项式运算 |
| 一元一次方程 | `generateLinearEquation` | 2x+3=11 | 3x-5=2x+7 | 2(x+3)=5x-6 |
| 几何初步 | `generateGeometry` | 补角/余角 | 对顶角/邻补角 | 三角形内角和 |

## 4. 题目数据结构

每个生成函数返回：

```js
{
  type: '小数乘法',           // 题型名称
  question: '3.5 × 4 = ?',   // 题目文本
  answer: 14,                 // 正确答案（数字）
  hint: '提示：...',          // 解题提示
  difficulty: 1               // 难度级别
}
```

## 5. 核心 API

### `generateRandomQuestion(difficulty)`

随机从8种题型中选一种生成题目。

```js
import { generateRandomQuestion } from '@/utils/math.js'
const question = generateRandomQuestion(2) // 中等难度
```

### `generateOptions(correctAnswer, count = 4)`

为正确答案生成4个选择项（含正确答案，已打乱）。

干扰项生成策略：
- 25% — 正确答案 ± 随机偏移
- 25% — 正确答案 × 2 或 ÷ 2
- 25% — 正确答案 × 10（小数点错位）
- 25% — 随机数

```js
import { generateOptions } from '@/utils/math.js'
const options = generateOptions(14) // [14, 28, 12.5, 140]（示例）
```

### `checkAnswer(userAnswer, correctAnswer, tolerance = 0.01)`

验证用户答案是否正确（支持小数容差）。

```js
import { checkAnswer } from '@/utils/math.js'
checkAnswer('14', 14)      // true
checkAnswer('3.14', 3.14)  // true
checkAnswer('abc', 14)     // false
```

## 6. 工具函数

| 函数 | 说明 |
|------|------|
| `randomDecimal(min, max, decimals)` | 随机小数 |
| `randomInt(min, max)` | 随机整数 |
| `round(num, decimals)` | 四舍五入 |
| `shuffleArray(array)` | 打乱数组（Fisher-Yates） |

## 7. 添加新题型

### 步骤

1. 在 `TYPES` 中添加类型常量：
```js
export const TYPES = {
  // ...
  PERCENTAGE: '百分数'
}
```

2. 实现生成函数：
```js
export function generatePercentage(difficulty) {
  let question, answer
  switch (difficulty) {
    case DIFFICULTY.EASY:
      // ...
      break
    case DIFFICULTY.MEDIUM:
      // ...
      break
    case DIFFICULTY.HARD:
      // ...
      break
  }
  return {
    type: TYPES.PERCENTAGE,
    question, answer,
    hint: '提示：百分数 = 部分 ÷ 整体 × 100%',
    difficulty
  }
}
```

3. 在 `generateRandomQuestion` 中注册：
```js
const generators = [
  // ...现有生成器
  generatePercentage
]
```

## 8. 与游戏系统的集成

```
DifficultySystem.getQuestionDifficulty()  → 整数 1-3
       ↓
generateRandomQuestion(difficulty)         → 题目对象
       ↓
generateOptions(question.answer)           → 选择项数组
       ↓
Vue 组件显示题目模态框
       ↓
用户答题 → checkAnswer(userInput, answer)  → boolean
       ↓
callback(correct)  → Game 建塔/升级
```
