'use client'

import { create } from 'zustand'

// 食物类型配置
export type FoodType = 'grape' | 'strawberry' | 'peach' | 'blueberry' | 'orange' | 'kiwi' | 'lemon' | 'cherry' | 'watermelon' | 'pineapple' | 'coconut' | 'starfruit'

export interface FoodConfig {
  type: FoodType
  color: string
  emoji: string
  unlockLevel: number
}

// 食物配置表
export const FOOD_CONFIGS: FoodConfig[] = [
  { type: 'grape', color: '#9333ea', emoji: '🍇', unlockLevel: 1 },
  { type: 'strawberry', color: '#ef4444', emoji: '🍓', unlockLevel: 1 },
  { type: 'peach', color: '#ec4899', emoji: '🍑', unlockLevel: 1 },
  { type: 'blueberry', color: '#3b82f6', emoji: '🫐', unlockLevel: 1 },
  { type: 'orange', color: '#f97316', emoji: '🍊', unlockLevel: 5 },
  { type: 'kiwi', color: '#22c55e', emoji: '🥝', unlockLevel: 5 },
  { type: 'lemon', color: '#eab308', emoji: '🍋', unlockLevel: 10 },
  { type: 'cherry', color: '#dc2626', emoji: '🍒', unlockLevel: 15 },
  { type: 'watermelon', color: '#16a34a', emoji: '🍉', unlockLevel: 20 },
  { type: 'pineapple', color: '#fbbf24', emoji: '🍍', unlockLevel: 25 },
  { type: 'coconut', color: '#d97706', emoji: '🥥', unlockLevel: 30 },
  { type: 'starfruit', color: '#facc15', emoji: '⭐', unlockLevel: 40 },
]

// 位置接口
export interface Position {
  x: number
  y: number
}

// 食物项接口
export interface FoodItem {
  position: Position
  type: FoodType
  color: string
  emoji: string
}

// 方向枚举
export type Direction = 'up' | 'down' | 'left' | 'right'

// 游戏状态类型
export type GameStatus = 'tutorial' | 'playing' | 'paused' | 'gameover' | 'wrong_food' | 'level_complete'

// 游戏接口
export interface GameState {
  gameStatus: GameStatus
  level: number
  lives: number
  score: number
  snake: Position[]
  direction: Direction
  nextDirection: Direction
  snakeColorType: FoodType
  snakeColor: string
  snakeEmoji: string
  foods: FoodItem[]
  gridSize: number
  cellSize: number
  canvasWidth: number
  canvasHeight: number
  foodCount: number
  isChangingColor: boolean
  showWrongFoodDialog: boolean
  foodsEatenInLevel: number
  foodsToAdvance: number

  initGame: () => void
  startLevel: () => void
  advanceLevel: () => void
  pauseGame: () => void
  resumeGame: () => void
  setDirection: (direction: Direction) => void
  moveSnake: () => void
  eatFood: (index: number, currentSnakeColorType?: FoodType) => void
  spawnFood: () => void
  checkCollision: () => boolean
  changeSnakeColor: () => void
  handleWrongFood: () => void
  gameOver: () => void
  resetGame: () => void
}

// 获取当前关卡可用的食物类型
export const getAvailableFoods = (level: number): FoodType[] => {
  return FOOD_CONFIGS
    .filter(food => food.unlockLevel <= level)
    .map(food => food.type)
}

// 获取随机食物类型
export const getRandomFoodType = (level: number): FoodType => {
  const available = getAvailableFoods(level)
  return available[Math.floor(Math.random() * available.length)]
}

// 生成随机位置
export const getRandomPosition = (gridSize: number, snake: Position[]): Position => {
  let position: Position
  let attempts = 0
  do {
    position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    }
    attempts++
  } while (
    snake.some(s => s.x === position.x && s.y === position.y) &&
    attempts < 100
  )
  return position
}

// 创建游戏Store
export const useGameStore = create<GameState>((set, get) => ({
  gameStatus: 'tutorial',
  level: 1,
  lives: 0,
  score: 0,
  snake: [],
  direction: 'right',
  nextDirection: 'right',
  snakeColorType: 'grape',
  snakeColor: '#9333ea',
  snakeEmoji: '🍇',
  foods: [],
  gridSize: 20,
  cellSize: 20,
  canvasWidth: 400,
  canvasHeight: 400,
  foodCount: 1,
  isChangingColor: false,
  showWrongFoodDialog: false,
  foodsEatenInLevel: 0,
  foodsToAdvance: 5,
    initGame: () => {
    // 计算合适的单元格大小
    const maxCellSize = 40
    const minCellSize = 20
    const availableWidth = window.innerWidth - 40
    const availableHeight = window.innerHeight - 350 // 留出头部和底部空间

    // 计算基于宽度和高度的单元格大小
    const cellSizeByWidth = Math.floor(availableWidth / 20)
    const cellSizeByHeight = Math.floor(availableHeight / 20)

    // 取较小值，并限制在合理范围内
    const cellSize = Math.min(
      Math.min(cellSizeByWidth, cellSizeByHeight),
      maxCellSize
    )
    const finalCellSize = Math.max(cellSize, minCellSize)

    const gridSize = 20
    const canvasWidth = finalCellSize * gridSize
    const canvasHeight = finalCellSize * gridSize

    const initialSnake: Position[] = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ]

    const initialColorType = getRandomFoodType(1)
    const colorConfig = FOOD_CONFIGS.find(f => f.type === initialColorType)!

    // 生成初始食物
    const initialFoodPosition = getRandomPosition(gridSize, initialSnake)
    const initialFood = {
      position: initialFoodPosition,
      type: initialColorType,
      color: colorConfig.color,
      emoji: colorConfig.emoji,
    }

    set({
      gameStatus: 'tutorial',
      level: 1,
      lives: 0,
      score: 0,
      snake: initialSnake,
      direction: 'right',
      nextDirection: 'right',
      snakeColorType: initialColorType,
      snakeColor: colorConfig.color,
      snakeEmoji: colorConfig.emoji,
      foods: [initialFood], // 直接设置初始食物
      gridSize,
      cellSize: finalCellSize,
      canvasWidth,
      canvasHeight,
      foodCount: 1,
      isChangingColor: false,
      showWrongFoodDialog: false,
      foodsEatenInLevel: 0,
      foodsToAdvance: 5,
    })
  },
    startLevel: () => {
    const { level, gridSize, snake } = get()

    // 根据关卡设置游戏参数
    let foodCount = 1
    let lives = 0
    let foodsToAdvance = 5

    if (level === 1) {
      foodCount = 1
      lives = 0
      foodsToAdvance = 5
    } else if (level === 2) {
      foodCount = 3
      lives = 0
      foodsToAdvance = 8
    } else {
      foodCount = 5
      lives = 3
      foodsToAdvance = 10
    }

    // 随机蛇的颜色
    const snakeColorType = getRandomFoodType(level)
    const colorConfig = FOOD_CONFIGS.find(f => f.type === snakeColorType)!

    // 生成食物，确保至少有一个匹配蛇的颜色
    const newFoods: FoodItem[] = []

    for (let i = 0; i < foodCount; i++) {
      const position = getRandomPosition(gridSize, snake)

      let foodType: FoodType
      if (level === 1) {
        // 教程局：所有食物都匹配蛇的颜色
        foodType = snakeColorType
      } else {
        // 其他局：检查是否已经有匹配的食物
        const hasMatching = newFoods.some(f => f.type === snakeColorType)

        if (!hasMatching) {
          // 确保至少有一个匹配的
          foodType = snakeColorType
        } else {
          // 其他随机生成
          foodType = getRandomFoodType(level)
        }
      }

      const foodConfig = FOOD_CONFIGS.find(f => f.type === foodType)!

      newFoods.push({
        position,
        type: foodType,
        color: foodConfig.color,
        emoji: foodConfig.emoji,
      })
    }

    set({
      gameStatus: 'playing',
      foodCount,
      lives,
      foods: newFoods,
      snakeColorType,
      snakeColor: colorConfig.color,
      snakeEmoji: colorConfig.emoji,
      foodsEatenInLevel: 0,
      foodsToAdvance,
    })
  },
    advanceLevel: () => {
    set(state => ({
      level: state.level + 1,
    }))
    get().startLevel()
  },

  pauseGame: () => {
    set({ gameStatus: 'paused' })
  },

  resumeGame: () => {
    set({ gameStatus: 'playing' })
  },

  setDirection: (direction: Direction) => {
    const { direction: currentDirection } = get()
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    }

    if (direction !== opposites[currentDirection]) {
      set({ nextDirection: direction })
    }
  },

  moveSnake: () => {
    const { snake, nextDirection, gridSize } = get()
    const newSnake = [...snake]
    const head = { ...newSnake[0] }

    switch (nextDirection) {
      case 'up':
        head.y -= 1
        break
      case 'down':
        head.y += 1
        break
      case 'left':
        head.x -= 1
        break
      case 'right':
        head.x += 1
        break
    }

    // 穿墙逻辑
    if (head.x < 0) head.x = gridSize - 1
    if (head.x >= gridSize) head.x = 0
    if (head.y < 0) head.y = gridSize - 1
    if (head.y >= gridSize) head.y = 0

    newSnake.unshift(head)

    // 检查是否吃到食物
    const { foods, snakeColorType } = get()
    const eatenIndex = foods.findIndex(
      food => food.position.x === head.x && food.position.y === head.y
    )

    if (eatenIndex !== -1) {
      // 吃到食物，不移除尾巴（蛇变长）
      get().eatFood(eatenIndex, snakeColorType)
    } else {
      // 没吃到食物，移除尾巴
      newSnake.pop()
    }

    set({ snake: newSnake, direction: nextDirection })
  },
    eatFood: (index: number, currentSnakeColorType?: FoodType) => {
    const { foods, level, foodsEatenInLevel, foodsToAdvance } = get()
    const eatenFood = foods[index]

    // 使用传入的蛇颜色，避免状态不一致
    const actualSnakeColorType = currentSnakeColorType || get().snakeColorType

    if (eatenFood.type === actualSnakeColorType) {
      // 吃对了
      const newFoodsEaten = foodsEatenInLevel + 1

      set(state => ({
        score: state.score + 10,
        foodsEatenInLevel: newFoodsEaten,
      }))

      // 移除被吃的食物
      const newFoods = [...foods]
      newFoods.splice(index, 1)
      set({ foods: newFoods })

      // 生成新食物
      get().spawnFood()

      // 检查是否需要进入下一关
      if (newFoodsEaten >= foodsToAdvance) {
        // 进入下一关
        set({ gameStatus: 'level_complete' })
        return
      }

      // 判断是否需要变色（前几局延迟，后面立即）
      const shouldDelay = level <= 3
      if (shouldDelay) {
        set({ isChangingColor: true })
        setTimeout(() => {
          get().changeSnakeColor()
          set({ isChangingColor: false })
        }, 1500)
      } else {
        get().changeSnakeColor()
      }
    } else {
      // 吃错了
      get().handleWrongFood()
    }
  },

  spawnFood: () => {
    const { gridSize, snake, level, snakeColorType, foods, foodCount } = get()
    const position = getRandomPosition(gridSize, snake)

    let foodType: FoodType

    if (level === 1) {
      // 教程局：只生成与蛇颜色相同的食物
      foodType = snakeColorType
    } else {
      // 其他局：检查是否已经有匹配的食物
      const hasMatching = foods.some(f => f.type === snakeColorType)

      if (!hasMatching || foods.length < foodCount - 1) {
        // 如果场上没有匹配的食物，或者食物数量明显不足，生成匹配的
        foodType = snakeColorType
      } else {
        // 随机生成
        foodType = getRandomFoodType(level)
      }
    }

    const foodConfig = FOOD_CONFIGS.find(f => f.type === foodType)!

    set(state => ({
      foods: [
        ...state.foods,
        {
          position,
          type: foodType,
          color: foodConfig.color,
          emoji: foodConfig.emoji,
        },
      ],
    }))
  },

  checkCollision: () => {
    const { snake } = get()
    const head = snake[0]

    // 检查是否撞到自己
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  },

  changeSnakeColor: () => {
    const { level, foods, foodCount } = get()
    const newColorType = getRandomFoodType(level)
    const colorConfig = FOOD_CONFIGS.find(f => f.type === newColorType)!

    // 检查场上是否已经有匹配新颜色的食物
    const hasMatchingFood = foods.some(f => f.type === newColorType)

    if (!hasMatchingFood) {
      // 如果没有匹配的食物，需要替换一个食物为新颜色
      const newFoods = [...foods]

      // 找到第一个不匹配的食物并替换它
      const indexToReplace = newFoods.findIndex(f => f.type !== newColorType)

      if (indexToReplace !== -1) {
        newFoods[indexToReplace] = {
          ...newFoods[indexToReplace],
          type: newColorType,
          color: colorConfig.color,
          emoji: colorConfig.emoji,
        }
      } else if (newFoods.length < foodCount) {
        // 如果还没到食物数量上限，直接添加一个匹配的食物
        const position = getRandomPosition(get().gridSize, get().snake)
        newFoods.push({
          position,
          type: newColorType,
          color: colorConfig.color,
          emoji: colorConfig.emoji,
        })
      }

      set({
        snakeColorType: newColorType,
        snakeColor: colorConfig.color,
        snakeEmoji: colorConfig.emoji,
        foods: newFoods,
      })
    } else {
      // 如果已经有匹配的食物，只改变蛇的颜色
      set({
        snakeColorType: newColorType,
        snakeColor: colorConfig.color,
        snakeEmoji: colorConfig.emoji,
      })
    }
  },

  handleWrongFood: () => {
    const { level, lives } = get()

    if (level === 1) {
      // 教程局不应该吃错
      return
    }

    if (level === 2) {
      // 第二局：显示弹窗提示
      set({ gameStatus: 'wrong_food', showWrongFoodDialog: true })
    } else {
      // 第三局+：扣除生命
      const newLives = lives - 1
      if (newLives <= 0) {
        get().gameOver()
      } else {
        set({ lives: newLives })
        // 移除被吃错的食物
        const head = get().snake[0]
        set(state => ({
          foods: state.foods.filter(food => food.position.x !== head.x || food.position.y !== head.y),
        }))
        // 生成新食物
        get().spawnFood()
      }
    }
  },

  gameOver: () => {
    set({ gameStatus: 'gameover' })
  },

  resetGame: () => {
    get().initGame()
  },
}))