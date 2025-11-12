"use client"

import { useState, useEffect } from "react"
import { supabase } from "./supabase/client"

interface TreeProgressData {
  totalDaysCompleted: number
  totalDaysFailed: number
  currentStreak: number
  longestStreak: number
  totalTrees: number
  currentTreeProgress: number
  isLoading: boolean
  error: string | null
}

export function useTreeProgress() {
  const [data, setData] = useState<TreeProgressData>({
    totalDaysCompleted: 0,
    totalDaysFailed: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalTrees: 0,
    currentTreeProgress: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Busca o usuário atual
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // Se não houver usuário, usa dados mockados para desenvolvimento
          setData({
            totalDaysCompleted: 14,
            totalDaysFailed: 2,
            currentStreak: 5,
            longestStreak: 14,
            totalTrees: 2,
            currentTreeProgress: 0,
            isLoading: false,
            error: null
          })
          return
        }

        // Busca progresso do usuário
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Busca dias do programa completados
        const { data: completedDays, error: daysError } = await supabase
          .from('program_days')
          .select('day_number, completed')
          .eq('user_id', user.id)
          .eq('completed', true)

        // Busca todos os dias do programa do usuário
        const { data: allDays, error: allDaysError } = await supabase
          .from('program_days')
          .select('day_number, completed')
          .eq('user_id', user.id)
          .order('day_number', { ascending: true })

        // Calcula dias completados
        const completed = completedDays?.length || 0
        
        // Calcula dias falhados: dias que existem no banco mas não foram completados
        // e que estão dentro do range do programa atual do usuário
        const currentDay = progressData?.current_day || 0
        const failed = allDays?.filter(day => 
          !day.completed && 
          day.day_number <= currentDay &&
          day.day_number > 0
        ).length || 0

        // Calcula streak atual
        let currentStreak = 0
        if (completedDays && completedDays.length > 0) {
          const sortedDays = [...completedDays].sort((a, b) => b.day_number - a.day_number)
          let lastDay = sortedDays[0].day_number
          currentStreak = 1
          
          for (let i = 1; i < sortedDays.length; i++) {
            if (sortedDays[i].day_number === lastDay - 1) {
              currentStreak++
              lastDay = sortedDays[i].day_number
            } else {
              break
            }
          }
        }

        const longestStreak = progressData?.longest_streak || currentStreak
        const daysPerTree = 7
        const totalTrees = Math.floor(completed / daysPerTree)
        const currentTreeProgress = completed % daysPerTree

        setData({
          totalDaysCompleted: completed,
          totalDaysFailed: failed,
          currentStreak,
          longestStreak,
          totalTrees,
          currentTreeProgress,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching tree progress:', error)
        // Fallback para dados mockados em caso de erro
        setData({
          totalDaysCompleted: 14,
          totalDaysFailed: 2,
          currentStreak: 5,
          longestStreak: 14,
          totalTrees: 2,
          currentTreeProgress: 0,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    fetchProgress()
  }, [])

  return data
}

