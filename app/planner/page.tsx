"use client"

import { useState, useEffect, useCallback } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSidebar } from "@/lib/sidebar-context"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
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
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

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

const getMoodOptions = (language: string) => {
  if (language === "pt") {
    return [
      { emoji: "😞", label: "Triste" },
      { emoji: "😐", label: "Neutro" },
      { emoji: "🙂", label: "Bem" },
      { emoji: "😄", label: "Feliz" },
      { emoji: "😎", label: "Excelente" },
    ]
  } else if (language === "es") {
    return [
      { emoji: "😞", label: "Triste" },
      { emoji: "😐", label: "Neutral" },
      { emoji: "🙂", label: "Bien" },
      { emoji: "😄", label: "Feliz" },
      { emoji: "😎", label: "Excelente" },
    ]
  } else {
    return [
      { emoji: "😞", label: "Sad" },
      { emoji: "😐", label: "Neutral" },
      { emoji: "🙂", label: "Good" },
      { emoji: "😄", label: "Happy" },
      { emoji: "😎", label: "Excellent" },
    ]
  }
}

export default function PlannerPage() {
  const { language } = useLanguage()
  const { collapsed } = useSidebar()
  const t = translations[language]
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

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

  // Load planner data
  const loadPlannerData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(language === "pt" ? "Faça login para acessar o planner" : "Please login to access the planner")
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
        // PGRST116 = no rows returned
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
      } else {
        // Initialize empty planner
        setPlannerData({
          daily_goal: null,
          tasks: [],
          triggers: [],
          reward: null,
          reflection: null,
          mood: null,
        })
      }
    } catch (error) {
      console.error("Error loading planner data:", error)
      toast.error(language === "pt" ? "Erro ao carregar planner" : "Error loading planner")
    } finally {
      setIsLoading(false)
    }
  }, [language])

  useEffect(() => {
    loadPlannerData()
  }, [loadPlannerData])

  // Auto-save with debounce
  useEffect(() => {
    if (isLoading) return

    const timeoutId = setTimeout(async () => {
      await savePlannerData()
    }, 2000) // 2 seconds debounce

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Garantir que tasks e triggers sejam arrays válidos
      const tasksArray = Array.isArray(plannerData.tasks) ? plannerData.tasks : []
      const triggersArray = Array.isArray(plannerData.triggers) ? plannerData.triggers : []

      // Converter strings vazias para null
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

      console.log("Saving planner data:", { ...payload, tasks: tasksArray.length, triggers: triggersArray.length })

      const { data, error } = await supabase
        .from("daily_planner")
        .upsert(payload, {
          onConflict: "user_id,planner_date",
        })
        .select()

      if (error) {
        console.error("Supabase error:", error)
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      setLastSaved(new Date())
    } catch (error: any) {
      console.error("Error saving planner data:", error)
      console.error("Error type:", typeof error)
      console.error("Error keys:", error ? Object.keys(error) : "No error object")
      
      const errorMessage = error?.message || error?.details || error?.hint || 
        (language === "pt" ? "Erro desconhecido ao salvar planner" : "Unknown error saving planner")
      
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

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
    setPlannerData({
      ...plannerData,
      tasks: plannerData.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    })
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-[oklch(0.68_0.18_45)]" />
                {t.dailyPlanner}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {language === "pt"
                  ? "Organize seu dia, identifique gatilhos e celebre suas conquistas"
                  : "Organize your day, identify triggers and celebrate your achievements"}
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
                <span className="text-xs text-green-400/80 flex items-center gap-2">
                  <Save className="h-3 w-3" />
                  {t.saved}
                </span>
              )}
              <Button
                onClick={savePlannerData}
                size="sm"
                className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)]"
              >
                <Save className="h-4 w-4 mr-2" />
                {t.saved}
              </Button>
            </div>
          </div>

          {/* Planner Sections */}
          <div className="space-y-6">
            {/* Daily Goal */}
            <Card className="p-6 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 border-[oklch(0.54_0.18_285)]/20">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-semibold">{t.dailyGoal}</h2>
                  <Textarea
                    value={plannerData.daily_goal || ""}
                    onChange={(e) =>
                      setPlannerData({ ...plannerData, daily_goal: e.target.value })
                    }
                    placeholder={t.dailyGoalPlaceholder}
                    className="min-h-[80px] bg-background/50 border-white/10 focus:border-[oklch(0.54_0.18_285)]/50"
                  />
                </div>
              </div>
            </Card>

            {/* Tasks */}
            <Card className="p-6 venser-card-glow bg-gradient-to-br from-[oklch(0.68_0.18_45)]/10 to-[oklch(0.7_0.18_30)]/10 border-[oklch(0.68_0.18_45)]/20">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] flex items-center justify-center shrink-0">
                  <CheckSquare className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <h2 className="text-xl font-semibold">{t.tasks}</h2>
                  
                  {/* Task List */}
                  <div className="space-y-2">
                    {plannerData.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="data-[state=checked]:bg-[oklch(0.68_0.18_45)] data-[state=checked]:border-[oklch(0.68_0.18_45)]"
                        />
                        <span
                          className={cn(
                            "flex-1",
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

                  {/* Add Task */}
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
            <Card className="p-6 venser-card-glow bg-gradient-to-br from-[oklch(0.7_0.18_30)]/10 to-[oklch(0.68_0.18_45)]/10 border-[oklch(0.7_0.18_30)]/20">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.18_30)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <h2 className="text-xl font-semibold">{t.triggers}</h2>
                  
                  {/* Trigger List */}
                  <div className="space-y-3">
                    {plannerData.triggers.map((trigger) => (
                      <div
                        key={trigger.id}
                        className="p-3 rounded-lg bg-background/30 border border-white/10 hover:border-white/20 transition-colors"
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

                  {/* Add Trigger */}
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
            <Card className="p-6 venser-card-glow bg-gradient-to-br from-[oklch(0.68_0.18_45)]/10 to-[oklch(0.54_0.18_285)]/10 border-[oklch(0.68_0.18_45)]/20">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.54_0.18_285)] flex items-center justify-center shrink-0">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-semibold">{t.reward}</h2>
                  <Input
                    value={plannerData.reward || ""}
                    onChange={(e) =>
                      setPlannerData({ ...plannerData, reward: e.target.value })
                    }
                    placeholder={t.rewardPlaceholder}
                    className="bg-background/50 border-white/10 focus:border-[oklch(0.68_0.18_45)]/50"
                  />
                </div>
              </div>
            </Card>

            {/* Reflection */}
            <Card className="p-6 venser-card-glow bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 border-[oklch(0.54_0.18_285)]/20">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-semibold">{t.reflection}</h2>
                  <Textarea
                    value={plannerData.reflection || ""}
                    onChange={(e) =>
                      setPlannerData({ ...plannerData, reflection: e.target.value })
                    }
                    placeholder={t.reflectionPlaceholder}
                    className="min-h-[120px] bg-background/50 border-white/10 focus:border-[oklch(0.54_0.18_285)]/50"
                  />
                </div>
              </div>
            </Card>

            {/* Mood */}
            <Card className="p-6 venser-card-glow bg-gradient-to-br from-[oklch(0.7_0.15_220)]/10 to-[oklch(0.68_0.18_45)]/10 border-[oklch(0.7_0.15_220)]/20">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0">
                  <Smile className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl font-semibold">{t.mood}</h2>
                  <p className="text-sm text-muted-foreground">{t.selectMood}</p>
                  <div className="flex flex-wrap gap-3">
                    {getMoodOptions(language).map((moodOption) => (
                      <Button
                        key={moodOption.emoji}
                        variant="outline"
                        onClick={() =>
                          setPlannerData({ ...plannerData, mood: moodOption.emoji })
                        }
                        className={cn(
                          "h-16 w-16 text-3xl p-0 border-2 transition-all",
                          plannerData.mood === moodOption.emoji
                            ? "border-[oklch(0.7_0.15_220)] bg-[oklch(0.7_0.15_220)]/20 scale-110"
                            : "border-white/10 hover:border-white/30 bg-background/50"
                        )}
                      >
                        {moodOption.emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

