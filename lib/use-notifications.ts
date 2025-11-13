"use client"

import { useState, useEffect } from "react"
import { supabase } from "./supabase/client"

interface NotificationState {
  enabled: boolean
  permission: NotificationPermission
  loading: boolean
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    enabled: false,
    permission: "default",
    loading: true
  })

  useEffect(() => {
    // Verifica permissão do navegador
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = Notification.permission
      
      // Carrega preferência salva do localStorage
      const savedPreference = localStorage.getItem("notificationsEnabled")
      const enabled = savedPreference === "true" && permission === "granted"
      
      setState({
        enabled,
        permission,
        loading: false
      })

      // Se já estiver ativado, agenda notificações
      if (enabled && permission === "granted") {
        scheduleDailyNotifications()
      }
    } else {
      setState({
        enabled: false,
        permission: "denied",
        loading: false
      })
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === "granted") {
        // Salva preferência no localStorage
        localStorage.setItem("notificationsEnabled", "true")
        
        // Salva no Supabase se houver usuário (opcional, não bloqueia se falhar)
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError) {
            if (authError.message?.includes('Failed to fetch')) {
              // Erro de rede, ignora silenciosamente
              return
            }
            throw authError
          }
          if (user) {
            // Tenta atualizar, mas não falha se a coluna não existir
            await supabase
              .from("profiles")
              .update({ notifications_enabled: true })
              .eq("id", user.id)
              .then(() => {
                // Sucesso
              })
              .catch((error: any) => {
                // Ignora erro se coluna não existir ou erro de rede
                if (!error?.message?.includes('Failed to fetch')) {
                  console.warn("Error updating notifications:", error?.message)
                }
              })
          }
        } catch (error: any) {
          // Ignora erros de rede do Supabase, usa apenas localStorage
          if (!error?.message?.includes('Failed to fetch') && error?.name !== 'TypeError') {
            console.warn("Error saving notifications:", error?.message)
          }
        }

        // Agenda notificações diárias
        scheduleDailyNotifications()

        setState({
          enabled: true,
          permission: "granted",
          loading: false
        })
        return true
      } else {
        setState(prev => ({
          ...prev,
          permission,
          enabled: false
        }))
        return false
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificações:", error)
      return false
    }
  }

  const disableNotifications = async () => {
    localStorage.setItem("notificationsEnabled", "false")
    
    // Tenta salvar no Supabase (opcional)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        if (authError.message?.includes('Failed to fetch')) {
          // Erro de rede, ignora silenciosamente
          return
        }
        throw authError
      }
      if (user) {
        await supabase
          .from("profiles")
          .update({ notifications_enabled: false })
          .eq("id", user.id)
          .then(() => {
            // Sucesso
          })
          .catch((error: any) => {
            // Ignora erro se coluna não existir ou erro de rede
            if (!error?.message?.includes('Failed to fetch')) {
              console.warn("Error updating notifications:", error?.message)
            }
          })
      }
    } catch (error: any) {
      // Ignora erros de rede do Supabase
      if (!error?.message?.includes('Failed to fetch') && error?.name !== 'TypeError') {
        console.warn("Error saving notifications:", error?.message)
      }
    }

    setState(prev => ({
      ...prev,
      enabled: false
    }))
  }

  const toggleNotifications = async () => {
    if (state.enabled) {
      await disableNotifications()
    } else {
      if (state.permission === "default") {
        await requestPermission()
      } else if (state.permission === "denied") {
        // Mostrar mensagem de que precisa permitir manualmente
        // A mensagem será mostrada pelo componente que usa o hook
        return false
      } else {
        // Permissão já concedida, apenas ativar
        localStorage.setItem("notificationsEnabled", "true")
        scheduleDailyNotifications()
        setState(prev => ({ ...prev, enabled: true }))
      }
    }
  }

  return {
    ...state,
    requestPermission,
    disableNotifications,
    toggleNotifications
  }
}

function scheduleDailyNotifications() {
  if (typeof window === "undefined") {
    return
  }

  // Verifica se já foi agendado hoje
  const lastScheduled = localStorage.getItem("lastNotificationScheduled")
  const today = new Date().toDateString()
  
  if (lastScheduled === today) {
    // Já agendado hoje, não precisa agendar novamente
    return
  }

  // Marca que foi agendado hoje
  localStorage.setItem("lastNotificationScheduled", today)

  // Verifica periodicamente se é hora de enviar notificação
  checkAndSendNotification()
  
  // Verifica a cada hora se é hora de enviar
  setInterval(checkAndSendNotification, 60 * 60 * 1000) // 1 hora
}

function checkAndSendNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return
  }

  if (Notification.permission !== "granted") {
    return
  }

  const enabled = localStorage.getItem("notificationsEnabled") === "true"
  if (!enabled) {
    return
  }

  // Verifica se já foi enviada hoje
  const lastSent = localStorage.getItem("lastNotificationSent")
  const today = new Date().toDateString()
  
  if (lastSent === today) {
    // Já enviada hoje
    return
  }

  // Verifica se é hora de enviar (9h da manhã)
  const now = new Date()
  const hour = now.getHours()
  
  if (hour >= 9) {
    // Hora de enviar
    const messages = [
      "Você está no caminho certo! Continue forte hoje. 🌱",
      "Cada dia sem recaída é uma vitória. Você consegue! 💪",
      "Sua mente está se recuperando. Mantenha o foco! 🧠",
      "Você é mais forte do que pensa. Continue assim! ⭐",
      "Cada momento de resistência te torna mais forte. 🌟",
      "Sua jornada de recuperação continua. Estamos com você! 💚",
      "Lembre-se: você não precisa de pornografia. Você precisa de paz. 🕊️"
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    showNotification("VENSER - Lembrete Diário", randomMessage)
    
    // Marca que foi enviada hoje
    localStorage.setItem("lastNotificationSent", today)
  }
}

function showNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return
  }

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/icon-light-32x32.png",
      badge: "/icon-light-32x32.png",
      tag: "venser-daily-reminder",
      requireInteraction: false,
      silent: false
    })

    // Fecha automaticamente após 5 segundos
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Ação ao clicar na notificação
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }
}

