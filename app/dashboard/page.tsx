"use client"

import { ProgressRing } from "@/components/progress-ring"
import { TreeOfLife } from "@/components/tree-of-life"
import { TimerDisplay } from "@/components/timer-display"
import { LineChartSimple } from "@/components/line-chart-simple"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Hand, Brain, RotateCcw, MoreHorizontal, Sparkles, AlertCircle, Check, X, Minus } from "lucide-react"
import { PeacefulAnimation } from "@/components/peaceful-animation"
import { LifeTreeLandscape } from "@/components/life-tree-landscape"
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
  
  // Analytics data
  const analyticsData = [60, 65, 70, 68, 75, 80, 82, 78, 85, 88, 85, 90]

  // Weekly check-in data (Mon-first ordering)
  const weekOrder = [1, 2, 3, 4, 5, 6, 0] // Monday to Sunday
  const weekLabels = ["M", "T", "W", "T", "F", "S", "S"]
  const todayDow = new Date().getDay()
  const todayPos = weekOrder.indexOf(todayDow)
  
  // Demo weekly status: 0 = not started, 1 = completed, 2 = failed
  const weeklyStatus = [1, 2, 1, 1, 2, 1, 2] // M=completed, T=failed, W=completed, etc.

  const handlePanicButton = () => {
    // TODO: Implementar chamada de vídeo
    console.log("Botão de Pânico clicado")
  }

  return (
    <div className="min-h-screen starry-background relative pb-24">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "lg:ml-20" : "lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 pt-20 lg:pt-8 py-8 space-y-6 pb-40 lg:pb-24">
          {/* Weekly Check-in Section */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              {weekOrder.map((_, idx) => {
                const status = weeklyStatus[idx]
                const isToday = idx === todayPos
                const isPast = idx < todayPos
                
                let icon = null
                let bgClass = "bg-white/10 border-white/20"
                
                if (isPast) {
                  if (status === 1) {
                    // Completed
                    icon = <Check className="h-4 w-4 text-white" />
                    bgClass = "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] border-[oklch(0.54_0.18_285)]"
                  } else if (status === 2) {
                    // Failed
                    icon = <X className="h-4 w-4 text-white" />
                    bgClass = "bg-red-600/50 border-red-500/50"
                  } else {
                    // Not started
                    icon = <Minus className="h-4 w-4 text-white/50" />
                  }
                } else if (isToday) {
                  icon = <span className="text-xs text-white/70">{weekLabels[idx]}</span>
                  bgClass = "bg-white/20 border-white/30"
                } else {
                  icon = <span className="text-xs text-white/50">{weekLabels[idx]}</span>
                }
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full ${bgClass} border-2 flex items-center justify-center transition-all`}>
                      {icon}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-center text-white/70 text-sm">{t.earlyPreview}</p>
          </div>

          {/* Header Section - Mobile Style */}
          <div className="space-y-4 mb-6 lg:hidden">
            <PeacefulAnimation />
            <div className="text-center space-y-2">
              <p className="text-white text-sm">{t.youveBeenFree}:</p>
              <TimerDisplay startDate={startDate} />
            </div>
          </div>

          {/* Timer Section - Desktop */}
          <div className="hidden lg:block text-center mb-8">
            <p className="text-white text-lg mb-2">{t.youveBeenFree}:</p>
            <TimerDisplay startDate={startDate} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-6">
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Hand className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{t.pledge}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{t.meditate}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <RotateCcw className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{t.reset}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <MoreHorizontal className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{t.more}</span>
            </button>
          </div>

          {/* Brain Rewiring Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">{t.brainReprogramming}</span>
              <span className="text-white font-semibold">{Math.round(brainProgress)}%</span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[oklch(0.7_0.15_220)] to-[oklch(0.54_0.18_285)] rounded-full transition-all duration-500"
                style={{ width: `${brainProgress}%` }}
              />
            </div>
          </div>

          {/* Open Analytics Section */}
          <div className="space-y-3 mb-6">
            <h3 className="text-white font-semibold">{t.openAnalytics}</h3>
            <Card className="p-4 bg-card/50 backdrop-blur-sm border-white/10">
              <LineChartSimple 
                data={analyticsData} 
                color="oklch(0.7 0.15 220)" 
                label="" 
              />
            </Card>
          </div>

          {/* Challenge and Life Tree Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 28 Days Challenge Card */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white ml-1">{t.daysChallenge}</h4>
              <Card className="p-6 bg-gradient-to-br from-purple-900/80 to-indigo-900/80 border-white/10 backdrop-blur-sm relative overflow-hidden min-h-[180px] flex items-center justify-center">
                {/* Starry background effect */}
                <div className="absolute inset-0 opacity-30">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5 + 0.3,
                      }}
                    />
                  ))}
                </div>
                
                {/* Number 28 with gradient */}
                <div className="relative z-10">
                  <div className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
                    28
                  </div>
                  
                  {/* Four-pointed stars around the number */}
                  <div className="absolute -top-2 -left-4 w-3 h-3 text-white">
                    <svg viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0 L7 4 L11 4 L8 6.5 L9 10.5 L6 8 L3 10.5 L4 6.5 L1 4 L5 4 Z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-2 -right-4 w-3 h-3 text-white">
                    <svg viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0 L7 4 L11 4 L8 6.5 L9 10.5 L6 8 L3 10.5 L4 6.5 L1 4 L5 4 Z" />
                    </svg>
                  </div>
                  <div className="absolute top-1/2 -right-6 w-2 h-2 text-white/80">
                    <svg viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0 L7 4 L11 4 L8 6.5 L9 10.5 L6 8 L3 10.5 L4 6.5 L1 4 L5 4 Z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Life Tree Card */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white ml-1">{t.lifeTree}</h4>
              <Link href="/program">
                <Card className="p-0 bg-transparent border-white/10 backdrop-blur-sm hover:border-green-500/50 transition-all cursor-pointer h-full overflow-hidden min-h-[180px]">
                  <LifeTreeLandscape />
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Panic Button - Fixed at bottom, above mobile nav */}
      <div className="fixed bottom-20 left-0 right-0 z-50 p-4 lg:bottom-4 lg:pl-0 lg:pr-0">
        <div className={cn("max-w-7xl mx-auto", collapsed ? "lg:ml-20 lg:px-4" : "lg:ml-64 lg:px-4")}>
          <Button
            onClick={handlePanicButton}
            className="w-full h-14 bg-red-900/30 hover:bg-red-900/40 backdrop-blur-sm text-white font-semibold rounded-full border-2 border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.6),0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(248,113,113,0.8),0_0_40px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 rounded-sm bg-white/20 flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-xs">!</span>
            </div>
            {t.panicButton}
          </Button>
        </div>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
