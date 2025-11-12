"use client"

import { useState } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { ProgressRing } from "@/components/progress-ring"
import { StatCard } from "@/components/stat-card"
import { LineChartSimple } from "@/components/line-chart-simple"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame, Trophy, Brain, Zap, Award, Check } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const { language } = useLanguage()
  const [period, setPeriod] = useState<"week" | "month" | "all">("week")
  const t = translations[language]
  const { collapsed } = useSidebar()

  // Demo data
  const recoveryScore = 78
  const consecutiveDays = 14
  const personalRecord = 21
  const mentalClarity = 85
  const energyLevel = 72

  const moodData = [60, 65, 70, 68, 75, 80, 82]
  const productivityData = [55, 62, 68, 71, 75, 78, 82]

  const milestones = [
    { id: 1, title: t.firstWeek, days: 7, achieved: true },
    { id: 2, title: t.twoWeeks, days: 14, achieved: true },
    { id: 3, title: t.oneMonth, days: 30, achieved: false },
    { id: 4, title: t.threeMonths, days: 90, achieved: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          {/* Recovery Score */}
          <Card className="p-6 md:p-8 venser-card-glow">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              <div className="flex justify-center">
                <div className="scale-90 md:scale-100 lg:scale-110">
                  <ProgressRing progress={recoveryScore} size={200}>
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] bg-clip-text text-transparent">
                        {recoveryScore}%
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2">{t.recoveryScore}</p>
                    </div>
                  </ProgressRing>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-2">{t.excellentProgress}</h2>
                  <p className="text-muted-foreground">{t.focusIncrease}</p>
                </div>

                <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="week">{t.thisWeek}</TabsTrigger>
                    <TabsTrigger value="month">{t.thisMonth}</TabsTrigger>
                    <TabsTrigger value="all">{t.allTime}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Flame}
              label={t.consecutiveDays}
              value={consecutiveDays}
              color="text-[oklch(0.68_0.18_45)]"
            />
            <StatCard
              icon={Trophy}
              label={t.personalRecord}
              value={personalRecord}
              color="text-[oklch(0.54_0.18_285)]"
              trend={`+${consecutiveDays} ${t.days}`}
            />
            <StatCard
              icon={Brain}
              label={t.mentalClarity}
              value={`${mentalClarity}%`}
              color="text-[oklch(0.7_0.15_220)]"
              trend="+15% this week"
            />
            <StatCard
              icon={Zap}
              label={t.energyLevel}
              value={`${energyLevel}%`}
              color="text-[oklch(0.68_0.18_45)]"
              trend="+8% this week"
            />
          </div>

          {/* Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <LineChartSimple data={moodData} color="oklch(0.54 0.18 285)" label={t.moodTrend} />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.avgMood}</span>
                <span className="font-semibold text-[oklch(0.54_0.18_285)]">72%</span>
              </div>
            </Card>

            <Card className="p-6">
              <LineChartSimple data={productivityData} color="oklch(0.7 0.15 220)" label={t.productivityTrend} />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.completionRate}</span>
                <span className="font-semibold text-[oklch(0.7_0.15_220)]">86%</span>
              </div>
            </Card>
          </div>

          {/* Milestones */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Award className="h-6 w-6 text-[oklch(0.68_0.18_45)]" />
              {t.milestones}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {milestones.map((milestone) => (
                <Card
                  key={milestone.id}
                  className={`p-6 transition-all ${
                    milestone.achieved
                      ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.7_0.15_220)]/20 border-[oklch(0.54_0.18_285)]/50"
                      : "opacity-50"
                  }`}
                >
                  <div className="text-center space-y-3">
                    <div
                      className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center ${
                        milestone.achieved
                          ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)]"
                          : "bg-muted"
                      }`}
                    >
                      {milestone.achieved ? (
                        <Check className="h-8 w-8 text-white" />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">{milestone.days}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.days} {t.days}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
