"use client"

import { useState, useEffect } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { ProgressRing } from "@/components/progress-ring"
import { StatCard } from "@/components/stat-card"
import { LineChartSimple } from "@/components/line-chart-simple"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame, Trophy, Brain, Zap, Award, Check, TreePine, Calendar, Target, CheckSquare, AlertTriangle, Smile, TrendingUp, Heart, Sparkles, ArrowRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { TreeForest } from "@/components/tree-forest"
import { useTreeProgress } from "@/lib/use-tree-progress"
import { supabase } from "@/lib/supabase/client"

interface PlannerMetrics {
  totalDays: number
  daysWithGoal: number
  totalTasks: number
  completedTasks: number
  totalTriggers: number
  triggersByIntensity: {
    leve: number
    moderado: number
    forte: number
  }
  moodDistribution: Record<string, number>
  plannerUsageData: number[]
  topTriggers: Array<{ text: string; count: number; intensity: string }>
  daysWithReward: number
  daysWithReflection: number
  averageTasksPerDay: number
  averageCompletionRate: number
  recentReflections: Array<{ date: string; reflection: string }>
  recentRewards: Array<{ date: string; reward: string }>
}

export default function AnalyticsPage() {
  const { language } = useLanguage()
  const [period, setPeriod] = useState<"week" | "month" | "all">("week")
  const t = translations[language]
  const { collapsed } = useSidebar()
  const treeProgress = useTreeProgress()
  const [plannerMetrics, setPlannerMetrics] = useState<PlannerMetrics | null>(null)
  const [isLoadingPlanner, setIsLoadingPlanner] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Real data states
  const [recoveryScore, setRecoveryScore] = useState(0)
  const [mentalClarity, setMentalClarity] = useState(0)
  const [energyLevel, setEnergyLevel] = useState(0)
  const [moodData, setMoodData] = useState<number[]>([])
  const [productivityData, setProductivityData] = useState<number[]>([])
  const [moodLabels, setMoodLabels] = useState<string[]>([])
  const [productivityLabels, setProductivityLabels] = useState<string[]>([])
  const [moodUpdatesPerDay, setMoodUpdatesPerDay] = useState<number[]>([])
  const [productivityUpdatesPerDay, setProductivityUpdatesPerDay] = useState<number[]>([])
  const [moodHourDistribution, setMoodHourDistribution] = useState<Record<number, number>>({})
  const [productivityHourDistribution, setProductivityHourDistribution] = useState<Record<number, number>>({})

  const consecutiveDays = treeProgress.currentStreak || 0
  const personalRecord = treeProgress.longestStreak || 0

  const milestones = [
    { id: 1, title: t.firstWeek, days: 7, achieved: true },
    { id: 2, title: t.twoWeeks, days: 14, achieved: true },
    { id: 3, title: t.oneMonth, days: 30, achieved: false },
    { id: 4, title: t.threeMonths, days: 90, achieved: false },
  ]

  // Helper function to convert mood emoji to numeric value (1-5 scale)
  const moodEmojiToValue = (emoji: string | null): number => {
    if (!emoji) return 3 // Neutral
    const moodMap: Record<string, number> = {
      '😞': 1, // Sad
      '😐': 2, // Neutral
      '🙂': 3, // Slightly happy
      '😊': 4, // Happy
      '😄': 5, // Very happy
      '😢': 1,
      '😕': 2,
      '😌': 3,
      '😁': 5,
    }
    return moodMap[emoji] || 3
  }

  // Helper function to convert mood value (1-5) to percentage (0-100)
  const moodValueToPercentage = (value: number): number => {
    return ((value - 1) / 4) * 100
  }

  // Load analytics data (mood, productivity, recovery metrics)
  const loadAnalyticsData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date
      if (period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (period === "month") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(0) // All time
      }

      // Get planner entries for mood and productivity with timestamps
      const { data: plannerEntries, error } = await supabase
        .from("daily_planner")
        .select("planner_date, mood, tasks, created_at, updated_at")
        .eq("user_id", user.id)
        .gte("planner_date", startDate.toISOString().split("T")[0])
        .order("planner_date", { ascending: true })

      if (error) throw error

      if (!plannerEntries || plannerEntries.length === 0) {
        setMoodData([])
        setProductivityData([])
        setRecoveryScore(0)
        setMentalClarity(0)
        setEnergyLevel(0)
        return
      }

      // Calculate days to show (last 7 days for trends)
      const daysToShow = 7
      const today = new Date()
      const moodTrend: number[] = []
      const productivityTrend: number[] = []
      const moodLabelsArray: string[] = []
      const productivityLabelsArray: string[] = []
      const moodUpdatesCount: number[] = []
      const productivityUpdatesCount: number[] = []
      const moodHours: Record<number, number> = {}
      const productivityHours: Record<number, number> = {}

      // Count updates per day and hour distribution
      // Note: daily_planner has UNIQUE(user_id, planner_date), so one entry per day
      // But we can track the hour of last update
      const entriesByDate: Record<string, any> = {}
      plannerEntries.forEach((entry: any) => {
        entriesByDate[entry.planner_date] = entry
        
        // Extract hour from updated_at for hour distribution
        if (entry.updated_at) {
          const updateDate = new Date(entry.updated_at)
          const hour = updateDate.getHours()
          
          if (entry.mood) {
            moodHours[hour] = (moodHours[hour] || 0) + 1
          }
          if (entry.tasks && Array.isArray(entry.tasks) && entry.tasks.length > 0) {
            productivityHours[hour] = (productivityHours[hour] || 0) + 1
          }
        }
      })

      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]
        
        // Format label (day name + date)
        const dayName = date.toLocaleDateString(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", { weekday: "short" })
        const dayNumber = date.getDate()
        const month = date.toLocaleDateString(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", { month: "short" })
        const label = `${dayName} ${dayNumber}/${month}`
        
        const entry = entriesByDate[dateStr]
        
        // Each day has 1 entry (due to UNIQUE constraint), but we track if it was updated
        const hasUpdate = entry ? 1 : 0
        const updateHour = entry?.updated_at ? new Date(entry.updated_at).getHours() : null
        
        if (entry) {
          // Mood: convert emoji to percentage
          const moodValue = moodEmojiToValue(entry.mood)
          moodTrend.push(moodValueToPercentage(moodValue))
          moodLabelsArray.push(label)
          moodUpdatesCount.push(hasUpdate)
          
          // Productivity: calculate based on task completion rate
          if (entry.tasks && Array.isArray(entry.tasks)) {
            const totalTasks = entry.tasks.length
            const completedTasks = entry.tasks.filter((t: any) => t.completed).length
            const productivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            productivityTrend.push(productivity)
            productivityLabelsArray.push(label)
            productivityUpdatesCount.push(hasUpdate)
          } else {
            productivityTrend.push(0)
            productivityLabelsArray.push(label)
            productivityUpdatesCount.push(0)
          }
        } else {
          // No entry for this day
          moodTrend.push(0)
          moodLabelsArray.push(label)
          moodUpdatesCount.push(0)
          productivityTrend.push(0)
          productivityLabelsArray.push(label)
          productivityUpdatesCount.push(0)
        }
      }

      setMoodData(moodTrend)
      setProductivityData(productivityTrend)
      setMoodLabels(moodLabelsArray)
      setProductivityLabels(productivityLabelsArray)
      setMoodUpdatesPerDay(moodUpdatesCount)
      setProductivityUpdatesPerDay(productivityUpdatesCount)
      setMoodHourDistribution(moodHours)
      setProductivityHourDistribution(productivityHours)

      // Calculate recovery score, mental clarity, and energy level
      // Recovery score: based on consistency (days with planner entries), task completion, and mood
      const totalDays = plannerEntries.length
      const daysWithGoal = plannerEntries.filter((e) => e.daily_goal).length
      let totalTasks = 0
      let completedTasks = 0
      let totalMoodValue = 0
      let moodCount = 0

      plannerEntries.forEach((entry) => {
        if (entry.tasks && Array.isArray(entry.tasks)) {
          totalTasks += entry.tasks.length
          completedTasks += entry.tasks.filter((t: any) => t.completed).length
        }
        if (entry.mood) {
          totalMoodValue += moodEmojiToValue(entry.mood)
          moodCount++
        }
      })

      const goalConsistency = totalDays > 0 ? (daysWithGoal / totalDays) * 100 : 0
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      const avgMood = moodCount > 0 ? moodValueToPercentage(totalMoodValue / moodCount) : 50

      // Recovery score: weighted average
      const calculatedRecoveryScore = Math.round(
        goalConsistency * 0.3 + taskCompletionRate * 0.4 + avgMood * 0.3
      )
      setRecoveryScore(calculatedRecoveryScore)

      // Mental clarity: based on reflection completion and task organization
      const daysWithReflection = plannerEntries.filter((e) => e.reflection && e.reflection.trim().length > 0).length
      const reflectionRate = totalDays > 0 ? (daysWithReflection / totalDays) * 100 : 0
      const calculatedMentalClarity = Math.round(
        reflectionRate * 0.5 + taskCompletionRate * 0.5
      )
      setMentalClarity(calculatedMentalClarity)

      // Energy level: based on task completion and consistency
      const calculatedEnergyLevel = Math.round(
        taskCompletionRate * 0.6 + goalConsistency * 0.4
      )
      setEnergyLevel(calculatedEnergyLevel)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    }
  }

  // Load planner metrics
  useEffect(() => {
    loadPlannerMetrics()
    loadAnalyticsData()
    
    // Set up real-time subscription
    let channel: any = null
    
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('planner-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_planner',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Reload metrics when planner data changes
            loadPlannerMetrics()
            loadAnalyticsData()
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadPlannerMetrics = async () => {
    try {
      setIsLoadingPlanner(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date
      if (period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (period === "month") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(0) // All time
      }

      const { data: plannerEntries, error } = await supabase
        .from("daily_planner")
        .select("*")
        .eq("user_id", user.id)
        .gte("planner_date", startDate.toISOString().split("T")[0])
        .order("planner_date", { ascending: true })

      if (error) throw error

      if (!plannerEntries || plannerEntries.length === 0) {
        setPlannerMetrics(null)
        setIsLoadingPlanner(false)
        return
      }

      // Calculate metrics
      const totalDays = plannerEntries.length
      const daysWithGoal = plannerEntries.filter((e) => e.daily_goal).length

      let totalTasks = 0
      let completedTasks = 0
      let totalTriggers = 0
      const triggersByIntensity = { leve: 0, moderado: 0, forte: 0 }
      const moodDistribution: Record<string, number> = {}
      const triggerCounts: Record<string, { count: number; intensity: string }> = {}
      let daysWithReward = 0
      let daysWithReflection = 0
      const recentReflections: Array<{ date: string; reflection: string }> = []
      const recentRewards: Array<{ date: string; reward: string }> = []

      // Process each entry
      plannerEntries.forEach((entry) => {
        // Tasks
        if (entry.tasks && Array.isArray(entry.tasks)) {
          totalTasks += entry.tasks.length
          completedTasks += entry.tasks.filter((t: any) => t.completed).length
        }

        // Triggers
        if (entry.triggers && Array.isArray(entry.triggers)) {
          totalTriggers += entry.triggers.length
          entry.triggers.forEach((trigger: any) => {
            if (trigger.intensity) {
              triggersByIntensity[trigger.intensity as keyof typeof triggersByIntensity]++
            }
            // Count trigger frequency
            const key = trigger.text?.toLowerCase().trim() || ""
            if (key) {
              if (!triggerCounts[key]) {
                triggerCounts[key] = { count: 0, intensity: trigger.intensity || "leve" }
              }
              triggerCounts[key].count++
            }
          })
        }

        // Mood
        if (entry.mood) {
          moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1
        }

        // Rewards
        if (entry.reward && entry.reward.trim().length > 0) {
          daysWithReward++
          recentRewards.push({
            date: entry.planner_date,
            reward: entry.reward
          })
        }

        // Reflections
        if (entry.reflection && entry.reflection.trim().length > 0) {
          daysWithReflection++
          recentReflections.push({
            date: entry.planner_date,
            reflection: entry.reflection
          })
        }
      })

      // Sort and limit recent items
      recentReflections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      recentRewards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Get top triggers
      const topTriggers = Object.entries(triggerCounts)
        .map(([text, data]) => ({ text, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calculate planner usage over time (last 7/30 days)
      const daysToShow = period === "week" ? 7 : period === "month" ? 30 : Math.min(30, totalDays)
      const plannerUsageData: number[] = []
      const today = new Date()
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]
        const hasEntry = plannerEntries.some((e) => e.planner_date === dateStr)
        plannerUsageData.push(hasEntry ? 1 : 0)
      }

      const averageTasksPerDay = totalDays > 0 ? (totalTasks / totalDays) : 0
      const averageCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      setPlannerMetrics({
        totalDays,
        daysWithGoal,
        totalTasks,
        completedTasks,
        totalTriggers,
        triggersByIntensity,
        moodDistribution,
        plannerUsageData,
        topTriggers,
        daysWithReward,
        daysWithReflection,
        averageTasksPerDay: Math.round(averageTasksPerDay * 10) / 10,
        averageCompletionRate: Math.round(averageCompletionRate),
        recentReflections: recentReflections.slice(0, 5),
        recentRewards: recentRewards.slice(0, 5),
      })
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error loading planner metrics:", error)
    } finally {
      setIsLoadingPlanner(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          {/* Recovery Score */}
          <Card className="p-6 md:p-8 venser-card-glow">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8">
              <div className="flex justify-center md:justify-start w-full md:w-auto">
                <div className="w-full max-w-[280px] md:max-w-none">
                  <ProgressRing progress={recoveryScore} size={280} strokeWidth={16}>
                    <div className="text-center px-4">
                      <div className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] bg-clip-text text-transparent leading-none">
                        {recoveryScore}%
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mt-3 font-medium">{t.recoveryScore}</p>
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">{t.mentalClarity}</p>
                            <p className="text-lg font-semibold text-[oklch(0.7_0.15_220)]">{mentalClarity}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t.energyLevel}</p>
                            <p className="text-lg font-semibold text-[oklch(0.68_0.18_45)]">{energyLevel}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ProgressRing>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4 md:pl-4">
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{t.excellentProgress}</h2>
                  <p className="text-sm md:text-base text-muted-foreground">{t.focusIncrease}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/5 to-transparent border-[oklch(0.54_0.18_285)]/20">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                  <Smile className="h-5 w-5 text-[oklch(0.54_0.18_285)]" />
                  {t.moodTrend}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {language === "pt" ? "Evolução do seu humor nos últimos dias" : language === "es" ? "Evolución de tu humor en los últimos días" : "Your mood evolution over recent days"}
                </p>
              </div>
              <div className="h-48 md:h-56 mb-4">
                <LineChartSimple 
                  data={moodData} 
                  color="oklch(0.54 0.18 285)" 
                  label="" 
                  labels={moodLabels}
                  showLabels={true}
                />
              </div>
              
              {/* Additional Info: Days, updates and hour distribution */}
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-1 text-[10px]">
                      {language === "pt" ? "Dias com dados" : language === "es" ? "Días con datos" : "Days with data"}
                    </p>
                    <p className="text-base font-semibold text-[oklch(0.54_0.18_285)]">
                      {moodUpdatesPerDay.filter(v => v > 0).length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-1 text-[10px]">
                      {language === "pt" ? "Total de dias" : language === "es" ? "Total de días" : "Total days"}
                    </p>
                    <p className="text-base font-semibold text-[oklch(0.54_0.18_285)]">
                      {moodLabels.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-1 text-[10px]">
                      {language === "pt" ? "Taxa de uso" : language === "es" ? "Tasa de uso" : "Usage rate"}
                    </p>
                    <p className="text-base font-semibold text-[oklch(0.54_0.18_285)]">
                      {moodLabels.length > 0 
                        ? Math.round((moodUpdatesPerDay.filter(v => v > 0).length / moodLabels.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
                
                {/* Hour distribution */}
                {Object.keys(moodHourDistribution).length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {language === "pt" ? "Horário mais frequente de registro" : language === "es" ? "Horario más frecuente de registro" : "Most frequent registration time"}
                    </p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const maxHour = Object.entries(moodHourDistribution)
                          .sort(([, a], [, b]) => b - a)[0]?.[0]
                        if (!maxHour) return <span className="text-sm">-</span>
                        const hour = parseInt(maxHour)
                        const count = moodHourDistribution[hour]
                        return (
                          <>
                            <span className="text-lg font-bold text-[oklch(0.54_0.18_285)]">
                              {hour.toString().padStart(2, '0')}:00
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({count} {language === "pt" ? "registros" : language === "es" ? "registros" : "records"})
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t.avgMood}</p>
                    <p className="text-2xl md:text-3xl font-bold text-[oklch(0.54_0.18_285)]">
                      {(() => {
                        const validData = moodData.filter(v => v > 0)
                        return validData.length > 0 
                          ? Math.round(validData.reduce((a, b) => a + b, 0) / validData.length) 
                          : 0
                      })()}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "pt" ? "Tendência" : language === "es" ? "Tendencia" : "Trend"}
                    </p>
                    <div className="flex items-center gap-1 text-[oklch(0.54_0.18_285)]">
                      {(() => {
                        const validData = moodData.filter(v => v > 0)
                        if (validData.length < 2) return <span className="text-sm font-semibold">-</span>
                        const first = validData[0]
                        const last = validData[validData.length - 1]
                        const diff = last - first
                        return (
                          <>
                            {diff > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : diff < 0 ? (
                              <TrendingUp className="h-4 w-4 rotate-180" />
                            ) : null}
                            <span className="text-sm font-semibold">
                              {diff > 0 ? "+" : ""}{Math.round(diff)}%
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:p-8 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/5 to-transparent border-[oklch(0.7_0.15_220)]/20">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[oklch(0.7_0.15_220)]" />
                  {t.productivityTrend}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {language === "pt" ? "Sua produtividade ao longo do tempo" : language === "es" ? "Tu productividad a lo largo del tiempo" : "Your productivity over time"}
                </p>
              </div>
              <div className="h-48 md:h-56 mb-4">
                <LineChartSimple 
                  data={productivityData} 
                  color="oklch(0.7 0.15 220)" 
                  label="" 
                  labels={productivityLabels}
                  showLabels={true}
                />
              </div>
              
              {/* Additional Info: Days, updates and hour distribution */}
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-1 text-[10px]">
                      {language === "pt" ? "Dias com dados" : language === "es" ? "Días con datos" : "Days with data"}
                    </p>
                    <p className="text-base font-semibold text-[oklch(0.7_0.15_220)]">
                      {productivityUpdatesPerDay.filter(v => v > 0).length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-1 text-[10px]">
                      {language === "pt" ? "Total de dias" : language === "es" ? "Total de días" : "Total days"}
                    </p>
                    <p className="text-base font-semibold text-[oklch(0.7_0.15_220)]">
                      {productivityLabels.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-1 text-[10px]">
                      {language === "pt" ? "Taxa de uso" : language === "es" ? "Tasa de uso" : "Usage rate"}
                    </p>
                    <p className="text-base font-semibold text-[oklch(0.7_0.15_220)]">
                      {productivityLabels.length > 0 
                        ? Math.round((productivityUpdatesPerDay.filter(v => v > 0).length / productivityLabels.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
                
                {/* Hour distribution */}
                {Object.keys(productivityHourDistribution).length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {language === "pt" ? "Horário mais frequente de registro" : language === "es" ? "Horario más frecuente de registro" : "Most frequent registration time"}
                    </p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const maxHour = Object.entries(productivityHourDistribution)
                          .sort(([, a], [, b]) => b - a)[0]?.[0]
                        if (!maxHour) return <span className="text-sm">-</span>
                        const hour = parseInt(maxHour)
                        const count = productivityHourDistribution[hour]
                        return (
                          <>
                            <span className="text-lg font-bold text-[oklch(0.7_0.15_220)]">
                              {hour.toString().padStart(2, '0')}:00
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({count} {language === "pt" ? "registros" : language === "es" ? "registros" : "records"})
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t.completionRate}</p>
                    <p className="text-2xl md:text-3xl font-bold text-[oklch(0.7_0.15_220)]">
                      {(() => {
                        const validData = productivityData.filter(v => v > 0)
                        return validData.length > 0 
                          ? Math.round(validData.reduce((a, b) => a + b, 0) / validData.length) 
                          : 0
                      })()}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "pt" ? "Tendência" : language === "es" ? "Tendencia" : "Trend"}
                    </p>
                    <div className="flex items-center gap-1 text-[oklch(0.7_0.15_220)]">
                      {(() => {
                        const validData = productivityData.filter(v => v > 0)
                        if (validData.length < 2) return <span className="text-sm font-semibold">-</span>
                        const first = validData[0]
                        const last = validData[validData.length - 1]
                        const diff = last - first
                        return (
                          <>
                            {diff > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : diff < 0 ? (
                              <TrendingUp className="h-4 w-4 rotate-180" />
                            ) : null}
                            <span className="text-sm font-semibold">
                              {diff > 0 ? "+" : ""}{Math.round(diff)}%
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tree Forest Progress */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TreePine className="h-6 w-6 text-[oklch(0.68_0.18_45)]" />
              {t.lifeTree} - {t.forest}
            </h3>
            <div className="space-y-4">
              {treeProgress.isLoading ? (
                <div className="text-center text-muted-foreground py-8">{t.loading}</div>
              ) : (
                <>
                  <div className="h-64 rounded-lg overflow-hidden bg-gradient-to-br from-green-900/20 to-teal-900/20 border border-green-500/20">
                    <TreeForest 
                      totalDaysCompleted={treeProgress.totalDaysCompleted}
                      totalDaysFailed={treeProgress.totalDaysFailed}
                      daysPerTree={7}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-[oklch(0.68_0.18_45)]">{treeProgress.totalTrees}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.treesCompleted}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-[oklch(0.54_0.18_285)]">{treeProgress.currentTreeProgress}/7</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.currentTreeProgress}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-[oklch(0.7_0.15_220)]">{treeProgress.totalDaysCompleted}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.daysCompleted}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-red-400">{treeProgress.totalDaysFailed}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.daysWithFailure}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

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

          {/* Planner Metrics Section */}
          <Card className="p-4 md:p-6 lg:p-8 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/5 to-[oklch(0.7_0.15_220)]/5 border-[oklch(0.54_0.18_285)]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold">
                    {language === "pt" ? "Métricas do Planner" : language === "es" ? "Métricas del Planificador" : "Planner Metrics"}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    {language === "pt" 
                      ? "Análise completa do seu planejamento diário" 
                      : language === "es"
                        ? "Análisis completo de tu planificación diaria"
                        : "Complete analysis of your daily planning"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {lastUpdate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>
                      {language === "pt" 
                        ? `Atualizado ${lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        : language === "es"
                        ? `Actualizado ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                        : `Updated ${lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                )}
                <Link href="/planner">
                  <Button className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 transition-opacity">
                    {language === "pt" ? "Abrir Planner" : language === "es" ? "Abrir Planificador" : "Open Planner"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {isLoadingPlanner ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16">
                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-[oklch(0.54_0.18_285)] mb-4"></div>
                <p className="text-sm md:text-base text-muted-foreground">
                  {language === "pt" ? "Carregando métricas..." : language === "es" ? "Cargando métricas..." : "Loading metrics..."}
                </p>
              </div>
            ) : !plannerMetrics ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                </div>
                <p className="text-sm md:text-base text-muted-foreground max-w-md">
                  {language === "pt" 
                    ? "Nenhum dado do planner encontrado para este período. Comece a usar o planner para ver suas métricas aqui!" 
                    : language === "es"
                      ? "No se encontraron datos del planificador para este período. ¡Comienza a usar el planificador para ver tus métricas aquí!"
                      : "No planner data found for this period. Start using the planner to see your metrics here!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {/* Planner Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <Card className="p-4 md:p-5 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.54_0.18_285)]/5 border-[oklch(0.54_0.18_285)]/30 hover:border-[oklch(0.54_0.18_285)]/50 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">
                          {language === "pt" ? "Dias com Planner" : language === "es" ? "Días con Planificador" : "Days with Planner"}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-[oklch(0.54_0.18_285)]">
                          {plannerMetrics.totalDays}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "registros no período" : language === "es" ? "registros en el período" : "records in period"}
                        </p>
                      </div>
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.54_0.18_285)]/70 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-5 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/10 to-[oklch(0.7_0.15_220)]/5 border-[oklch(0.7_0.15_220)]/30 hover:border-[oklch(0.7_0.15_220)]/50 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">
                          {language === "pt" ? "Objetivos Definidos" : language === "es" ? "Objetivos Definidos" : "Goals Set"}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-[oklch(0.7_0.15_220)]">
                          {plannerMetrics.daysWithGoal}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[oklch(0.7_0.15_220)] to-[oklch(0.54_0.18_285)] transition-all"
                              style={{ width: `${Math.round((plannerMetrics.daysWithGoal / plannerMetrics.totalDays) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[oklch(0.7_0.15_220)]">
                            {Math.round((plannerMetrics.daysWithGoal / plannerMetrics.totalDays) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.7_0.15_220)]/70 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Target className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-5 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/10 to-[oklch(0.68_0.18_45)]/5 border-[oklch(0.68_0.18_45)]/30 hover:border-[oklch(0.68_0.18_45)]/50 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">
                          {language === "pt" ? "Tarefas Completadas" : language === "es" ? "Tareas Completadas" : "Tasks Completed"}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-[oklch(0.68_0.18_45)]">
                          {plannerMetrics.completedTasks}
                          <span className="text-lg md:text-xl text-muted-foreground font-normal">/{plannerMetrics.totalTasks}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] transition-all"
                              style={{ 
                                width: plannerMetrics.totalTasks > 0 
                                  ? `${Math.round((plannerMetrics.completedTasks / plannerMetrics.totalTasks) * 100)}%` 
                                  : "0%" 
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[oklch(0.68_0.18_45)]">
                            {plannerMetrics.totalTasks > 0
                              ? `${Math.round((plannerMetrics.completedTasks / plannerMetrics.totalTasks) * 100)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.68_0.18_45)]/70 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CheckSquare className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-5 bg-gradient-to-br from-[oklch(0.7_0.18_30)]/10 to-[oklch(0.7_0.18_30)]/5 border-[oklch(0.7_0.18_30)]/30 hover:border-[oklch(0.7_0.18_30)]/50 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">
                          {language === "pt" ? "Gatilhos Identificados" : language === "es" ? "Gatillos Identificados" : "Triggers Identified"}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-[oklch(0.7_0.18_30)]">
                          {plannerMetrics.totalTriggers}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "total registrado" : language === "es" ? "total registrado" : "total recorded"}
                        </p>
                      </div>
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.18_30)] to-[oklch(0.7_0.18_30)]/70 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Planner Usage Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/5 to-transparent border-[oklch(0.54_0.18_285)]/20">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.54_0.18_285)]/70 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm md:text-base font-semibold">
                            {language === "pt" ? "Uso do Planner" : language === "es" ? "Uso del Planificador" : "Planner Usage"}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {language === "pt" ? "Frequência de uso ao longo do tempo" : language === "es" ? "Frecuencia de uso a lo largo del tiempo" : "Usage frequency over time"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <LineChartSimple
                        data={plannerMetrics.plannerUsageData.map((v) => v * 100)}
                        color="oklch(0.54 0.18 285)"
                        label=""
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === "pt" ? "Taxa de uso" : language === "es" ? "Tasa de uso" : "Usage rate"}
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-[oklch(0.54_0.18_285)]">
                          {Math.round((plannerMetrics.plannerUsageData.filter((v) => v === 1).length / plannerMetrics.plannerUsageData.length) * 100)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === "pt" ? "Dias ativos" : language === "es" ? "Días activos" : "Active days"}
                        </p>
                        <p className="text-lg md:text-xl font-semibold">
                          {plannerMetrics.plannerUsageData.filter((v) => v === 1).length}/{plannerMetrics.plannerUsageData.length}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Mood Distribution */}
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/5 to-transparent border-[oklch(0.7_0.15_220)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.7_0.15_220)]/70 flex items-center justify-center">
                        <Smile className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Distribuição de Humor" : language === "es" ? "Distribución de Humor" : "Mood Distribution"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "Como você se sentiu nos últimos dias" : language === "es" ? "Cómo te sentiste en los últimos días" : "How you felt in recent days"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      {Object.entries(plannerMetrics.moodDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .map(([mood, count]) => {
                          const percentage = (count / plannerMetrics.totalDays) * 100
                          return (
                            <div key={mood} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <span className="text-xl md:text-2xl">{mood}</span>
                                  <span className="text-xs md:text-sm text-muted-foreground">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                                <span className="text-sm md:text-base font-medium text-muted-foreground">
                                  {count} {language === "pt" ? "dias" : language === "es" ? "días" : "days"}
                                </span>
                              </div>
                              <div className="h-2.5 md:h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] transition-all duration-500 ease-out"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      {Object.keys(plannerMetrics.moodDistribution).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 md:py-12">
                          <Smile className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mb-3" />
                          <p className="text-sm md:text-base text-muted-foreground text-center">
                            {language === "pt" ? "Nenhum humor registrado ainda" : language === "es" ? "No se registró humor aún" : "No mood recorded yet"}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Triggers Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Triggers by Intensity */}
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.7_0.18_30)]/5 to-transparent border-[oklch(0.7_0.18_30)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.7_0.18_30)] to-[oklch(0.7_0.18_30)]/70 flex items-center justify-center">
                        <Zap className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Gatilhos por Intensidade" : language === "es" ? "Gatillos por Intensidad" : "Triggers by Intensity"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "Distribuição dos níveis de intensidade" : language === "es" ? "Distribución de los niveles de intensidad" : "Distribution of intensity levels"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      {[
                        { key: "leve", label: t.intensityLight, color: "bg-green-500/20 text-green-400 border-green-500/30", barColor: "bg-green-500" },
                        { key: "moderado", label: t.intensityModerate, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", barColor: "bg-yellow-500" },
                        { key: "forte", label: t.intensityStrong, color: "bg-red-500/20 text-red-400 border-red-500/30", barColor: "bg-red-500" },
                      ].map(({ key, label, color, barColor }) => {
                        const count = plannerMetrics.triggersByIntensity[key as keyof typeof plannerMetrics.triggersByIntensity]
                        const percentage = plannerMetrics.totalTriggers > 0 ? (count / plannerMetrics.totalTriggers) * 100 : 0
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={cn("px-2.5 py-1.5 rounded-md text-xs md:text-sm font-medium border", color)}>
                                {label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm md:text-base font-semibold text-foreground">{count}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                            <div className="h-2.5 md:h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full transition-all duration-500 ease-out", barColor)}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Top Triggers */}
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/5 to-transparent border-[oklch(0.68_0.18_45)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.68_0.18_45)]/70 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Gatilhos Mais Frequentes" : language === "es" ? "Gatillos Más Frecuentes" : "Most Frequent Triggers"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "Os gatilhos que mais aparecem" : language === "es" ? "Los gatillos que más aparecen" : "The triggers that appear most often"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {plannerMetrics.topTriggers.length > 0 ? (
                        plannerMetrics.topTriggers.map((trigger, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-white/10"
                          >
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <div className="h-6 w-6 md:h-8 md:w-8 rounded-md bg-gradient-to-br from-[oklch(0.68_0.18_45)]/20 to-[oklch(0.68_0.18_45)]/10 flex items-center justify-center shrink-0">
                                <span className="text-xs md:text-sm font-bold text-[oklch(0.68_0.18_45)]">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="text-sm md:text-base flex-1 truncate font-medium">{trigger.text}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn(
                                "text-xs md:text-sm px-2 md:px-2.5 py-1 md:py-1.5 rounded-md font-medium border",
                                trigger.intensity === "leve" && "bg-green-500/20 text-green-400 border-green-500/30",
                                trigger.intensity === "moderado" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                                trigger.intensity === "forte" && "bg-red-500/20 text-red-400 border-red-500/30"
                              )}>
                                {trigger.intensity === "leve" ? t.intensityLight : trigger.intensity === "moderado" ? t.intensityModerate : t.intensityStrong}
                              </span>
                              <span className="text-xs md:text-sm font-semibold text-muted-foreground bg-background/50 px-2 py-1 rounded-md">
                                {trigger.count}x
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 md:py-12">
                          <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mb-3" />
                          <p className="text-sm md:text-base text-muted-foreground text-center">
                            {language === "pt" ? "Nenhum gatilho registrado ainda" : language === "es" ? "No se registró gatillo aún" : "No triggers recorded yet"}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Additional Metrics - Rewards and Reflections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
                  {/* Rewards Section */}
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/5 to-transparent border-[oklch(0.68_0.18_45)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.68_0.18_45)]/70 flex items-center justify-center">
                        <Trophy className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Recompensas" : language === "es" ? "Recompensas" : "Rewards"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "Dias com recompensas definidas" : language === "es" ? "Días con recompensas definidas" : "Days with rewards set"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-2xl md:text-3xl font-bold text-[oklch(0.68_0.18_45)]">
                            {plannerMetrics.daysWithReward}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "pt" ? "de" : language === "es" ? "de" : "of"} {plannerMetrics.totalDays} {language === "pt" ? "dias" : language === "es" ? "días" : "days"}
                          </p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[oklch(0.68_0.18_45)]/20 to-[oklch(0.68_0.18_45)]/10 flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-[oklch(0.68_0.18_45)]" />
                        </div>
                      </div>
                      {plannerMetrics.recentRewards.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {language === "pt" ? "Recompensas Recentes" : language === "es" ? "Recompensas Recientes" : "Recent Rewards"}
                          </p>
                          {plannerMetrics.recentRewards.map((reward, index) => (
                            <div key={index} className="p-3 rounded-lg bg-muted/20 border border-white/5">
                              <p className="text-xs text-muted-foreground mb-1">
                                {new Date(reward.date).toLocaleDateString(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" })}
                              </p>
                              <p className="text-sm font-medium">{reward.reward}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Reflections Section */}
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/5 to-transparent border-[oklch(0.54_0.18_285)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.54_0.18_285)]/70 flex items-center justify-center">
                        <Heart className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Reflexões" : language === "es" ? "Reflexiones" : "Reflections"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {language === "pt" ? "Dias com reflexões registradas" : language === "es" ? "Días con reflexiones registradas" : "Days with reflections recorded"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-2xl md:text-3xl font-bold text-[oklch(0.54_0.18_285)]">
                            {plannerMetrics.daysWithReflection}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "pt" ? "de" : language === "es" ? "de" : "of"} {plannerMetrics.totalDays} {language === "pt" ? "dias" : language === "es" ? "días" : "days"}
                          </p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.54_0.18_285)]/10 flex items-center justify-center">
                          <Heart className="h-8 w-8 text-[oklch(0.54_0.18_285)]" />
                        </div>
                      </div>
                      {plannerMetrics.recentReflections.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {language === "pt" ? "Reflexões Recentes" : language === "es" ? "Reflexiones Recientes" : "Recent Reflections"}
                          </p>
                          {plannerMetrics.recentReflections.map((reflection, index) => (
                            <div key={index} className="p-3 rounded-lg bg-muted/20 border border-white/5">
                              <p className="text-xs text-muted-foreground mb-1">
                                {new Date(reflection.date).toLocaleDateString(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" })}
                              </p>
                              <p className="text-sm line-clamp-2">{reflection.reflection}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6">
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/5 to-transparent border-[oklch(0.7_0.15_220)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.7_0.15_220)]/70 flex items-center justify-center">
                        <CheckSquare className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Média de Tarefas por Dia" : language === "es" ? "Promedio de Tareas por Día" : "Average Tasks per Day"}
                        </h4>
                      </div>
                    </div>
                    <div className="text-center py-6">
                      <p className="text-4xl md:text-5xl font-bold text-[oklch(0.7_0.15_220)]">
                        {plannerMetrics.averageTasksPerDay}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === "pt" ? "tarefas por dia" : language === "es" ? "tareas por día" : "tasks per day"}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/5 to-transparent border-[oklch(0.68_0.18_45)]/20">
                    <div className="flex items-center gap-2 md:gap-3 mb-4">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.68_0.18_45)]/70 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm md:text-base font-semibold">
                          {language === "pt" ? "Taxa de Conclusão" : language === "es" ? "Tasa de Finalización" : "Completion Rate"}
                        </h4>
                      </div>
                    </div>
                    <div className="text-center py-6">
                      <p className="text-4xl md:text-5xl font-bold text-[oklch(0.68_0.18_45)]">
                        {plannerMetrics.averageCompletionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === "pt" ? "de tarefas completadas" : language === "es" ? "de tareas completadas" : "of tasks completed"}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
