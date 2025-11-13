"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Wind, Play, Pause, ArrowLeft, Info, RotateCcw, Sparkles, Heart, Clock, Target } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export default function BreathExercisePage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale')
  const [breathCountdown, setBreathCountdown] = useState(4)
  const [isBreathingActive, setIsBreathingActive] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [totalSessionTime, setTotalSessionTime] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const animationRef = useRef<number>()

  const breathTimings = {
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 4
  }

  // Controla o exercício de respiração
  useEffect(() => {
    if (!isBreathingActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const startTime = Date.now()
    const currentPhaseTime = breathTimings[breathPhase] * 1000

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / currentPhaseTime, 1)
      setPhaseProgress(progress * 100)

      if (elapsed < currentPhaseTime) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animate()

    const timer = setTimeout(() => {
      if (breathCountdown <= 1) {
        // Muda para a próxima fase
        const phases: Array<'inhale' | 'hold' | 'exhale' | 'pause'> = ['inhale', 'hold', 'exhale', 'pause']
        const currentIndex = phases.indexOf(breathPhase)
        const nextIndex = (currentIndex + 1) % phases.length
        const nextPhase = phases[nextIndex]
        
        setBreathPhase(nextPhase)
        setBreathCountdown(breathTimings[nextPhase])
        setPhaseProgress(0)
        
        // Incrementa contador quando completa um ciclo (volta para inhale)
        if (nextPhase === 'inhale' && currentIndex === 3) {
          setCycleCount(prev => prev + 1)
        }
      } else {
        setBreathCountdown(prev => prev - 1)
      }
    }, 1000)

    return () => {
      clearTimeout(timer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isBreathingActive, breathPhase, breathCountdown])

  // Calcula tempo total da sessão
  useEffect(() => {
    if (!isBreathingActive || !sessionStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
      setTotalSessionTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isBreathingActive, sessionStartTime])

  const handleStart = () => {
    setIsBreathingActive(true)
    setBreathPhase('inhale')
    setBreathCountdown(4)
    setCycleCount(0)
    setPhaseProgress(0)
    setSessionStartTime(new Date())
    setTotalSessionTime(0)
  }

  const handlePause = () => {
    setIsBreathingActive(false)
  }

  const handleResume = () => {
    setIsBreathingActive(true)
  }

  const handleReset = () => {
    setIsBreathingActive(false)
    setBreathPhase('inhale')
    setBreathCountdown(4)
    setCycleCount(0)
    setPhaseProgress(0)
    setSessionStartTime(null)
    setTotalSessionTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseText = () => {
    if (breathPhase === 'inhale') {
      return language === "pt" ? "Inspire" : language === "es" ? "Inspira" : "Inhale"
    } else if (breathPhase === 'hold') {
      return language === "pt" ? "Segure" : language === "es" ? "Mantén" : "Hold"
    } else if (breathPhase === 'exhale') {
      return language === "pt" ? "Expire" : language === "es" ? "Exhala" : "Exhale"
    } else {
      return language === "pt" ? "Pause" : language === "es" ? "Pausa" : "Pause"
    }
  }

  const getPhaseDescription = () => {
    if (breathPhase === 'inhale') {
      return language === "pt" 
        ? "Inspire profundamente pelo nariz" 
        : language === "es"
        ? "Inspira profundamente por la nariz"
        : "Inhale deeply through your nose"
    } else if (breathPhase === 'hold') {
      return language === "pt" 
        ? "Segure a respiração com calma" 
        : language === "es"
        ? "Mantén la respiración con calma"
        : "Hold your breath calmly"
    } else if (breathPhase === 'exhale') {
      return language === "pt" 
        ? "Expire completamente pela boca" 
        : language === "es"
        ? "Exhala completamente por la boca"
        : "Exhale completely through your mouth"
    } else {
      return language === "pt" 
        ? "Pause e relaxe completamente" 
        : language === "es"
        ? "Pausa y relájate completamente"
        : "Pause and relax completely"
    }
  }

  const getPhaseColor = () => {
    if (breathPhase === 'inhale') {
      return {
        primary: 'from-orange-400 to-amber-400',
        border: 'border-orange-400',
        text: 'text-orange-400',
        glow: 'shadow-[0_0_40px_rgba(251,146,60,0.6)]'
      }
    } else if (breathPhase === 'hold') {
      return {
        primary: 'from-orange-500 to-amber-500',
        border: 'border-orange-500',
        text: 'text-orange-500',
        glow: 'shadow-[0_0_50px_rgba(251,146,60,0.7)]'
      }
    } else if (breathPhase === 'exhale') {
      return {
        primary: 'from-orange-300 to-amber-300',
        border: 'border-orange-300',
        text: 'text-orange-300',
        glow: 'shadow-[0_0_30px_rgba(251,146,60,0.4)]'
      }
    } else {
      return {
        primary: 'from-orange-400/70 to-amber-400/70',
        border: 'border-orange-400/50',
        text: 'text-orange-400/70',
        glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]'
      }
    }
  }

  const getPhaseSize = () => {
    if (breathPhase === 'inhale' || breathPhase === 'hold') {
      return { 
        width: '280px', 
        height: '280px'
      }
    } else {
      return { 
        width: '220px', 
        height: '220px'
      }
    }
  }
  
  const getPhaseSizeClass = () => {
    if (breathPhase === 'inhale' || breathPhase === 'hold') {
      return 'w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] lg:w-[360px] lg:h-[360px]'
    } else {
      return 'w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px] lg:w-[300px] lg:h-[300px]'
    }
  }

  const colors = getPhaseColor()
  const size = getPhaseSize()

  return (
    <div className="min-h-screen starry-background relative pb-24">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(
        collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64",
        "transition-all duration-300"
      )}>
        <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 pb-20 md:pb-8">
          {/* Header Melhorado */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.dashboard}
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-400/30 shrink-0">
                  <Wind className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-orange-400" />
                </div>
                <span className="leading-tight">{language === "pt" ? "Exercício de Respiração 4-7-8" : language === "es" ? "Ejercicio de Respiración 4-7-8" : "4-7-8 Breathing Exercise"}</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/70 hidden sm:block">
                {language === "pt" 
                  ? "Técnica cientificamente comprovada para reduzir ansiedade, promover relaxamento profundo e melhorar o bem-estar"
                  : language === "es"
                  ? "Técnica científicamente comprobada para reducir la ansiedad, promover la relajación profunda y mejorar el bienestar"
                  : "Scientifically proven technique to reduce anxiety, promote deep relaxation and improve well-being"}
              </p>
            </div>
          </div>

          {/* Estatísticas da Sessão */}
          {isBreathingActive && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <Card className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-400/30 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 md:gap-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-orange-500/20 shrink-0">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] sm:text-xs text-white/60">{language === "pt" ? "Ciclos" : language === "es" ? "Ciclos" : "Cycles"}</div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">{cycleCount}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 md:gap-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] sm:text-xs text-white/60">{language === "pt" ? "Tempo" : language === "es" ? "Tiempo" : "Time"}</div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">{formatTime(totalSessionTime)}</div>
                  </div>
                </div>
              </Card>
              <Card className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 md:gap-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-green-500/20 shrink-0">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] sm:text-xs text-white/60">{language === "pt" ? "Fase" : language === "es" ? "Fase" : "Phase"}</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-green-400">{getPhaseText()}</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Área Principal do Exercício - Melhorada */}
          <Card className="p-4 sm:p-6 md:p-12 bg-gradient-to-br from-blue-950/90 via-indigo-950/90 to-purple-950/90 border-white/10 backdrop-blur-xl relative overflow-hidden">
            {/* Background decorativo - apenas quando não está ativo ou em desktop */}
            {!isBreathingActive && (
              <div className="absolute inset-0 opacity-10 sm:opacity-15 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-48 md:h-48 bg-orange-400/15 rounded-full blur-lg sm:blur-xl md:blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-48 md:h-48 bg-amber-400/15 rounded-full blur-lg sm:blur-xl md:blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            )}

            <div className="relative flex flex-col items-center justify-center min-h-[400px] sm:min-h-[450px] md:min-h-[500px] space-y-4 sm:space-y-6 md:space-y-8">
              {/* Círculo Principal Melhorado */}
              <div className="relative">
                {/* Círculos de onda múltiplos */}
                {isBreathingActive && (breathPhase === 'inhale' || breathPhase === 'hold') && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "absolute inset-0 rounded-full border-2",
                          colors.border,
                          "animate-ping"
                        )}
                        style={{
                          opacity: 0.3 - (i * 0.1),
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: '3s',
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Círculo principal */}
                <div 
                  className={cn(
                    "rounded-full border-4 transition-all duration-1000 ease-in-out relative",
                    colors.border,
                    colors.glow,
                    getPhaseSizeClass()
                  )}
                >
                  {/* Gradiente interno */}
                  <div className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-br opacity-20",
                    colors.primary
                  )} />
                  
                  <div className="flex items-center justify-center h-full relative z-10 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
                    <div className="text-center w-full">
                      {/* Contador grande */}
                      <div className={cn(
                        "text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-2 sm:mb-3 md:mb-4 transition-all duration-300",
                        colors.text,
                        "drop-shadow-lg"
                      )}>
                        {breathCountdown}
                      </div>
                      
                      {/* Fase atual */}
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 uppercase tracking-wider sm:tracking-widest font-bold mb-2 sm:mb-3 px-2">
                        {getPhaseText()}
                      </div>
                      
                      {/* Descrição */}
                      <div className="text-sm sm:text-base md:text-lg text-white/80 max-w-[200px] sm:max-w-[240px] md:max-w-[280px] mx-auto leading-relaxed px-2">
                        {getPhaseDescription()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de progresso circular */}
                {isBreathingActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className={cn("transform -rotate-90", getPhaseSizeClass())}>
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className={colors.text}
                        opacity="0.2"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}%`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - phaseProgress / 100)}%`}
                        className={colors.text}
                        opacity="0.6"
                        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Barra de progresso linear */}
              {isBreathingActive && (
                <div className="w-full max-w-md space-y-1 sm:space-y-2 px-4">
                  <div className="flex justify-between text-[10px] sm:text-xs text-white/60 mb-1">
                    <span>{getPhaseText()}</span>
                    <span>{breathCountdown}s / {breathTimings[breathPhase]}s</span>
                  </div>
                  <Progress 
                    value={phaseProgress} 
                    className="h-1.5 sm:h-2 bg-white/10"
                  />
                </div>
              )}

              {/* Mensagem motivacional durante o exercício - apenas em desktop */}
              {isBreathingActive && cycleCount > 0 && (
                <div className="hidden md:block text-center space-y-2 animate-in fade-in duration-500">
                  <div className="flex items-center justify-center gap-2 text-orange-400">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      {cycleCount === 1 
                        ? (language === "pt" ? "Ótimo começo! Continue assim!" : language === "es" ? "¡Gran comienzo! ¡Sigue así!" : "Great start! Keep going!")
                        : cycleCount >= 4
                        ? (language === "pt" ? "Excelente! Você está no caminho certo!" : language === "es" ? "¡Excelente! ¡Vas por buen camino!" : "Excellent! You're on the right track!")
                        : (language === "pt" ? "Muito bem! Continue respirando!" : language === "es" ? "¡Muy bien! ¡Sigue respirando!" : "Well done! Keep breathing!")
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Controles Melhorados */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md px-2">
                {!isBreathingActive ? (
                  <Button
                    onClick={handleStart}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 sm:px-8 py-5 sm:py-6 md:py-7 text-base sm:text-lg shadow-lg shadow-orange-500/50 transition-all hover:scale-105"
                    size="lg"
                  >
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                    {language === "pt" ? "Iniciar Exercício" : language === "es" ? "Iniciar Ejercicio" : "Start Exercise"}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePause}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold py-5 sm:py-6 md:py-7 text-sm sm:text-base shadow-lg shadow-red-500/50 transition-all hover:scale-105"
                      size="lg"
                    >
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {language === "pt" ? "Pausar" : language === "es" ? "Pausar" : "Pause"}
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 py-5 sm:py-6 md:py-7 text-sm sm:text-base transition-all hover:scale-105"
                      size="lg"
                    >
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {language === "pt" ? "Reiniciar" : language === "es" ? "Reiniciar" : "Reset"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Instruções e Informações Melhoradas */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Instruções */}
            <Card className="p-6 bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-orange-500/20 border-orange-400/30 backdrop-blur-sm hover:border-orange-400/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/20">
                    <Info className="h-5 w-5 text-orange-400" />
                  </div>
                  {language === "pt" ? "Como fazer" : language === "es" ? "Cómo hacerlo" : "How to do it"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  {showInstructions 
                    ? (language === "pt" ? "Ocultar" : language === "es" ? "Ocultar" : "Hide")
                    : (language === "pt" ? "Mostrar" : language === "es" ? "Mostrar" : "Show")
                  }
                </Button>
              </div>
              {showInstructions && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {[
                    { step: 1, text: language === "pt" ? "Inspire pelo nariz contando mentalmente até 4 segundos. Sinta o ar preenchendo seus pulmões." : language === "es" ? "Inspira por la nariz contando mentalmente hasta 4 segundos. Siente el aire llenando tus pulmones." : "Inhale through your nose counting mentally to 4 seconds. Feel the air filling your lungs." },
                    { step: 2, text: language === "pt" ? "Segure a respiração contando até 7 segundos. Mantenha a calma e relaxe." : language === "es" ? "Mantén la respiración contando hasta 7 segundos. Mantén la calma y relájate." : "Hold your breath counting to 7 seconds. Stay calm and relax." },
                    { step: 3, text: language === "pt" ? "Expire pela boca contando até 8 segundos, fazendo um som suave 'whoosh'. Libere toda a tensão." : language === "es" ? "Exhala por la boca contando hasta 8 segundos, haciendo un sonido suave 'whoosh'. Libera toda la tensión." : "Exhale through your mouth counting to 8 seconds, making a soft 'whoosh' sound. Release all tension." },
                    { step: 4, text: language === "pt" ? "Pause por 4 segundos antes de repetir o ciclo. Sinta a calma se estabelecendo." : language === "es" ? "Pausa por 4 segundos antes de repetir el ciclo. Siente la calma estableciéndose." : "Pause for 4 seconds before repeating the cycle. Feel the calm settling in." }
                  ].map((item) => (
                    <div 
                      key={item.step}
                      className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {item.step}
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed flex-1 pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Benefícios Melhorados */}
            <Card className="p-6 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/20 border-green-400/30 backdrop-blur-sm hover:border-green-400/50 transition-colors">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/20">
                  <Heart className="h-5 w-5 text-green-400" />
                </div>
                {language === "pt" ? "Benefícios Científicos" : language === "es" ? "Beneficios Científicos" : "Scientific Benefits"}
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: "🧠", text: language === "pt" ? "Reduz ansiedade e estresse rapidamente ativando o sistema nervoso parassimpático" : language === "es" ? "Reduce ansiedad y estrés rápidamente activando el sistema nervioso parasimpático" : "Quickly reduces anxiety and stress by activating the parasympathetic nervous system" },
                  { icon: "😌", text: language === "pt" ? "Promove relaxamento profundo e calma mental através da regulação da respiração" : language === "es" ? "Promueve relajación profunda y calma mental a través de la regulación de la respiración" : "Promotes deep relaxation and mental calm through breath regulation" },
                  { icon: "😴", text: language === "pt" ? "Melhora significativamente a qualidade do sono quando praticado antes de dormir" : language === "es" ? "Mejora significativamente la calidad del sueño cuando se practica antes de dormir" : "Significantly improves sleep quality when practiced before bed" },
                  { icon: "💪", text: language === "pt" ? "Ajuda a controlar impulsos e desejos, fortalecendo o autocontrole" : language === "es" ? "Ayuda a controlar impulsos y deseos, fortaleciendo el autocontrol" : "Helps control impulses and cravings, strengthening self-control" },
                  { icon: "⚡", text: language === "pt" ? "Aumenta a oxigenação do cérebro, melhorando clareza mental e foco" : language === "es" ? "Aumenta la oxigenación del cerebro, mejorando la claridad mental y el enfoque" : "Increases brain oxygenation, improving mental clarity and focus" }
                ].map((benefit, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl shrink-0">{benefit.icon}</span>
                    <span className="text-sm text-white/90 leading-relaxed flex-1">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Dica Final Melhorada */}
          <Card className="p-6 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 border-blue-400/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-2">
                  {language === "pt" ? "Dica de Prática" : language === "es" ? "Consejo de Práctica" : "Practice Tip"}
                </h4>
                <p className="text-white/90 text-sm leading-relaxed">
                  {language === "pt" 
                    ? "💙 Pratique este exercício sempre que sentir ansiedade, estresse ou tentação. Recomenda-se fazer 4-8 ciclos por sessão para melhores resultados. Quanto mais você pratica, mais fácil e natural fica! Experimente praticar pela manhã para começar o dia com calma, ou à noite para relaxar antes de dormir."
                    : language === "es"
                    ? "💙 Practica este ejercicio siempre que sientas ansiedad, estrés o tentación. Se recomienda hacer 4-8 ciclos por sesión para mejores resultados. ¡Cuanto más practiques, más fácil y natural será! Prueba practicar por la mañana para comenzar el día con calma, o por la noche para relajarte antes de dormir."
                    : "💙 Practice this exercise whenever you feel anxiety, stress, or temptation. It's recommended to do 4-8 cycles per session for best results. The more you practice, the easier and more natural it becomes! Try practicing in the morning to start the day calmly, or at night to relax before bed."}
                </p>
              </div>
            </div>
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
