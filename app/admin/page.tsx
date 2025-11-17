"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award, 
  Activity, 
  Calendar,
  BarChart3,
  UserCheck,
  UserX,
  Sparkles,
  Loader2,
  ArrowRight,
  Settings,
  BookOpen,
  Shield,
  Bot,
  Eye,
  Diamond
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  totalXP: number
  averageRecoveryScore: number
  completedPrograms: number
  activeStreaks: number
}

interface UserActivity {
  date: string
  active: number
  new: number
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    totalXP: 0,
    averageRecoveryScore: 0,
    completedPrograms: 0,
    activeStreaks: 0,
  })
  const [activityData, setActivityData] = useState<UserActivity[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])

  useEffect(() => {
    checkAdminAccess()
    loadDashboardData()
  }, [])

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

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Total de usuários
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

      // Usuários ativos (com atividade nos últimos 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: activeUsers } = await supabase
        .from("daily_checkins")
        .select("user_id", { count: "exact", head: true })
        .gte("checkin_date", sevenDaysAgo.toISOString().split("T")[0])

      // Novos usuários hoje
      const today = new Date().toISOString().split("T")[0]
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today)

      // Novos usuários esta semana
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: newUsersThisWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString())

      // Total de XP
      const { data: xpData } = await supabase
        .from("user_progress")
        .select("total_xp")
      
      const totalXP = xpData?.reduce((sum, item) => sum + (item.total_xp || 0), 0) || 0

      // Score médio de recuperação
      const { data: recoveryData } = await supabase
        .from("user_progress")
        .select("recovery_score")
      
      const avgRecovery = recoveryData && recoveryData.length > 0
        ? recoveryData.reduce((sum, item) => sum + (item.recovery_score || 0), 0) / recoveryData.length
        : 0

      // Programas completos (usuários no dia 90)
      const { count: completedPrograms } = await supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("current_day", 90)

      // Streaks ativos (maior que 0)
      const { count: activeStreaks } = await supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .gt("current_streak", 0)

      // Dados de atividade dos últimos 7 dias
      const activityPromises = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]
        
        activityPromises.push(
          Promise.all([
            supabase
              .from("daily_checkins")
              .select("user_id", { count: "exact", head: true })
              .eq("checkin_date", dateStr),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .gte("created_at", dateStr)
              .lt("created_at", new Date(date.getTime() + 86400000).toISOString().split("T")[0])
          ])
        )
      }

      const activityResults = await Promise.all(activityPromises)
      const activity = activityResults.map(([activeResult, newResult], index) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - index))
        return {
          date: date.toLocaleDateString("pt-BR", { weekday: "short" }),
          active: activeResult.count || 0,
          new: newResult.count || 0,
        }
      })

      // Top 5 usuários por XP
      const { data: topUsersData } = await supabase
        .from("user_progress")
        .select(`
          total_xp,
          current_streak,
          current_day,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order("total_xp", { ascending: false })
        .limit(5)

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        totalXP,
        averageRecoveryScore: Math.round(avgRecovery),
        completedPrograms: completedPrograms || 0,
        activeStreaks: activeStreaks || 0,
      })

      setActivityData(activity)
      setTopUsers(topUsersData || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast.error("Erro ao carregar dados do dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/admin/users",
    },
    {
      title: "Usuários Ativos",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/admin/users",
    },
    {
      title: "Novos Hoje",
      value: stats.newUsersToday,
      icon: UserCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/admin/users",
    },
    {
      title: "XP Total",
      value: stats.totalXP.toLocaleString("pt-BR"),
      icon: Sparkles,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      link: "/admin/analytics",
    },
    {
      title: "Score Médio",
      value: `${stats.averageRecoveryScore}%`,
      icon: TrendingUp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      link: "/admin/analytics",
    },
    {
      title: "Programas Completos",
      value: stats.completedPrograms,
      icon: Award,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      link: "/admin/analytics",
    },
  ]

  const pieData = [
    { name: "Usuários Ativos", value: stats.activeUsers },
    { name: "Inativos", value: stats.totalUsers - stats.activeUsers },
  ]

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do sistema e métricas de usuários
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
            </Link>
            <Link href="/admin/features">
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Funcionalidades
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/admin/illusion">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Ilusões
              </Button>
            </Link>
            <Link href="/admin/dopamine">
              <Button variant="outline">
                <Diamond className="h-4 w-4 mr-2" />
                Dopamine
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Panels Navigation - Destaque Principal */}
        <Card className="p-6 border-2">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Painéis Administrativos</h3>
            <p className="text-muted-foreground">
              Acesse rapidamente todos os painéis de gerenciamento do sistema
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Gerenciar Usuários */}
            <Link href="/admin/users">
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Gerenciar Usuários</h4>
                    <p className="text-sm text-muted-foreground">
                      Controle de acessos, permissões e perfis de usuários
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>

            {/* Controlar Funcionalidades */}
            <Link href="/admin/features">
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-500 group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Funcionalidades</h4>
                    <p className="text-sm text-muted-foreground">
                      Habilite ou desabilite funcionalidades do aplicativo
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>

            {/* Analytics */}
            <Link href="/admin/analytics">
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-green-500 group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Métricas detalhadas e estatísticas do sistema
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>

            {/* Gerenciar Programa */}
            <Link href="/admin/program">
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-orange-500 group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Programa de 90 Dias</h4>
                    <p className="text-sm text-muted-foreground">
                      Gerencie templates, conteúdos e tarefas do programa
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>

            {/* Agente IA Tony */}
            <Link href="/admin/ai-agent">
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-cyan-500 group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bot className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Agente IA - Tony</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure comportamento, personalidade e base de conhecimento
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>

            {/* Dopamine Visualiser */}
            <Link href="/admin/dopamine">
              <Card className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-orange-500 group h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Diamond className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Dopamine Visualiser</h4>
                    <p className="text-sm text-muted-foreground">
                      Gerencie atividades saudáveis que geram dopamina natural
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Link key={index} href={stat.link}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Atividade dos Últimos 7 Dias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Usuários Ativos"
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="Novos Usuários"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Users Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Usuários</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top 5 Usuários por XP</h3>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {(user.profiles as any)?.full_name || (user.profiles as any)?.email || "Usuário"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dia {user.current_day} • Streak: {user.current_streak} dias
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{user.total_xp.toLocaleString("pt-BR")} XP</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}

