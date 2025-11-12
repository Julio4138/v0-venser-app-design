"use client"

import { useEffect, useRef, createContext } from "react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { supabase } from "@/lib/supabase/client"

interface UserProgress {
  currentStreak: number
  lastActivityDate: Date | null
  todayCompleted: boolean
  hasFailed: boolean
}

const TonyNotificationsContext = createContext<{}>({})

export function TonyNotificationsProvider({ children }: { children: React.ReactNode }) {
  useTonyNotifications()
  return <TonyNotificationsContext.Provider value={{}}>{children}</TonyNotificationsContext.Provider>
}

function useTonyNotifications() {
  const { language } = useLanguage()
  const t = translations[language]
  const lastNotificationRef = useRef<string | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const getTimeOfDay = (): "morning" | "afternoon" | "evening" | "night" => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 22) return "evening"
    return "night"
  }

  const getUserProgress = async (): Promise<UserProgress | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      // Buscar progresso do usuário
      const { data: programDays } = await supabase
        .from("program_days")
        .select("day_number, completed, completed_at")
        .eq("user_id", user.id)
        .order("day_number", { ascending: false })
        .limit(7)

      if (!programDays || programDays.length === 0) {
        return {
          currentStreak: 0,
          lastActivityDate: null,
          todayCompleted: false,
          hasFailed: false,
        }
      }

      // Calcular streak - contar dias consecutivos completados
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Ordenar por data de conclusão (mais recente primeiro)
      const completedDays = programDays
        .filter((day) => day.completed && day.completed_at)
        .map((day) => {
          const completedDate = new Date(day.completed_at!)
          completedDate.setHours(0, 0, 0, 0)
          return completedDate
        })
        .sort((a, b) => b.getTime() - a.getTime())

      // Verificar se completou hoje
      const completedToday = completedDays.some(
        (date) => date.getTime() === today.getTime()
      )

      if (completedToday) {
        streak = 1
        // Contar dias consecutivos anteriores
        for (let i = 1; i < completedDays.length; i++) {
          const expectedDate = new Date(today)
          expectedDate.setDate(expectedDate.getDate() - i)
          expectedDate.setHours(0, 0, 0, 0)

          if (completedDays[i]?.getTime() === expectedDate.getTime()) {
            streak++
          } else {
            break
          }
        }
      } else if (completedDays.length > 0) {
        // Se não completou hoje, verificar se completou ontem
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (completedDays[0]?.getTime() === yesterday.getTime()) {
          streak = 1
          // Contar dias consecutivos anteriores
          for (let i = 1; i < completedDays.length; i++) {
            const expectedDate = new Date(yesterday)
            expectedDate.setDate(expectedDate.getDate() - i)
            expectedDate.setHours(0, 0, 0, 0)

            if (completedDays[i]?.getTime() === expectedDate.getTime()) {
              streak++
            } else {
              break
            }
          }
        }
      }

      // Verificar se completou hoje (já calculado acima)
      const todayCompleted = completedToday

      // Verificar última atividade
      const lastCompleted = programDays.find((day) => day.completed && day.completed_at)
      const lastActivityDate = lastCompleted
        ? new Date(lastCompleted.completed_at!)
        : null

      // Verificar se falhou (não completou nos últimos 2 dias mas tinha streak)
      const hasFailed = streak === 0 && lastActivityDate !== null

      return {
        currentStreak: streak,
        lastActivityDate,
        todayCompleted,
        hasFailed,
      }
    } catch (error) {
      console.error("Error fetching user progress:", error)
      return null
    }
  }

  const shouldSendNotification = (type: string, progress: UserProgress | null): boolean => {
    if (!progress) return false

    const notificationKey = `${type}-${new Date().toDateString()}`
    
    // Não enviar a mesma notificação no mesmo dia
    if (lastNotificationRef.current === notificationKey) {
      return false
    }

    const timeOfDay = getTimeOfDay()

    switch (type) {
      case "morning":
        return timeOfDay === "morning" && !progress.todayCompleted
      case "afternoon":
        return timeOfDay === "afternoon" && !progress.todayCompleted && progress.currentStreak > 0
      case "evening":
        return timeOfDay === "evening" && progress.todayCompleted
      case "failure":
        return progress.hasFailed && timeOfDay === "evening"
      case "no-progress":
        // Verificar se não houve progresso nas últimas 24 horas
        if (!progress.lastActivityDate) return false
        const hoursSinceLastActivity =
          (new Date().getTime() - progress.lastActivityDate.getTime()) / (1000 * 60 * 60)
        return hoursSinceLastActivity >= 24 && timeOfDay === "afternoon"
      default:
        return false
    }
  }

  const sendNotification = (message: string) => {
    toast.info(message, {
      duration: 5000,
      position: "top-center",
      style: {
        background: "linear-gradient(to right, oklch(0.54 0.18 285), oklch(0.7 0.15 220))",
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      },
    })
  }

  const checkAndSendNotifications = async () => {
    const progress = await getUserProgress()
    if (!progress) return

    const timeOfDay = getTimeOfDay()

    // Notificação matinal
    if (shouldSendNotification("morning", progress)) {
      sendNotification(t.morningReminder)
      lastNotificationRef.current = `morning-${new Date().toDateString()}`
      return
    }

    // Notificação de falta de progresso (tarde)
    if (shouldSendNotification("no-progress", progress)) {
      sendNotification(t.noProgressMotivation)
      lastNotificationRef.current = `no-progress-${new Date().toDateString()}`
      return
    }

    // Notificação de motivação (tarde)
    if (shouldSendNotification("afternoon", progress)) {
      sendNotification(t.afternoonMotivation)
      lastNotificationRef.current = `afternoon-${new Date().toDateString()}`
      return
    }

    // Notificação noturna (reflexão positiva)
    if (shouldSendNotification("evening", progress)) {
      sendNotification(t.eveningReflection)
      lastNotificationRef.current = `evening-${new Date().toDateString()}`
      return
    }

    // Notificação de encorajamento após falha
    if (shouldSendNotification("failure", progress)) {
      sendNotification(t.failureEncouragement)
      lastNotificationRef.current = `failure-${new Date().toDateString()}`
      return
    }
  }

  useEffect(() => {
    // Verificar imediatamente ao montar
    checkAndSendNotifications()

    // Verificar a cada hora
    checkIntervalRef.current = setInterval(() => {
      checkAndSendNotifications()
    }, 60 * 60 * 1000) // 1 hora

    // Verificar também a cada 30 minutos para melhor responsividade
    const quickCheckInterval = setInterval(() => {
      checkAndSendNotifications()
    }, 30 * 60 * 1000) // 30 minutos

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      clearInterval(quickCheckInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]) // Re-executar quando o idioma mudar
}

