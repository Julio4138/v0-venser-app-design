"use client"

import { useEffect, useState } from "react"

interface StreakCounterProps {
  startDate: Date
  daysLabel: string
  hoursLabel: string
  minutesLabel: string
}

export function StreakCounter({ startDate, daysLabel, hoursLabel, minutesLabel }: StreakCounterProps) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const diff = now.getTime() - startDate.getTime()

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTime({ days, hours, minutes })
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [startDate])

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="text-center">
        <div className="text-5xl font-bold bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] bg-clip-text text-transparent">
          {time.days}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{daysLabel}</div>
      </div>
      <div className="text-4xl text-muted-foreground">:</div>
      <div className="text-center">
        <div className="text-5xl font-bold bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] bg-clip-text text-transparent">
          {time.hours}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{hoursLabel}</div>
      </div>
      <div className="text-4xl text-muted-foreground">:</div>
      <div className="text-center">
        <div className="text-5xl font-bold bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.15_220)] bg-clip-text text-transparent">
          {time.minutes}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{minutesLabel}</div>
      </div>
    </div>
  )
}
