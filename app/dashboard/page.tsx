"use client"

import { ProgressRing } from "@/components/progress-ring"
import { TreeOfLife } from "@/components/tree-of-life"
import { StreakCounter } from "@/components/streak-counter"
import { MobileNav } from "@/components/mobile-nav"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Lightbulb, Target, TrendingUp, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()

  // Demo data - in production this would come from a database
  const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
  const currentDay = 14
  const brainProgress = Math.min((currentDay / 90) * 100, 100)

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      <div className={cn(collapsed ? "lg:ml-20" : "lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 lg:pb-8">
          {/* Main Progress Circle */}
          <Card className="p-8 venser-card-glow">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-semibold text-muted-foreground">{t.cleanFor}</h2>

              <div className="flex justify-center">
                <ProgressRing progress={brainProgress} size={280} strokeWidth={16}>
                  <div className="text-center px-4">
                    <StreakCounter
                      startDate={startDate}
                      daysLabel={t.days}
                      hoursLabel={t.hours}
                      minutesLabel={t.minutes}
                    />
                  </div>
                </ProgressRing>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.brainReprogramming}</span>
                  <span className="font-semibold text-[oklch(0.54_0.18_285)]">{Math.round(brainProgress)}%</span>
                </div>
                <Progress value={brainProgress} className="h-3" />
              </div>
            </div>
          </Card>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 hover:border-[oklch(0.54_0.18_285)] transition-all hover:venser-card-glow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-muted-foreground">{t.insightOfDay}</h3>
                  <p className="text-sm leading-relaxed">{t.insightText}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:border-[oklch(0.7_0.15_220)] transition-all hover:venser-card-glow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-muted-foreground">{t.nextGoal}</h3>
                  <p className="text-2xl font-bold">{t.nextGoalText}</p>
                  <Progress value={(currentDay / 7) * 100} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:border-[oklch(0.68_0.18_45)] transition-all hover:venser-card-glow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.54_0.18_285)] flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-muted-foreground">{t.focusTrend}</h3>
                  <p className="text-2xl font-bold text-green-500">{t.focusImproving}</p>
                  <div className="flex items-center gap-1">
                    <div className="h-8 w-1 bg-green-500/30 rounded" />
                    <div className="h-10 w-1 bg-green-500/50 rounded" />
                    <div className="h-14 w-1 bg-green-500/70 rounded" />
                    <div className="h-16 w-1 bg-green-500 rounded" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tree of Life */}
          <Card className="p-8 venser-card-glow overflow-hidden">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">{t.treeOfLife}</h3>
              <p className="text-sm text-muted-foreground">{"Your progress grows with every day of commitment"}</p>
              <TreeOfLife days={currentDay} />
              <p className="text-xs text-muted-foreground">
                {currentDay} / 90 {t.days}
              </p>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/program">
              <Card className="p-6 hover:border-[oklch(0.54_0.18_285)] transition-all cursor-pointer hover:venser-card-glow group">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold group-hover:text-[oklch(0.54_0.18_285)] transition-colors">
                      {t.program}
                    </h3>
                    <p className="text-sm text-muted-foreground">{"Continue your 90-day journey"}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-[oklch(0.54_0.18_285)]" />
                </div>
              </Card>
            </Link>

            <Link href="/missions">
              <Card className="p-6 hover:border-[oklch(0.7_0.15_220)] transition-all cursor-pointer hover:venser-card-glow group">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold group-hover:text-[oklch(0.7_0.15_220)] transition-colors">
                      {t.missions}
                    </h3>
                    <p className="text-sm text-muted-foreground">{"Complete today's tasks"}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-[oklch(0.7_0.15_220)]" />
                </div>
              </Card>
            </Link>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
