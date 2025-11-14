"use client"

import { useState, useEffect, useCallback } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MissionCard } from "@/components/mission-card"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useSidebar } from "@/lib/sidebar-context"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ProgressRing } from "@/components/progress-ring"
import { 
  Target, 
  CheckSquare, 
  Zap, 
  Trophy, 
  Heart, 
  Smile, 
  Plus, 
  Trash2, 
  Save,
  Calendar,
  Sparkles,
  Flame,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Award,
  Wind,
  BookOpen,
  FileText,
  ListChecks
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Task {
  id: string
  text: string
  completed: boolean
}

interface Trigger {
  id: string
  text: string
  intensity: "leve" | "moderado" | "forte"
}

interface DailyPlannerData {
  daily_goal: string | null
  tasks: Task[]
  triggers: Trigger[]
  reward: string | null
  reflection: string | null
  mood: string | null
}

interface Mission {
  id: number
  icon: typeof Wind
  title: string
  xp: number
  completed: boolean
}

const getMoodOptions = (language: string) => {
  if (language === "pt") {
    return [
      { emoji: "😞", label: "Triste", message: "Dias difíceis também constroem força." },
      { emoji: "😐", label: "Neutro", message: "Você está equilibrado. Continue firme." },
      { emoji: "🙂", label: "Bem", message: "Você está equilibrado. Continue firme." },
      { emoji: "😄", label: "Feliz", message: "Essa energia é o combustível do seu propósito." },
      { emoji: "😎", label: "Excelente", message: "Essa energia é o combustível do seu propósito." },
    ]
  } else if (language === "es") {
    return [
      { emoji: "😞", label: "Triste", message: "Los días difíciles también construyen fuerza." },
      { emoji: "😐", label: "Neutral", message: "Estás equilibrado. Sigue firme." },
      { emoji: "🙂", label: "Bien", message: "Estás equilibrado. Sigue firme." },
      { emoji: "😄", label: "Feliz", message: "Esta energía es el combustible de tu propósito." },
      { emoji: "😎", label: "Excelente", message: "Esta energía es el combustible de tu propósito." },
    ]
  } else {
    return [
      { emoji: "😞", label: "Sad", message: "Difficult days also build strength." },
      { emoji: "😐", label: "Neutral", message: "You are balanced. Stay firm." },
      { emoji: "🙂", label: "Good", message: "You are balanced. Stay firm." },
      { emoji: "😄", label: "Happy", message: "This energy is the fuel of your purpose." },
      { emoji: "😎", label: "Excellent", message: "This energy is the fuel of your purpose." },
    ]
  }
}

const getMoodMessage = (emoji: string, language: string): string => {
  const options = getMoodOptions(language)
  const mood = options.find(m => m.emoji === emoji)
  return mood?.message || ""
}

export default function TasksPage() {
  const { language } = useLanguage()
  const { collapsed } = useSidebar()
  const t = translations[language]
  const [activeTab, setActiveTab] = useState("missions")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Missions state
  const [missions, setMissions] = useState<Mission[]>([
    { id: 1, icon: Wind, title: t.mission1, xp: 10, completed: false },
    { id: 2, icon: BookOpen, title: t.mission2, xp: 15, completed: false },
    { id: 3, icon: FileText, title: t.mission3, xp: 20, completed: false },
    { id: 4, icon: Brain, title: t.mission4, xp: 25, completed: false },
    { id: 5, icon: Smile, title: t.mission5, xp: 10, completed: false },
  ])

  // Planner state
  const [plannerData, setPlannerData] = useState<DailyPlannerData>({
    daily_goal: null,
    tasks: [],
    triggers: [],
    reward: null,
    reflection: null,
    mood: null,
  })

  const [newTaskText, setNewTaskText] = useState("")
  const [newTriggerText, setNewTriggerText] = useState("")
  const [newTriggerIntensity, setNewTriggerIntensity] = useState<"leve" | "moderado" | "forte">("leve")
  const [userProgress, setUserProgress] = useState({
    currentStreak: 0,
    totalDaysClean: 0,
    completionRate: 0,
  })
  const [tonyMessage, setTonyMessage] = useState("")
  const [goalFeedback, setGoalFeedback] = useState(false)
  const [goalWasEmpty, setGoalWasEmpty] = useState(true)
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())
  const [allTasksCompletedShown, setAllTasksCompletedShown] = useState(false)
  const [triggerFeedbackShown, setTriggerFeedbackShown] = useState<Set<string>>(new Set())
  const [reflectionActive, setReflectionActive] = useState(false)
  const [selectedMoodMessage, setSelectedMoodMessage] = useState("")
  const [tonyFinalMessageShown, setTonyFinalMessageShown] = useState(false)

  // Load user progress
  const loadUserProgress = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: progress } = await supabase
        .from("user_progress")
        .select("current_streak, total_days_clean, longest_streak")
        .eq("user_id", user.id)
        .single()

      if (progress) {
        setUserProgress({
          currentStreak: progress.current_streak || 0,
          totalDaysClean: progress.total_days_clean || 0,
          completionRate: progress.total_days_clean > 0 ? Math.min(100, (progress.current_streak / progress.total_days_clean) * 100) : 0,
        })
      }
    } catch (error) {
      console.error("Error loading user progress:", error)
    }
  }, [])

  // Load planner data
  const loadPlannerData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(language === "pt" ? "Faça login para acessar as tarefas" : "Please login to access tasks")
        return
      }

      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("daily_planner")
        .select("*")
        .eq("user_id", user.id)
        .eq("planner_date", today)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setPlannerData({
          daily_goal: data.daily_goal || null,
          tasks: (data.tasks as Task[]) || [],
          triggers: (data.triggers as Trigger[]) || [],
          reward: data.reward || null,
          reflection: data.reflection || null,
          mood: data.mood || null,
        })
        setLastSaved(new Date(data.updated_at))
        setGoalWasEmpty(!data.daily_goal || data.daily_goal.trim() === "")
        setReflectionActive(!!(data.reflection && data.reflection.trim().length > 0))
        if (data.mood) {
          const moodMessage = getMoodMessage(data.mood, language)
          setSelectedMoodMessage(moodMessage)
        }
      } else {
        setPlannerData({
          daily_goal: null,
          tasks: [],
          triggers: [],
          reward: null,
          reflection: null,
          mood: null,
        })
        setGoalWasEmpty(true)
        setReflectionActive(false)
      }
    } catch (error) {
      console.error("Error loading planner data:", error)
      toast.error(language === "pt" ? "Erro ao carregar tarefas" : "Error loading tasks")
    } finally {
      setIsLoading(false)
    }
  }, [language])

  useEffect(() => {
    loadPlannerData()
    loadUserProgress()
  }, [loadPlannerData, loadUserProgress])

  // Auto-save with debounce
  useEffect(() => {
    if (isLoading) return

    const timeoutId = setTimeout(async () => {
      await savePlannerData()
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [plannerData, isLoading])

  const savePlannerData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        return
      }

      setIsSaving(true)

      const today = new Date().toISOString().split("T")[0]

      const tasksArray = Array.isArray(plannerData.tasks) ? plannerData.tasks : []
      const triggersArray = Array.isArray(plannerData.triggers) ? plannerData.triggers : []

      const dailyGoal = plannerData.daily_goal?.trim() || null
      const reward = plannerData.reward?.trim() || null
      const reflection = plannerData.reflection?.trim() || null
      const mood = plannerData.mood?.trim() || null

      const payload = {
        user_id: user.id,
        planner_date: today,
        daily_goal: dailyGoal,
        tasks: tasksArray,
        triggers: triggersArray,
        reward: reward,
        reflection: reflection,
        mood: mood,
      }

      const { data, error } = await supabase
        .from("daily_planner")
        .upsert(payload, {
          onConflict: "user_id,planner_date",
        })
        .select()

      if (error) {
        throw error
      }

      setLastSaved(new Date())
    } catch (error: any) {
      console.error("Error saving planner data:", error)
      const errorMessage = error?.message || error?.details || error?.hint || 
        (language === "pt" ? "Erro desconhecido ao salvar" : "Unknown error saving")
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const playCompletionSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.debug("Audio not available")
    }
  }, [])

  // Missions functions
  const completeMission = (id: number) => {
    setMissions((prev) => prev.map((mission) => (mission.id === id ? { ...mission, completed: true } : mission)))
  }

  const totalXP = missions.reduce((sum, m) => sum + m.xp, 0)
  const earnedXP = missions.filter((m) => m.completed).reduce((sum, m) => sum + m.xp, 0)
  const missionsProgress = totalXP > 0 ? (earnedXP / totalXP) * 100 : 0
  const allMissionsComplete = missions.every((m) => m.completed)

  // Planner functions
  const addTask = () => {
    if (!newTaskText.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    }

    setPlannerData({
      ...plannerData,
      tasks: [...plannerData.tasks, newTask],
    })

    setNewTaskText("")
  }

  const toggleTask = (taskId: string) => {
    const task = plannerData.tasks.find(t => t.id === taskId)
    const isCompleting = task && !task.completed

    setPlannerData({
      ...plannerData,
      tasks: plannerData.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    })

    if (isCompleting) {
      playCompletionSound()
      setCompletedTaskIds(prev => new Set([...prev, taskId]))
      setTimeout(() => {
        setCompletedTaskIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(taskId)
          return newSet
        })
      }, 1000)
    }

    if (task && task.completed) {
      setAllTasksCompletedShown(false)
    }
  }

  const deleteTask = (taskId: string) => {
    setPlannerData({
      ...plannerData,
      tasks: plannerData.tasks.filter((task) => task.id !== taskId),
    })
  }

  const addTrigger = () => {
    if (!newTriggerText.trim()) return

    const newTrigger: Trigger = {
      id: Date.now().toString(),
      text: newTriggerText.trim(),
      intensity: newTriggerIntensity,
    }

    setPlannerData({
      ...plannerData,
      triggers: [...plannerData.triggers, newTrigger],
    })

    setTimeout(() => {
      toast.success(
        language === "pt" 
          ? "Perceber o gatilho já é 50% do controle. 🎯"
          : language === "es"
          ? "Reconocer el gatillo ya es 50% del control. 🎯"
          : "Recognizing the trigger is already 50% of control. 🎯",
        {
          duration: 4000,
          style: {
            background: "linear-gradient(to right, oklch(0.7 0.18 30), oklch(0.68 0.18 45))",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          },
        }
      )
    }, 300)

    setNewTriggerText("")
    setNewTriggerIntensity("leve")
  }

  const deleteTrigger = (triggerId: string) => {
    setPlannerData({
      ...plannerData,
      triggers: plannerData.triggers.filter((trigger) => trigger.id !== triggerId),
    })
  }

  const updateTriggerIntensity = (triggerId: string, intensity: "leve" | "moderado" | "forte") => {
    setPlannerData({
      ...plannerData,
      triggers: plannerData.triggers.map((trigger) =>
        trigger.id === triggerId ? { ...trigger, intensity } : trigger
      ),
    })

    if (!triggerFeedbackShown.has(triggerId)) {
      setTriggerFeedbackShown(prev => new Set([...prev, triggerId]))
      setTimeout(() => {
        toast.success(
          language === "pt" 
            ? "Perceber o gatilho já é 50% do controle. 🎯"
            : language === "es"
            ? "Reconocer el gatillo ya es 50% del control. 🎯"
            : "Recognizing the trigger is already 50% of control. 🎯",
          {
            duration: 4000,
            style: {
              background: "linear-gradient(to right, oklch(0.7 0.18 30), oklch(0.68 0.18 45))",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
          }
        )
      }, 300)
    }
  }

  const getIntensityColor = (intensity: "leve" | "moderado" | "forte") => {
    switch (intensity) {
      case "leve":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "moderado":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "forte":
        return "bg-red-500/20 text-red-400 border-red-500/30"
    }
  }

  const getIntensityCardColor = (intensity: "leve" | "moderado" | "forte") => {
    switch (intensity) {
      case "leve":
        return "from-green-500/10 to-green-500/5 border-green-500/20"
      case "moderado":
        return "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20"
      case "forte":
        return "from-red-500/10 to-red-500/5 border-red-500/20"
    }
  }

  const calculateDailyProgress = () => {
    const totalItems = 1 + plannerData.tasks.length + plannerData.triggers.length + (plannerData.reward ? 1 : 0) + (plannerData.reflection ? 1 : 0) + (plannerData.mood ? 1 : 0)
    const completedItems = (plannerData.daily_goal ? 1 : 0) + 
      plannerData.tasks.filter(t => t.completed).length + 
      plannerData.triggers.length + 
      (plannerData.reward ? 1 : 0) + 
      (plannerData.reflection ? 1 : 0) + 
      (plannerData.mood ? 1 : 0)
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  }

  const dailyProgress = calculateDailyProgress()

  const generateTonyMessage = () => {
    const progress = dailyProgress
    const hasGoal = !!plannerData.daily_goal
    const completedTasks = plannerData.tasks.filter(t => t.completed).length
    const totalTasks = plannerData.tasks.length

    if (language === "pt") {
      if (progress === 100) {
        return "Incrível! Você completou tudo hoje! 🎉 Cada passo que você dá está fortalecendo sua jornada. Continue assim, você está no caminho certo!"
      } else if (progress >= 70) {
        return "Excelente progresso! Você está quase lá! 💪 Lembre-se: pequenos passos consistentes levam a grandes transformações. Continue!"
      } else if (hasGoal && completedTasks > 0) {
        return "Bom trabalho até agora! 🌟 Você já definiu seu objetivo e está completando tarefas. Isso é progresso real! Continue avançando."
      } else if (hasGoal) {
        return "Ótimo começo! Você já definiu seu objetivo do dia. Agora é hora de transformar esse objetivo em ação. Você consegue! 🚀"
      } else {
        return "Olá! Estou aqui para te apoiar na sua jornada. Comece definindo seu objetivo do dia - isso vai te dar direção e propósito. Vamos juntos! 💚"
      }
    } else if (language === "es") {
      if (progress === 100) {
        return "¡Increíble! ¡Completaste todo hoy! 🎉 Cada paso que das está fortaleciendo tu viaje. ¡Sigue así, vas por buen camino!"
      } else if (progress >= 70) {
        return "¡Excelente progreso! ¡Ya casi estás ahí! 💪 Recuerda: pequeños pasos consistentes llevan a grandes transformaciones. ¡Continúa!"
      } else if (hasGoal && completedTasks > 0) {
        return "¡Buen trabajo hasta ahora! 🌟 Ya definiste tu objetivo y estás completando tareas. ¡Eso es progreso real! Sigue avanzando."
      } else if (hasGoal) {
        return "¡Buen comienzo! Ya definiste tu objetivo del día. Ahora es hora de transformar ese objetivo en acción. ¡Tú puedes! 🚀"
      } else {
        return "¡Hola! Estoy aquí para apoyarte en tu viaje. Comienza definiendo tu objetivo del día - esto te dará dirección y propósito. ¡Vamos juntos! 💚"
      }
    } else {
      if (progress === 100) {
        return "Amazing! You've completed everything today! 🎉 Every step you take is strengthening your journey. Keep going, you're on the right track!"
      } else if (progress >= 70) {
        return "Excellent progress! You're almost there! 💪 Remember: small consistent steps lead to great transformations. Keep going!"
      } else if (hasGoal && completedTasks > 0) {
        return "Good work so far! 🌟 You've already set your goal and are completing tasks. That's real progress! Keep moving forward."
      } else if (hasGoal) {
        return "Great start! You've already set your daily goal. Now it's time to turn that goal into action. You've got this! 🚀"
      } else {
        return "Hello! I'm here to support you on your journey. Start by setting your daily goal - this will give you direction and purpose. Let's go together! 💚"
      }
    }
  }

  const generateTonyFinalMessage = () => {
    if (language === "pt") {
      return "Anotei suas evoluções de hoje. Você está se tornando alguém que domina a si mesmo. Amanhã, continue com essa clareza. 💪"
    } else if (language === "es") {
      return "Anoté tus evoluciones de hoy. Te estás convirtiendo en alguien que se domina a sí mismo. Mañana, continúa con esa claridad. 💪"
    } else {
      return "I've noted your progress today. You're becoming someone who masters themselves. Tomorrow, continue with this clarity. 💪"
    }
  }

  useEffect(() => {
    const message = generateTonyMessage()
    setTonyMessage(message)
  }, [plannerData, language])

  useEffect(() => {
    const hasGoal = !!plannerData.daily_goal && plannerData.daily_goal.trim().length > 0
    const hasTasks = plannerData.tasks.length > 0
    const hasTriggers = plannerData.triggers.length > 0
    const hasReward = !!plannerData.reward && plannerData.reward.trim().length > 0
    const hasReflection = !!plannerData.reflection && plannerData.reflection.trim().length > 0
    const hasMood = !!plannerData.mood

    const allFieldsCompleted = hasGoal && hasTasks && hasTriggers && hasReward && hasReflection && hasMood

    if (allFieldsCompleted && !tonyFinalMessageShown) {
      setTonyFinalMessageShown(true)
      setTimeout(() => {
        const finalMessage = generateTonyFinalMessage()
        toast.success(
          finalMessage,
          {
            duration: 8000,
            style: {
              background: "linear-gradient(to right, oklch(0.54 0.18 285), oklch(0.7 0.15 220))",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "16px",
              padding: "16px",
            },
          }
        )
        setTonyMessage(finalMessage)
      }, 1000)
    } else if (!allFieldsCompleted) {
      setTonyFinalMessageShown(false)
    }
  }, [plannerData, tonyFinalMessageShown, language])

  useEffect(() => {
    if (plannerData.tasks.length > 0) {
      const allCompleted = plannerData.tasks.every(task => task.completed)
      if (allCompleted && !allTasksCompletedShown) {
        setAllTasksCompletedShown(true)
        setTimeout(() => {
          toast.success(
            language === "pt" 
              ? "Você cumpriu sua palavra hoje. Isso é raro — e poderoso. 💪"
              : "You kept your word today. That's rare — and powerful. 💪",
            {
              duration: 5000,
              style: {
                background: "linear-gradient(to right, oklch(0.68 0.18 45), oklch(0.7 0.18 30))",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              },
            }
          )
        }, 500)
      } else if (!allCompleted) {
        setAllTasksCompletedShown(false)
      }
    }
  }, [plannerData.tasks, allTasksCompletedShown, language])

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
        <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <ListChecks className="h-8 w-8 text-[oklch(0.68_0.18_45)] animate-pulse" />
                {t.tasksNav}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {language === "pt"
                  ? "Missões diárias e planejamento para sua jornada de transformação"
                  : "Daily missions and planning for your transformation journey"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  {t.saving}
                </span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-xs text-green-400/80 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.saved}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="missions" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t.missions}
              </TabsTrigger>
              <TabsTrigger value="planner" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t.planner}
              </TabsTrigger>
            </TabsList>

            {/* Missions Tab */}
            <TabsContent value="missions" className="space-y-6">
              {/* Progress Card */}
              <Card className="p-6 md:p-8 venser-card-glow">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.progressToday}</h2>
                    <p className="text-muted-foreground">
                      {missions.filter((m) => m.completed).length} / {missions.length} {t.completed}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        XP: {earnedXP} / {totalXP}
                      </span>
                      <span className="font-semibold text-[oklch(0.54_0.18_285)]">{Math.round(missionsProgress)}%</span>
                    </div>
                    <Progress value={missionsProgress} className="h-4" />
                  </div>

                  {allMissionsComplete && (
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
            </TabsContent>

            {/* Planner Tab */}
            <TabsContent value="planner" className="space-y-6">
              {/* Progress Header */}
              <Card className="p-6 md:p-8 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 via-[oklch(0.7_0.15_220)]/20 to-[oklch(0.68_0.18_45)]/20 border-[oklch(0.54_0.18_285)]/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-6 w-6 text-[oklch(0.68_0.18_45)]" />
                      <h2 className="text-2xl font-bold">
                        {language === "pt" ? "Progresso de Hoje" : "Today's Progress"}
                      </h2>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {language === "pt" ? "Completado hoje" : "Completed today"}
                        </span>
                        <span className="text-lg font-semibold text-[oklch(0.68_0.18_45)]">
                          {dailyProgress}%
                        </span>
                      </div>
                      <Progress value={dailyProgress} className="h-3 bg-background/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {language === "pt" ? "Sequência" : "Streak"}
                          </p>
                          <p className="text-xl font-bold text-orange-400">
                            {userProgress.currentStreak} {language === "pt" ? "dias" : "days"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-[oklch(0.68_0.18_45)]" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {language === "pt" ? "Total de dias" : "Total days"}
                          </p>
                          <p className="text-xl font-bold text-[oklch(0.68_0.18_45)]">
                            {userProgress.totalDaysClean}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ProgressRing progress={dailyProgress} size={120}>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[oklch(0.68_0.18_45)]">
                          {dailyProgress}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {language === "pt" ? "do dia" : "of day"}
                        </div>
                      </div>
                    </ProgressRing>
                  </div>
                </div>
              </Card>

              {/* Daily Goal */}
              <Card className="p-6 md:p-7 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/15 to-[oklch(0.7_0.15_220)]/15 border-[oklch(0.54_0.18_285)]/25 hover:border-[oklch(0.54_0.18_285)]/40 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 shadow-lg">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {t.dailyGoal}
                        {plannerData.daily_goal && (
                          <CheckCircle2 className="h-5 w-5 text-green-400 animate-in fade-in" />
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Defina seu propósito para hoje - isso guiará suas ações"
                          : "Set your purpose for today - this will guide your actions"}
                      </p>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={plannerData.daily_goal || ""}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setPlannerData({ ...plannerData, daily_goal: newValue })
                          if (!plannerData.daily_goal || plannerData.daily_goal.trim() === "") {
                            setGoalWasEmpty(true)
                          }
                        }}
                        onFocus={() => {
                          setGoalWasEmpty(!plannerData.daily_goal || plannerData.daily_goal.trim() === "")
                        }}
                        onBlur={(e) => {
                          const hasValue = e.target.value.trim().length > 0
                          if (hasValue && goalWasEmpty && !goalFeedback) {
                            setGoalFeedback(true)
                            toast.success(
                              language === "pt" 
                                ? "Objetivo definido. Agora o dia tem direção. 🎯"
                                : "Goal set. Now the day has direction. 🎯",
                              {
                                duration: 4000,
                                style: {
                                  background: "linear-gradient(to right, oklch(0.54 0.18 285), oklch(0.7 0.15 220))",
                                  color: "white",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                },
                              }
                            )
                            setTimeout(() => {
                              setGoalFeedback(false)
                              setGoalWasEmpty(false)
                            }, 2000)
                          }
                        }}
                        placeholder={t.dailyGoalPlaceholder}
                        className={cn(
                          "min-h-[100px] bg-background/50 border-white/10 focus:border-[oklch(0.54_0.18_285)]/50 transition-all",
                          goalFeedback && "animate-pulse shadow-lg shadow-[oklch(0.54_0.18_285)]/50"
                        )}
                      />
                      {goalFeedback && (
                        <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-r from-[oklch(0.54_0.18_285)]/20 via-transparent to-[oklch(0.7_0.15_220)]/20 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tasks */}
              <Card className="p-6 md:p-7 venser-card-glow bg-gradient-to-br from-[oklch(0.68_0.18_45)]/15 to-[oklch(0.7_0.18_30)]/15 border-[oklch(0.68_0.18_45)]/25 hover:border-[oklch(0.68_0.18_45)]/40 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] flex items-center justify-center shrink-0 shadow-lg">
                    <CheckSquare className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {t.tasks}
                        {plannerData.tasks.length > 0 && (
                          <span className="text-sm font-normal text-muted-foreground">
                            ({plannerData.tasks.filter(t => t.completed).length}/{plannerData.tasks.length})
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Transforme seu objetivo em ações concretas"
                          : "Turn your goal into concrete actions"}
                      </p>
                    </div>
                      
                    <div className="space-y-2">
                      {plannerData.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg bg-background/30 border transition-all duration-200",
                            task.completed 
                              ? "border-green-500/30 bg-green-500/5" 
                              : "border-white/10 hover:border-white/20 hover:bg-background/40"
                          )}
                        >
                          <div className="relative">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => {
                                toggleTask(task.id)
                              }}
                              className={cn(
                                "data-[state=checked]:bg-[oklch(0.68_0.18_45)] data-[state=checked]:border-[oklch(0.68_0.18_45)] transition-all",
                                completedTaskIds.has(task.id) && "animate-pulse scale-110"
                              )}
                            />
                            {completedTaskIds.has(task.id) && (
                              <div className="absolute inset-0 rounded-md bg-[oklch(0.68_0.18_45)]/30 animate-ping pointer-events-none" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "flex-1 transition-all",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addTask()
                          }
                        }}
                        placeholder={t.taskPlaceholder}
                        className="bg-background/50 border-white/10 focus:border-[oklch(0.68_0.18_45)]/50"
                      />
                      <Button
                        onClick={addTask}
                        className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)]"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Triggers */}
              <Card className="p-6 md:p-7 venser-card-glow bg-gradient-to-br from-[oklch(0.7_0.18_30)]/15 to-[oklch(0.68_0.18_45)]/15 border-[oklch(0.7_0.18_30)]/25 hover:border-[oklch(0.7_0.18_30)]/40 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.18_30)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0 shadow-lg">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {t.triggers}
                        {plannerData.triggers.length > 0 && (
                          <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            {plannerData.triggers.filter(t => t.intensity === "forte").length} {language === "pt" ? "fortes" : "strong"}
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Identifique situações que podem desencadear comportamentos indesejados"
                          : "Identify situations that may trigger unwanted behaviors"}
                      </p>
                    </div>
                      
                    <div className="space-y-3">
                      {plannerData.triggers.map((trigger) => (
                        <div
                          key={trigger.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all duration-300",
                            `bg-gradient-to-br ${getIntensityCardColor(trigger.intensity)}`
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm mb-2">{trigger.text}</p>
                              <div className="flex gap-2">
                                {(["leve", "moderado", "forte"] as const).map((intensity) => (
                                  <Button
                                    key={intensity}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateTriggerIntensity(trigger.id, intensity)}
                                    className={cn(
                                      "h-7 text-xs",
                                      trigger.intensity === intensity
                                        ? getIntensityColor(intensity)
                                        : "bg-background/50 border-white/10"
                                    )}
                                  >
                                    {language === "pt"
                                      ? intensity === "leve"
                                        ? t.intensityLight
                                        : intensity === "moderado"
                                          ? t.intensityModerate
                                          : t.intensityStrong
                                      : intensity === "leve"
                                        ? t.intensityLight
                                        : intensity === "moderado"
                                          ? t.intensityModerate
                                          : t.intensityStrong}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTrigger(trigger.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Input
                        value={newTriggerText}
                        onChange={(e) => setNewTriggerText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addTrigger()
                          }
                        }}
                        placeholder={t.triggerPlaceholder}
                        className="bg-background/50 border-white/10 focus:border-[oklch(0.7_0.18_30)]/50"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={newTriggerIntensity}
                          onValueChange={(value) =>
                            setNewTriggerIntensity(value as "leve" | "moderado" | "forte")
                          }
                        >
                          <SelectTrigger className="bg-background/50 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leve">{t.intensityLight}</SelectItem>
                            <SelectItem value="moderado">{t.intensityModerate}</SelectItem>
                            <SelectItem value="forte">{t.intensityStrong}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={addTrigger}
                          className="bg-gradient-to-r from-[oklch(0.7_0.18_30)] to-[oklch(0.68_0.18_45)]"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Reward */}
              <Card className="p-6 md:p-7 venser-card-glow bg-gradient-to-br from-[oklch(0.68_0.18_45)]/15 to-[oklch(0.54_0.18_285)]/15 border-[oklch(0.68_0.18_45)]/25 hover:border-[oklch(0.68_0.18_45)]/40 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.54_0.18_285)] flex items-center justify-center shrink-0 shadow-lg">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {t.reward}
                        {plannerData.reward && (
                          <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Celebre suas conquistas - recompensas reforçam comportamentos positivos"
                          : "Celebrate your achievements - rewards reinforce positive behaviors"}
                      </p>
                    </div>
                    <Input
                      value={plannerData.reward || ""}
                      onChange={(e) =>
                        setPlannerData({ ...plannerData, reward: e.target.value })
                      }
                      placeholder={t.rewardPlaceholder}
                      className="bg-background/50 border-white/10 focus:border-[oklch(0.68_0.18_45)]/50 transition-all"
                    />
                  </div>
                </div>
              </Card>

              {/* Reflection */}
              <Card className={cn(
                "p-6 md:p-7 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/15 to-[oklch(0.7_0.15_220)]/15 border-[oklch(0.54_0.18_285)]/25 hover:border-[oklch(0.54_0.18_285)]/40 transition-all duration-500 relative overflow-hidden",
                reflectionActive && "bg-gradient-to-br from-[oklch(0.18_0.03_270)]/40 to-[oklch(0.18_0.03_270)]/30"
              )}>
                {reflectionActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/10 pointer-events-none transition-opacity duration-500" />
                )}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 shadow-lg">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-xl font-bold">{t.reflection}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Revisite seu dia - reflexão consolida aprendizados e crescimento"
                          : "Review your day - reflection consolidates learning and growth"}
                      </p>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={plannerData.reflection || ""}
                        onChange={(e) => {
                          setPlannerData({ ...plannerData, reflection: e.target.value })
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim().length > 0 && !reflectionActive) {
                            setReflectionActive(true)
                            setTimeout(() => {
                              toast.success(
                                language === "pt" 
                                  ? "Respire. O aprendizado de hoje vale mais que o erro de ontem. 🕊️"
                                  : language === "es"
                                  ? "Respira. El aprendizaje de hoy vale más que el error de ayer. 🕊️"
                                  : "Breathe. Today's learning is worth more than yesterday's mistake. 🕊️",
                                {
                                  duration: 6000,
                                  style: {
                                    background: "linear-gradient(to right, oklch(0.54 0.18 285), oklch(0.7 0.15 220))",
                                    color: "white",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                  },
                                }
                              )
                            }, 500)
                          } else if (e.target.value.trim().length === 0) {
                            setReflectionActive(false)
                          }
                        }}
                        placeholder={t.reflectionPlaceholder}
                        className={cn(
                          "min-h-[140px] bg-background/50 border-white/10 focus:border-[oklch(0.54_0.18_285)]/50 transition-all",
                          reflectionActive && "bg-background/60"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Mood */}
              <Card className="p-6 md:p-7 venser-card-glow bg-gradient-to-br from-[oklch(0.7_0.15_220)]/15 to-[oklch(0.68_0.18_45)]/15 border-[oklch(0.7_0.15_220)]/25 hover:border-[oklch(0.7_0.15_220)]/40 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0 shadow-lg">
                    <Smile className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold">{t.mood}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Registre como você se sente - emoções são parte importante da jornada"
                          : "Record how you feel - emotions are an important part of the journey"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {getMoodOptions(language).map((moodOption) => (
                        <Button
                          key={moodOption.emoji}
                          variant="outline"
                          onClick={() => {
                            setPlannerData({ ...plannerData, mood: moodOption.emoji })
                            const message = moodOption.message
                            setSelectedMoodMessage(message)
                            toast.success(
                              `${moodOption.emoji} ${message}`,
                              {
                                duration: 5000,
                                style: {
                                  background: "linear-gradient(to right, oklch(0.7 0.15 220), oklch(0.68 0.18 45))",
                                  color: "white",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                },
                              }
                            )
                          }}
                          className={cn(
                            "h-20 w-20 text-4xl p-0 border-2 transition-all hover:scale-105",
                            plannerData.mood === moodOption.emoji
                              ? "border-[oklch(0.7_0.15_220)] bg-[oklch(0.7_0.15_220)]/20 scale-110 shadow-lg"
                              : "border-white/10 hover:border-white/30 bg-background/50"
                          )}
                        >
                          {moodOption.emoji}
                        </Button>
                      ))}
                    </div>
                    {plannerData.mood && selectedMoodMessage && (
                      <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-[oklch(0.7_0.15_220)]/20 to-[oklch(0.68_0.18_45)]/20 border border-[oklch(0.7_0.15_220)]/30 animate-in fade-in">
                        <p className="text-base font-medium text-foreground/90 leading-relaxed">
                          {plannerData.mood} {selectedMoodMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Tony Interaction */}
              <Card className="p-6 md:p-8 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/20 via-[oklch(0.7_0.15_220)]/20 to-[oklch(0.68_0.18_45)]/20 border-[oklch(0.54_0.18_285)]/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shadow-xl">
                      <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {t.tony}
                        <span className="text-sm font-normal text-muted-foreground">
                          {language === "pt" ? "seu agente motivacional" : "your motivational agent"}
                        </span>
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === "pt" 
                          ? "Consolidação final - uma mensagem personalizada baseada no seu progresso"
                          : "Final consolidation - a personalized message based on your progress"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/40 border border-[oklch(0.54_0.18_285)]/30">
                      <p className="text-base leading-relaxed text-foreground/90">
                        {tonyMessage}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/tony">
                        <Button className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 transition-opacity">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {language === "pt" ? "Conversar com Tony" : "Chat with Tony"}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTonyMessage(generateTonyMessage())
                          toast.success(language === "pt" ? "Mensagem atualizada! 💚" : "Message updated! 💚")
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {language === "pt" ? "Nova mensagem" : "New message"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

