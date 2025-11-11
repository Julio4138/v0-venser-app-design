"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MissionCardProps {
  icon: LucideIcon
  title: string
  xp: number
  completed: boolean
  onComplete: () => void
  completedLabel: string
}

export function MissionCard({ icon: Icon, title, xp, completed, onComplete, completedLabel }: MissionCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleComplete = () => {
    setIsAnimating(true)
    setTimeout(() => {
      onComplete()
      setIsAnimating(false)
    }, 500)
  }

  return (
    <Card
      className={cn(
        "p-6 transition-all duration-500",
        completed &&
          "bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.7_0.15_220)]/20 border-[oklch(0.54_0.18_285)]/50",
        isAnimating && "scale-105 venser-glow",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div
            className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center transition-all shrink-0",
              completed ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)]" : "bg-muted",
            )}
          >
            {completed ? (
              <Check className="h-7 w-7 text-white" />
            ) : (
              <Icon className={cn("h-7 w-7", completed ? "text-white" : "text-muted-foreground")} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn("font-semibold", completed && "line-through text-muted-foreground")}>{title}</p>
            <p className="text-sm text-muted-foreground">+{xp} XP</p>
          </div>
        </div>

        {!completed ? (
          <Button onClick={handleComplete} size="sm">
            <Check className="mr-2 h-4 w-4" />
            {completedLabel}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm font-medium text-[oklch(0.54_0.18_285)]">
            <Check className="h-5 w-5" />
            {completedLabel}
          </div>
        )}
      </div>
    </Card>
  )
}
