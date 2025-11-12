"use client"

import { useEffect, useState } from "react"

interface TimerDisplayProps {
  startDate: Date | null
  compact?: boolean
}

export function TimerDisplay({ startDate, compact = false }: TimerDisplayProps) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!startDate) {
      setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      return
    }
    
    const updateTime = () => {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTime({ days, hours, minutes, seconds })
    }

    updateTime()
    const interval = setInterval(updateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [startDate])
  
  // Se não houver startDate, retorna zero
  if (!startDate) {
    return (
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-white/50">
          0m 0s
        </div>
      </div>
    )
  }

  if (compact) {
    // Compact version for mobile header
    const textSize = "text-2xl"
    if (time.days > 0) {
      return (
        <div className="text-center">
          <div className={`${textSize} font-bold text-white`}>
            {time.days}d {time.hours}h {time.minutes}m
          </div>
        </div>
      )
    }
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

  // Full version - após 24h mostra dias, horas, minutos e segundos
  if (time.days > 0 || time.hours >= 24) {
    const totalDays = time.days > 0 ? time.days : Math.floor(time.hours / 24)
    const remainingHours = time.days > 0 ? time.hours : time.hours % 24
    return (
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-white">
          {totalDays} {totalDays === 1 ? 'dia' : 'dias'} - {remainingHours}h - {time.minutes}m {time.seconds}s
        </div>
      </div>
    )
  }

  // Se tiver horas mas menos de 24h
  if (time.hours > 0) {
    return (
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-white">
          {time.hours}h {time.minutes}m
        </div>
      </div>
    )
  }

  // Show minutes large and seconds smaller below (menos de 1 hora)
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

