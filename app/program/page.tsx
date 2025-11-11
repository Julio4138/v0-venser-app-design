"use client"

import { useState } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { DayCard } from "@/components/day-card"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Brain, Flame, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function ProgramPage() {
  const { language } = useLanguage()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [mood, setMood] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const t = translations[language]

  // Demo data - in production this would come from a database
  const currentDay = 14
  const totalDays = 90
  const currentStreak = 14

  const exercises = {
    14: {
      title: "Understanding Your Triggers",
      content:
        "Today, we explore the patterns and situations that trigger unhealthy behaviors. By identifying these triggers, you can develop strategies to avoid or manage them effectively. Take 10 minutes to write down 3 situations that challenge you most.",
      meditation: "Mindfulness for Self-Awareness (10 min)",
    },
  }

  const handleCompleteDay = () => {
    if (mood) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedDay(null)
        setMood(null)
      }, 2000)
    }
  }

  const moods = [
    { value: "excellent", label: t.excellent, color: "from-green-500 to-emerald-500" },
    { value: "good", label: t.good, color: "from-blue-500 to-cyan-500" },
    { value: "okay", label: t.okay, color: "from-yellow-500 to-orange-500" },
    { value: "struggling", label: t.struggling, color: "from-red-500 to-pink-500" },
  ]

  // Generate week groups
  const weeks = []
  for (let i = 0; i < totalDays; i += 7) {
    const weekDays = []
    for (let j = 1; j <= 7 && i + j <= totalDays; j++) {
      const day = i + j
      let status: "completed" | "current" | "locked" = "locked"

      if (day < currentDay) status = "completed"
      else if (day === currentDay) status = "current"

      weekDays.push({ day, status })
    }
    weeks.push({
      number: Math.floor(i / 7) + 1,
      days: weekDays,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      <div className="lg:ml-64">
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 lg:pb-8">
          {/* Progress Header */}
          <Card className="p-6 venser-card-glow">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold">{t.dayJourney}</h1>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-[oklch(0.68_0.18_45)]" />
                  <span className="text-lg font-bold text-[oklch(0.68_0.18_45)]">
                    {currentStreak} {t.days}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {currentDay} / {totalDays}
                  </span>
                  <span>{Math.round((currentDay / totalDays) * 100)}%</span>
                </div>
                <Progress value={(currentDay / totalDays) * 100} className="h-2" />
              </div>
            </div>
          </Card>

          {/* Week Grid */}
          {weeks.map((week) => (
            <div key={week.number} className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">
                {t.week} {week.number}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {week.days.map((dayData) => (
                  <DayCard
                    key={dayData.day}
                    day={dayData.day}
                    status={dayData.status}
                    streak={dayData.status === "current" && currentStreak >= 7}
                    onClick={() => dayData.status === "current" && setSelectedDay(dayData.day)}
                  />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <MobileNav translations={t} />

      {/* Day Detail Dialog */}
      <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {"Day"} {selectedDay} - {exercises[14 as keyof typeof exercises]?.title}
            </DialogTitle>
            <DialogDescription>{t.exerciseOfDay}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Exercise Content */}
            <Card className="p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="font-semibold">{t.exerciseOfDay}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {exercises[14 as keyof typeof exercises]?.content}
                  </p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t.readExercise}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Meditation */}
            <Card className="p-6 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/10 to-[oklch(0.68_0.18_45)]/10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="font-semibold">{t.guidedMeditation}</h3>
                  <p className="text-sm text-muted-foreground">{exercises[14 as keyof typeof exercises]?.meditation}</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Brain className="mr-2 h-4 w-4" />
                    {t.startMeditation}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Mood Check */}
            <div className="space-y-3">
              <h3 className="font-semibold">{t.moodCheck}</h3>
              <div className="grid grid-cols-2 gap-3">
                {moods.map((moodOption) => (
                  <Button
                    key={moodOption.value}
                    variant={mood === moodOption.value ? "default" : "outline"}
                    onClick={() => setMood(moodOption.value)}
                    className={cn(
                      "h-auto py-4",
                      mood === moodOption.value && `bg-gradient-to-r ${moodOption.color} text-white`,
                    )}
                  >
                    {moodOption.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Complete Button */}
            <Button
              size="lg"
              onClick={handleCompleteDay}
              disabled={!mood}
              className="w-full h-14 bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white"
            >
              <Check className="mr-2 h-5 w-5" />
              {t.completeDay}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md text-center">
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow animate-bounce">
                <Check className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{t.dayWon}</h2>
              <p className="text-muted-foreground">{t.keepGoing}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[oklch(0.68_0.18_45)]">
              <span>+50</span>
              <span className="text-base text-muted-foreground">{t.xpEarned}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
