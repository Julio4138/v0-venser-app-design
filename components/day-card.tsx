"use client"

import { Card } from "@/components/ui/card"
import { Check, Lock, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface DayCardProps {
  day: number
  status: "completed" | "current" | "locked"
  onClick?: () => void
  streak?: boolean
  language?: "pt" | "en" | "es"
}

export function DayCard({ day, status, onClick, streak, language = "pt" }: DayCardProps) {
  const isClickable = status === "current" || status === "completed"

  return (
    <Card
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "relative p-6 transition-all duration-300",
        isClickable && "cursor-pointer hover:scale-105 hover:border-[oklch(0.54_0.18_285)] venser-card-glow",
        status === "completed" &&
          "bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.7_0.15_220)]/20 border-[oklch(0.54_0.18_285)]/50",
        status === "locked" && "opacity-50",
      )}
    >
      {streak && status === "current" && (
        <div className="absolute -top-2 -right-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] flex items-center justify-center venser-glow">
            <Flame className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all",
            status === "completed" &&
              "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white",
            status === "current" &&
              "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white animate-pulse",
            status === "locked" && "bg-muted text-muted-foreground",
          )}
        >
          {status === "completed" ? (
            <Check className="h-8 w-8" />
          ) : status === "locked" ? (
            <Lock className="h-6 w-6" />
          ) : (
            day
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-medium">
            {language === "pt" ? "Dia" : language === "es" ? "Día" : "Day"} {day}
          </p>
        </div>
      </div>
    </Card>
  )
}
