'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'
type GameStatus = 'tutorial' | 'playing' | 'paused' | 'gameover' | 'level_complete' | 'wrong_food'

interface Position {
  x: number
  y: number
}

interface Food {
  position: Position
  color: string
  emoji: string
}

interface GameData {
  gameStatus: GameStatus
  level: number
  lives: number
  score: number
  snake: Position[]
  snakeColor: string
  snakeEmoji: string
  foods: Food[]
  isChangingColor: boolean
  foodsEatenInLevel: number
  foodsToAdvance: number
}

const FOODS = [
  { color: '#9333ea', emoji: '🍇', unlockLevel: 1 },
  { color: '#ef4444', emoji: '🍓', unlockLevel: 1 },
  { color: '#ec4899', emoji: '🍑', unlockLevel: 1 },
  { color: '#3b82f6', emoji: '🫐', unlockLevel: 1 },
  { color: '#f97316', emoji: '🍊', unlockLevel: 5 },
  { color: '#22c55e', emoji: '🥝', unlockLevel: 5 },
  { color: '#eab308', emoji: '🍋', unlockLevel: 10 },
  { color: '#dc2626', emoji: '🍒', unlockLevel: 15 },
  { color: '#16a34a', emoji: '🍉', unlockLevel: 20 },
  { color: '#fbbf24', emoji: '🍍', unlockLevel: 25 },
  { color: '#d97706', emoji: '🥥', unlockLevel: 30 },
  { color: '#facc15', emoji: '⭐', unlockLevel: 40 },
]

const INITIAL_SNAKE: Position[] = [
  { x: 5, y: 10 },
  { x: 4, y: 10 },
  { x: 3, y: 10 },
]

export default function SnakeGamePage() {
  const [gameData, setGameData] = useState<GameData>({
    gameStatus: 'tutorial',
    level: 1,
    lives: 0,
    score: 0,
    snake: [...INITIAL_SNAKE],
    snakeColor: '#9333ea',
    snakeEmoji: '🍇',
    foods: [],
    isChangingColor: false,
    foodsEatenInLevel: 0,
    foodsToAdvance: 5,
  })

  const [currentDirection, setCurrentDirection] = useState<Direction>('right')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cellSize, setCellSize] = useState(20)
  const intervalRef = useRef<number | null>(null)

  const updateCellSize = useCallback(() => {
    const maxCellSize = 40
    const minCellSize = 20
    const availableWidth = window.innerWidth - 40
    const availableHeight = window.innerHeight - 400
    const cellSizeByWidth = Math.floor(availableWidth / 20)
    const cellSizeByHeight = Math.floor(availableHeight / 20)
    const cellSize = Math.min(Math.min(cellSizeByWidth, cellSizeByHeight), maxCellSize)
    setCellSize(Math.max(cellSize, minCellSize))
  }, [])

  const getRandomFood = (level: number) => {
    const available = FOODS.filter(f => f.unlockLevel <= level)
    const food = available[Math.floor(Math.random() * available.length)]
    return food
  }

  const getRandomPosition = (snake: Position[], gridSize: number): Position => {
    let position: Position
    let attempts = 0
    do {
      position = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      }
      attempts++
    } while (snake.some(s => s.x === position.x && s.y === position.y) && attempts < 100)
    return position
  }

  const spawnFoods = useCallback((count: number, level: number, snake: Position[], requiredColor?: string) => {
    const newFoods: Food[] = []
    const gridSize = 20
    let hasRequiredColor = !requiredColor

    for (let i = 0; i < count; i++) {
      const position = getRandomPosition([...snake, ...newFoods.map(f => f.position)], gridSize)
      
      if (!hasRequiredColor && i === count - 1) {
        const matchingFoodConfig = FOODS.find(f => f.color === requiredColor)
        if (matchingFoodConfig && matchingFoodConfig.unlockLevel <= level) {
          newFoods.push({
            position,
            color: matchingFoodConfig.color,
            emoji: matchingFoodConfig.emoji,
          })
          hasRequiredColor = true
          continue
        }
      }
      
      const foodConfig = getRandomFood(level)
      newFoods.push({
        position,
        color: foodConfig.color,
        emoji: foodConfig.emoji,
      })
      
      if (requiredColor && foodConfig.color === requiredColor) {
        hasRequiredColor = true
      }
    }

    if (requiredColor && !hasRequiredColor && newFoods.length > 0) {
      const matchingFoodConfig = FOODS.find(f => f.color === requiredColor)
      if (matchingFoodConfig && matchingFoodConfig.unlockLevel <= level) {
        const lastFood = newFoods[newFoods.length - 1]
        newFoods[newFoods.length - 1] = {
          position: lastFood.position,
          color: matchingFoodConfig.color,
          emoji: matchingFoodConfig.emoji,
        }
      }
    }

    return newFoods
  }, [])

  const changeSnakeColor = useCallback(() => {
    setGameData(prev => {
      const { level, foods, snake } = prev
      const availableFoods = FOODS.filter(f => f.unlockLevel <= level)
      const newFood = availableFoods[Math.floor(Math.random() * availableFoods.length)]
      const hasMatchingFood = foods.some(f => f.color === newFood.color)
      
      let newFoods = [...foods]
      
      if (!hasMatchingFood) {
        const indexToReplace = newFoods.findIndex(f => f.color !== newFood.color)
        if (indexToReplace !== -1) {
          newFoods[indexToReplace] = {
            position: newFoods[indexToReplace].position,
            color: newFood.color,
            emoji: newFood.emoji,
          }
        } else if (newFoods.length < 5) {
          const position = getRandomPosition([...snake, ...newFoods.map(f => f.position)], 20)
          newFoods.push({
            position,
            color: newFood.color,
            emoji: newFood.emoji,
          })
        }
      }
      
      return {
        ...prev,
        snakeColor: newFood.color,
        snakeEmoji: newFood.emoji,
        foods: newFoods,
        isChangingColor: false,
      }
    })
  }, [])

  useEffect(() => {
    updateCellSize()
    window.addEventListener('resize', updateCellSize)
    return () => window.removeEventListener('resize', updateCellSize)
  }, [updateCellSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gridSize = 20
    const canvasWidth = cellSize * gridSize
    const canvasHeight = cellSize * gridSize

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#fefce8'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.strokeStyle = '#fef3c7'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, canvasHeight)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(canvasWidth, i * cellSize)
      ctx.stroke()
    }

    gameData.snake.forEach((segment, index) => {
      const x = segment.x * cellSize
      const y = segment.y * cellSize
      const padding = 2

      const alpha = 1 - (index / gameData.snake.length) * 0.5
      ctx.fillStyle = index === 0 ? gameData.snakeColor : gameData.snakeColor + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      if (index === 0) {
        ctx.shadowColor = gameData.snakeColor
        ctx.shadowBlur = 10
      } else {
        ctx.shadowBlur = 0
      }

      const radius = 4
      ctx.beginPath()
      ctx.moveTo(x + padding + radius, y + padding)
      ctx.lineTo(x + cellSize - padding - radius, y + padding)
      ctx.quadraticCurveTo(x + cellSize - padding, y + padding, x + cellSize - padding, y + padding + radius)
      ctx.lineTo(x + cellSize - padding, y + cellSize - padding - radius)
      ctx.quadraticCurveTo(x + cellSize - padding, y + cellSize - padding, x + cellSize - padding - radius, y + cellSize - padding)
      ctx.lineTo(x + padding + radius, y + cellSize - padding)
      ctx.quadraticCurveTo(x + padding, y + cellSize - padding, x + padding, y + cellSize - padding - radius)
      ctx.lineTo(x + padding, y + padding + radius)
      ctx.quadraticCurveTo(x + padding, y + padding, x + padding + radius, y + padding)
      ctx.closePath()
      ctx.fill()

      if (index === 0) {
        ctx.shadowBlur = 0
        ctx.fillStyle = 'white'
        const eyeSize = cellSize / 5
        const eyeOffset = cellSize / 3

        ctx.beginPath()
        ctx.arc(x + cellSize / 2 - eyeOffset, y + cellSize / 2 - eyeOffset / 2, eyeSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + cellSize / 2 + eyeOffset, y + cellSize / 2 - eyeOffset / 2, eyeSize, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#1f2937'
        ctx.beginPath()
        ctx.arc(x + cellSize / 2 - eyeOffset, y + cellSize / 2 - eyeOffset / 2, eyeSize / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + cellSize / 2 + eyeOffset, y + cellSize / 2 - eyeOffset / 2, eyeSize / 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#1f2937'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x + cellSize / 2, y + cellSize / 2 + eyeOffset, eyeOffset / 2, 0, Math.PI)
        ctx.stroke()
      }
    })

    gameData.foods.forEach(food => {
      const x = food.position.x * cellSize
      const y = food.position.y * cellSize

      ctx.fillStyle = food.color + '40'
      ctx.shadowColor = food.color
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.font = `${cellSize - 4}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(food.emoji, x + cellSize / 2, y + cellSize / 2 + 2)
    })

    ctx.shadowBlur = 0
  }, [gameData.snake, gameData.foods, cellSize, gameData.snakeColor])

  const moveSnake = useCallback(() => {
    setGameData(prev => {
      if (prev.gameStatus !== 'playing') {
        return prev
      }

      const newSnake = [...prev.snake]
      const head = { ...newSnake[0] }
      const gridSize = 20

      switch (currentDirection) {
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

      if (head.x < 0) head.x = gridSize - 1
      if (head.x >= gridSize) head.x = 0
      if (head.y < 0) head.y = gridSize - 1
      if (head.y >= gridSize) head.y = 0

      newSnake.unshift(head)

      const eatenIndex = prev.foods.findIndex(
        food => food.position.x === head.x && food.position.y === head.y
      )

      if (eatenIndex !== -1) {
        const eatenFood = prev.foods[eatenIndex]
        
        if (eatenFood.color === prev.snakeColor) {
          const newFoodsEaten = prev.foodsEatenInLevel + 1
          const newScore = prev.score + 10

          if (newFoodsEaten >= prev.foodsToAdvance) {
            return {
              ...prev,
              score: newScore,
              foodsEatenInLevel: newFoodsEaten,
              snake: newSnake,
              gameStatus: 'level_complete',
            }
          } else {
            const newFoods = [...prev.foods]
            newFoods.splice(eatenIndex, 1)
            const additionalFood = spawnFoods(1, prev.level, newSnake, prev.snakeColor)
            
            const result = {
              ...prev,
              score: newScore,
              foodsEatenInLevel: newFoodsEaten,
              snake: newSnake,
              foods: [...newFoods, ...additionalFood],
              isChangingColor: prev.level <= 3,
            }

            if (prev.level <= 3) {
              setTimeout(() => {
                changeSnakeColor()
              }, 1500)
            } else {
              changeSnakeColor()
            }

            return result
          }
        } else {
          if (prev.level === 2) {
            return {
              ...prev,
              snake: newSnake,
              gameStatus: 'wrong_food',
            }
          } else if (prev.lives > 0) {
            const newLives = prev.lives - 1
            return {
              ...prev,
              lives: newLives,
              snake: newSnake,
              gameStatus: newLives <= 0 ? 'gameover' : 'playing',
            }
          } else {
            return {
              ...prev,
              snake: newSnake,
              gameStatus: 'gameover',
            }
          }
        }
      } else {
        newSnake.pop()
        
        const headPosition = newSnake[0]
        if (newSnake.slice(1).some(s => s.x === headPosition.x && s.y === headPosition.y)) {
          return { ...prev, snake: newSnake, gameStatus: 'gameover' }
        }
        
        return { ...prev, snake: newSnake }
      }
    })
  }, [currentDirection, spawnFoods, changeSnakeColor])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (gameData.gameStatus === 'playing') {
      intervalRef.current = window.setInterval(() => {
        moveSnake()
      }, 150)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [gameData.gameStatus, moveSnake])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameData.gameStatus !== 'playing') return

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          if (currentDirection !== 'down') setCurrentDirection('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          if (currentDirection !== 'up') setCurrentDirection('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          if (currentDirection !== 'right') setCurrentDirection('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          if (currentDirection !== 'left') setCurrentDirection('right')
          break
        case ' ':
          e.preventDefault()
          setGameData(prev => ({
            ...prev,
            gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
          }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameData.gameStatus, currentDirection])

  const formatLevel = (level: number) => {
    return level.toString().padStart(3, '0')
  }

  const handleStartGame = () => {
    const newFood = getRandomFood(1)
    const initialSnake = [...INITIAL_SNAKE]
    const initialFoods = spawnFoods(1, 1, initialSnake, newFood.color)

    setGameData({
      gameStatus: 'playing',
      level: 1,
      lives: 0,
      score: 0,
      snake: initialSnake,
      snakeColor: newFood.color,
      snakeEmoji: newFood.emoji,
      foods: initialFoods,
      isChangingColor: false,
      foodsEatenInLevel: 0,
      foodsToAdvance: 5,
    })
    setCurrentDirection('right')
  }

  const handleAdvanceLevel = () => {
    const newLevel = gameData.level + 1
    const foodCount = newLevel === 2 ? 3 : 5
    const lives = newLevel >= 3 ? 3 : 0
    const foodsToAdvance = newLevel === 2 ? 8 : 10
    const newFood = getRandomFood(newLevel)
    const resetSnake = [...INITIAL_SNAKE]
    const initialFoods = spawnFoods(foodCount, newLevel, resetSnake, newFood.color)

    setGameData({
      gameStatus: 'playing',
      level: newLevel,
      lives,
      score: gameData.score,
      snake: resetSnake,
      foodsToAdvance,
      snakeColor: newFood.color,
      snakeEmoji: newFood.emoji,
      foods: initialFoods,
      isChangingColor: false,
      foodsEatenInLevel: 0,
    })
    setCurrentDirection('right')
  }

  const handleResumeFromWrongFood = () => {
    if (gameData.level === 2) {
      handleStartGame()
    } else {
      setGameData(prev => ({ ...prev, gameStatus: 'playing' }))
    }
  }

  const handleRestart = () => {
    setGameData({
      gameStatus: 'tutorial',
      level: 1,
      lives: 0,
      score: 0,
      snake: [...INITIAL_SNAKE],
      snakeColor: '#9333ea',
      snakeEmoji: '🍇',
      foods: [],
      isChangingColor: false,
      foodsEatenInLevel: 0,
      foodsToAdvance: 5,
    })
    setCurrentDirection('right')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col relative overflow-hidden p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-8xl opacity-20 animate-pulse">🍇</div>
        <div className="absolute top-20 right-20 text-8xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}>🍓</div>
        <div className="absolute bottom-20 left-20 text-8xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>🍑</div>
        <div className="absolute bottom-10 right-10 text-8xl opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}>🫐</div>
      </div>

      {/* 顶部：计分板 */}
      <header className="w-full max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl shadow-2xl shadow-amber-400/30 p-2">
          <div className="bg-white/98 backdrop-blur-md rounded-3xl p-4 md:p-6">
            {/* 计分板标题 */}
            <div className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                🎮 贪吃蛇大冒险
              </h1>
            </div>

            {/* 计分板内容 */}
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              {/* 局数 */}
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-500 rounded-3xl p-4 md:p-6 text-center shadow-lg shadow-amber-200/50">
                <div className="text-sm md:text-base font-bold text-amber-700 tracking-wider mb-2">局数</div>
                <div className="text-4xl md:text-5xl font-black text-amber-800">{formatLevel(gameData.level)}</div>
              </div>

              {/* 分数 */}
              <div className="bg-gradient-to-br from-green-100 to-green-200 border-4 border-green-500 rounded-3xl p-4 md:p-6 text-center shadow-lg shadow-green-200/50">
                <div className="text-sm md:text-base font-bold text-green-700 tracking-wider mb-2">分数</div>
                <div className="text-4xl md:text-5xl font-black text-green-800">{gameData.score}</div>
              </div>

              {/* 生命 */}
              <div className="bg-gradient-to-br from-red-100 to-red-200 border-4 border-red-500 rounded-3xl p-4 md:p-6 text-center shadow-lg shadow-red-200/50">
                <div className="text-sm md:text-base font-bold text-red-700 tracking-wider mb-2">生命</div>
                <div className="text-4xl md:text-5xl font-black text-red-800">
                  {gameData.lives > 0 ? `${gameData.lives} ❤️` : '❤️'}
                </div>
              </div>
            </div>

            {/* 进度条 */}
            {gameData.gameStatus === 'playing' && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-base font-bold text-gray-700 mb-3">
                  <span className="flex items-center gap-2">
                    <span>📊</span>
                    <span>本局进度</span>
                  </span>
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 rounded-full text-white font-bold text-lg">
                    {gameData.foodsEatenInLevel} / {gameData.foodsToAdvance}
                  </span>
                </div>
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden border-3 border-gray-300 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 transition-all duration-500 ease-out rounded-full shadow-lg"
                    style={{ width: `${(gameData.foodsEatenInLevel / gameData.foodsToAdvance) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 中部：游戏区域 */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-6xl mx-auto w-full">
          {/* 游戏画布容器 */}
          <div className="flex-1 bg-white/98 backdrop-blur-lg rounded-3xl shadow-2xl shadow-amber-300/50 border-4 border-amber-400 p-4 md:p-8">
            {/* 当前目标 */}
            <div className="mb-6 flex justify-center">
              <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-purple-100 border-4 border-purple-400 rounded-3xl px-8 md:px-12 py-6 shadow-lg shadow-purple-200/50">
                <div className="text-center">
                  <div className="text-sm md:text-base font-bold text-purple-700 tracking-wider mb-2">当前目标</div>
                  <div className="text-6xl md:text-7xl animate-bounce">{gameData.snakeEmoji}</div>
                  {gameData.isChangingColor && (
                    <div className="text-base md:text-lg text-orange-600 font-bold animate-pulse mt-3">
                      ⚡ 即将变色...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 游戏画布 */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-2xl blur-md opacity-50 animate-pulse"></div>
                <canvas
                  ref={canvasRef}
                  width={cellSize * 20}
                  height={cellSize * 20}
                  className="relative rounded-2xl shadow-2xl border-4 border-amber-500"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            {/* 移动端控制按钮 */}
            <div className="mt-8 lg:hidden">
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => {
                    if (currentDirection !== 'down') setCurrentDirection('up')
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-4 border-blue-600 rounded-3xl text-4xl shadow-xl shadow-blue-300/50 hover:scale-110 transition-all duration-200 active:scale-95"
                >
                  ⬆️
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (currentDirection !== 'right') setCurrentDirection('left')
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-4 border-blue-600 rounded-3xl text-4xl shadow-xl shadow-blue-300/50 hover:scale-110 transition-all duration-200 active:scale-95"
                  >
                    ⬅️
                  </button>
                  <button
                    onClick={() => {
                      if (currentDirection !== 'up') setCurrentDirection('down')
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-4 border-blue-600 rounded-3xl text-4xl shadow-xl shadow-blue-300/50 hover:scale-110 transition-all duration-200 active:scale-95"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => {
                      if (currentDirection !== 'left') setCurrentDirection('right')
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-4 border-blue-600 rounded-3xl text-4xl shadow-xl shadow-blue-300/50 hover:scale-110 transition-all duration-200 active:scale-95"
                  >
                    ➡️
                  </button>
                </div>
              </div>
            </div>

            {/* 操作提示 */}
            <div className="mt-8 text-center">
              <p className="hidden lg:block text-gray-700 font-bold text-lg bg-amber-50 px-8 py-4 rounded-2xl border-3 border-amber-200">
                <span className="mr-4">⌨️ 使用</span>
                <kbd className="px-4 py-2 bg-white border-3 border-gray-300 rounded-xl shadow-md font-bold text-gray-800 text-lg">↑↓←→</kbd>
                <span className="mx-4">或</span>
                <kbd className="px-4 py-2 bg-white border-3 border-gray-300 rounded-xl shadow-md font-bold text-gray-800 text-lg">WASD</kbd>
                <span className="mx-4">控制方向</span>
                <span className="mx-4">|</span>
                <span className="mx-4">按</span>
                <kbd className="px-4 py-2 bg-white border-3 border-gray-300 rounded-xl shadow-md font-bold text-gray-800 text-lg">空格</kbd>
                <span className="ml-4">暂停/继续</span>
              </p>
            </div>
          </div>

          {/* 右侧：游戏机制说明 */}
          <div className="hidden lg:block w-72 space-y-6">
            {/* 游戏玩法 */}
            <div className="bg-white/98 backdrop-blur-lg rounded-3xl shadow-xl border-4 border-purple-400 p-6">
              <h3 className="text-2xl font-black text-purple-800 mb-4 text-center flex items-center justify-center gap-3">
                <span>📖</span>
                <span>游戏玩法</span>
              </h3>
              <ul className="space-y-3 text-base text-purple-700">
                <li className="flex items-start gap-3">
                  <span className="text-2xl text-purple-500">1️⃣</span>
                  <span>第一局：熟悉基本操作</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl text-purple-500">2️⃣</span>
                  <span>第二局：颜色匹配</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl text-purple-500">3️⃣</span>
                  <span>第三局+：难度升级</span>
                </li>
              </ul>
            </div>

            {/* 惊喜机制 */}
            <div className="bg-white/98 backdrop-blur-lg rounded-3xl shadow-xl border-4 border-blue-400 p-6">
              <h3 className="text-2xl font-black text-blue-800 mb-4 text-center flex items-center justify-center gap-3">
                <span>🎯</span>
                <span>惊喜机制</span>
              </h3>
              <ul className="space-y-3 text-base text-blue-700">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🍊</span>
                  <span>第5局：解锁橙子和猕猴桃</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🍋</span>
                  <span>第10局：解锁柠檬</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <span>更多局数解锁更多美食！</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 教程弹窗 */}
      {gameData.gameStatus === 'tutorial' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border-4 border-amber-400 p-8 md:p-12 max-w-4xl mx-auto shadow-2xl shadow-amber-300/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 text-[12rem] opacity-5">🎮</div>
              <div className="absolute bottom-0 left-0 text-[10rem] opacity-5">🐍</div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-center mb-10 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                🎮 欢迎来到贪吃蛇大冒险！
              </h2>

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-3xl border-4 border-purple-400 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="font-black text-purple-900 mb-6 text-2xl flex items-center gap-4">
                    <span className="text-4xl">📖</span>
                    <span>游戏玩法</span>
                  </div>
                  <ul className="space-y-4 text-lg text-purple-800">
                    <li className="flex items-start gap-4">
                      <span className="text-3xl text-purple-600">1️⃣</span>
                      <span>第一局：熟悉基本操作，蛇颜色固定</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="text-3xl text-purple-600">2️⃣</span>
                      <span>第二局：颜色匹配，吃对应颜色的食物</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="text-3xl text-purple-600">3️⃣</span>
                      <span>第三局+：难度升级，有3次生命</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl border-4 border-blue-400 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="font-black text-blue-900 mb-6 text-2xl flex items-center gap-4">
                    <span className="text-4xl">🎯</span>
                    <span>惊喜机制</span>
                  </div>
                  <ul className="space-y-4 text-lg text-blue-800">
                    <li className="flex items-start gap-4">
                      <span className="text-3xl">🍊</span>
                      <span>第5局：解锁橙子和猕猴桃</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="text-3xl">🍋</span>
                      <span>第10局：解锁柠檬</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="text-3xl">✨</span>
                      <span>更多局数解锁更多美味食物！</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-3xl border-4 border-green-400 shadow-lg mb-10">
                <div className="font-black text-green-900 mb-6 text-2xl flex items-center justify-center gap-4">
                  <span className="text-4xl">⌨️</span>
                  <span>控制方式</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6 text-lg text-green-800">
                  <div className="bg-white p-6 rounded-3xl border-4 border-green-300 text-center">
                    <div className="font-bold mb-3">方向键</div>
                    <div className="text-3xl font-black">↑ ↓ ← →</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border-4 border-green-300 text-center">
                    <div className="font-bold mb-3">WASD</div>
                    <div className="text-3xl font-black">W A S D</div>
                  </div>
                  <div className="md:col-span-2 bg-white p-6 rounded-3xl border-4 border-green-300 text-center">
                    <div className="font-bold mb-3">暂停</div>
                    <div className="text-2xl font-black">按空格键</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleStartGame}
                  className="px-16 py-6 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 hover:from-amber-500 hover:via-orange-500 hover:to-red-500 text-white font-black text-2xl border-4 border-amber-700 rounded-3xl shadow-2xl shadow-amber-400/50 hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  🎮 开始游戏
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 过关弹窗 */}
      {gameData.gameStatus === 'level_complete' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border-4 border-green-400 p-8 md:p-12 max-w-2xl mx-auto shadow-2xl shadow-green-300/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 text-[12rem] opacity-5">🎉</div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-center mb-8 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent animate-bounce">
                🎉 恭喜过关！
              </h2>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-10 rounded-3xl border-4 border-green-400 shadow-lg mb-10">
                <p className="text-3xl font-bold text-green-900 text-center mb-6">
                  你已经完成了第{gameData.level}局！
                </p>
                <div className="bg-white p-8 rounded-3xl border-4 border-green-300">
                  <p className="text-2xl text-green-800 text-center">
                    得分: <span className="font-black text-5xl ml-4">{gameData.score}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleAdvanceLevel}
                  className="px-16 py-6 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 hover:from-green-500 hover:via-emerald-500 hover:to-green-600 text-white font-black text-2xl border-4 border-green-700 rounded-3xl shadow-2xl shadow-green-400/50 hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  🎮 进入下一局
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 吃错食物弹窗 */}
      {gameData.gameStatus === 'wrong_food' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border-4 border-red-400 p-8 md:p-12 max-w-2xl mx-auto shadow-2xl shadow-red-300/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 text-[12rem] opacity-5">😅</div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-center mb-8 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                😅 吃错了！
              </h2>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-10 rounded-3xl border-4 border-red-400 shadow-lg mb-10">
                <p className="text-3xl font-bold text-red-900 text-center mb-6">
                  再试一次吧
                </p>
                <p className="text-xl text-red-800 text-center">
                  记得只吃和蛇颜色一样的食物哦！
                </p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleResumeFromWrongFood}
                  className="px-16 py-6 bg-gradient-to-r from-red-400 via-pink-400 to-red-500 hover:from-red-500 hover:via-pink-500 hover:to-red-600 text-white font-black text-2xl border-4 border-red-700 rounded-3xl shadow-2xl shadow-red-400/50 hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  🔄 重新开始
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 游戏结束弹窗 */}
      {gameData.gameStatus === 'gameover' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border-4 border-gray-400 p-8 md:p-12 max-w-2xl mx-auto shadow-2xl shadow-gray-300/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 text-[12rem] opacity-5">💀</div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-center mb-8 bg-gradient-to-r from-gray-500 to-gray-600 bg-clip-text text-transparent">
                💀 游戏结束
              </h2>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-10 rounded-3xl border-4 border-gray-400 shadow-lg mb-10">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border-4 border-gray-300 text-center">
                    <div className="font-bold text-gray-600 mb-4 text-lg">最终局数</div>
                    <div className="text-5xl font-black text-gray-900">{formatLevel(gameData.level)}</div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border-4 border-gray-300 text-center">
                    <div className="font-bold text-gray-600 mb-4 text-lg">最终分数</div>
                    <div className="text-5xl font-black text-gray-900">{gameData.score}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleRestart}
                  className="px-16 py-6 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 hover:from-green-500 hover:via-emerald-500 hover:to-green-600 text-white font-black text-2xl border-4 border-green-700 rounded-3xl shadow-2xl shadow-green-400/50 hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  🔄 再来一局
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
