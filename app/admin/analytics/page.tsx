"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  Target,
  Activity,
  ArrowLeft,
  Loader2,
  Download
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

interface AnalyticsData {
  userGrowth: { date: string; users: number }[]
  dailyActivity: { date: string; active: number; checkins: number }[]
  programProgress: { day: number; users: number }[]
  xpDistribution: { range: string; count: number }[]
  recoveryScores: { range: string; count: number }[]
  streakDistribution: { range: string; count: number }[]
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    dailyActivity: [],
    programProgress: [],
    xpDistribution: [],
    recoveryScores: [],
    streakDistribution: [],
  })
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d")

  useEffect(() => {
    checkAdminAccess()
    loadAnalytics()
  }, [dateRange])

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Acesso negado. Faça login como administrador.")
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single()

      if (!profile?.is_pro) {
        toast.error("Acesso negado. Você precisa ser um administrador.")
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      toast.error("Erro ao verificar acesso")
      router.push("/dashboard")
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Calcular data inicial baseado no range
      let startDate = new Date()
      if (dateRange === "7d") {
        startDate.setDate(startDate.getDate() - 7)
      } else if (dateRange === "30d") {
        startDate.setDate(startDate.getDate() - 30)
      } else if (dateRange === "90d") {
        startDate.setDate(startDate.getDate() - 90)
      } else {
        startDate = new Date(0) // All time
      }

      // Crescimento de usuários
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true })

      // Agrupar por data
      const userGrowthMap = new Map<string, number>()
      let cumulative = 0
      profilesData?.forEach((profile) => {
        const date = new Date(profile.created_at).toISOString().split("T")[0]
        cumulative++
        userGrowthMap.set(date, cumulative)
      })

      const userGrowth = Array.from(userGrowthMap.entries()).map(([date, users]) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
        users,
      }))

      // Atividade diária
      const { data: checkinsData } = await supabase
        .from("daily_checkins")
        .select("checkin_date, user_id")
        .gte("checkin_date", startDate.toISOString().split("T")[0])
        .order("checkin_date", { ascending: true })

      const activityMap = new Map<string, { active: Set<string>; checkins: number }>()
      checkinsData?.forEach((checkin) => {
        const date = checkin.checkin_date
        if (!activityMap.has(date)) {
          activityMap.set(date, { active: new Set(), checkins: 0 })
        }
        const dayData = activityMap.get(date)!
        dayData.active.add(checkin.user_id)
        dayData.checkins++
      })

      const dailyActivity = Array.from(activityMap.entries())
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
          active: data.active.size,
          checkins: data.checkins,
        }))
        .slice(-30) // Últimos 30 dias

      // Progresso no programa
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("current_day")

      const programProgressMap = new Map<number, number>()
      progressData?.forEach((progress) => {
        const day = progress.current_day || 0
        programProgressMap.set(day, (programProgressMap.get(day) || 0) + 1)
      })

      const programProgress = Array.from({ length: 90 }, (_, i) => i + 1).map((day) => ({
        day,
        users: programProgressMap.get(day) || 0,
      }))

      // Distribuição de XP
      const { data: xpData } = await supabase
        .from("user_progress")
        .select("total_xp")

      const xpRanges = [
        { range: "0-100", min: 0, max: 100 },
        { range: "101-500", min: 101, max: 500 },
        { range: "501-1000", min: 501, max: 1000 },
        { range: "1001-5000", min: 1001, max: 5000 },
        { range: "5000+", min: 5001, max: Infinity },
      ]

      const xpDistribution = xpRanges.map((range) => ({
        range: range.range,
        count: xpData?.filter((x) => x.total_xp >= range.min && x.total_xp <= range.max).length || 0,
      }))

      // Distribuição de scores de recuperação
      const { data: recoveryData } = await supabase
        .from("user_progress")
        .select("recovery_score")

      const scoreRanges = [
        { range: "0-20", min: 0, max: 20 },
        { range: "21-40", min: 21, max: 40 },
        { range: "41-60", min: 41, max: 60 },
        { range: "61-80", min: 61, max: 80 },
        { range: "81-100", min: 81, max: 100 },
      ]

      const recoveryScores = scoreRanges.map((range) => ({
        range: range.range,
        count: recoveryData?.filter((r) => r.recovery_score >= range.min && r.recovery_score <= range.max).length || 0,
      }))

      // Distribuição de streaks
      const { data: streakData } = await supabase
        .from("user_progress")
        .select("current_streak")

      const streakRanges = [
        { range: "0", min: 0, max: 0 },
        { range: "1-7", min: 1, max: 7 },
        { range: "8-30", min: 8, max: 30 },
        { range: "31-60", min: 31, max: 60 },
        { range: "60+", min: 61, max: Infinity },
      ]

      const streakDistribution = streakRanges.map((range) => ({
        range: range.range,
        count: streakData?.filter((s) => s.current_streak >= range.min && s.current_streak <= range.max).length || 0,
      }))

      setAnalytics({
        userGrowth,
        dailyActivity,
        programProgress,
        xpDistribution,
        recoveryScores,
        streakDistribution,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
      toast.error("Erro ao carregar analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Analytics Detalhadas</h1>
              <p className="text-muted-foreground mt-1">
                Métricas e estatísticas do aplicativo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todo o período</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crescimento de Usuários
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Daily Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Diária
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Usuários Ativos"
                />
                <Line
                  type="monotone"
                  dataKey="checkins"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Check-ins"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Program Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso no Programa (Dia Atual)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.programProgress.slice(0, 30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* XP Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Distribuição de XP
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.xpDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Recovery Scores */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribuição de Scores de Recuperação
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.recoveryScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Streak Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Distribuição de Streaks
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.streakDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  )
}

