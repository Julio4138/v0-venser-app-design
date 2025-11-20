"use client"

import { useState, useEffect } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { DayCard } from "@/components/day-card"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Flame, Check, Lock, Trophy, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/sidebar-context"
import { supabase } from "@/lib/supabase/client"
import { ProgramDayContent } from "@/components/program-day-content"
import { ProgramDayChecklist } from "@/components/program-day-checklist"
import { ProgramDayReflection } from "@/components/program-day-reflection"
import { toast } from "sonner"

interface ProgramDay {
  day_number: number
  completed: boolean
  unlocked_at: string | null
  template_id: string | null
  completed_at?: string | null
}

interface ProgramDayTemplate {
  id: string
  day_number: number
  title_pt: string
  title_en?: string
  title_es?: string
  content_text_pt?: string
  content_text_en?: string
  content_text_es?: string
  content_audio_url?: string
  content_video_url?: string
  motivational_quote_pt?: string
  motivational_quote_en?: string
  motivational_quote_es?: string
  xp_reward: number
}

interface Task {
  id: string
  title: string
  description?: string
  task_type: "checklist" | "reflection" | "meditation" | "reading"
  xp_reward: number
  is_required: boolean
  completed: boolean
}

export default function ProgramPage() {
  const { language } = useLanguage()
  const { collapsed } = useSidebar()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const t = translations[language]

  // Program duration options
  const programDurations = [7, 15, 30, 60, 90, 180, 365]
  
  // User data
  const [selectedDuration, setSelectedDuration] = useState<number>(90)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [userProgress, setUserProgress] = useState({
    currentDay: 1,
    totalDays: 90,
    currentStreak: 0,
    totalXp: 0,
  })
  const [programDays, setProgramDays] = useState<ProgramDay[]>([])
  const [dayTemplate, setDayTemplate] = useState<ProgramDayTemplate | null>(null)
  const [dayTasks, setDayTasks] = useState<Task[]>([])
  const [reflectionText, setReflectionText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [hasCompletedToday, setHasCompletedToday] = useState(false)

  // Load user's selected duration first, then load data
  useEffect(() => {
    const loadInitialData = async () => {
      // Carregar duração primeiro e aguardar o valor
      const loadedDuration = await loadUserDuration()
      // Se encontrou uma duração no banco, garantir que selectedDuration está atualizado
      if (loadedDuration) {
        setSelectedDuration(loadedDuration)
      }
      // Após carregar a duração, carregar os dados do usuário passando a duração carregada
      await loadUserData(loadedDuration || undefined)
      // Marcar como carregamento inicial completo após tudo estar carregado
      setIsInitialLoad(false)
    }
    loadInitialData()
  }, [])

  // Update duration and reload data when duration changes (skip initial load)
  useEffect(() => {
    if (!isInitialLoad && selectedDuration) {
      // Atualizar estado local imediatamente para refletir na UI
      setUserProgress((prev) => ({
        ...prev,
        totalDays: selectedDuration,
      }))
      
      const updateAndReload = async () => {
        console.log("Saving program duration:", selectedDuration)
        // Salvar primeiro e aguardar confirmação
        await updateUserDuration()
        // Aguardar um pouco mais para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 500))
        // Recarregar dados
        await loadUserData(selectedDuration)
      }
      updateAndReload()
    }
  }, [selectedDuration, isInitialLoad])

  // Load day details when selected
  useEffect(() => {
    if (selectedDay) {
      loadDayDetails(selectedDay)
    }
  }, [selectedDay, language])

  // Subscribe to program_days changes for real-time sync
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      channel = supabase
        .channel(`program_days_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'program_days',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Reload day details if the current selected day changed
            if (selectedDay && payload.new && (payload.new as any).day_number === selectedDay) {
              loadDayDetails(selectedDay)
            }
            // Reload user data to update program days list
            loadUserData()
          }
        )
        .subscribe()

      return () => {
        if (channel) {
          supabase.removeChannel(channel)
        }
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedDay, loadDayDetails, loadUserData])

  // Auto-save reflection with debounce
  useEffect(() => {
    if (!selectedDay || !reflectionText) return
    
    // Don't auto-save if day is completed
    const day = programDays.find((d) => d.day_number === selectedDay)
    if (day?.completed) return

    const timeoutId = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Save reflection to program_days (not final, just draft)
        await supabase
          .from("program_days")
          .update({
            reflection_text: reflectionText,
          })
          .eq("user_id", user.id)
          .eq("day_number", selectedDay)
      } catch (error) {
        console.error("Error auto-saving reflection:", error)
      }
    }, 1000) // Debounce 1 second

    return () => clearTimeout(timeoutId)
  }, [reflectionText, selectedDay, programDays])

  const loadUserDuration = async (): Promise<number | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data: progress, error } = await supabase
        .from("user_progress")
        .select("program_duration")
        .eq("user_id", user.id)
        .single()

      if (error) {
        // PGRST116 = no rows returned, which is OK for new users
        if (error.code !== 'PGRST116') {
          console.error("Error loading user duration:", error)
        }
        return null
      }

      if (progress?.program_duration) {
        const duration = progress.program_duration
        console.log("Loaded program duration from database:", duration)
        setSelectedDuration(duration)
        setUserProgress((prev) => ({
          ...prev,
          totalDays: duration,
        }))
        return duration
      } else {
        console.log("No program_duration found in database, using default 90")
      }
      return null
    } catch (error) {
      console.error("Error loading user duration:", error)
      return null
    }
  }

  const updateUserDuration = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found for updating duration")
        return
      }

      // Usar upsert com onConflict para garantir que atualize o registro existente
      const { data, error } = await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: user.id,
            program_duration: selectedDuration,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()

      if (error) {
        console.error("Error updating user duration:", error)
        toast.error(
          language === "pt"
            ? "Erro ao salvar duração do programa"
            : "Error saving program duration"
        )
        return
      }

      // Verificar se foi salvo corretamente
      if (data && data.length > 0) {
        console.log("Program duration saved successfully:", data[0].program_duration)
      }
    } catch (error) {
      console.error("Error updating user duration:", error)
      toast.error(
        language === "pt"
          ? "Erro ao salvar duração do programa"
          : "Error saving program duration"
      )
    }
  }

  const loadUserData = async (durationOverride?: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(language === "pt" ? "Faça login para acessar o programa" : "Please login to access the program")
        return
      }

      // Load user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (progress) {
        // Usar durationOverride se fornecido (para garantir valor correto na primeira carga)
        // Senão usar selectedDuration se já foi carregado, senão usar program_duration do banco
        const duration = durationOverride || selectedDuration || progress.program_duration || 90
        setUserProgress({
          currentDay: progress.current_day || 1,
          totalDays: duration,
          currentStreak: progress.current_streak || 0,
          totalXp: progress.total_xp || 0,
        })
        // Se selectedDuration ainda não foi definido e há program_duration no banco, usar esse valor
        if (!selectedDuration && progress.program_duration) {
          setSelectedDuration(progress.program_duration)
        }
      } else {
        // Se não houver progresso, usar selectedDuration ou padrão
        setUserProgress((prev) => ({
          ...prev,
          totalDays: selectedDuration || 90,
        }))
      }

      // Check if user completed a day today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: todayCompletion } = await supabase
        .from("program_days")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("completed_at", today.toISOString())
        .limit(1)

      setHasCompletedToday((todayCompletion?.length || 0) > 0)

      // Load program days for selected duration
      // Usar durationOverride se fornecido, senão usar selectedDuration se já foi carregado, senão usar program_duration do banco
      const duration = durationOverride || selectedDuration || progress?.program_duration || 90
      const { data: days } = await supabase
        .from("program_days")
        .select("*")
        .eq("user_id", user.id)
        .lte("day_number", duration)
        .order("day_number", { ascending: true })

      if (days) {
        // Ensure day 1 is unlocked if no days are unlocked
        const hasUnlockedDay = days.some((d) => d.unlocked_at || d.completed)
        if (!hasUnlockedDay && days.length > 0) {
          // Unlock day 1
          await supabase
            .from("program_days")
            .update({ unlocked_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("day_number", 1)

          // Reload days
          const { data: updatedDays } = await supabase
            .from("program_days")
            .select("*")
            .eq("user_id", user.id)
            .order("day_number", { ascending: true })

          if (updatedDays) {
            setProgramDays(updatedDays)
          }
        } else {
          setProgramDays(days)
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error(language === "pt" ? "Erro ao carregar dados" : "Error loading data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDayDetails = async (dayNumber: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Check if day is unlocked
      const programDay = programDays.find((d) => d.day_number === dayNumber)
      if (!programDay) {
        toast.error(
          language === "pt"
            ? "Este dia ainda não está disponível. Complete o dia anterior primeiro."
            : "This day is not available yet. Complete the previous day first."
        )
        setSelectedDay(null)
        return
      }

      // Allow viewing completed days without restrictions
      // If day is locked and not completed and not day 1, don't load
      if (dayNumber !== 1 && !programDay.unlocked_at && !programDay.completed) {
        toast.error(
          language === "pt"
            ? "Este dia está bloqueado. Complete o dia anterior para desbloquear."
            : "This day is locked. Complete the previous day to unlock it."
        )
        setSelectedDay(null)
        return
      }

      // Get user's program duration
      const { data: userProgressData } = await supabase
        .from("user_progress")
        .select("program_duration")
        .eq("user_id", user.id)
        .single()
      
      const programDuration = userProgressData?.program_duration || selectedDuration || 90

      // If no template_id, try to find template by day_number and program_duration
      let templateId = programDay.template_id

      if (!templateId) {
        const { data: templateByDay } = await supabase
          .from("program_day_templates")
          .select("id")
          .eq("day_number", dayNumber)
          .eq("program_duration", programDuration)
          .eq("is_active", true)
          .single()

        if (templateByDay) {
          templateId = templateByDay.id
          // Update program_day with template_id
          await supabase
            .from("program_days")
            .update({ template_id: templateId })
            .eq("user_id", user.id)
            .eq("day_number", dayNumber)
        }
      }

      if (!templateId) {
        toast.error(
          language === "pt"
            ? "Template não encontrado para este dia. Entre em contato com o suporte."
            : "Template not found for this day. Please contact support."
        )
        setSelectedDay(null)
        return
      }

      // Load template
      const { data: template } = await supabase
        .from("program_day_templates")
        .select("*")
        .eq("id", templateId)
        .single()

      if (template) {
        const titleKey = `title_${language}` as keyof ProgramDayTemplate
        const contentKey = `content_text_${language}` as keyof ProgramDayTemplate
        const quoteKey = `motivational_quote_${language}` as keyof ProgramDayTemplate

        setDayTemplate({
          ...template,
          title_pt: (template[titleKey] || template.title_pt) as string,
          content_text_pt: (template[contentKey] || template.content_text_pt) as string,
          motivational_quote_pt: (template[quoteKey] || template.motivational_quote_pt) as string,
        })
      }

      // Load tasks from template
      const { data: tasks } = await supabase
        .from("program_day_tasks")
        .select("*")
        .eq("template_id", templateId)
        .order("task_order", { ascending: true })

      // Load planner tasks from program_days
      const { data: dayDataForPlanner } = await supabase
        .from("program_days")
        .select("planner_tasks, current_day")
        .eq("user_id", user.id)
        .eq("day_number", dayNumber)
        .single()

      const plannerTasks = (dayDataForPlanner?.planner_tasks as Array<{ id: string; text: string; completed: boolean }>) || []
      
      // Get current day to check if we should show planner tasks
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("current_day")
        .eq("user_id", user.id)
        .single()

      const isCurrentDay = progressData?.current_day === dayNumber

      if (tasks && tasks.length > 0) {
        // Load user progress for tasks
        const { data: taskProgress } = await supabase
          .from("program_day_user_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("day_number", dayNumber)

        const tasksWithProgress: Task[] = tasks.map((task) => {
          const progress = taskProgress?.find((tp) => tp.task_id === task.id)
          const titleKey = `title_${language}` as keyof typeof task
          const descKey = `description_${language}` as keyof typeof task

          return {
            id: task.id,
            title: (task[titleKey] || task.title_pt) as string,
            description: (task[descKey] || task.description_pt) as string | undefined,
            task_type: task.task_type,
            xp_reward: task.xp_reward,
            is_required: task.is_required,
            completed: progress?.completed || false,
          }
        })

        // Add planner tasks if this is the current day
        if (isCurrentDay && plannerTasks.length > 0) {
          const plannerTasksFormatted: Task[] = plannerTasks.map((pt) => ({
            id: `planner_${pt.id}`,
            title: pt.text,
            description: undefined,
            task_type: "checklist" as const,
            xp_reward: 5, // Default XP for planner tasks
            is_required: false,
            completed: pt.completed || false,
          }))

          setDayTasks([...tasksWithProgress, ...plannerTasksFormatted])
        } else {
          setDayTasks(tasksWithProgress)
        }

        // Update total_tasks in program_days
        const totalTasksCount = isCurrentDay 
          ? tasks.length + plannerTasks.length 
          : tasks.length
        await supabase
          .from("program_days")
          .update({ total_tasks: totalTasksCount })
          .eq("user_id", user.id)
          .eq("day_number", dayNumber)
      } else {
        // Only planner tasks available
        if (isCurrentDay && plannerTasks.length > 0) {
          const plannerTasksFormatted: Task[] = plannerTasks.map((pt) => ({
            id: `planner_${pt.id}`,
            title: pt.text,
            description: undefined,
            task_type: "checklist" as const,
            xp_reward: 5,
            is_required: false,
            completed: pt.completed || false,
          }))
          setDayTasks(plannerTasksFormatted)
        } else {
          setDayTasks([])
        }
      }

      // Load reflection if exists
      const { data: dayData } = await supabase
        .from("program_days")
        .select("reflection_text")
        .eq("user_id", user.id)
        .eq("day_number", dayNumber)
        .single()

      if (dayData?.reflection_text) {
        setReflectionText(dayData.reflection_text)
      } else {
        setReflectionText("")
      }
    } catch (error) {
      console.error("Error loading day details:", error)
      toast.error(language === "pt" ? "Erro ao carregar detalhes do dia" : "Error loading day details")
    }
  }

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !selectedDay) return
      
      // Don't allow task changes if day is completed
      const day = programDays.find((d) => d.day_number === selectedDay)
      if (day?.completed) {
        toast.info(
          language === "pt"
            ? "Este dia já foi completado. Não é possível alterar as tarefas."
            : "This day has already been completed. Tasks cannot be changed."
        )
        return
      }

      // Check if this is a planner task
      const isPlannerTask = taskId.startsWith("planner_")
      
      if (isPlannerTask) {
        // Update planner task in program_days
        const { data: dayData } = await supabase
          .from("program_days")
          .select("planner_tasks, current_day")
          .eq("user_id", user.id)
          .eq("day_number", selectedDay)
          .single()

        if (dayData?.planner_tasks) {
          const plannerTasks = (dayData.planner_tasks as Array<{ id: string; text: string; completed: boolean }>) || []
          const actualTaskId = taskId.replace("planner_", "")
          const updatedPlannerTasks = plannerTasks.map((pt) =>
            pt.id === actualTaskId ? { ...pt, completed } : pt
          )

          await supabase
            .from("program_days")
            .update({ planner_tasks: updatedPlannerTasks })
            .eq("user_id", user.id)
            .eq("day_number", selectedDay)

          // Also sync back to daily_planner
          const today = new Date().toISOString().split("T")[0]
          const { data: plannerData } = await supabase
            .from("daily_planner")
            .select("tasks")
            .eq("user_id", user.id)
            .eq("planner_date", today)
            .single()

          if (plannerData?.tasks) {
            const dailyPlannerTasks = (plannerData.tasks as Array<{ id: string; text: string; completed: boolean }>) || []
            const updatedDailyPlannerTasks = dailyPlannerTasks.map((t) =>
              t.id === actualTaskId ? { ...t, completed } : t
            )

            await supabase
              .from("daily_planner")
              .update({ tasks: updatedDailyPlannerTasks })
              .eq("user_id", user.id)
              .eq("planner_date", today)
          }
        }
      } else {
        // Regular program task
        // Find task to get XP reward
        const task = dayTasks.find((t) => t.id === taskId)
        const xpReward = task?.xp_reward || 0

        // Update task progress
        const { error } = await supabase
          .from("program_day_user_progress")
          .upsert({
            user_id: user.id,
            day_number: selectedDay,
            task_id: taskId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })

        if (error) throw error

        // Show notification for completed tasks
        if (completed) {
          toast.success(
            language === "pt"
              ? `Tarefa concluída! +${xpReward} XP`
              : `Task completed! +${xpReward} XP`,
            {
              duration: 2000,
            }
          )
        }
      }

      // Update local state and calculate completed tasks
      const updatedTasks = dayTasks.map((task) => (task.id === taskId ? { ...task, completed } : task))
      setDayTasks(updatedTasks)

      // Update total tasks count in program_days using updated tasks
      const completedTasks = updatedTasks.filter((t) => t.completed)
      const totalTasks = updatedTasks.length

      if (!selectedDay) {
        console.error("selectedDay is null, cannot update program_days")
        return
      }

      const { error: updateError } = await supabase
        .from("program_days")
        .update({
          tasks_completed: completedTasks.length,
          total_tasks: totalTasks,
        })
        .eq("user_id", user.id)
        .eq("day_number", selectedDay)

      if (updateError) {
        console.error("Error updating program_days:", updateError)
        throw updateError
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error(language === "pt" ? "Erro ao atualizar tarefa" : "Error updating task")
    }
  }

  const handleCompleteDay = async () => {
    if (!selectedDay) return

    // Check if all required tasks are completed
    const requiredTasks = dayTasks.filter((t) => t.is_required)
    const completedRequired = requiredTasks.every((t) => t.completed)

    if (!completedRequired) {
      toast.error(
        language === "pt"
          ? "Complete todas as tarefas obrigatórias antes de finalizar o dia"
          : "Complete all required tasks before finishing the day",
        {
          duration: 3000,
        }
      )
      return
    }

    // Check if reflection is filled (optional but recommended)
    if (!reflectionText || reflectionText.trim().length < 10) {
      const shouldContinue = confirm(
        language === "pt"
          ? "Você ainda não escreveu uma reflexão. Deseja continuar mesmo assim?"
          : "You haven't written a reflection yet. Do you want to continue anyway?"
      )
      if (!shouldContinue) return
    }

    setIsCompleting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(language === "pt" ? "Usuário não autenticado" : "User not authenticated")
        setIsCompleting(false)
        return
      }

      // Validar se o dia existe e tem template antes de chamar a RPC
      const day = programDays.find((d) => d.day_number === selectedDay)
      if (!day) {
        toast.error(
          language === "pt" 
            ? "Dia não encontrado. Por favor, recarregue a página."
            : "Day not found. Please reload the page."
        )
        setIsCompleting(false)
        return
      }

      if (!day.template_id) {
        toast.error(
          language === "pt"
            ? "Template não encontrado para este dia. Entre em contato com o suporte."
            : "Template not found for this day. Please contact support."
        )
        setIsCompleting(false)
        return
      }

      // Call the complete function
      const { data, error } = await supabase.rpc("complete_program_day", {
        p_user_id: user.id,
        p_day_number: selectedDay,
        p_reflection_text: reflectionText?.trim() || null,
      })

      if (error) {
        // Melhorar extração da mensagem de erro do Supabase
        let errorMessage = error.message || error.details || error.hint
        
        // Se não houver mensagem, tentar extrair do código de erro
        if (!errorMessage && error.code) {
          errorMessage = `Erro ${error.code}: ${language === "pt" ? "Erro ao completar dia" : "Error completing day"}`
        }
        
        // Log detalhado para debug - serializar corretamente
        const errorInfo = {
          message: error.message || null,
          details: error.details || null,
          hint: error.hint || null,
          code: error.code || null,
          selectedDay,
          userId: user.id,
        }
        console.error("Error completing day - RPC Error:", JSON.stringify(errorInfo, null, 2))
        
        // Se não houver mensagem específica, usar mensagem padrão
        const finalErrorMessage = errorMessage || (language === "pt" 
          ? "Erro ao completar dia. Por favor, tente novamente ou entre em contato com o suporte."
          : "Error completing day. Please try again or contact support.")
        
        toast.error(finalErrorMessage)
        setIsCompleting(false)
        return
      }

      // Verificar se a função retornou erro
      if (!data?.success || data?.error) {
        const errorType = data?.error
        
        // Tratar erros específicos da função SQL
        let errorMessage = data?.message || (language === "pt" ? "Erro ao completar dia" : "Error completing day")
        
        switch (errorType) {
          case 'already_completed_today':
            errorMessage = language === "pt"
              ? "Você já completou um dia hoje. O próximo dia será desbloqueado amanhã."
              : "You already completed a day today. The next day will be unlocked tomorrow."
            break
          case 'day_not_found':
            errorMessage = language === "pt"
              ? "Dia não encontrado. Por favor, recarregue a página."
              : "Day not found. Please reload the page."
            break
          case 'template_not_found':
            errorMessage = language === "pt"
              ? "Template não encontrado para este dia. Entre em contato com o suporte."
              : "Template not found for this day. Please contact support."
            break
          case 'update_failed':
            errorMessage = language === "pt"
              ? "Falha ao atualizar o dia. Por favor, tente novamente."
              : "Failed to update the day. Please try again."
            break
          case 'unexpected_error':
            errorMessage = data?.message || (language === "pt"
              ? "Erro inesperado ao completar dia. Por favor, tente novamente."
              : "Unexpected error completing day. Please try again.")
            break
          default:
            // Usar mensagem padrão ou a mensagem retornada pela função
            if (!data?.message) {
              errorMessage = language === "pt"
                ? "Erro ao completar dia. Por favor, tente novamente."
                : "Error completing day. Please try again."
            }
        }
        
        console.error("Error completing day - Function returned error:", JSON.stringify(data, null, 2))
        toast.error(errorMessage, {
          duration: 5000,
        })
        setIsCompleting(false)
        return
      }

      if (data?.success) {
        const totalXpEarned = data.xp_earned || 0
        setXpEarned(totalXpEarned)
        setShowSuccess(true)

        // Reload user data to get updated progress
        await loadUserData()

        // Show success notification
        toast.success(
          language === "pt"
            ? `Dia ${selectedDay} completado! +${totalXpEarned} XP ganhos!`
            : `Day ${selectedDay} completed! +${totalXpEarned} XP earned!`,
          {
            duration: 4000,
          }
        )

        // If next day was unlocked, show notification
        if (data.next_day_unlocked && selectedDay < selectedDuration) {
          const unlockDate = data.next_day_unlock_date 
            ? new Date(data.next_day_unlock_date)
            : new Date(Date.now() + 24 * 60 * 60 * 1000) // Próximo dia por padrão
          
          setTimeout(() => {
            toast.info(
              language === "pt"
                ? `🎉 Dia ${selectedDay + 1} será desbloqueado amanhã! Continue sua jornada um dia de cada vez.`
                : `🎉 Day ${selectedDay + 1} will be unlocked tomorrow! Continue your journey one day at a time.`,
              {
                duration: 6000,
              }
            )
          }, 2000)
        }

        // Close dialog after showing success
        setTimeout(() => {
          setShowSuccess(false)
          setSelectedDay(null)
          setReflectionText("")
          setDayTasks([])
          setDayTemplate(null)
          
          // Recarregar dados para atualizar progresso
          loadUserData()
        }, 4000)
      }
    } catch (error: any) {
      // Log detalhado para debug - serializar corretamente
      const errorInfo: Record<string, any> = {
        errorType: typeof error,
        errorConstructor: error?.constructor?.name || null,
        selectedDay,
      }
      
      // Tentar extrair informações serializáveis do erro
      if (error?.message) errorInfo.message = error.message
      if (error?.details) errorInfo.details = error.details
      if (error?.hint) errorInfo.hint = error.hint
      if (error?.code) errorInfo.code = error.code
      if (error?.stack) errorInfo.stack = error.stack
      
      // Se o erro for um objeto Supabase, extrair propriedades conhecidas
      if (typeof error === 'object' && error !== null) {
        try {
          // Tentar serializar apenas propriedades conhecidas
          const serializableError = {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
          errorInfo.serializedError = JSON.stringify(serializableError)
        } catch (e) {
          // Ignorar erro de serialização
        }
      }
      
      console.error("Error completing day - Catch block:", JSON.stringify(errorInfo, null, 2))
      
      // Melhorar extração da mensagem de erro
      let errorMessage = error?.message || error?.details || error?.hint
      
      // Se houver código de erro, adicionar contexto
      if (error?.code && !errorMessage) {
        errorMessage = language === "pt"
          ? `Erro ${error.code}: Falha ao completar dia`
          : `Error ${error.code}: Failed to complete day`
      }
      
      // Mensagem padrão se ainda não tiver nada
      if (!errorMessage || errorMessage === "{}" || errorMessage === "[object Object]") {
        errorMessage = language === "pt" 
          ? "Erro ao completar dia. Por favor, verifique sua conexão e tente novamente. Se o problema persistir, entre em contato com o suporte."
          : "Error completing day. Please check your connection and try again. If the problem persists, contact support."
      }
      
      toast.error(errorMessage)
    } finally {
      setIsCompleting(false)
    }
  }

  const getDayStatus = (dayNumber: number): "completed" | "current" | "locked" | "upcoming" => {
    const day = programDays.find((d) => d.day_number === dayNumber)
    if (!day) return "locked"

    if (day.completed) return "completed"
    
    // Verificar se o dia está desbloqueado (unlocked_at deve ser no passado ou hoje)
    // Comparar apenas a data, não a hora, para permitir acesso no mesmo dia
    if (day.unlocked_at) {
      const unlockDate = new Date(day.unlocked_at)
      unlockDate.setHours(0, 0, 0, 0)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      
      // Se a data de desbloqueio já passou (incluindo hoje), está disponível
      if (unlockDate <= now) {
        return "current"
      }
      // Se ainda não chegou a data, verificar se é o próximo dia e o usuário já completou hoje
      if (unlockDate > now && hasCompletedToday) {
        // Verificar se é o próximo dia após o último dia completo
        const lastCompletedDay = programDays
          .filter((d) => d.completed)
          .sort((a, b) => (b.day_number || 0) - (a.day_number || 0))[0]
        
        if (lastCompletedDay && dayNumber === lastCompletedDay.day_number + 1) {
          return "upcoming"
        }
      }
      // Se ainda não chegou a data, está bloqueado
      return "locked"
    }
    
    // Dia 1 sempre está disponível (se não tiver unlocked_at definido)
    if (dayNumber === 1) return "current"
    
    return "locked"
  }

  // Generate week groups based on selected duration
  const weeks = []
  // Sempre usar selectedDuration como prioridade, pois é o valor mais atual selecionado pelo usuário
  const totalDays = selectedDuration || userProgress.totalDays || 90
  for (let i = 0; i < totalDays; i += 7) {
    const weekDays = []
    for (let j = 1; j <= 7 && i + j <= totalDays; j++) {
      const day = i + j
      const status = getDayStatus(day)
      weekDays.push({ day, status })
    }
    weeks.push({
      number: Math.floor(i / 7) + 1,
      days: weekDays,
    })
  }
  
  // Also include the next day if it's upcoming (visible but not clickable)
  // Mas apenas se estiver dentro da duração selecionada
  const nextDayNumber = programDays
    .filter((d) => d.completed)
    .sort((a, b) => (b.day_number || 0) - (a.day_number || 0))[0]?.day_number || 0
  
  if (nextDayNumber > 0 && nextDayNumber < totalDays) {
    const nextDay = nextDayNumber + 1
    // Só adicionar se o próximo dia estiver dentro da duração selecionada
    if (nextDay <= totalDays) {
      const nextDayStatus = getDayStatus(nextDay)
      if (nextDayStatus === "upcoming") {
        // Find the week that should contain this day
        const weekIndex = Math.floor((nextDay - 1) / 7)
        if (weeks[weekIndex]) {
          // Check if the day is not already in the week
          if (!weeks[weekIndex].days.find((d) => d.day === nextDay)) {
            weeks[weekIndex].days.push({ day: nextDay, status: "upcoming" })
            weeks[weekIndex].days.sort((a, b) => a.day - b.day)
          }
        }
      }
    }
  }

  const canUnlockDay = (dayNumber: number): boolean => {
    if (dayNumber === 1) return true
    const previousDay = programDays.find((d) => d.day_number === dayNumber - 1)
    return previousDay?.completed || false
  }

  const handleDayClick = async (dayNumber: number) => {
    const status = getDayStatus(dayNumber)
    
    // Verificar se o dia está bloqueado por data
    const day = programDays.find((d) => d.day_number === dayNumber)
    if (day?.unlocked_at) {
      const unlockDate = new Date(day.unlocked_at)
      const now = new Date()
      if (unlockDate > now) {
        // Calcular quando será desbloqueado
        const hoursUntilUnlock = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        const daysUntilUnlock = Math.ceil(hoursUntilUnlock / 24)
        
        toast.info(
          language === "pt"
            ? `Este dia será desbloqueado ${daysUntilUnlock === 1 ? 'amanhã' : `em ${daysUntilUnlock} dias`}. Complete um dia por vez para manter o progresso consistente.`
            : `This day will be unlocked ${daysUntilUnlock === 1 ? 'tomorrow' : `in ${daysUntilUnlock} days`}. Complete one day at a time to maintain consistent progress.`,
          {
            duration: 5000,
          }
        )
        return
      }
    }
    
    if (status === "locked" && !canUnlockDay(dayNumber)) {
      toast.info(
        language === "pt"
          ? `Complete o dia ${dayNumber - 1} para desbloquear este dia`
          : `Complete day ${dayNumber - 1} to unlock this day`,
        {
          duration: 3000,
        }
      )
      return
    }

    if (status === "current" || (status === "locked" && canUnlockDay(dayNumber))) {
      setSelectedDay(dayNumber)
    } else if (status === "completed") {
      // Allow viewing completed days
      setSelectedDay(dayNumber)
    }
  }

  const navigateToDay = (direction: "prev" | "next") => {
    if (!selectedDay) return

    const completedDays = programDays
      .filter((d) => d.completed)
      .map((d) => d.day_number)
      .sort((a, b) => a - b)

    if (direction === "prev") {
      // Find previous completed day
      const prevDay = completedDays.filter((d) => d < selectedDay).pop()
      if (prevDay) {
        setSelectedDay(prevDay)
      }
    } else {
      // Find next completed day
      const nextDay = completedDays.find((d) => d > selectedDay)
      if (nextDay) {
        setSelectedDay(nextDay)
      }
    }
  }

  const getCompletedDays = () => {
    return programDays
      .filter((d) => d.completed)
      .map((d) => d.day_number)
      .sort((a, b) => a - b)
  }

  const canNavigatePrev = () => {
    if (!selectedDay) return false
    const completedDays = getCompletedDays()
    return completedDays.some((d) => d < selectedDay)
  }

  const canNavigateNext = () => {
    if (!selectedDay) return false
    const completedDays = getCompletedDays()
    return completedDays.some((d) => d > selectedDay)
  }

  const isDayCompleted = () => {
    if (!selectedDay) return false
    const day = programDays.find((d) => d.day_number === selectedDay)
    return day?.completed || false
  }

  const currentDayData = programDays.find((d) => d.day_number === userProgress.currentDay)
  
  // Verificar se todas as tarefas obrigatórias estão completas
  const requiredTasks = dayTasks.filter((t) => t.is_required)
  const allRequiredTasksCompleted = 
    requiredTasks.length === 0 || // Se não há tarefas obrigatórias, permite completar
    (requiredTasks.length > 0 && requiredTasks.every((t) => t.completed))
  
  // Verificar se há tarefas (se não houver tarefas, permite completar se houver template)
  const hasTasks = dayTasks.length > 0
  const canComplete = allRequiredTasksCompleted && (hasTasks || dayTemplate)

  if (isLoading) {
    return (
      <div className="min-h-screen starry-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === "pt" ? "Carregando..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen starry-background relative pb-24">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64", "relative z-10")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8 relative z-10">
          {/* Progress Header */}
          <Card className="p-5 md:p-6 venser-card-glow relative z-10">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {language === "pt"
                      ? `Jornada de ${selectedDuration} Dias`
                      : language === "es"
                      ? `Viaje de ${selectedDuration} Días`
                      : `${selectedDuration}-Day Journey`}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === "pt"
                      ? `Sua jornada de transformação em ${selectedDuration} dias`
                      : `Your ${selectedDuration}-day transformation journey`}
                  </p>
                </div>
                
                {/* Duration Selector */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "pt" ? "Duração da Jornada" : "Journey Duration"}
                  </label>
                  <Select
                    value={selectedDuration.toString()}
                    onValueChange={(value) => setSelectedDuration(Number(value))}
                  >
                    <SelectTrigger 
                      className={cn(
                        "w-full sm:w-[180px]",
                        selectedDuration === 90 && "border-[oklch(0.54_0.18_285)] bg-gradient-to-r from-[oklch(0.54_0.18_285)]/5 to-[oklch(0.7_0.15_220)]/5"
                      )}
                    >
                      <SelectValue placeholder={language === "pt" ? "Selecione a duração" : "Select duration"} />
                    </SelectTrigger>
                    <SelectContent>
                      {programDurations.map((duration) => {
                        const durationText = `${duration} ${language === "pt" ? "dias" : "days"}`
                        return (
                          <SelectItem 
                            key={duration} 
                            value={duration.toString()}
                            textValue={durationText}
                            className={duration === 90 ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 text-[oklch(0.54_0.18_285)] font-semibold" : ""}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{durationText}</span>
                              {duration === 90 && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white">
                                  {language === "pt" ? "recomendado" : language === "es" ? "recomendado" : "recommended"}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[oklch(0.68_0.18_45)]" />
                    <span className="text-lg font-bold text-[oklch(0.68_0.18_45)]">
                      {userProgress.totalXp} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-[oklch(0.68_0.18_45)]" />
                    <span className="text-lg font-bold text-[oklch(0.68_0.18_45)]">
                      {userProgress.currentStreak} {t.days}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {userProgress.currentDay} / {selectedDuration}
                  </span>
                  <span>{Math.round((userProgress.currentDay / selectedDuration) * 100)}%</span>
                </div>
                <Progress value={(userProgress.currentDay / selectedDuration) * 100} className="h-2" />
              </div>
            </div>
          </Card>


          {/* Week Grid */}
          {weeks.map((week) => (
            <div key={week.number} className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">
                {t.week} {week.number}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
                {week.days.map((dayData) => (
                  <DayCard
                    key={dayData.day}
                    day={dayData.day}
                    status={dayData.status}
                    streak={dayData.status === "current" && userProgress.currentStreak >= 7}
                    onClick={() => handleDayClick(dayData.day)}
                    language={language}
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
        <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header com gradiente */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.7_0.15_220)]/20 border-b border-white/10">
            <DialogHeader className="text-left">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-1">
                  {/* Botão navegação anterior */}
                  {isDayCompleted() && canNavigatePrev() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateToDay("prev")}
                      className="h-8 w-8 shrink-0"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 relative">
                    <span className="text-white font-bold text-lg">{selectedDay}</span>
                    {isDayCompleted() && (
                      <div className="absolute -top-1 -right-1">
                        <Check className="h-4 w-4 text-[oklch(0.68_0.18_45)] bg-background rounded-full p-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                      {dayTemplate 
                        ? (language === "pt" ? dayTemplate.title_pt : language === "es" ? dayTemplate.title_es : dayTemplate.title_en)
                        : `${language === "pt" ? "Dia" : "Day"} ${selectedDay}`
                      }
                    </DialogTitle>
                    {isDayCompleted() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" ? "Dia completado" : "Day completed"}
                      </p>
                    )}
                  </div>
                  
                  {/* Botão navegação próximo */}
                  {isDayCompleted() && canNavigateNext() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateToDay("next")}
                      className="h-8 w-8 shrink-0"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {isDayCompleted() 
                  ? (language === "pt"
                      ? "Revise as informações e reflexões deste dia completado"
                      : "Review the information and reflections from this completed day")
                  : (language === "pt"
                      ? "Complete todas as tarefas e faça sua reflexão para desbloquear o próximo dia"
                      : "Complete all tasks and make your reflection to unlock the next day")
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Conteúdo scrollável */}
          {dayTemplate && (
            <>
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {/* Day Content */}
                <ProgramDayContent
                  title={language === "pt" ? dayTemplate.title_pt : language === "es" ? dayTemplate.title_es : dayTemplate.title_en || dayTemplate.title_pt}
                  contentText={language === "pt" ? dayTemplate.content_text_pt : language === "es" ? dayTemplate.content_text_es : dayTemplate.content_text_en || dayTemplate.content_text_pt}
                  contentAudioUrl={dayTemplate.content_audio_url}
                  contentVideoUrl={dayTemplate.content_video_url}
                  motivationalQuote={language === "pt" ? dayTemplate.motivational_quote_pt : language === "es" ? dayTemplate.motivational_quote_es : dayTemplate.motivational_quote_en || dayTemplate.motivational_quote_pt}
                  language={language}
                />

                {/* Tasks Checklist */}
                {dayTasks.length > 0 && (
                  <ProgramDayChecklist
                    tasks={dayTasks}
                    onTaskComplete={handleTaskComplete}
                    language={language}
                    disabled={isDayCompleted()}
                  />
                )}

                {/* Reflection */}
                <ProgramDayReflection
                  reflectionText={reflectionText}
                  onReflectionChange={setReflectionText}
                  language={language}
                  disabled={isDayCompleted()}
                />
              </div>

              {/* Footer fixo com botão */}
              {!isDayCompleted() && (
                <div className="px-4 md:px-6 py-3 md:py-4 border-t border-white/10 bg-background/95 backdrop-blur-sm sticky bottom-0 z-10">
                  <div className="space-y-2">
                    {!canComplete && dayTasks.length > 0 && (
                      <p className="text-xs md:text-sm text-muted-foreground text-center">
                        {language === "pt"
                          ? "Complete todas as tarefas obrigatórias para finalizar o dia"
                          : "Complete all required tasks to finish the day"}
                      </p>
                    )}
                    {canComplete && !isCompleting && (
                      <p className="text-xs md:text-sm text-green-400/80 text-center">
                        {language === "pt"
                          ? "✓ Pronto para completar o dia!"
                          : "✓ Ready to complete the day!"}
                      </p>
                    )}
                    <Button
                      size="lg"
                      onClick={handleCompleteDay}
                      disabled={!canComplete || isCompleting}
                      className="w-full h-12 md:h-14 bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity font-semibold"
                    >
                      {isCompleting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {language === "pt" ? "Completando..." : "Completing..."}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          {language === "pt" ? "Completar Dia e Desbloquear Próximo" : "Complete Day and Unlock Next"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {isDayCompleted() && (
                <div className="px-4 md:px-6 py-3 md:py-4 border-t border-white/10 bg-background/95 backdrop-blur-sm sticky bottom-0 z-10">
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    {language === "pt"
                      ? "Este dia já foi completado. Use os botões de navegação para revisar outros dias."
                      : "This day has already been completed. Use the navigation buttons to review other days."}
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {language === "pt" ? "Dia Completado!" : "Day Completed!"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow animate-bounce">
                <Check className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {language === "pt" ? "Dia Completado!" : "Day Completed!"}
              </h2>
              <p className="text-muted-foreground">
                {language === "pt"
                  ? "Parabéns! Você está progredindo na sua jornada de transformação."
                  : "Congratulations! You're making progress on your transformation journey."}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[oklch(0.68_0.18_45)]">
                <Star className="h-6 w-6" />
                <span>+{xpEarned} XP</span>
              </div>
              {selectedDay && selectedDay < userProgress.totalDays && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === "pt"
                      ? "Próximo dia desbloqueado!"
                      : "Next day unlocked!"}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-[oklch(0.68_0.18_45)]" />
                    <span className="font-semibold">
                      {language === "pt" ? "Dia" : "Day"} {selectedDay + 1}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
