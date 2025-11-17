"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "./supabase/client"

interface IllusionBusterProgress {
  id?: string
  user_id?: string
  illusion_buster_xp: number
  illusion_buster_level: number
  destroyed_illusions: string[]
  earned_badges: string[]
  current_combo: number
  highest_combo: number
  illusion_buster_streak: number
  isLoading: boolean
  error: string | null
}

interface UpdateProgressParams {
  xp?: number
  level?: number
  destroyedIllusions?: string[]
  earnedBadges?: string[]
  combo?: number
  streak?: number
}

export function useIllusionBusterProgress() {
  const [progress, setProgress] = useState<IllusionBusterProgress>({
    illusion_buster_xp: 0,
    illusion_buster_level: 1,
    destroyed_illusions: [],
    earned_badges: [],
    current_combo: 0,
    highest_combo: 0,
    illusion_buster_streak: 0,
    isLoading: true,
    error: null
  })

  // Carregar progresso do banco
  const loadProgress = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.warn("User not authenticated, using default progress")
        setProgress(prev => ({ ...prev, isLoading: false }))
        return
      }

      const { data, error } = await supabase
        .from('illusion_buster_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // PGRST116 = no rows returned (não é um erro real, apenas indica que não há dados)
        const errorCode = error.code
        const errorMessage = error.message || ''
        
        // Verificar se é erro de tabela não encontrada (42P01 = relation does not exist)
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('tabela')) {
          console.error("❌ ERRO: A tabela 'illusion_buster_progress' não existe no Supabase!")
          console.error("📋 SOLUÇÃO: Execute a migração '011_illusion_buster_progress.sql' no SQL Editor do Supabase")
          console.error("Detalhes do erro:", {
            code: errorCode,
            message: errorMessage,
            details: error.details,
            hint: error.hint
          })
          setProgress(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: "Tabela não encontrada. Execute a migração 011_illusion_buster_progress.sql no Supabase." 
          }))
          return
        }
        
        // Se for PGRST116, não há dados ainda - continuar normalmente
        if (errorCode === 'PGRST116') {
          // Não há registro ainda, continuar normalmente para criar um novo
        } else {
          // Erro real - logar com informações detalhadas
          const errorInfo: any = {}
          if (errorMessage) errorInfo.message = errorMessage
          if (errorCode) errorInfo.code = errorCode
          if (error.details) errorInfo.details = error.details
          if (error.hint) errorInfo.hint = error.hint
          
          console.error("Error loading progress:", errorInfo)
          setProgress(prev => ({ ...prev, isLoading: false, error: errorMessage || "Erro ao carregar progresso" }))
          return
        }
      }

      if (data) {
        setProgress({
          id: data.id,
          user_id: data.user_id,
          illusion_buster_xp: data.illusion_buster_xp || 0,
          illusion_buster_level: data.illusion_buster_level || 1,
          destroyed_illusions: Array.isArray(data.destroyed_illusions) 
            ? data.destroyed_illusions 
            : [],
          earned_badges: Array.isArray(data.earned_badges) 
            ? data.earned_badges 
            : [],
          current_combo: data.current_combo || 0,
          highest_combo: data.highest_combo || 0,
          illusion_buster_streak: data.illusion_buster_streak || 0,
          isLoading: false,
          error: null
        })
      } else {
        // Criar registro inicial
        const { data: newData, error: insertError } = await supabase
          .from('illusion_buster_progress')
          .insert({
            user_id: user.id,
            illusion_buster_xp: 0,
            illusion_buster_level: 1,
            destroyed_illusions: [],
            earned_badges: [],
            current_combo: 0,
            highest_combo: 0,
            illusion_buster_streak: 0
          })
          .select()
          .single()

        if (insertError) {
          const errorInfo: any = {}
          if (insertError.message) errorInfo.message = insertError.message
          if (insertError.code) errorInfo.code = insertError.code
          if (insertError.details) errorInfo.details = insertError.details
          if (insertError.hint) errorInfo.hint = insertError.hint
          
          if (Object.keys(errorInfo).length === 0) {
            try {
              errorInfo.rawError = JSON.stringify(insertError)
            } catch {
              errorInfo.rawError = String(insertError)
            }
          }
          
          console.error("Error creating progress:", errorInfo)
          setProgress(prev => ({ ...prev, isLoading: false, error: insertError.message || "Erro ao criar progresso" }))
        } else if (newData) {
          setProgress({
            id: newData.id,
            user_id: newData.user_id,
            illusion_buster_xp: newData.illusion_buster_xp || 0,
            illusion_buster_level: newData.illusion_buster_level || 1,
            destroyed_illusions: Array.isArray(newData.destroyed_illusions) 
              ? newData.destroyed_illusions 
              : [],
            earned_badges: Array.isArray(newData.earned_badges) 
              ? newData.earned_badges 
              : [],
            current_combo: newData.current_combo || 0,
            highest_combo: newData.highest_combo || 0,
            illusion_buster_streak: newData.illusion_buster_streak || 0,
            isLoading: false,
            error: null
          })
        }
      }
    } catch (error: any) {
      const errorInfo: any = {}
      if (error?.message) errorInfo.message = error.message
      if (error?.code) errorInfo.code = error.code
      if (error?.details) errorInfo.details = error.details
      if (error?.hint) errorInfo.hint = error.hint
      if (error?.stack) errorInfo.stack = error.stack
      
      if (Object.keys(errorInfo).length === 0) {
        try {
          errorInfo.rawError = JSON.stringify(error)
        } catch {
          errorInfo.rawError = String(error)
        }
      }
      
      console.error("Error in loadProgress:", errorInfo)
      setProgress(prev => ({ ...prev, isLoading: false, error: error?.message || "Erro desconhecido ao carregar progresso" }))
    }
  }, [])

  // Atualizar progresso no banco
  const updateProgress = useCallback(async (params: UpdateProgressParams) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.warn("User not authenticated, cannot update progress")
        return
      }

      // Buscar progresso atual
      const { data: currentData, error: fetchError } = await supabase
        .from('illusion_buster_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // PGRST116 = no rows returned (não é um erro real, apenas indica que não há dados)
        const errorCode = fetchError.code
        const errorMessage = fetchError.message || ''
        
        // Verificar se é erro de tabela não encontrada (42P01 = relation does not exist)
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('tabela')) {
          console.error("❌ ERRO: A tabela 'illusion_buster_progress' não existe no Supabase!")
          console.error("📋 SOLUÇÃO: Execute a migração '011_illusion_buster_progress.sql' no SQL Editor do Supabase")
          console.error("Detalhes do erro:", {
            code: errorCode,
            message: errorMessage,
            details: fetchError.details,
            hint: fetchError.hint
          })
          return
        }
        
        // Se for PGRST116, não há dados ainda - continuar normalmente
        if (errorCode === 'PGRST116') {
          // Não há registro ainda, continuar normalmente para criar um novo
        } else {
          // Erro real - logar com informações detalhadas
          const errorInfo: any = {}
          if (errorMessage) errorInfo.message = errorMessage
          if (errorCode) errorInfo.code = errorCode
          if (fetchError.details) errorInfo.details = fetchError.details
          if (fetchError.hint) errorInfo.hint = fetchError.hint
          
          console.error("Error fetching current progress:", errorInfo)
          return
        }
      }

      // Preparar dados para atualização
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (params.xp !== undefined) {
        updateData.illusion_buster_xp = params.xp
      }
      if (params.level !== undefined) {
        updateData.illusion_buster_level = params.level
      }
      if (params.destroyedIllusions !== undefined) {
        updateData.destroyed_illusions = params.destroyedIllusions
      }
      if (params.earnedBadges !== undefined) {
        updateData.earned_badges = params.earnedBadges
      }
      if (params.combo !== undefined) {
        updateData.current_combo = params.combo
        // Atualizar highest_combo se necessário
        const currentHighest = currentData?.highest_combo || 0
        if (params.combo > currentHighest) {
          updateData.highest_combo = params.combo
        }
      }
      if (params.streak !== undefined) {
        updateData.illusion_buster_streak = params.streak
      }

      // Se não existe registro, criar
      if (!currentData) {
        const { data: newData, error: insertError } = await supabase
          .from('illusion_buster_progress')
          .insert({
            user_id: user.id,
            ...updateData
          })
          .select()
          .single()

        if (insertError) {
          const errorInfo: any = {}
          if (insertError.message) errorInfo.message = insertError.message
          if (insertError.code) errorInfo.code = insertError.code
          if (insertError.details) errorInfo.details = insertError.details
          if (insertError.hint) errorInfo.hint = insertError.hint
          
          if (Object.keys(errorInfo).length === 0) {
            try {
              errorInfo.rawError = JSON.stringify(insertError)
            } catch {
              errorInfo.rawError = String(insertError)
            }
          }
          
          console.error("Error creating progress:", errorInfo)
          return
        }

        if (newData) {
          setProgress(prev => ({
            ...prev,
            ...updateData,
            destroyed_illusions: Array.isArray(newData.destroyed_illusions) 
              ? newData.destroyed_illusions 
              : [],
            earned_badges: Array.isArray(newData.earned_badges) 
              ? newData.earned_badges 
              : []
          }))
        }
      } else {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('illusion_buster_progress')
          .update(updateData)
          .eq('user_id', user.id)

        if (updateError) {
          const errorInfo: any = {}
          if (updateError.message) errorInfo.message = updateError.message
          if (updateError.code) errorInfo.code = updateError.code
          if (updateError.details) errorInfo.details = updateError.details
          if (updateError.hint) errorInfo.hint = updateError.hint
          
          if (Object.keys(errorInfo).length === 0) {
            try {
              errorInfo.rawError = JSON.stringify(updateError)
            } catch {
              errorInfo.rawError = String(updateError)
            }
          }
          
          console.error("Error updating progress:", errorInfo)
          return
        }

        // Atualizar estado local
        setProgress(prev => ({
          ...prev,
          ...updateData,
          destroyed_illusions: params.destroyedIllusions !== undefined 
            ? params.destroyedIllusions 
            : prev.destroyed_illusions,
          earned_badges: params.earnedBadges !== undefined 
            ? params.earnedBadges 
            : prev.earned_badges
        }))
      }
    } catch (error: any) {
      const errorInfo: any = {}
      if (error?.message) errorInfo.message = error.message
      if (error?.code) errorInfo.code = error.code
      if (error?.details) errorInfo.details = error.details
      if (error?.hint) errorInfo.hint = error.hint
      if (error?.stack) errorInfo.stack = error.stack
      
      if (Object.keys(errorInfo).length === 0) {
        try {
          errorInfo.rawError = JSON.stringify(error)
        } catch {
          errorInfo.rawError = String(error)
        }
      }
      
      console.error("Error in updateProgress:", errorInfo)
    }
  }, [])

  // Carregar progresso ao montar componente
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  return {
    progress,
    loadProgress,
    updateProgress,
    isLoading: progress.isLoading,
    error: progress.error
  }
}

