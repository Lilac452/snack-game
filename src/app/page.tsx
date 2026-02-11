'use client'

import { useEffect, useState, useRef } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right'

interface Position {
  x: number
  y: number
}

interface GameData {
  gameStatus: 'tutorial' | 'playing' | 'paused' | 'gameover'
  level: number
  lives: number
  score: number
  snake: Position[]
  snakeEmoji: string
  isChangingColor: boolean
  foodsEatenInLevel: number
  foodsToAdvance: number
}

export default function SnakeGamePage() {
  const [gameData, setGameData] = useState<GameData>({
    gameStatus: 'tutorial',
    level: 1,
    lives: 0,
    score: 0,
    snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
    snakeEmoji: '🍇',
    isChangingColor: false,
    foodsEatenInLevel: 0,
    foodsToAdvance: 5,
  })

  const [direction, setDirection] = useState<Direction>('right')
  // 修复1: useRef 不能像 useState 那样解构
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [cellSize, setCellSize] = useState(20)

  const updateCellSize = () => {
    const maxCellSize = 40
    const minCellSize = 20
    const availableWidth = window.innerWidth - 40
    const availableHeight = window.innerHeight - 350
    const cellSizeByWidth = Math.floor(availableWidth / 20)
    const cellSizeByHeight = Math.floor(availableHeight / 20)
    const cellSize = Math.min(
      Math.min(cellSizeByWidth, cellSizeByHeight),
      maxCellSize
    )
    setCellSize(Math.max(cellSize, minCellSize))
  }

  useEffect(() => {
    updateCellSize()
    window.addEventListener('resize', updateCellSize)
    return () => window.removeEventListener('resize', updateCellSize)
  }, [])

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

      ctx.fillStyle = '#9333ea'
      ctx.shadowColor = '#9333ea'
      ctx.shadowBlur = 10

      const radius = 4
      ctx.beginPath()
      ctx.moveTo(x + padding + radius, y + padding)
      ctx.lineTo(x + cellSize - padding - radius, y + padding)
      ctx.quadraticCurveTo(x + cellSize - padding, y + padding, x + cellSize - padding, y + padding + radius)
      ctx.lineTo(x + cellSize - padding, y + cellSize - padding - radius)
      ctx.quadraticCurveTo(x + cellSize - padding, y + cellSize - padding, x + cellSize - padding - radius, y + cellSize - padding)
      ctx.lineTo(x + padding + radius, y + cellSize - padding - radius)
      ctx.quadraticCurveTo(x + padding, y + padding, x + padding + radius, y + cellSize - padding - radius)
      ctx.lineTo(x + padding, y + cellSize - padding - radius)
      ctx.quadraticCurveTo(x + padding, y + cellSize - padding, x + padding + radius, y + cellSize - padding)
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

    ctx.shadowBlur = 0
  }, [gameData.snake, cellSize])

  useEffect(() => {
    let gameInterval: number | null = null

    if (gameData.gameStatus === 'playing') {
      gameInterval = window.setInterval(() => {
        moveSnake()
        if (checkCollision()) {
          setGameData(prev => ({ ...prev, gameStatus: 'gameover' }))
        }
      }, 150)
    }
    return () => {
      if (gameInterval) window.clearInterval(gameInterval)
    }
  }, [gameData.gameStatus])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameData.gameStatus !== 'playing') return

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          setDirection('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          setDirection('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          setDirection('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          setDirection('right')
          break
        case ' ':
          e.preventDefault()
          setGameData(prev => ({ ...prev, gameStatus: 'paused' }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameData.gameStatus])

  const moveSnake = () => {
    const newSnake = [...gameData.snake]
    const head = { ...newSnake[0] }
    const gridSize = 20

    switch (direction) {
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
    newSnake.pop()

    setGameData(prev => ({ ...prev, snake: newSnake }))
  }

  const checkCollision = () => {
    const head = gameData.snake[0]
    return gameData.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  }

  const handleStartGame = () => {
    // 修复2: setGameData 需要提供完整的 GameData 对象
    setGameData({
      gameStatus: 'playing',
      level: 1,
      lives: 0,
      score: 0,
      snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
      snakeEmoji: '🍇',
      isChangingColor: false,
      foodsEatenInLevel: 0,
      foodsToAdvance: 5,
    })
  }

  const handleRestart = () => {
    setGameData({
      gameStatus: 'tutorial',
      level: 1,
      lives: 0,
      score: 0,
      snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
      snakeEmoji: '🍇',
      isChangingColor: false,
      foodsEatenInLevel: 0,
      foodsToAdvance: 5,
    })
  }

  const formatLevel = (level: number) => {
    return level.toString().padStart(3, '0')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-2 md:p-4 flex flex-col">
      <header className="w-full max-w-4xl mx-auto mb-4">
        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border-4 border-amber-300">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 border-2 border-amber-400 rounded-lg px-4 py-2">
                <div className="text-xs text-amber-700 font-medium">局数</div>
                <div className="text-2xl font-bold text-amber-800">{formatLevel(gameData.level)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-green-100 border-2 border-green-400 rounded-lg px-4 py-2">
                <div className="text-xs text-green-700 font-medium">分数</div>
                <div className="text-xl font-bold text-green-800">🏆 {gameData.score}</div>
              </div>

              {gameData.lives > 0 && (
                <div className="bg-red-100 border-2 border-red-400 rounded-lg px-4 py-2">
                  <div className="text-xs text-red-700 font-medium">生命</div>
                  <div className="text-xl font-bold text-red-800">❤️ {gameData.lives}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-2">
        <div className="p-3 md:p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border-4 border-amber-400">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={cellSize * 20}
              height={cellSize * 20}
              className="border-4 border-amber-400 rounded-lg shadow-xl"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          <div className="mt-4 md:hidden">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setDirection('up')}
                className="w-14 h-14 border-2 border-amber-400 bg-white hover:bg-amber-50 rounded text-2xl"
              >
                ⬆️
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection('left')}
                  className="w-14 h-14 border-2 border-amber-400 bg-white hover:bg-amber-50 rounded text-2xl"
                >
                  ⬅️
                </button>
                <button
                  onClick={() => setDirection('down')}
                  className="w-14 h-14 border-2 border-amber-400 bg-white hover:bg-amber-50 rounded text-2xl"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => setDirection('right')}
                  className="w-14 h-14 border-2 border-amber-400 bg-white hover:bg-amber-50 rounded text-2xl"
                >
                  ➡️
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="hidden md:block">
              使用 <kbd className="px-2 py-1 bg-gray-100 rounded border">↑↓←→</kbd> 或 <kbd className="px-2 py-1 bg-gray-100 rounded border">WASD</kbd> 控制方向
              <span className="mx-2">|</span>
              按 <kbd className="px-2 py-1 bg-gray-100 rounded border">空格</kbd> 暂停/继续
            </p>
          </div>
        </div>
      </main>

      {gameData.gameStatus === 'tutorial' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border-4 border-amber-400 p-6 max-w-md mx-auto">
            <h2 className="text-2xl text-center mb-4">🎮 贪吃蛇大冒险</h2>

            <div className="space-y-4 text-left">
              <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                <div className="font-bold text-purple-700 mb-2">📖 游戏玩法</div>
                <ul className="space-y-1 text-sm">
                  <li>• 使用方向键或 WASD 控制蛇的移动</li>
                  <li>• 吃到食物后蛇会变长</li>
                  <li>• 避免撞到自己</li>
                </ul>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                <div className="font-bold text-green-700 mb-2">🎯 目标</div>
                <ul className="space-y-1 text-sm">
                  <li>• 尽可能多地吃食物</li>
                  <li>• 挑高分，挑战更高局数</li>
                  <li>• 蛇的颜色会随机变化</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold border-2 border-amber-600 rounded-lg text-lg"
              >
                🎮 开始游戏
              </button>
            </div>
          </div>
        </div>
      )}

      {gameData.gameStatus === 'gameover' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border-4 border-gray-400 p-6 max-w-md mx-auto">
            <h2 className="text-2xl text-center mb-4">💀 游戏结束</h2>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">最终局数</div>
                  <div className="text-2xl font-bold text-gray-800">{formatLevel(gameData.level)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">最终分数</div>
                  <div className="text-2xl font-bold text-gray-800">🏆 {gameData.score}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white font-bold border-2 border-green-600 rounded-lg text-lg"
              >
                🔄 再来一局
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}