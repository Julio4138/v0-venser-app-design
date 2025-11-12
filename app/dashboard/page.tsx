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
import { Hand, Brain, RotateCcw, MoreHorizontal, Sparkles, AlertCircle, Check, X, Minus, Cloud, Plus, Flower2, Bell, TreePine, MessageCircle, Globe, SquarePlus, Circle, HelpCircle, Star, ChevronRight, Heart, BookOpen, Smile, Users, Target, RotateCw, ClipboardList, Wind, Award, Quote } from "lucide-react"
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

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 pb-40 md:pb-24">
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

          {/* Header Section - All Devices */}
          <div className="space-y-4 mb-6 md:mb-8">
            <PeacefulAnimation />
            <div className="text-center space-y-2">
              <p className="text-white text-sm md:text-lg">{t.youveBeenFree}:</p>
              <TimerDisplay startDate={startDate} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-6">
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Hand className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-xs font-medium">{t.pledge}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Brain className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-xs font-medium">{t.meditate}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-xs font-medium">{t.reset}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* 28 Days Challenge Card */}
            <div className="flex flex-col space-y-2 h-full">
              <h4 className="text-sm font-semibold text-white ml-1">{t.daysChallenge}</h4>
              <Card className="p-6 bg-gradient-to-br from-purple-900/80 to-indigo-900/80 border-white/10 backdrop-blur-sm relative overflow-hidden h-full flex items-center justify-center min-h-[180px]">
                {/* Starry background effect */}
                <div className="absolute inset-0 opacity-30">
                  {Array.from({ length: 30 }).map((_, i) => {
                    // Use deterministic values based on index to avoid hydration mismatch
                    const seed = i * 0.618033988749895 // Golden ratio for better distribution
                    const top = ((seed * 100) % 100).toFixed(2)
                    const left = (((seed * 1.618033988749895) * 100) % 100).toFixed(2)
                    const opacity = (0.3 + ((seed * 0.5) % 0.5)).toFixed(3)
                    
                    return (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          opacity: parseFloat(opacity),
                        }}
                      />
                    )
                  })}
                </div>
                
                {/* Number 28 with gradient */}
                <div className="relative z-10">
                  <div className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
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
            <div className="flex flex-col space-y-2 h-full">
              <h4 className="text-sm font-semibold text-white ml-1">{t.lifeTree}</h4>
              <Link href="/program" className="h-full flex">
                <Card className="p-0 bg-transparent border-white/10 backdrop-blur-sm hover:border-green-500/50 transition-all cursor-pointer h-full w-full overflow-hidden min-h-[180px] flex items-center justify-center">
                  <LifeTreeLandscape />
                </Card>
              </Link>
            </div>
          </div>

          {/* Speak to Tony Section */}
          <div className="space-y-4 mb-6 mt-16 md:mt-20">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">{t.speakToMelius}</h3>
            </div>
            <p className="text-sm text-white/70 mb-4">{t.meliusDescription}</p>
            
            <div className="relative">
              <Card className="p-6 bg-gradient-to-br from-blue-900 to-indigo-900 border-white/10 hover:border-blue-400/50 transition-all cursor-pointer group overflow-hidden min-h-[120px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-white/90 transition-colors shadow-md">
                    <Plus className="h-6 w-6 text-blue-900" />
                  </div>
                  <span className="text-white font-semibold text-lg">{t.newSession}</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Daily Motivation Quote Section */}
          <div className="space-y-4 mb-6 mt-12">
            <div className="flex items-center gap-2">
              <Flower2 className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">{t.dailyMotivationQuote}</h3>
            </div>
            
            <Card className="p-6 bg-gradient-to-br from-blue-950/80 to-indigo-950/80 border-white/10 backdrop-blur-sm relative overflow-hidden">
              {/* Tulip/Flower icon at top center */}
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Flower2 className="h-6 w-6 text-white/80" />
                </div>
              </div>
              
              {/* Quote text */}
              <p className="text-white text-center leading-relaxed text-base md:text-lg">
                {t.motivationQuote}
              </p>
            </Card>
          </div>

          {/* Features List Section */}
          <div className="space-y-3 mb-6 mt-12">
            {/* Enable Notifications */}
            <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-blue-400/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.enableNotifications}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{t.enableNotificationsDesc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/50 transition-colors">
                  <Circle className="h-4 w-4 text-transparent" />
                </div>
              </div>
            </Card>

            {/* Plant Life Tree */}
            <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-green-400/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                  <TreePine className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.plantLifeTree}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{t.plantLifeTreeDesc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/50 transition-colors">
                  <Circle className="h-4 w-4 text-transparent" />
                </div>
              </div>
            </Card>

            {/* Join Community */}
            <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-purple-400/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.joinCommunity}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{t.joinCommunityDesc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/50 transition-colors">
                  <Circle className="h-4 w-4 text-transparent" />
                </div>
              </div>
            </Card>

            {/* Enable Content Blocker */}
            <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-red-400/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                  <div className="relative">
                    <Globe className="h-6 w-6 text-white" />
                    <X className="h-4 w-4 text-red-400 absolute -top-1 -right-1" strokeWidth={3} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.enableContentBlocker}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{t.enableContentBlockerDesc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/50 transition-colors">
                  <Circle className="h-4 w-4 text-transparent" />
                </div>
              </div>
            </Card>

            {/* Help & Learn from Others */}
            <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-yellow-400/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                  <SquarePlus className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.helpAndLearn}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{t.helpAndLearnDesc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 group-hover:border-white/50 transition-colors">
                  <Circle className="h-4 w-4 text-transparent" />
                </div>
              </div>
            </Card>
          </div>

          {/* Status Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 mt-12">
            {/* On Track Card */}
            <Card className="p-4 md:p-5 bg-gradient-to-br from-blue-950/50 to-indigo-950/50 border-white/10 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center">
                  <Check className="h-5 w-5 md:h-6 md:w-6 text-black" strokeWidth={3} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-white/70">{t.onTrackToQuit}</p>
                  <p className="text-sm md:text-base lg:text-xl font-bold text-white">20 de Ago de 2025</p>
                </div>
              </div>
            </Card>

            {/* Tempted to Relapse Card */}
            <Card className="p-4 md:p-5 bg-gradient-to-br from-blue-950/50 to-indigo-950/50 border-white/10 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center relative">
                  <div className="text-2xl md:text-3xl lg:text-4xl">🤩</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-white/70">{t.temptedToRelapse}</p>
                  <p className="text-sm md:text-base lg:text-xl font-bold text-green-400">{t.falseText}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* I'm Quitting Because Section */}
          <Card className="p-5 mb-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <HelpCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white mb-2">{t.imQuittingBecause}</h4>
                <p className="text-white/70 text-sm mb-4 cursor-pointer hover:text-white transition-colors">
                  {t.addReasonPlaceholder}
                </p>
                <div className="flex items-center justify-end gap-1 text-xs text-white/60">
                  <Star className="h-3 w-3" />
                  <span>{t.best} 19m</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 28 Day Challenge Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">{t.dayChallenge}</span>
              <span className="text-white font-semibold">0%</span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-900 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: "0%" }}
              />
            </div>
          </div>

          {/* Main Menu Section */}
          <div className="space-y-4 mb-6 mt-12">
            <h3 className="text-lg font-semibold text-white">{t.main}</h3>
            
            <div className="space-y-2">
              {/* Save A Friend */}
              <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-cyan-400/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                      <div className="relative w-5 h-5">
                        <Users className="h-5 w-5 text-cyan-400 absolute" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-cyan-300 rounded-full" />
                      </div>
                    </div>
                    <span className="text-white font-medium">{t.saveAFriend}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </Card>

              {/* Talk to Tony */}
              <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-orange-400/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <div className="relative w-5 h-5">
                        {/* Robot head shape */}
                        <div className="w-5 h-5 rounded-sm border-2 border-orange-400 relative">
                          {/* Eyes */}
                          <div className="absolute top-1 left-1 w-1 h-1 bg-orange-400 rounded-full" />
                          <div className="absolute top-1 right-1 w-1 h-1 bg-orange-400 rounded-full" />
                          {/* Mouth lines */}
                          <div className="absolute bottom-1 left-1 right-1 h-0.5 border-t border-orange-400" />
                        </div>
                      </div>
                    </div>
                    <span className="text-white font-medium">{t.talkToTony}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </Card>

              {/* Reasons for Change */}
              <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-pink-400/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                      <div className="relative">
                        <Heart className="h-5 w-5 text-pink-400" />
                        <Hand className="h-3 w-3 text-pink-300 absolute -bottom-0.5 -right-0.5" />
                      </div>
                    </div>
                    <span className="text-white font-medium">{t.reasonsForChange}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </Card>

              {/* Chat */}
              <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-green-400/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <MessageCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-white font-medium">{t.chat}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </Card>

              {/* Learn */}
              <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-orange-400/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <BookOpen className="h-5 w-5 text-orange-400" />
                    </div>
                    <span className="text-white font-medium">{t.learn}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </Card>

              {/* Milestones */}
              <Card className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-purple-400/50 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <RotateCw className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="text-white font-medium">{t.milestones}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </Card>
            </div>
          </div>

          {/* Mindfulness Section */}
          <div className="space-y-4 mb-6 mt-12">
            <Card className="p-5 bg-gradient-to-br from-blue-950/80 to-indigo-950/80 border-white/10 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">{t.mindfulness}</h3>
              
              <div className="space-y-2">
                {/* Side Effects */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        {/* Coração esquerdo */}
                        <path d="M7 3C4.239 3 2 5.239 2 8c0 4.418 5.03 9.5 7 11.5 1.97-2 5-7.082 5-11.5 0-2.761-2.239-5-5-5-1.126 0-2.164.371-3 1.002C8.164 3.371 7.126 3 7 3z"/>
                        {/* Coração direito */}
                        <path d="M17 3c-2.761 0-5 2.239-5 5 0 4.418 5.03 9.5 7 11.5 1.97-2 5-7.082 5-11.5 0-2.761-2.239-5-5-5-1.126 0-2.164.371-3 1.002C18.164 3.371 17.126 3 17 3z"/>
                      </svg>
                    </div>
                    <span className="text-white font-medium">{t.sideEffects}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>

                {/* Motivation */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <ClipboardList className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-white font-medium">{t.motivation}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>

                {/* Breath Exercise */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <Wind className="h-5 w-5 text-orange-400" />
                    </div>
                    <span className="text-white font-medium">{t.breathExercise}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>

                {/* Success Stories */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                      <Award className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-white font-medium">{t.successStories}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </Card>

            {/* Quote Section */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4">
                <Quote className="h-12 w-12 text-cyan-400" />
              </div>
              <p className="text-white text-center text-lg md:text-xl font-medium leading-relaxed">
                {t.quoteText}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Panic Button - Fixed at bottom, above mobile nav */}
      <div className="fixed bottom-20 left-0 right-0 z-50 p-4 md:bottom-4 md:pl-0 md:pr-0">
        <div className={cn("max-w-7xl mx-auto", collapsed ? "md:ml-20 lg:ml-20 md:px-4" : "md:ml-56 lg:ml-64 md:px-4")}>
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
