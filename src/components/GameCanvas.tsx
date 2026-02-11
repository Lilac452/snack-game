'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/game-store'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    snake,
    foods,
    cellSize,
    gridSize,
    canvasWidth,
    canvasHeight,
    snakeColor,
  } = useGameStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

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

    snake.forEach((segment, index) => {
      const x = segment.x * cellSize
      const y = segment.y * cellSize
      const padding = 2
      const alpha = 1 - (index / snake.length) * 0.5

      if (index === 0) {
        ctx.fillStyle = snakeColor
        ctx.shadowColor = snakeColor
        ctx.shadowBlur = 10
      } else {
        ctx.fillStyle = snakeColor + Math.floor(alpha * 255).toString(16).padStart(2, '0')
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

    foods.forEach(food => {
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
  }, [snake, foods, cellSize, gridSize, canvasWidth, canvasHeight, snakeColor])

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="border-4 border-amber-400 rounded-lg shadow-xl"
      style={{
        imageRendering: 'pixelated',
      }}
    />
  )
}