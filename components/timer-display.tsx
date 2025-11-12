"use client"

import { useEffect, useState } from "react"

interface TimerDisplayProps {
  startDate: Date
  compact?: boolean
}

export function TimerDisplay({ startDate, compact = false }: TimerDisplayProps) {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTime({ hours, minutes, seconds })
    }

    updateTime()
    const interval = setInterval(updateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [startDate])

  if (compact) {
    // Compact version for mobile header
    const textSize = "text-2xl"
    if (time.hours > 0) {
      return (
        <div className="text-center">
          <div className={`${textSize} font-bold text-white`}>
            {time.hours}h {time.minutes}m
          </div>
        </div>
      )
    }
    if (time.minutes > 0) {
      return (
        <div className="text-center">
          <div className={`${textSize} font-bold text-white`}>
            {time.minutes}m {time.seconds}s
          </div>
        </div>
      )
    }
    return (
      <div className="text-center">
        <div className={`${textSize} font-bold text-white`}>
          {time.seconds}s
        </div>
      </div>
    )
  }

  // Full version with separate minutes and seconds display
  if (time.hours > 0) {
    return (
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-white">
          {time.hours}h {time.minutes}m
        </div>
      </div>
    )
  }

  // Show minutes large and seconds smaller below
  return (
    <div className="text-center">
      <div className="text-5xl md:text-6xl font-bold text-white">
        {time.minutes}m
      </div>
      <div className="text-xl md:text-2xl text-white/80 mt-1">
        {time.seconds}s
      </div>
    </div>
  )
}

