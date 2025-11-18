"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Brain, Play, Pause, ArrowLeft, RotateCcw, Sparkles, X } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export default function MeditarPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  
  // Estados para meditação
  const [meditationTime, setMeditationTime] = useState(300) // 5 minutos em segundos
  const [meditationElapsed, setMeditationElapsed] = useState(0)
  const [isMeditationActive, setIsMeditationActive] = useState(false)
  const [meditationStartTime, setMeditationStartTime] = useState<Date | null>(null)
  const [selectedMeditationType, setSelectedMeditationType] = useState<'guided' | 'timer' | 'breathing'>('timer')
  const [meditationPausedElapsed, setMeditationPausedElapsed] = useState(0)

  // Funções de controle da meditação
  const handleStartMeditation = () => {
    setIsMeditationActive(true)
    setMeditationStartTime(new Date())
    setMeditationElapsed(meditationPausedElapsed)
  }

  const handlePauseMeditation = () => {
    setIsMeditationActive(false)
    if (meditationStartTime) {
      const elapsed = Math.floor((Date.now() - meditationStartTime.getTime()) / 1000) + meditationPausedElapsed
      setMeditationPausedElapsed(elapsed)
      setMeditationElapsed(elapsed)
    }
  }

  const handleResumeMeditation = () => {
    setIsMeditationActive(true)
    setMeditationStartTime(new Date())
  }

  const handleResetMeditation = () => {
    setIsMeditationActive(false)
    setMeditationElapsed(0)
    setMeditationPausedElapsed(0)
    setMeditationStartTime(null)
  }

  // Timer de meditação
  useEffect(() => {
    if (!isMeditationActive || !meditationStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - meditationStartTime.getTime()) / 1000) + meditationPausedElapsed
      setMeditationElapsed(elapsed)
      
      // Para timer e guiada, para quando atingir o tempo definido
      if ((selectedMeditationType === 'timer' || selectedMeditationType === 'guided') && elapsed >= meditationTime) {
        setIsMeditationActive(false)
        setMeditationPausedElapsed(0)
        // Tocar som de conclusão (opcional)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isMeditationActive, meditationStartTime, meditationTime, selectedMeditationType, meditationPausedElapsed])

  const formatMeditationTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getRemainingTime = () => {
    if (selectedMeditationType === 'timer' || selectedMeditationType === 'guided') {
      return Math.max(0, meditationTime - meditationElapsed)
    }
    return meditationElapsed
  }

  const getDisplayTime = () => {
    if (selectedMeditationType === 'timer' || selectedMeditationType === 'guided') {
      return getRemainingTime()
    }
    return meditationElapsed
  }

  return (
    <div className="min-h-screen starry-background relative pb-24">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(
        collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64",
        "transition-all duration-300"
      )}>
        <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-8 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 pb-20 md:pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
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
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 shrink-0">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-400" />
                </div>
                <span className="leading-tight">{t.meditate}</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/70 hidden sm:block">
                {language === "pt" 
                  ? "Relaxe sua mente, encontre paz interior e fortaleça seu autocontrole através da meditação"
                  : language === "es"
                  ? "Relaja tu mente, encuentra paz interior y fortalece tu autocontrol a través de la meditación"
                  : "Relax your mind, find inner peace and strengthen your self-control through meditation"}
              </p>
            </div>
          </div>

          {/* Seleção de Tipo de Meditação */}
          {!isMeditationActive && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setSelectedMeditationType('timer')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMeditationType === 'timer'
                    ? 'bg-purple-500/20 border-purple-400 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-2">⏱️</div>
                <div className="font-semibold mb-1">
                  {language === "pt" ? "Timer" : language === "es" ? "Temporizador" : "Timer"}
                </div>
                <div className="text-xs text-white/60">
                  {language === "pt" ? "Medite por um tempo definido" : language === "es" ? "Medita por un tiempo definido" : "Meditate for a set time"}
                </div>
              </button>
              <button
                onClick={() => setSelectedMeditationType('guided')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMeditationType === 'guided'
                    ? 'bg-purple-500/20 border-purple-400 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-semibold mb-1">
                  {language === "pt" ? "Guiada" : language === "es" ? "Guiada" : "Guided"}
                </div>
                <div className="text-xs text-white/60">
                  {language === "pt" ? "Siga instruções passo a passo" : language === "es" ? "Sigue instrucciones paso a paso" : "Follow step-by-step instructions"}
                </div>
              </button>
              <button
                onClick={() => router.push('/breath-exercise')}
                className="p-4 rounded-lg border-2 bg-white/5 border-white/20 text-white/70 hover:bg-white/10 transition-all"
              >
                <div className="text-2xl mb-2">🌬️</div>
                <div className="font-semibold mb-1">
                  {language === "pt" ? "Respiração" : language === "es" ? "Respiración" : "Breathing"}
                </div>
                <div className="text-xs text-white/60">
                  {language === "pt" ? "Exercício de respiração 4-7-8" : language === "es" ? "Ejercicio de respiración 4-7-8" : "4-7-8 breathing exercise"}
                </div>
              </button>
            </div>
          )}

          {/* Configuração de Tempo (para timer e guiada) */}
          {!isMeditationActive && (selectedMeditationType === 'timer' || selectedMeditationType === 'guided') && (
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30 backdrop-blur-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">
                  {language === "pt" ? "Duração" : language === "es" ? "Duración" : "Duration"}
                </span>
                <span className="text-2xl font-bold text-purple-400">
                  {formatMeditationTime(meditationTime)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[60, 300, 600, 900].map((time) => (
                  <button
                    key={time}
                    onClick={() => setMeditationTime(time)}
                    className={`py-2 px-3 rounded-lg text-sm transition-all ${
                      meditationTime === time
                        ? 'bg-purple-500/30 border-2 border-purple-400 text-white'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {time === 60 ? '1m' : time === 300 ? '5m' : time === 600 ? '10m' : '15m'}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Área Principal de Meditação */}
          <Card className="p-4 sm:p-4 md:p-6 bg-gradient-to-br from-purple-950/90 via-indigo-950/90 to-blue-950/90 border-white/10 backdrop-blur-xl relative overflow-hidden">
            <div className="relative flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px] space-y-2 sm:space-y-3 md:space-y-4">
              {selectedMeditationType === 'timer' && (
                <>
                  {/* Timer Grande */}
                  <div className="text-5xl md:text-6xl font-bold text-purple-300 mb-2 font-mono">
                    {formatMeditationTime(getRemainingTime())}
                  </div>
                  
                  {/* Progresso Circular */}
                  {isMeditationActive && (
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mb-3">
                      <svg className="transform -rotate-90 w-full h-full">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-white/10"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="text-purple-400"
                          strokeDasharray={`${2 * Math.PI * 45}%`}
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - (meditationElapsed / meditationTime))}%`}
                          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                        />
                      </svg>
                    </div>
                  )}

                  {/* Mensagem Motivacional */}
                  {isMeditationActive && (
                    <div className="text-center space-y-1 mb-3">
                      <p className="text-base text-white/90">
                        {language === "pt" 
                          ? "Respire profundamente e relaxe..."
                          : language === "es"
                          ? "Respira profundamente y relájate..."
                          : "Breathe deeply and relax..."}
                      </p>
                      <p className="text-sm text-white/60">
                        {language === "pt" 
                          ? "Foque na sua respiração e deixe os pensamentos passarem"
                          : language === "es"
                          ? "Enfócate en tu respiración y deja que los pensamientos pasen"
                          : "Focus on your breath and let thoughts pass"}
                      </p>
                    </div>
                  )}

                  {!isMeditationActive && (
                    <div className="text-center space-y-1 mb-3">
                      <p className="text-base text-white/90">
                        {language === "pt" 
                          ? "Pronto para começar sua meditação?"
                          : language === "es"
                          ? "¿Listo para comenzar tu meditación?"
                          : "Ready to start your meditation?"}
                      </p>
                      <p className="text-sm text-white/60">
                        {language === "pt" 
                          ? "Encontre um lugar tranquilo e confortável"
                          : language === "es"
                          ? "Encuentra un lugar tranquilo y cómodo"
                          : "Find a quiet and comfortable place"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {selectedMeditationType === 'guided' && (
                <>
                  {isMeditationActive ? (
                    <>
                      {/* Timer Grande durante meditação ativa */}
                      <div className="text-5xl md:text-6xl font-bold text-purple-300 mb-2 font-mono">
                        {formatMeditationTime(getRemainingTime())}
                      </div>
                      
                      {/* Progresso Circular */}
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mb-3">
                        <svg className="transform -rotate-90 w-full h-full">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-white/10"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            className="text-purple-400"
                            strokeDasharray={`${2 * Math.PI * 45}%`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - (meditationElapsed / meditationTime))}%`}
                            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                          />
                        </svg>
                      </div>

                      {/* Instruções durante meditação */}
                      <div className="text-center space-y-1 mb-3 max-w-md">
                        <p className="text-base text-white/90">
                          {language === "pt" 
                            ? "Siga as instruções e respire profundamente..."
                            : language === "es"
                            ? "Sigue las instrucciones y respira profundamente..."
                            : "Follow the instructions and breathe deeply..."}
                        </p>
                        <p className="text-sm text-white/60">
                          {language === "pt" 
                            ? "Foque na sua respiração e deixe os pensamentos passarem"
                            : language === "es"
                            ? "Enfócate en tu respiración y deja que los pensamientos pasen"
                            : "Focus on your breath and let thoughts pass"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-2 w-full">
                      <div className="text-4xl mb-2">🎯</div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {language === "pt" ? "Meditação Guiada" : language === "es" ? "Meditación Guiada" : "Guided Meditation"}
                      </h3>
                      <p className="text-white/80 text-sm max-w-md mx-auto mb-2">
                        {language === "pt" 
                          ? "Siga estas instruções simples para uma meditação guiada:"
                          : language === "es"
                          ? "Sigue estas instrucciones simples para una meditación guiada:"
                          : "Follow these simple instructions for a guided meditation:"}
                      </p>
                      <div className="space-y-2 mt-3 text-left max-w-md mx-auto">
                        {[
                          { step: 1, text: language === "pt" ? "Sente-se confortavelmente com a coluna ereta" : language === "es" ? "Siéntate cómodamente con la columna recta" : "Sit comfortably with your back straight" },
                          { step: 2, text: language === "pt" ? "Feche os olhos e respire naturalmente" : language === "es" ? "Cierra los ojos y respira naturalmente" : "Close your eyes and breathe naturally" },
                          { step: 3, text: language === "pt" ? "Foque sua atenção na respiração" : language === "es" ? "Enfoca tu atención en la respiración" : "Focus your attention on your breath" },
                          { step: 4, text: language === "pt" ? "Quando a mente divagar, gentilmente traga de volta ao foco" : language === "es" ? "Cuando la mente divague, suavemente vuelve al foco" : "When your mind wanders, gently bring it back to focus" },
                          { step: 5, text: language === "pt" ? "Permaneça assim pelo tempo configurado" : language === "es" ? "Permanece así por el tiempo configurado" : "Stay like this for the configured time" }
                        ].map((item) => (
                          <div key={item.step} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {item.step}
                            </div>
                            <p className="text-white/90 text-sm pt-1">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Controles */}
              <div className="flex items-center gap-3 mt-4">
                {!isMeditationActive ? (
                  <>
                    <Button
                      onClick={meditationElapsed > 0 ? handleResumeMeditation : handleStartMeditation}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold px-6 py-4 text-base"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {meditationElapsed > 0 
                        ? (language === "pt" ? "Retomar" : language === "es" ? "Reanudar" : "Resume")
                        : (language === "pt" ? "Iniciar" : language === "es" ? "Iniciar" : "Start")
                      }
                    </Button>
                    {meditationElapsed > 0 && (
                      <Button
                        onClick={handleResetMeditation}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 px-4 py-4"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {language === "pt" ? "Reiniciar" : language === "es" ? "Reiniciar" : "Reset"}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handlePauseMeditation}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 px-4 py-4"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      {t.pause}
                    </Button>
                    <Button
                      onClick={handleResetMeditation}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 px-4 py-4"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {language === "pt" ? "Reiniciar" : language === "es" ? "Reiniciar" : "Reset"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Benefícios da Meditação */}
          <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-green-400" />
              {language === "pt" ? "Benefícios da Meditação" : language === "es" ? "Beneficios de la Meditación" : "Meditation Benefits"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                { icon: "🧠", text: language === "pt" ? "Reduz ansiedade e estresse" : language === "es" ? "Reduce ansiedad y estrés" : "Reduces anxiety and stress" },
                { icon: "💪", text: language === "pt" ? "Fortalece autocontrole" : language === "es" ? "Fortalece el autocontrol" : "Strengthens self-control" },
                { icon: "😌", text: language === "pt" ? "Promove paz interior" : language === "es" ? "Promueve paz interior" : "Promotes inner peace" },
                { icon: "⚡", text: language === "pt" ? "Melhora foco e concentração" : language === "es" ? "Mejora enfoque y concentración" : "Improves focus and concentration" }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-white/90">
                  <span className="text-xl">{benefit.icon}</span>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

