"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Hand, Brain, RotateCcw, MoreHorizontal, Sparkles, AlertCircle, Check, X, Minus, Cloud, Plus, Flower2, Bell, TreePine, MessageCircle, Globe, SquarePlus, Circle, HelpCircle, Star, ChevronRight, Heart, BookOpen, Smile, Users, Target, RotateCw, ClipboardList, Wind, Award, Quote, Flame, Play, Pause, Copy, Share2, Bot } from "lucide-react"
import { PeacefulAnimation } from "@/components/peaceful-animation"
import { TreeForest } from "@/components/tree-forest"
import { useTreeProgress } from "@/lib/use-tree-progress"
import { useNotifications } from "@/lib/use-notifications"
import { useContentBlocker } from "@/lib/use-content-blocker"
import Link from "next/link"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const treeProgress = useTreeProgress()
  const notifications = useNotifications()
  const contentBlocker = useContentBlocker()
  
  const [userProgress, setUserProgress] = useState({
    currentDay: 0,
    currentStreak: 0,
    totalXp: 0,
    totalDaysClean: 0,
    programDuration: 90, // Duração padrão, será carregada do banco
  })
  const [isLoading, setIsLoading] = useState(true)
  const [quittingReason, setQuittingReason] = useState(() => {
    // Carrega do localStorage no início se disponível
    if (typeof window !== 'undefined') {
      return localStorage.getItem('venser.quitting_reason') || ""
    }
    return ""
  })
  const [isEditingReason, setIsEditingReason] = useState(false)
  const [isSavingReason, setIsSavingReason] = useState(false)
  const [reasonSaved, setReasonSaved] = useState(false)
  const [savedInDatabase, setSavedInDatabase] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [isReasonsDialogOpen, setIsReasonsDialogOpen] = useState(false)
  const [isMilestonesDialogOpen, setIsMilestonesDialogOpen] = useState(false)
  const [isSideEffectsDialogOpen, setIsSideEffectsDialogOpen] = useState(false)
  const [isMotivationDialogOpen, setIsMotivationDialogOpen] = useState(false)
  const [isSuccessStoriesDialogOpen, setIsSuccessStoriesDialogOpen] = useState(false)
  const [isPledgeDialogOpen, setIsPledgeDialogOpen] = useState(false)
  
  // Estado do timer - controla se está rodando e a data de início
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    // Verifica se há uma data salva no localStorage
    const savedStartDate = typeof window !== 'undefined' ? localStorage.getItem('timerStartDate') : null
    return savedStartDate !== null
  })
  
  const [startDate, setStartDate] = useState<Date | null>(() => {
    // Carrega a data salva do localStorage ou retorna null
    if (typeof window !== 'undefined') {
      const savedStartDate = localStorage.getItem('timerStartDate')
      if (savedStartDate) {
        return new Date(savedStartDate)
      }
    }
    return null
  })
  
  // Data de início para exibição (usa uma data padrão se não houver timer ativo)
  const displayStartDate = startDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  
  // Calcula o dia atual do desafio de 28 dias
  const calculateChallengeDay = () => {
    const startDateToUse = startDate || displayStartDate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(startDateToUse)
    start.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    // Retorna o dia atual (1-28), nunca menor que 1
    return Math.max(1, Math.min(daysSinceStart + 1, 28))
  }
  
  const challengeDay = calculateChallengeDay()
  
  // Estado para a data final do desafio
  const [challengeEndDate, setChallengeEndDate] = useState<string | null>(null)
  
  // Função para formatar data em português
  const formatDatePortuguese = (date: Date): string => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} de ${month} de ${year}`
  }
  
  // Busca a data de início do usuário e calcula a data final do desafio
  useEffect(() => {
    const fetchChallengeEndDate = async () => {
      try {
        // Primeiro tenta buscar do localStorage (timerStartDate)
        let userStartDate: Date | null = null
        
        if (startDate) {
          userStartDate = startDate
        } else {
          // Se não houver no localStorage, busca do banco de dados
          try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError) {
              throw authError
            }
            if (user) {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('start_date')
                .eq('id', user.id)
                .single()
              
              if (profileError && profileError.code !== 'PGRST116') {
                throw profileError
              }
              
              if (profile?.start_date) {
                userStartDate = new Date(profile.start_date)
              }
            }
          } catch (dbError: any) {
            // Se falhar ao buscar do banco, usa localStorage ou data padrão
            if (dbError?.message?.includes('Failed to fetch')) {
              console.warn("Network error fetching challenge date (using cached data)")
            } else {
              console.warn("Error fetching challenge date:", dbError?.message)
            }
          }
        }
        
        // Se não encontrou data específica, usa a data de exibição padrão
        const dateToUse = userStartDate || displayStartDate
        
        // Calcula a data final (28 dias depois)
        const endDate = new Date(dateToUse)
        endDate.setDate(endDate.getDate() + 28) // Desafio de 28 dias
        setChallengeEndDate(formatDatePortuguese(endDate))
      } catch (error: any) {
        console.warn('Erro ao buscar data final do desafio:', error?.message || error)
        // Em caso de erro, calcula baseado na data de exibição padrão
        const endDate = new Date(displayStartDate)
        endDate.setDate(endDate.getDate() + 28)
        setChallengeEndDate(formatDatePortuguese(endDate))
      }
    }
    
    fetchChallengeEndDate()
  }, [startDate, displayStartDate])
  
  // Calcular progresso do cérebro baseado no dia atual e duração do programa
  const programDuration = userProgress.programDuration || 90
  const brainProgress = Math.min((userProgress.currentDay / programDuration) * 100, 100)
  
  // Analytics data
  const analyticsData = [60, 65, 70, 68, 75, 80, 82, 78, 85, 88, 85, 90]

  // Carregar dados do usuário
  useEffect(() => {
    loadUserData()
    
    // Atualizar a cada 30 segundos para refletir mudanças
    const interval = setInterval(loadUserData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadUserData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.warn("Auth error (non-critical):", authError.message)
        setIsLoading(false)
        return
      }

      if (!user) {
        setIsLoading(false)
        return
      }

      // Buscar progresso do usuário
      const { data: progress, error: progressError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (progressError && progressError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is OK
        console.warn("Error loading progress:", progressError.message)
      }

      if (progress) {
        setUserProgress({
          currentDay: progress.current_day || 0,
          currentStreak: progress.current_streak || 0,
          totalXp: progress.total_xp || 0,
          totalDaysClean: progress.total_days_clean || 0,
          programDuration: progress.program_duration || 90, // Carregar duração do programa
        })
      } else {
        // Se não houver progresso, manter duração padrão
        setUserProgress((prev) => ({
          ...prev,
          programDuration: 90,
        }))
      }

      // Buscar data de início e motivo (primeiro dia completado ou data de criação do perfil)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("start_date, created_at, quitting_reason")
        .eq("id", user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Error loading profile:", profileError.message)
      }
      
      // Carrega o motivo do banco ou do localStorage como fallback
      if (profile?.quitting_reason) {
        setQuittingReason(profile.quitting_reason)
        // Sincroniza com localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('venser.quitting_reason', profile.quitting_reason)
        }
      } else if (typeof window !== 'undefined') {
        // Fallback: tenta carregar do localStorage
        const savedReason = localStorage.getItem('venser.quitting_reason')
        if (savedReason) {
          setQuittingReason(savedReason)
        }
      }

      if (profile?.start_date) {
        setStartDate(new Date(profile.start_date))
        setIsTimerRunning(true)
        if (typeof window !== 'undefined') {
          localStorage.setItem('timerStartDate', new Date(profile.start_date).toISOString())
        }
      } else if (profile?.created_at) {
        setStartDate(new Date(profile.created_at))
        setIsTimerRunning(true)
        if (typeof window !== 'undefined') {
          localStorage.setItem('timerStartDate', new Date(profile.created_at).toISOString())
        }
      } else if (!startDate) {
        // Fallback: usar data atual menos dias limpos
        const daysAgo = progress?.total_days_clean || 0
        const fallbackDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        setStartDate(fallbackDate)
      }
    } catch (error: any) {
      // Tratamento mais robusto para erros de rede
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        console.warn("Network error loading user data (using cached/local data):", error.message)
        // Tenta carregar do localStorage como fallback
        if (typeof window !== 'undefined') {
          const savedReason = localStorage.getItem('venser.quitting_reason')
          if (savedReason) {
            setQuittingReason(savedReason)
          }
        }
      } else {
        console.error("Error loading user data:", error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Weekly check-in data (Sun-first ordering)
  const weekOrder = [0, 1, 2, 3, 4, 5, 6] // Sunday to Saturday (Domingo to Sábado)
  const weekLabels = t.weekDays // Use translated day labels
  const todayDow = new Date().getDay()
  const todayPos = weekOrder.indexOf(todayDow)
  
  // Buscar status semanal real do banco
  const [weeklyStatus, setWeeklyStatus] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])

  useEffect(() => {
    loadWeeklyStatus()
  }, [userProgress, startDate])

  const loadWeeklyStatus = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.warn("Auth error loading weekly status:", authError.message)
        return
      }

      if (!user) return

      // Buscar dias completados na última semana
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: completedDays, error: daysError } = await supabase
        .from("program_days")
        .select("completed_at, completed")
        .eq("user_id", user.id)
        .gte("completed_at", weekAgo.toISOString())
        .eq("completed", true)

      if (daysError) {
        console.warn("Error loading weekly status:", daysError.message)
        return
      }

      const status = weekOrder.map((dayOfWeek, idx) => {
        const today = new Date()
        const sunday = new Date(today)
        sunday.setDate(today.getDate() - today.getDay())
        sunday.setHours(0, 0, 0, 0)
        
        const dayDate = new Date(sunday)
        dayDate.setDate(sunday.getDate() + idx)
        dayDate.setHours(0, 0, 0, 0)

        if (dayDate > today) {
          return 0 // Future day
        }

        const wasCompleted = completedDays?.some((day) => {
          const completedDate = new Date(day.completed_at)
          completedDate.setHours(0, 0, 0, 0)
          return completedDate.getTime() === dayDate.getTime()
        })

        return wasCompleted ? 1 : (dayDate < today ? 2 : 0)
      })

      setWeeklyStatus(status)
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        console.warn("Network error loading weekly status (non-critical):", error.message)
      } else {
        console.error("Error loading weekly status:", error)
      }
    }
  }

  const handlePanicButton = () => {
    // TODO: Implementar chamada de vídeo
    console.log("Botão de Pânico clicado")
  }

  const saveQuittingReason = async () => {
    const reasonToSave = quittingReason.trim()
    
    // Salva no localStorage primeiro (sempre funciona)
    if (typeof window !== 'undefined') {
      try {
        if (reasonToSave) {
          localStorage.setItem('venser.quitting_reason', reasonToSave)
        } else {
          localStorage.removeItem('venser.quitting_reason')
        }
      } catch (e) {
        console.error("Error saving to localStorage:", e)
      }
    }
    
    if (!reasonToSave) {
      setReasonSaved(false)
      return
    }
    
    setIsSavingReason(true)
    setReasonSaved(false)
    
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.warn("Não foi possível autenticar o usuário:", authError?.message)
        // Se não conseguir autenticar, pelo menos salvou no localStorage
        setSavedInDatabase(false)
        setReasonSaved(true)
        setTimeout(() => {
          setReasonSaved(false)
          setSavedInDatabase(false)
        }, 3000)
        setIsSavingReason(false)
        return
      }

      // Tenta atualizar a coluna quitting_reason no banco
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ quitting_reason: reasonToSave })
        .eq("id", user.id)
        .select()

      if (updateError) {
        // Se falhar, mostra o erro completo no console
        console.error("❌ Erro ao salvar no banco de dados:", {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        // Ainda mostra como salvo pois está no localStorage
        setSavedInDatabase(false)
        setReasonSaved(true)
        setTimeout(() => {
          setReasonSaved(false)
          setSavedInDatabase(false)
        }, 3000)
      } else {
        console.log("✅ Salvo com sucesso no banco de dados:", data)
        setSavedInDatabase(true)
        setReasonSaved(true)
        setTimeout(() => {
          setReasonSaved(false)
          setSavedInDatabase(false)
        }, 3000)
      }
    } catch (error) {
      console.error("❌ Erro ao salvar motivo:", error)
      // Mesmo com erro, mostra como salvo pois está no localStorage
      setSavedInDatabase(false)
      setReasonSaved(true)
      setTimeout(() => {
        setReasonSaved(false)
        setSavedInDatabase(false)
      }, 3000)
    } finally {
      setIsSavingReason(false)
    }
  }

  // Função para iniciar o timer
  const handleStartTimer = () => {
    const newStartDate = new Date()
    setStartDate(newStartDate)
    setIsTimerRunning(true)
    
    // Salva no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerStartDate', newStartDate.toISOString())
    }
    
    // TODO: Em produção, salvar no Supabase
    // await supabase.from('user_progress').update({ start_date: newStartDate }).eq('user_id', userId)
  }

  // Função para gerar link de convite
  const generateInviteLink = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!user) {
          // Se não houver usuário, usa um link genérico
          setInviteLink(`${baseUrl}/auth/signup`)
          return
        }

        // Gera um link de convite com o ID do usuário como referência
        const referralCode = user.id.substring(0, 8) // Usa os primeiros 8 caracteres do ID
        const inviteUrl = `${baseUrl}/auth/signup?ref=${referralCode}`
        setInviteLink(inviteUrl)
      } catch (authError: any) {
        // Se falhar ao autenticar, usa link genérico
        if (authError?.message?.includes('Failed to fetch') || authError?.name === 'TypeError') {
          console.warn("Network error generating invite link (using generic link):", authError.message)
        } else {
          console.warn("Auth error generating invite link:", authError?.message)
        }
        setInviteLink(`${baseUrl}/auth/signup`)
      }
    } catch (error: any) {
      console.warn("Error generating invite link:", error?.message || error)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setInviteLink(`${baseUrl}/auth/signup`)
    }
  }

  // Função para copiar link
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying link:", error)
      // Fallback para navegadores antigos
      const textArea = document.createElement("textarea")
      textArea.value = inviteLink
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Fallback copy failed:", err)
      }
      document.body.removeChild(textArea)
    }
  }

  // Gera o link quando o dialog abre
  useEffect(() => {
    if (isInviteDialogOpen) {
      generateInviteLink()
    } else {
      // Reseta o link quando fecha
      setInviteLink("")
      setCopied(false)
    }
  }, [isInviteDialogOpen])

  // Função para resetar o timer (salva histórico e reinicia)
  const handleResetTimer = async () => {
    if (!startDate) return
    
    // Calcula o tempo decorrido antes de resetar
    const elapsedTime = new Date().getTime() - startDate.getTime()
    const days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((elapsedTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60))
    
    // TODO: Salvar histórico no Supabase antes de resetar
    // await supabase.from('timer_history').insert({
    //   user_id: userId,
    //   start_date: startDate,
    //   end_date: new Date(),
    //   duration_seconds: Math.floor(elapsedTime / 1000),
    //   days,
    //   hours,
    //   minutes
    // })
    
    // Salva no localStorage para histórico local
    if (typeof window !== 'undefined') {
      const history = JSON.parse(localStorage.getItem('timerHistory') || '[]')
      history.push({
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        duration: { days, hours, minutes },
        durationSeconds: Math.floor(elapsedTime / 1000)
      })
      localStorage.setItem('timerHistory', JSON.stringify(history))
      
      // Remove a data de início e para o timer
      localStorage.removeItem('timerStartDate')
    }
    
    // Reseta o estado
    setStartDate(null)
    setIsTimerRunning(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen starry-background flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
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
                    // Failed - Não concluído na jornada
                    icon = <X className="h-4 w-4 text-red-400" strokeWidth={3} />
                    bgClass = "bg-red-600/50 border-red-500/50"
                  } else {
                    // Not started - mostra a inicial do dia
                    icon = <span className="text-xs text-white/50">{weekLabels[idx]}</span>
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
            {/* Progress Info */}
            <div className="flex items-center justify-center gap-4 text-sm text-white/70 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[oklch(0.68_0.18_45)]" />
                <span>{userProgress.currentStreak} {t.days} {t.currentStreak}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[oklch(0.68_0.18_45)]" />
                <span>{userProgress.totalXp} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[oklch(0.68_0.18_45)]" />
                <span>{userProgress.currentDay}/{userProgress.programDuration || 90} {t.program}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 md:gap-8 mb-6">
            {/* Botão de Iniciar Timer */}
            {!isTimerRunning && (
              <button 
                onClick={handleStartTimer}
                className="flex flex-col items-center gap-3 text-white hover:opacity-80 transition-opacity"
              >
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Play className="h-6 w-6 md:h-8 md:w-8 ml-1" fill="white" />
                </div>
                <span className="text-sm md:text-base font-medium">{t.start}</span>
              </button>
            )}
            
            <button 
              onClick={() => setIsPledgeDialogOpen(true)}
              className="flex flex-col items-center gap-3 text-white hover:opacity-80 transition-opacity"
            >
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="text-2xl md:text-3xl">🤝</span>
              </div>
              <span className="text-sm md:text-base font-medium">{t.pledge}</span>
            </button>
            <button 
              onClick={() => router.push('/meditar')}
              className="flex flex-col items-center gap-3 text-white hover:opacity-80 transition-opacity"
            >
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="text-2xl md:text-3xl">🧘</span>
              </div>
              <span className="text-sm md:text-base font-medium">{t.meditate}</span>
            </button>
            <button 
              onClick={handleResetTimer}
              disabled={!isTimerRunning}
              className="flex flex-col items-center gap-3 text-white hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <span className="text-sm md:text-base font-medium">{t.reset}</span>
            </button>
            <div className="hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={() => {
                    const principalSection = document.getElementById('principal')
                    if (principalSection) {
                      principalSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="flex flex-col items-center gap-3 text-white hover:opacity-80 transition-opacity group"
                >
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 group-hover:scale-105">
                    <MoreHorizontal className="h-6 w-6 md:h-8 md:w-8 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <span className="text-sm md:text-base font-medium">{t.more}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="dropdown-menu-no-scroll w-80 bg-gradient-to-br from-purple-950/98 via-indigo-950/98 to-blue-950/98 border-purple-500/30 backdrop-blur-xl text-white shadow-2xl shadow-purple-900/50 p-2 rounded-xl"
              >
                <div className="px-2 py-1.5 mb-1.5 border-b border-white/10 shrink-0">
                  <DropdownMenuLabel className="text-base font-bold text-white px-0 mb-0.5">
                    {language === "pt" ? "Mais Opções" : language === "es" ? "Más Opciones" : "More Options"}
                  </DropdownMenuLabel>
                  <p className="text-xs text-white/50">
                    {language === "pt" ? "Acesso rápido a recursos" : language === "es" ? "Acceso rápido a recursos" : "Quick access to resources"}
                  </p>
                </div>
                
                <div className="space-y-0.5 overflow-y-auto max-h-[calc(70vh-120px)] pr-1 custom-scrollbar" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(139, 92, 246, 0.2) transparent'
                }}>
                  {/* Inspiração */}
                  <DropdownMenuItem
                    onClick={() => setIsReasonsDialogOpen(true)}
                    className="text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-rose-500/20 focus:bg-gradient-to-r focus:from-pink-500/20 focus:to-rose-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-pink-500/30 transition-all shrink-0">
                      <Heart className="h-4 w-4 text-pink-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Motivos para Parar" : language === "es" ? "Razones para Parar" : "Reasons to Quit"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Lembre-se do porquê" : language === "es" ? "Recuerda el por qué" : "Remember why"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => setIsMotivationDialogOpen(true)}
                    className="text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-amber-500/20 focus:bg-gradient-to-r focus:from-yellow-500/20 focus:to-amber-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-yellow-500/30 to-amber-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-yellow-500/30 transition-all shrink-0">
                      <Quote className="h-4 w-4 text-yellow-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Motivação" : language === "es" ? "Motivación" : "Motivation"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Citações inspiradoras" : language === "es" ? "Citas inspiradoras" : "Inspiring quotes"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => setIsSuccessStoriesDialogOpen(true)}
                    className="text-white hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-green-500/20 focus:bg-gradient-to-r focus:from-emerald-500/20 focus:to-green-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-emerald-500/30 transition-all shrink-0">
                      <Star className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Histórias de Sucesso" : language === "es" ? "Historias de Éxito" : "Success Stories"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Inspire-se com outros" : language === "es" ? "Inspírate con otros" : "Get inspired"}
                      </div>
                    </div>
                  </DropdownMenuItem>

                  {/* Progresso */}
                  <DropdownMenuItem
                    onClick={() => setIsMilestonesDialogOpen(true)}
                    className="text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 focus:bg-gradient-to-r focus:from-blue-500/20 focus:to-cyan-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-blue-500/30 transition-all shrink-0">
                      <Award className="h-4 w-4 text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Marcos e Conquistas" : language === "es" ? "Hitos y Logros" : "Milestones & Achievements"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Celebre suas vitórias" : language === "es" ? "Celebra tus victorias" : "Celebrate victories"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => setIsSideEffectsDialogOpen(true)}
                    className="text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-indigo-500/20 focus:bg-gradient-to-r focus:from-purple-500/20 focus:to-indigo-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-purple-500/30 transition-all shrink-0">
                      <AlertCircle className="h-4 w-4 text-purple-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Efeitos Colaterais" : language === "es" ? "Efectos Secundarios" : "Side Effects"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Benefícios da recuperação" : language === "es" ? "Beneficios de la recuperación" : "Recovery benefits"}
                      </div>
                    </div>
                  </DropdownMenuItem>

                  {/* Navegação */}
                  <DropdownMenuItem
                    onClick={() => router.push('/tools')}
                    className="text-white hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-cyan-500/20 focus:bg-gradient-to-r focus:from-teal-500/20 focus:to-cyan-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-teal-500/30 transition-all shrink-0">
                      <Wind className="h-4 w-4 text-teal-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Ferramentas" : language === "es" ? "Herramientas" : "Tools"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Exercícios e recursos" : language === "es" ? "Ejercicios y recursos" : "Exercises & resources"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => router.push('/analytics')}
                    className="text-white hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-purple-500/20 focus:bg-gradient-to-r focus:from-violet-500/20 focus:to-purple-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-violet-500/30 transition-all shrink-0">
                      <Target className="h-4 w-4 text-violet-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Análises" : language === "es" ? "Análisis" : "Analytics"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Estatísticas e gráficos" : language === "es" ? "Estadísticas y gráficos" : "Stats & charts"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => router.push('/community')}
                    className="text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-blue-500/20 focus:bg-gradient-to-r focus:from-indigo-500/20 focus:to-blue-500/20 cursor-pointer rounded-lg px-2.5 py-2 transition-all group/item"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center mr-2.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-indigo-500/30 transition-all shrink-0">
                      <Users className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {language === "pt" ? "Comunidade" : language === "es" ? "Comunidad" : "Community"}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 truncate">
                        {language === "pt" ? "Conecte-se com outros" : language === "es" ? "Conéctate con otros" : "Connect with others"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
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
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{t.program}: {userProgress.currentDay}/{userProgress.programDuration || 90}</span>
              <span>{language === "pt" ? "Dias Limpos" : "Days Clean"}: {userProgress.totalDaysClean}</span>
            </div>
          </div>

          {/* Open Analytics Section */}
          <Link href="/analytics" className="block space-y-3 mb-6 group">
            <h3 className="text-white font-semibold group-hover:text-[oklch(0.7_0.15_220)] transition-colors">{t.openAnalytics}</h3>
            <Card className="p-4 bg-card/50 backdrop-blur-sm border-white/10 group-hover:border-[oklch(0.7_0.15_220)]/50 transition-all cursor-pointer">
              <LineChartSimple 
                data={analyticsData} 
                color="oklch(0.7 0.15 220)" 
                label="" 
              />
            </Card>
          </Link>

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
                
                {/* Challenge Day Number with gradient */}
                <div className="relative z-10">
                  <div className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
                    {challengeDay}
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
              <Link href="/tree" className="h-full flex">
                <Card className="p-0 bg-transparent border-white/10 backdrop-blur-sm hover:border-green-500/50 transition-all cursor-pointer h-full w-full overflow-hidden min-h-[180px] flex items-center justify-center relative group">
                  {treeProgress.isLoading ? (
                    <div className="text-white/60 text-sm">{t.loading}</div>
                  ) : (
                    <>
                      <TreeForest 
                        totalDaysCompleted={treeProgress.totalDaysCompleted}
                        totalDaysFailed={treeProgress.totalDaysFailed}
                        daysPerTree={7}
                      />
                      {/* Overlay indicando que é clicável */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <div className="text-white/80 text-sm font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                          {t.lifeTree}
                        </div>
                      </div>
                    </>
                  )}
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
              <Card 
                onClick={() => router.push("/tony")}
                className="relative p-6 bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-cyan-900/90 border-white/10 hover:border-emerald-400/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[140px] hover:shadow-xl hover:shadow-emerald-500/20"
              >
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-8 -translate-y-8"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-300 rounded-full blur-2xl transform -translate-x-6 translate-y-6"></div>
                </div>
                
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                        <Bot className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-emerald-900 flex items-center justify-center group-hover:animate-pulse">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold text-xl group-hover:text-emerald-100 transition-colors">{t.newSession}</h3>
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-200 rounded-full border border-emerald-400/30">
                          {t.therapeuticAI}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {t.tonyDescription}
                      </p>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Heart className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t.tonyFeatures}</span>
                  </div>
                </div>
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
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
            <Card 
              className={`p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-blue-400/50 transition-all cursor-pointer group ${
                notifications.enabled ? "border-blue-400/50" : ""
              }`}
              onClick={async () => {
                if (!notifications.enabled && notifications.permission === "denied") {
                  alert(t.notificationsBlocked)
                  return
                }
                await notifications.toggleNotifications()
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  notifications.enabled 
                    ? "bg-blue-500/30 group-hover:bg-blue-500/40" 
                    : "bg-white/10 group-hover:bg-white/20"
                }`}>
                  <Bell className={`h-6 w-6 ${
                    notifications.enabled ? "text-blue-400" : "text-white"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.enableNotifications}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {notifications.enabled 
                      ? t.notificationsEnabled
                      : t.enableNotificationsDesc
                    }
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  notifications.enabled
                    ? "border-blue-400 bg-blue-400"
                    : "border-white/30 group-hover:border-white/50"
                }`}>
                  {notifications.enabled ? (
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  ) : (
                    <Circle className="h-4 w-4 text-transparent" />
                  )}
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
            <Card 
              className={`p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-red-400/50 transition-all cursor-pointer group ${
                contentBlocker.enabled ? "border-red-400/50" : ""
              }`}
              onClick={contentBlocker.toggleBlocker}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  contentBlocker.enabled 
                    ? "bg-red-500/30 group-hover:bg-red-500/40" 
                    : "bg-white/10 group-hover:bg-white/20"
                }`}>
                  <div className="relative">
                    <Globe className={`h-6 w-6 ${
                      contentBlocker.enabled ? "text-red-400" : "text-white"
                    }`} />
                    <X className={`h-4 w-4 absolute -top-1 -right-1 ${
                      contentBlocker.enabled ? "text-red-400" : "text-red-400/50"
                    }`} strokeWidth={3} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white mb-1">{t.enableContentBlocker}</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {contentBlocker.enabled 
                      ? t.contentBlockerEnabled
                      : t.enableContentBlockerDesc
                    }
                  </p>
                  <Link href="/blocker-install" className="block mt-2">
                    <p className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline">
                      💡 Para bloquear em todo o navegador, instale a extensão VENSER Blocker →
                    </p>
                  </Link>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  contentBlocker.enabled
                    ? "border-red-400 bg-red-400"
                    : "border-white/30 group-hover:border-white/50"
                }`}>
                  {contentBlocker.enabled ? (
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  ) : (
                    <Circle className="h-4 w-4 text-transparent" />
                  )}
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
                  <p className="text-sm md:text-base lg:text-xl font-bold text-white">
                    {challengeEndDate || '--'}
                  </p>
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
                {isEditingReason ? (
                  <div className="space-y-3 mb-4">
                    <textarea
                      value={quittingReason}
                      onChange={(e) => setQuittingReason(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsEditingReason(false)
                        }
                      }}
                      onBlur={async () => {
                        // Pequeno delay para permitir clicar no botão salvar
                        setTimeout(async () => {
                          setIsEditingReason(false)
                          if (quittingReason.trim()) {
                            await saveQuittingReason()
                          }
                        }, 200)
                      }}
                      placeholder={t.addReasonPlaceholder}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 resize-none min-h-[80px]"
                      autoFocus
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsEditingReason(false)
                            if (quittingReason.trim()) {
                              await saveQuittingReason()
                            }
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-400/10"
                        >
                          {isSavingReason ? (language === "pt" ? "Salvando..." : language === "es" ? "Guardando..." : "Saving...") : (language === "pt" ? "Salvar" : language === "es" ? "Guardar" : "Save")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsEditingReason(false)
                          }}
                          className="text-xs text-white/50 hover:text-white/70 transition-colors px-2 py-1 rounded hover:bg-white/5"
                        >
                          {language === "pt" ? "Cancelar" : language === "es" ? "Cancelar" : "Cancel"}
                        </button>
                      </div>
                      {reasonSaved && (
                        <span className={`text-xs flex items-center gap-1 animate-in fade-in ${
                          savedInDatabase ? "text-green-400" : "text-yellow-400"
                        }`}>
                          <Check className="h-3 w-3" />
                          {savedInDatabase 
                            ? (language === "pt" ? "Salvo no banco" : language === "es" ? "Guardado en BD" : "Saved to database")
                            : (language === "pt" ? "Salvo localmente" : language === "es" ? "Guardado localmente" : "Saved locally")
                          }
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingReason(true)}
                    className="text-white/70 text-sm mb-4 cursor-pointer hover:text-white transition-colors min-h-[60px] whitespace-pre-wrap break-words p-2 -m-2 rounded hover:bg-white/5"
                  >
                    {quittingReason || (
                      <span className="italic text-white/50">{t.addReasonPlaceholder}</span>
                    )}
                  </div>
                )}
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
          <div id="principal" className="space-y-4 mb-6 mt-12">
            <h3 className="text-lg font-semibold text-white">{t.main}</h3>
            
            <div className="space-y-2">
              {/* Save A Friend */}
              <Card 
                onClick={() => setIsInviteDialogOpen(true)}
                className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-cyan-400/50 transition-all cursor-pointer group"
              >
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
              <Card 
                onClick={() => router.push("/tony")}
                className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-orange-400/50 transition-all cursor-pointer group"
              >
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
              <Card 
                onClick={() => setIsReasonsDialogOpen(true)}
                className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-pink-400/50 transition-all cursor-pointer group"
              >
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
              <Card 
                onClick={() => router.push("/community")}
                className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-green-400/50 transition-all cursor-pointer group"
              >
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
              <Card 
                onClick={() => router.push("/tools")}
                className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-orange-400/50 transition-all cursor-pointer group"
              >
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
              <Card 
                onClick={() => setIsMilestonesDialogOpen(true)}
                className="p-4 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm hover:border-purple-400/50 transition-all cursor-pointer group"
              >
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
                <div 
                  onClick={() => setIsSideEffectsDialogOpen(true)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                >
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
                <div 
                  onClick={() => setIsMotivationDialogOpen(true)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <ClipboardList className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-white font-medium">{t.motivation}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>

                {/* Breath Exercise */}
                <div 
                  onClick={() => router.push('/breath-exercise')}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <Wind className="h-5 w-5 text-orange-400" />
                    </div>
                    <span className="text-white font-medium">{t.breathExercise}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </div>

                {/* Success Stories */}
                <div 
                  onClick={() => setIsSuccessStoriesDialogOpen(true)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                >
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
      <div className={cn(
        "fixed bottom-20 left-0 right-0 z-50 p-4 md:bottom-4",
        collapsed ? "md:left-20 lg:left-20" : "md:left-56 lg:left-64"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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

      {/* Dialog de Convite */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-950/95 to-indigo-950/95 border-white/20 backdrop-blur-xl text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              {language === "pt" ? "Salvar um Amigo" : language === "es" ? "Salvar un Amigo" : "Save A Friend"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Compartilhe este link com alguém que precisa de ajuda. Quando eles se cadastrarem usando seu link, vocês podem se apoiar na jornada juntos."
                : language === "es"
                ? "Comparte este enlace con alguien que necesita ayuda. Cuando se registren usando tu enlace, pueden apoyarse mutuamente en el viaje juntos."
                : "Share this link with someone who needs help. When they sign up using your link, you can support each other on the journey together."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                {language === "pt" ? "Link de Convite" : language === "es" ? "Enlace de Invitación" : "Invite Link"}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90 break-all">
                  {inviteLink || (language === "pt" ? "Carregando..." : language === "es" ? "Cargando..." : "Loading...")}
                </div>
                <Button
                  onClick={copyInviteLink}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white shrink-0"
                  size="sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {language === "pt" ? "Copiado!" : language === "es" ? "¡Copiado!" : "Copied!"}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {language === "pt" ? "Copiar" : language === "es" ? "Copiar" : "Copy"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 rounded-lg p-3">
              <Share2 className="h-4 w-4 text-cyan-400" />
              <span>
                {language === "pt" 
                  ? "Você também pode compartilhar diretamente via WhatsApp, Email ou outras redes sociais."
                  : language === "es"
                  ? "También puedes compartir directamente vía WhatsApp, Email u otras redes sociales."
                  : "You can also share directly via WhatsApp, Email or other social networks."}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Motivos para Mudança */}
      <Dialog open={isReasonsDialogOpen} onOpenChange={setIsReasonsDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-950/95 to-indigo-950/95 border-white/20 backdrop-blur-xl text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-400" />
              {language === "pt" ? "Motivos para Mudança" : language === "es" ? "Razones para el Cambio" : "Reasons for Change"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Escreva seus motivos para mudar. Ter motivos claros e pessoais te ajuda a manter o foco nos momentos difíceis."
                : language === "es"
                ? "Escribe tus razones para cambiar. Tener razones claras y personales te ayuda a mantener el enfoque en los momentos difíciles."
                : "Write your reasons for change. Having clear and personal reasons helps you stay focused during difficult moments."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Motivo Principal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                {language === "pt" ? "Meu motivo principal" : language === "es" ? "Mi razón principal" : "My main reason"}
              </label>
              {isEditingReason ? (
                <div className="space-y-3">
                  <textarea
                    value={quittingReason}
                    onChange={(e) => setQuittingReason(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingReason(false)
                      }
                    }}
                    placeholder={t.addReasonPlaceholder}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 resize-none min-h-[120px]"
                    autoFocus
                    rows={5}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsEditingReason(false)
                          if (quittingReason.trim()) {
                            await saveQuittingReason()
                          }
                        }}
                        className="text-xs text-pink-400 hover:text-pink-300 transition-colors px-3 py-1.5 rounded hover:bg-pink-400/10 bg-pink-400/5"
                      >
                        {isSavingReason ? (language === "pt" ? "Salvando..." : language === "es" ? "Guardando..." : "Saving...") : (language === "pt" ? "Salvar" : language === "es" ? "Guardar" : "Save")}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsEditingReason(false)
                        }}
                        className="text-xs text-white/50 hover:text-white/70 transition-colors px-3 py-1.5 rounded hover:bg-white/5"
                      >
                        {language === "pt" ? "Cancelar" : language === "es" ? "Cancelar" : "Cancel"}
                      </button>
                    </div>
                    {reasonSaved && (
                      <span className={`text-xs flex items-center gap-1 animate-in fade-in ${
                        savedInDatabase ? "text-green-400" : "text-yellow-400"
                      }`}>
                        <Check className="h-3 w-3" />
                        {savedInDatabase 
                          ? (language === "pt" ? "Salvo no banco" : language === "es" ? "Guardado en BD" : "Saved to database")
                          : (language === "pt" ? "Salvo localmente" : language === "es" ? "Guardado localmente" : "Saved locally")
                        }
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingReason(true)}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white/70 text-sm cursor-pointer hover:text-white hover:bg-white/15 transition-colors min-h-[120px] whitespace-pre-wrap break-words"
                >
                  {quittingReason || (
                    <span className="italic text-white/50">{t.addReasonPlaceholder}</span>
                  )}
                </div>
              )}
            </div>

            {/* Dica Motivacional */}
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" />
                <h4 className="font-semibold text-white">
                  {language === "pt" ? "Por que ter motivos claros é importante?" : language === "es" ? "¿Por qué tener razones claras es importante?" : "Why having clear reasons is important?"}
                </h4>
              </div>
              <ul className="text-sm text-white/80 space-y-1.5 list-disc list-inside">
                <li>
                  {language === "pt" 
                    ? "Lembra você do seu propósito quando a tentação aparecer"
                    : language === "es"
                    ? "Te recuerda tu propósito cuando aparezca la tentación"
                    : "Reminds you of your purpose when temptation appears"}
                </li>
                <li>
                  {language === "pt" 
                    ? "Fortalece sua determinação nos momentos difíceis"
                    : language === "es"
                    ? "Fortalece tu determinación en los momentos difíciles"
                    : "Strengthens your determination in difficult moments"}
                </li>
                <li>
                  {language === "pt" 
                    ? "Conecta você com seus valores e objetivos pessoais"
                    : language === "es"
                    ? "Te conecta con tus valores y objetivos personales"
                    : "Connects you with your values and personal goals"}
                </li>
              </ul>
            </div>

            {/* Sugestões de Motivos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white/90">
                {language === "pt" ? "Algumas ideias para começar:" : language === "es" ? "Algunas ideas para comenzar:" : "Some ideas to get started:"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  language === "pt" ? "Quero melhorar meus relacionamentos" : language === "es" ? "Quiero mejorar mis relaciones" : "I want to improve my relationships",
                  language === "pt" ? "Quero mais energia e foco" : language === "es" ? "Quiero más energía y enfoque" : "I want more energy and focus",
                  language === "pt" ? "Quero me sentir mais confiante" : language === "es" ? "Quiero sentirme más confiado" : "I want to feel more confident",
                  language === "pt" ? "Quero ser um exemplo melhor" : language === "es" ? "Quiero ser un mejor ejemplo" : "I want to be a better example",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!quittingReason.trim()) {
                        setQuittingReason(suggestion)
                        setIsEditingReason(true)
                      }
                    }}
                    disabled={!!quittingReason.trim()}
                    className="text-left text-xs text-white/70 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Marcos */}
      <Dialog open={isMilestonesDialogOpen} onOpenChange={setIsMilestonesDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-950/95 to-indigo-950/95 border-white/20 backdrop-blur-xl text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-purple-400" />
              {language === "pt" ? "Marcos" : language === "es" ? "Hitos" : "Milestones"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Acompanhe seus marcos de recuperação. Cada marco alcançado é uma vitória importante na sua jornada."
                : language === "es"
                ? "Rastrea tus hitos de recuperación. Cada hito alcanzado es una victoria importante en tu viaje."
                : "Track your recovery milestones. Each milestone achieved is an important victory on your journey."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Progresso Atual */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/90">
                  {language === "pt" ? "Dias Limpos" : language === "es" ? "Días Limpios" : "Days Clean"}
                </span>
                <span className="text-2xl font-bold text-purple-300">
                  {userProgress.totalDaysClean || userProgress.currentStreak}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((userProgress.totalDaysClean || userProgress.currentStreak) / (userProgress.programDuration || 90) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Lista de Marcos */}
            <div className="space-y-3">
              {[
                { id: 1, title: t.firstWeek, days: 7, icon: "🎯" },
                { id: 2, title: t.twoWeeks, days: 14, icon: "🌟" },
                { id: 3, title: t.oneMonth, days: 30, icon: "🏆" },
                { id: 4, title: t.threeMonths, days: 90, icon: "👑" },
              ].map((milestone) => {
                const daysClean = userProgress.totalDaysClean || userProgress.currentStreak
                const achieved = daysClean >= milestone.days
                const progress = Math.min((daysClean / milestone.days) * 100, 100)
                
                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border transition-all ${
                      achieved
                        ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl ${achieved ? "animate-bounce" : ""}`}>
                          {milestone.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{milestone.title}</h4>
                          <p className="text-xs text-white/60">
                            {milestone.days} {language === "pt" ? "dias" : language === "es" ? "días" : "days"}
                          </p>
                        </div>
                      </div>
                      {achieved ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <Check className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            {language === "pt" ? "Conquistado!" : language === "es" ? "¡Conseguido!" : "Achieved!"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-white/40 text-sm">
                          {milestone.days - daysClean} {language === "pt" ? "dias restantes" : language === "es" ? "días restantes" : "days left"}
                        </div>
                      )}
                    </div>
                    {!achieved && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          {progress.toFixed(0)}% {language === "pt" ? "completo" : language === "es" ? "completo" : "complete"}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mensagem Motivacional */}
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 rounded-lg p-4 text-center">
              <p className="text-sm text-white/90">
                {userProgress.totalDaysClean >= 90
                  ? (language === "pt" 
                      ? "🎉 Parabéns! Você alcançou todos os marcos principais! Continue assim!"
                      : language === "es"
                      ? "🎉 ¡Felicidades! ¡Has alcanzado todos los hitos principales! ¡Sigue así!"
                      : "🎉 Congratulations! You've achieved all main milestones! Keep it up!")
                  : userProgress.totalDaysClean >= 30
                  ? (language === "pt" 
                      ? "💪 Você está indo muito bem! Continue firme na sua jornada!"
                      : language === "es"
                      ? "💪 ¡Lo estás haciendo muy bien! ¡Sigue firme en tu viaje!"
                      : "💪 You're doing great! Stay strong on your journey!")
                  : userProgress.totalDaysClean >= 14
                  ? (language === "pt" 
                      ? "🌟 Excelente progresso! Você está no caminho certo!"
                      : language === "es"
                      ? "🌟 ¡Excelente progreso! ¡Vas por buen camino!"
                      : "🌟 Excellent progress! You're on the right track!")
                  : userProgress.totalDaysClean >= 7
                  ? (language === "pt" 
                      ? "🚀 Ótimo começo! Continue assim e você alcançará grandes marcos!"
                      : language === "es"
                      ? "🚀 ¡Gran comienzo! ¡Sigue así y alcanzarás grandes hitos!"
                      : "🚀 Great start! Keep going and you'll reach great milestones!")
                  : (language === "pt" 
                      ? "💚 Cada dia conta! Continue firme e você alcançará seus marcos!"
                      : language === "es"
                      ? "💚 ¡Cada día cuenta! ¡Sigue firme y alcanzarás tus hitos!"
                      : "💚 Every day counts! Stay strong and you'll reach your milestones!")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Efeitos Colaterais */}
      <Dialog open={isSideEffectsDialogOpen} onOpenChange={setIsSideEffectsDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-950/95 to-indigo-950/95 border-white/20 backdrop-blur-xl text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-400" />
              {language === "pt" ? "Efeitos Colaterais Positivos" : language === "es" ? "Efectos Secundarios Positivos" : "Positive Side Effects"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Descubra os benefícios incríveis que você pode experimentar ao se libertar da pornografia."
                : language === "es"
                ? "Descubre los increíbles beneficios que puedes experimentar al liberarte de la pornografía."
                : "Discover the incredible benefits you can experience by freeing yourself from pornography."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Efeitos Positivos */}
            <div className="space-y-3">
              {[
                {
                  title: language === "pt" ? "Aumento de Energia" : language === "es" ? "Aumento de Energía" : "Increased Energy",
                  description: language === "pt" 
                    ? "Você notará mais energia física e mental ao longo do dia, sem os picos e quedas de dopamina."
                    : language === "es"
                    ? "Notarás más energía física y mental durante el día, sin los picos y caídas de dopamina."
                    : "You'll notice more physical and mental energy throughout the day, without dopamine spikes and crashes.",
                  icon: "⚡"
                },
                {
                  title: language === "pt" ? "Melhor Foco e Concentração" : language === "es" ? "Mejor Enfoque y Concentración" : "Better Focus and Concentration",
                  description: language === "pt" 
                    ? "Sua capacidade de se concentrar em tarefas importantes melhora significativamente."
                    : language === "es"
                    ? "Tu capacidad de concentrarte en tareas importantes mejora significativamente."
                    : "Your ability to focus on important tasks improves significantly.",
                  icon: "🎯"
                },
                {
                  title: language === "pt" ? "Melhor Qualidade do Sono" : language === "es" ? "Mejor Calidad del Sueño" : "Better Sleep Quality",
                  description: language === "pt" 
                    ? "Dormir melhor leva a mais energia, melhor humor e saúde geral aprimorada."
                    : language === "es"
                    ? "Dormir mejor lleva a más energía, mejor humor y salud general mejorada."
                    : "Better sleep leads to more energy, better mood, and improved overall health.",
                  icon: "😴"
                },
                {
                  title: language === "pt" ? "Aumento da Confiança" : language === "es" ? "Aumento de la Confianza" : "Increased Confidence",
                  description: language === "pt" 
                    ? "Ao superar esse desafio, você desenvolve uma confiança mais profunda em si mesmo."
                    : language === "es"
                    ? "Al superar este desafío, desarrollas una confianza más profunda en ti mismo."
                    : "By overcoming this challenge, you develop deeper confidence in yourself.",
                  icon: "💪"
                },
                {
                  title: language === "pt" ? "Melhorias nos Relacionamentos" : language === "es" ? "Mejoras en las Relaciones" : "Relationship Improvements",
                  description: language === "pt" 
                    ? "Conexões mais autênticas e profundas com outras pessoas, incluindo relacionamentos íntimos."
                    : language === "es"
                    ? "Conexiones más auténticas y profundas con otras personas, incluyendo relaciones íntimas."
                    : "More authentic and deeper connections with others, including intimate relationships.",
                  icon: "❤️"
                },
                {
                  title: language === "pt" ? "Clareza Mental" : language === "es" ? "Claridad Mental" : "Mental Clarity",
                  description: language === "pt" 
                    ? "Pensamentos mais claros, menos neblina mental e melhor tomada de decisões."
                    : language === "es"
                    ? "Pensamientos más claros, menos niebla mental y mejor toma de decisiones."
                    : "Clearer thoughts, less brain fog, and better decision-making.",
                  icon: "🧠"
                },
                {
                  title: language === "pt" ? "Aumento da Motivação" : language === "es" ? "Aumento de la Motivación" : "Increased Motivation",
                  description: language === "pt" 
                    ? "Maior motivação para perseguir objetivos pessoais e profissionais."
                    : language === "es"
                    ? "Mayor motivación para perseguir objetivos personales y profesionales."
                    : "Greater motivation to pursue personal and professional goals.",
                  icon: "🚀"
                },
                {
                  title: language === "pt" ? "Melhor Autoestima" : language === "es" ? "Mejor Autoestima" : "Better Self-Esteem",
                  description: language === "pt" 
                    ? "Sentir-se melhor consigo mesmo ao fazer escolhas alinhadas com seus valores."
                    : language === "es"
                    ? "Sentirse mejor consigo mismo al hacer elecciones alineadas con tus valores."
                    : "Feeling better about yourself by making choices aligned with your values.",
                  icon: "🌟"
                }
              ].map((effect, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-lg p-4 hover:border-blue-400/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{effect.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{effect.title}</h4>
                      <p className="text-sm text-white/80">{effect.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mensagem Motivacional */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-lg p-4 text-center">
              <p className="text-sm text-white/90">
                {language === "pt" 
                  ? "💙 Lembre-se: esses benefícios aparecem gradualmente. Seja paciente e continue firme na sua jornada!"
                  : language === "es"
                  ? "💙 Recuerda: estos beneficios aparecen gradualmente. ¡Sé paciente y mantente firme en tu viaje!"
                  : "💙 Remember: these benefits appear gradually. Be patient and stay strong on your journey!"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Motivação */}
      <Dialog open={isMotivationDialogOpen} onOpenChange={setIsMotivationDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-950/95 to-indigo-950/95 border-white/20 backdrop-blur-xl text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-400" />
              {language === "pt" ? "Motivação e Inspiração" : language === "es" ? "Motivación e Inspiración" : "Motivation and Inspiration"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Citações e dicas motivacionais para te ajudar a manter o foco na sua jornada de recuperação."
                : language === "es"
                ? "Citas y consejos motivacionales para ayudarte a mantener el enfoque en tu viaje de recuperación."
                : "Motivational quotes and tips to help you stay focused on your recovery journey."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Citação Principal */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-6 text-center">
              <Quote className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-white leading-relaxed">
                {t.motivationQuote}
              </p>
            </div>

            {/* Citações Motivacionais */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                {language === "pt" ? "Mais Citações Inspiradoras" : language === "es" ? "Más Citas Inspiradoras" : "More Inspiring Quotes"}
              </h4>
              {[
                {
                  quote: language === "pt" 
                    ? "A jornada de mil milhas começa com um único passo."
                    : language === "es"
                    ? "El viaje de mil millas comienza con un solo paso."
                    : "The journey of a thousand miles begins with a single step.",
                  author: language === "pt" ? "Lao Tzu" : language === "es" ? "Lao Tzu" : "Lao Tzu"
                },
                {
                  quote: language === "pt" 
                    ? "Você não precisa ver toda a escada, apenas dê o primeiro degrau."
                    : language === "es"
                    ? "No necesitas ver toda la escalera, solo da el primer paso."
                    : "You don't have to see the whole staircase, just take the first step.",
                  author: language === "pt" ? "Martin Luther King Jr." : language === "es" ? "Martin Luther King Jr." : "Martin Luther King Jr."
                },
                {
                  quote: language === "pt" 
                    ? "A força não vem das capacidades físicas. Vem de uma vontade indomável."
                    : language === "es"
                    ? "La fuerza no viene de las capacidades físicas. Viene de una voluntad indomable."
                    : "Strength does not come from physical capacity. It comes from an indomitable will.",
                  author: language === "pt" ? "Mahatma Gandhi" : language === "es" ? "Mahatma Gandhi" : "Mahatma Gandhi"
                },
                {
                  quote: language === "pt" 
                    ? "Cada dia é uma nova oportunidade de ser melhor do que você foi ontem."
                    : language === "es"
                    ? "Cada día es una nueva oportunidad de ser mejor de lo que fuiste ayer."
                    : "Each day is a new opportunity to be better than you were yesterday.",
                  author: language === "pt" ? "Desconhecido" : language === "es" ? "Desconocido" : "Unknown"
                },
                {
                  quote: language === "pt" 
                    ? "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta."
                    : language === "es"
                    ? "El éxito no es final, el fracaso no es fatal: es el coraje de continuar lo que cuenta."
                    : "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                  author: language === "pt" ? "Winston Churchill" : language === "es" ? "Winston Churchill" : "Winston Churchill"
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-lg p-4 hover:border-green-400/40 transition-colors"
                >
                  <p className="text-white/90 text-sm leading-relaxed mb-2">"{item.quote}"</p>
                  <p className="text-white/60 text-xs text-right">— {item.author}</p>
                </div>
              ))}
            </div>

            {/* Dicas Motivacionais */}
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                {language === "pt" ? "Dicas para Manter a Motivação" : language === "es" ? "Consejos para Mantener la Motivación" : "Tips to Stay Motivated"}
              </h4>
              {[
                {
                  tip: language === "pt" 
                    ? "Celebre pequenas vitórias - cada dia limpo é uma conquista"
                    : language === "es"
                    ? "Celebra pequeñas victorias - cada día limpio es un logro"
                    : "Celebrate small victories - each clean day is an achievement",
                  icon: "🎉"
                },
                {
                  tip: language === "pt" 
                    ? "Lembre-se do seu 'porquê' - reflita sobre seus motivos para mudar"
                    : language === "es"
                    ? "Recuerda tu 'por qué' - reflexiona sobre tus razones para cambiar"
                    : "Remember your 'why' - reflect on your reasons for change",
                  icon: "💭"
                },
                {
                  tip: language === "pt" 
                    ? "Visualize seu futuro - imagine como será sua vida livre"
                    : language === "es"
                    ? "Visualiza tu futuro - imagina cómo será tu vida libre"
                    : "Visualize your future - imagine what your free life will be like",
                  icon: "🔮"
                },
                {
                  tip: language === "pt" 
                    ? "Conecte-se com outros - você não está sozinho nesta jornada"
                    : language === "es"
                    ? "Conéctate con otros - no estás solo en este viaje"
                    : "Connect with others - you're not alone on this journey",
                  icon: "🤝"
                },
                {
                  tip: language === "pt" 
                    ? "Seja gentil consigo mesmo - recaídas fazem parte do processo"
                    : language === "es"
                    ? "Sé amable contigo mismo - las recaídas son parte del proceso"
                    : "Be kind to yourself - relapses are part of the process",
                  icon: "💚"
                },
                {
                  tip: language === "pt" 
                    ? "Foque no presente - um dia de cada vez é suficiente"
                    : language === "es"
                    ? "Enfócate en el presente - un día a la vez es suficiente"
                    : "Focus on the present - one day at a time is enough",
                  icon: "⏰"
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-4 hover:border-green-400/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{item.icon}</div>
                    <p className="text-sm text-white/90 flex-1">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mensagem Final */}
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-4 text-center">
              <p className="text-sm text-white/90">
                {language === "pt" 
                  ? "💚 Você é mais forte do que pensa. Continue firme na sua jornada!"
                  : language === "es"
                  ? "💚 Eres más fuerte de lo que piensas. ¡Sigue firme en tu viaje!"
                  : "💚 You are stronger than you think. Stay strong on your journey!"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórias de Sucesso */}
      <Dialog open={isSuccessStoriesDialogOpen} onOpenChange={setIsSuccessStoriesDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-950/95 to-indigo-950/95 border-white/20 backdrop-blur-xl text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              {language === "pt" ? "Histórias de Sucesso" : language === "es" ? "Historias de Éxito" : "Success Stories"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Inspire-se com histórias reais de pessoas que transformaram suas vidas através da determinação e perseverança."
                : language === "es"
                ? "Inspírate con historias reales de personas que transformaron sus vidas a través de la determinación y la perseverancia."
                : "Get inspired by real stories of people who transformed their lives through determination and perseverance."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Histórias de Sucesso */}
            <div className="space-y-4">
              {[
                {
                  name: language === "pt" ? "João, 28 anos" : language === "es" ? "Juan, 28 años" : "John, 28 years old",
                  days: "90+ dias",
                  story: language === "pt" 
                    ? "Há 3 meses, eu não conseguia passar nem uma semana sem recair. Hoje, completo 90 dias limpo e minha vida mudou completamente. Tenho mais energia, melhor relacionamento com minha família e finalmente me sinto no controle da minha vida. O segredo foi não desistir após cada recaída e focar em um dia de cada vez."
                    : language === "es"
                    ? "Hace 3 meses, no podía pasar ni una semana sin recaer. Hoy, completo 90 días limpio y mi vida cambió completamente. Tengo más energía, mejor relación con mi familia y finalmente me siento en control de mi vida. El secreto fue no rendirse después de cada recaída y enfocarse en un día a la vez."
                    : "3 months ago, I couldn't go even a week without relapsing. Today, I've completed 90 clean days and my life has completely changed. I have more energy, a better relationship with my family, and finally feel in control of my life. The secret was not giving up after each relapse and focusing on one day at a time.",
                  icon: "🌟"
                },
                {
                  name: language === "pt" ? "Rafael, 32 anos" : language === "es" ? "Rafael, 32 años" : "Rafael, 32 years old",
                  days: "180+ dias",
                  story: language === "pt" 
                    ? "Depois de 10 anos lutando contra esse vício, finalmente encontrei a força para mudar. Usei o exercício de respiração sempre que sentia vontade, e isso me salvou inúmeras vezes. Hoje, tenho um relacionamento saudável, uma carreira que amo e uma paz interior que nunca imaginei possível. Minha autoestima melhorou muito e me sinto um homem mais forte e confiante."
                    : language === "es"
                    ? "Después de 10 años luchando contra esta adicción, finalmente encontré la fuerza para cambiar. Usé el ejercicio de respiración cada vez que sentía ganas, y eso me salvó innumerables veces. Hoy, tengo una relación saludable, una carrera que amo y una paz interior que nunca imaginé posible. Mi autoestima mejoró mucho y me siento un hombre más fuerte y confiado."
                    : "After 10 years fighting this addiction, I finally found the strength to change. I used the breathing exercise whenever I felt the urge, and it saved me countless times. Today, I have a healthy relationship, a career I love, and an inner peace I never imagined possible. My self-esteem has improved greatly and I feel like a stronger, more confident man.",
                  icon: "💪"
                },
                {
                  name: language === "pt" ? "Carlos, 25 anos" : language === "es" ? "Carlos, 25 años" : "Carlos, 25 years old",
                  days: "120+ dias",
                  story: language === "pt" 
                    ? "O que mais me ajudou foi escrever meus motivos para mudar e reler sempre que sentia fraqueza. Também me conectei com outros homens na comunidade e isso fez toda a diferença. Saber que não estou sozinho nessa jornada me deu força para continuar. Hoje, me sinto uma pessoa completamente diferente - mais confiante, focado e em paz. Minha produtividade no trabalho aumentou muito."
                    : language === "es"
                    ? "Lo que más me ayudó fue escribir mis razones para cambiar y releerlas cada vez que sentía debilidad. También me conecté con otros hombres en la comunidad y eso hizo toda la diferencia. Saber que no estoy solo en este viaje me dio fuerza para continuar. Hoy, me siento una persona completamente diferente - más confiado, enfocado y en paz. Mi productividad en el trabajo aumentó mucho."
                    : "What helped me most was writing down my reasons for change and rereading them whenever I felt weak. I also connected with other men in the community and that made all the difference. Knowing I'm not alone on this journey gave me strength to continue. Today, I feel like a completely different person - more confident, focused, and at peace. My productivity at work has increased significantly.",
                  icon: "📝"
                },
                {
                  name: language === "pt" ? "Lucas, 30 anos" : language === "es" ? "Lucas, 30 años" : "Lucas, 30 years old",
                  days: "200+ dias",
                  story: language === "pt" 
                    ? "No início, parecia impossível. Mas comecei a celebrar cada pequena vitória - 3 dias, 7 dias, 14 dias. Cada marco me dava mais confiança. Usei as técnicas de respiração, li as citações motivacionais diariamente e me mantive firme. Agora, não consigo imaginar minha vida de outra forma. A liberdade que sinto é indescritível. Minha concentração melhorou drasticamente e consigo me dedicar mais aos meus hobbies e relacionamentos."
                    : language === "es"
                    ? "Al principio, parecía imposible. Pero comencé a celebrar cada pequeña victoria - 3 días, 7 días, 14 días. Cada hito me daba más confianza. Usé las técnicas de respiración, leí las citas motivacionales diariamente y me mantuve firme. Ahora, no puedo imaginar mi vida de otra manera. La libertad que siento es indescriptible. Mi concentración mejoró drásticamente y puedo dedicarme más a mis hobbies y relaciones."
                    : "At first, it seemed impossible. But I started celebrating every small victory - 3 days, 7 days, 14 days. Each milestone gave me more confidence. I used breathing techniques, read motivational quotes daily, and stayed strong. Now, I can't imagine my life any other way. The freedom I feel is indescribable. My concentration has improved drastically and I can dedicate more time to my hobbies and relationships.",
                  icon: "🎯"
                },
                {
                  name: language === "pt" ? "Pedro, 35 anos" : language === "es" ? "Pedro, 35 años" : "Pedro, 35 years old",
                  days: "365+ dias",
                  story: language === "pt" 
                    ? "Um ano completo! Nunca pensei que chegaria aqui. O que funcionou para mim foi criar uma rotina matinal com exercícios de respiração, definir metas claras e me rodear de pessoas que me apoiavam. A jornada não foi linear - tive altos e baixos - mas nunca desisti. Hoje, sou a melhor versão de mim mesmo e isso não tem preço. Minha vida sexual melhorou muito, tenho mais energia física e mental, e finalmente me sinto no controle total da minha vida."
                    : language === "es"
                    ? "¡Un año completo! Nunca pensé que llegaría aquí. Lo que funcionó para mí fue crear una rutina matutina con ejercicios de respiración, establecer metas claras y rodearme de personas que me apoyaban. El viaje no fue lineal - tuve altibajos - pero nunca me rendí. Hoy, soy la mejor versión de mí mismo y eso no tiene precio. Mi vida sexual mejoró mucho, tengo más energía física y mental, y finalmente me siento en control total de mi vida."
                    : "A full year! I never thought I'd get here. What worked for me was creating a morning routine with breathing exercises, setting clear goals, and surrounding myself with supportive people. The journey wasn't linear - I had ups and downs - but I never gave up. Today, I'm the best version of myself and that's priceless. My sex life has improved greatly, I have more physical and mental energy, and I finally feel in complete control of my life.",
                  icon: "👑"
                }
              ].map((story, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border border-yellow-400/30 rounded-xl p-5 hover:border-yellow-400/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0">{story.icon}</div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-lg font-bold text-white">{story.name}</h4>
                        <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full">
                          <span className="text-sm font-semibold text-yellow-400">{story.days}</span>
                        </div>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">{story.story}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mensagem Motivacional */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                <h4 className="text-lg font-bold text-white">
                  {language === "pt" ? "Sua História Pode Ser a Próxima" : language === "es" ? "Tu Historia Puede Ser la Próxima" : "Your Story Could Be Next"}
                </h4>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                {language === "pt" 
                  ? "💛 Cada uma dessas pessoas começou exatamente onde você está agora. Elas enfrentaram os mesmos desafios, tiveram as mesmas dúvidas e, muitas vezes, pensaram em desistir. Mas elas continuaram, um dia de cada vez, e hoje celebram sua liberdade. Você também pode fazer isso. Continue firme na sua jornada - sua história de sucesso está sendo escrita agora mesmo!"
                  : language === "es"
                  ? "💛 Cada una de estas personas comenzó exactamente donde estás ahora. Enfrentaron los mismos desafíos, tuvieron las mismas dudas y, a menudo, pensaron en rendirse. Pero continuaron, un día a la vez, y hoy celebran su libertad. Tú también puedes hacerlo. ¡Sigue firme en tu viaje - tu historia de éxito se está escribiendo ahora mismo!"
                  : "💛 Each of these people started exactly where you are now. They faced the same challenges, had the same doubts, and often thought about giving up. But they continued, one day at a time, and today they celebrate their freedom. You can do it too. Stay strong on your journey - your success story is being written right now!"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Compromisso */}
      <Dialog open={isPledgeDialogOpen} onOpenChange={setIsPledgeDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-red-950/95 to-orange-950/95 border-white/20 backdrop-blur-xl text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              {t.pledge}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-2">
              {language === "pt" 
                ? "Renove seu compromisso e lembre-se dos motivos pelos quais você está nesta jornada."
                : language === "es"
                ? "Renueva tu compromiso y recuerda las razones por las que estás en este viaje."
                : "Renew your commitment and remember the reasons why you're on this journey."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Seção de Motivos */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" />
                {language === "pt" ? "Meu Compromisso" : language === "es" ? "Mi Compromiso" : "My Commitment"}
              </h3>
              
              {isEditingReason ? (
                <div className="space-y-3">
                  <textarea
                    value={quittingReason}
                    onChange={(e) => setQuittingReason(e.target.value)}
                    placeholder={t.addReasonPlaceholder}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setIsEditingReason(false)
                        if (quittingReason.trim()) {
                          await saveQuittingReason()
                        }
                      }}
                      className="text-sm text-pink-400 hover:text-pink-300 transition-colors px-4 py-2 rounded-lg hover:bg-pink-400/10 bg-pink-400/5 font-medium"
                    >
                      {isSavingReason ? (language === "pt" ? "Salvando..." : language === "es" ? "Guardando..." : "Saving...") : (language === "pt" ? "Salvar" : language === "es" ? "Guardar" : "Save")}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingReason(false)
                      }}
                      className="text-sm text-white/50 hover:text-white/70 transition-colors px-4 py-2 rounded-lg hover:bg-white/5 font-medium"
                    >
                      {language === "pt" ? "Cancelar" : language === "es" ? "Cancelar" : "Cancel"}
                    </button>
                    {reasonSaved && (
                      <span className={`text-xs flex items-center gap-1 animate-in fade-in ${
                        savedInDatabase ? "text-green-400" : "text-yellow-400"
                      }`}>
                        <Check className="h-3 w-3" />
                        {savedInDatabase 
                          ? (language === "pt" ? "Salvo no banco" : language === "es" ? "Guardado en BD" : "Saved to database")
                          : (language === "pt" ? "Salvo localmente" : language === "es" ? "Guardado localmente" : "Saved locally")
                        }
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingReason(true)}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white/70 text-sm cursor-pointer hover:text-white hover:bg-white/15 transition-colors min-h-[120px] whitespace-pre-wrap break-words"
                >
                  {quittingReason || (
                    <span className="italic text-white/50">{t.addReasonPlaceholder}</span>
                  )}
                </div>
              )}
            </div>

            {/* Estatísticas do Compromisso */}
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-red-400" />
                <h4 className="font-semibold text-white">
                  {language === "pt" ? "Sua Jornada" : language === "es" ? "Tu Viaje" : "Your Journey"}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-white/60 mb-1">
                    {language === "pt" ? "Dias Limpos" : language === "es" ? "Días Limpios" : "Days Clean"}
                  </div>
                  <div className="text-2xl font-bold text-red-300">
                    {userProgress.totalDaysClean || userProgress.currentStreak || 0}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs text-white/60 mb-1">
                    {language === "pt" ? "Sequência Atual" : language === "es" ? "Racha Actual" : "Current Streak"}
                  </div>
                  <div className="text-2xl font-bold text-orange-300">
                    {userProgress.currentStreak || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagem Motivacional */}
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-pink-400" />
                <h4 className="font-semibold text-white">
                  {language === "pt" ? "Lembre-se" : language === "es" ? "Recuerda" : "Remember"}
                </h4>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                {language === "pt" 
                  ? "💪 Cada dia que você permanece fiel ao seu compromisso é uma vitória. Você é mais forte do que imagina e está mais perto da liberdade do que nunca. Continue firme, um dia de cada vez."
                  : language === "es"
                  ? "💪 Cada día que permaneces fiel a tu compromiso es una victoria. Eres más fuerte de lo que imaginas y estás más cerca de la libertad que nunca. Sigue firme, un día a la vez."
                  : "💪 Every day you stay true to your commitment is a victory. You are stronger than you think and closer to freedom than ever. Stay strong, one day at a time."}
              </p>
            </div>

            {/* Botão para Ver Motivos Completos */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setIsPledgeDialogOpen(false)
                  setIsReasonsDialogOpen(true)
                }}
                className="text-sm text-pink-400 hover:text-pink-300 transition-colors px-4 py-2 rounded-lg hover:bg-pink-400/10 bg-pink-400/5 font-medium flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                {language === "pt" ? "Ver Detalhes dos Motivos" : language === "es" ? "Ver Detalles de las Razones" : "View Reasons Details"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
