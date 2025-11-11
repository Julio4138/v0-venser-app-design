"use client"

import { useState } from "react"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MissionCard } from "@/components/mission-card"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Wind, BookOpen, FileText, Brain, Smile } from "lucide-react"

export default function MissionsPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const [missions, setMissions] = useState([
    { id: 1, icon: Wind, title: t.mission1, xp: 10, completed: false },
    { id: 2, icon: BookOpen, title: t.mission2, xp: 15, completed: false },
    { id: 3, icon: FileText, title: t.mission3, xp: 20, completed: false },
    { id: 4, icon: Brain, title: t.mission4, xp: 25, completed: false },
    { id: 5, icon: Smile, title: t.mission5, xp: 10, completed: false },
  ])

  const completeMission = (id: number) => {
    setMissions((prev) => prev.map((mission) => (mission.id === id ? { ...mission, completed: true } : mission)))
  }

  const totalXP = missions.reduce((sum, m) => sum + m.xp, 0)
  const earnedXP = missions.filter((m) => m.completed).reduce((sum, m) => sum + m.xp, 0)
  const progress = (earnedXP / totalXP) * 100
  const allComplete = missions.every((m) => m.completed)

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      <div className="lg:ml-64">
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 lg:pb-8">
          {/* Progress Card */}
          <Card className="p-8 venser-card-glow">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">{t.progressToday}</h2>
                <p className="text-muted-foreground">
                  {missions.filter((m) => m.completed).length} / {missions.length} {t.completed}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    XP: {earnedXP} / {totalXP}
                  </span>
                  <span className="font-semibold text-[oklch(0.54_0.18_285)]">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-4" />
              </div>

              {allComplete && (
                <Card className="p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.7_0.15_220)]/20 border-[oklch(0.54_0.18_285)] animate-in fade-in zoom-in">
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center mx-auto venser-glow">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{t.allMissionsComplete}</h3>
                      <p className="text-muted-foreground">{t.bonusReward}</p>
                    </div>
                    <p className="text-3xl font-bold text-[oklch(0.68_0.18_45)]">+50 XP</p>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* Missions List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{t.todaysMissions}</h3>
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                icon={mission.icon}
                title={mission.title}
                xp={mission.xp}
                completed={mission.completed}
                onComplete={() => completeMission(mission.id)}
                completedLabel={t.completed}
              />
            ))}
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
