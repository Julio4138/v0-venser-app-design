"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
import { X, ArrowLeft, Lightbulb, AlertCircle, CheckCircle2, Sparkles, Eye, Brain, Trophy, Zap, Target, Flame, Star, Award, TrendingUp } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { useIllusionBusterProgress } from "@/lib/use-illusion-buster-progress"

interface Illusion {
  id: string
  title: string
  description: string
  reality: string
  category: string
  xp: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
}

interface Badge {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

export default function IllusionBusterPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const { progress, updateProgress, isLoading: isLoadingProgress } = useIllusionBusterProgress()
  
  const [selectedIllusion, setSelectedIllusion] = useState<Illusion | null>(null)
  const [viewedIllusions, setViewedIllusions] = useState<Set<string>>(new Set())
  const [shownBadges, setShownBadges] = useState<Set<string>>(new Set())
  const [isDestroying, setIsDestroying] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [showBadge, setShowBadge] = useState<Badge | null>(null)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)
  const [showXpGain, setShowXpGain] = useState<{ value: number; x: number; y: number } | null>(null)
  const [streak, setStreak] = useState(0)
  const [isExploding, setIsExploding] = useState(false)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const animationFrameRef = useRef<number>()
  const previousModalOpen = useRef(false)
  const hasLoadedFromDb = useRef(false)

  const XP_PER_LEVEL = 100
  const XP_PER_ILLUSION = 50
  const COMBO_MULTIPLIER = 1.5

  const illusions: Illusion[] = [
    {
      id: "1",
      title: language === "pt" ? "Vou usar apenas uma vez" : language === "es" ? "Lo usaré solo una vez" : "I'll just use it once",
      description: language === "pt" 
        ? "Acreditar que você pode controlar o uso e parar quando quiser"
        : language === "es"
        ? "Creer que puedes controlar el uso y parar cuando quieras"
        : "Believing you can control usage and stop whenever you want",
      reality: language === "pt"
        ? "O vício funciona através do sistema de recompensa do cérebro. Cada uso reforça o comportamento, tornando mais difícil resistir na próxima vez. O 'apenas uma vez' é uma armadilha mental que o vício usa para te manter preso. A pornografia é projetada para ser viciante - cada visualização aumenta o desejo pela próxima."
        : language === "es"
        ? "La adicción funciona a través del sistema de recompensa del cerebro. Cada uso refuerza el comportamiento, haciendo más difícil resistir la próxima vez. El 'solo una vez' es una trampa mental que la adicción usa para mantenerte atrapado. La pornografía está diseñada para ser adictiva - cada visualización aumenta el deseo por la siguiente."
        : "Addiction works through the brain's reward system. Each use reinforces the behavior, making it harder to resist next time. 'Just once' is a mental trap that addiction uses to keep you trapped. Pornography is designed to be addictive - each viewing increases the desire for the next.",
      category: language === "pt" ? "Controle" : language === "es" ? "Control" : "Control",
      xp: XP_PER_ILLUSION
    },
    {
      id: "2",
      title: language === "pt" ? "Isso me ajuda a relaxar" : language === "es" ? "Esto me ayuda a relajarme" : "This helps me relax",
      description: language === "pt"
        ? "Pensar que o comportamento problemático é uma solução para o estresse"
        : language === "es"
        ? "Pensar que el comportamiento problemático es una solución para el estrés"
        : "Thinking the problematic behavior is a solution for stress",
      reality: language === "pt"
        ? "O alívio é temporário e ilusório. O que você sente é uma fuga momentânea, mas o estresse e a ansiedade retornam ainda mais fortes. A pornografia cria um ciclo vicioso: você usa para escapar do estresse, mas isso aumenta a ansiedade e a depressão, criando mais necessidade de usar novamente. O verdadeiro relaxamento vem de técnicas saudáveis como meditação, exercícios e conexões genuínas."
        : language === "es"
        ? "El alivio es temporal e ilusorio. Lo que sientes es un escape momentáneo, pero el estrés y la ansiedad regresan aún más fuertes. La pornografía crea un círculo vicioso: la usas para escapar del estrés, pero esto aumenta la ansiedad y la depresión, creando más necesidad de usarla nuevamente. El verdadero relax viene de técnicas saludables como meditación, ejercicios y conexiones genuinas."
        : "The relief is temporary and illusory. What you feel is a momentary escape, but stress and anxiety return even stronger. Pornography creates a vicious cycle: you use it to escape stress, but this increases anxiety and depression, creating more need to use again. True relaxation comes from healthy techniques like meditation, exercise, and genuine connections.",
      category: language === "pt" ? "Bem-estar" : language === "es" ? "Bienestar" : "Wellbeing",
      xp: XP_PER_ILLUSION
    },
    {
      id: "3",
      title: language === "pt" ? "Não é tão ruim assim" : language === "es" ? "No es tan malo" : "It's not that bad",
      description: language === "pt"
        ? "Minimizar as consequências negativas do comportamento"
        : language === "es"
        ? "Minimizar las consecuencias negativas del comportamiento"
        : "Minimizing the negative consequences of the behavior",
      reality: language === "pt"
        ? "Seu cérebro está distorcendo a realidade para proteger o vício. As consequências são reais: perda de tempo, energia, relacionamentos, saúde mental e física. A pornografia afeta sua visão de relacionamentos reais, sua capacidade de intimidade, sua autoestima e sua energia. Reconhecer o impacto real é o primeiro passo para a mudança."
        : language === "es"
        ? "Tu cerebro está distorsionando la realidad para proteger la adicción. Las consecuencias son reales: pérdida de tiempo, energía, relaciones, salud mental y física. La pornografía afecta tu visión de relaciones reales, tu capacidad de intimidad, tu autoestima y tu energía. Reconocer el impacto real es el primer paso para el cambio."
        : "Your brain is distorting reality to protect the addiction. The consequences are real: loss of time, energy, relationships, mental and physical health. Pornography affects your view of real relationships, your capacity for intimacy, your self-esteem, and your energy. Recognizing the real impact is the first step to change.",
      category: language === "pt" ? "Realidade" : language === "es" ? "Realidad" : "Reality",
      xp: XP_PER_ILLUSION
    },
    {
      id: "4",
      title: language === "pt" ? "Preciso disso para funcionar" : language === "es" ? "Necesito esto para funcionar" : "I need this to function",
      description: language === "pt"
        ? "Acreditar que o comportamento é necessário para seu desempenho diário"
        : language === "es"
        ? "Creer que el comportamiento es necesario para tu desempeño diario"
        : "Believing the behavior is necessary for your daily performance",
      reality: language === "pt"
        ? "Isso é dependência, não necessidade. Seu cérebro adaptou-se ao comportamento, mas você pode recondicioná-lo. A pornografia não melhora seu desempenho - na verdade, ela drena sua energia, reduz sua motivação e afeta sua capacidade de foco. Com tempo e técnicas adequadas, você descobrirá que pode funcionar melhor sem isso, com mais clareza e energia genuína."
        : language === "es"
        ? "Eso es dependencia, no necesidad. Tu cerebro se ha adaptado al comportamiento, pero puedes recondicionarlo. La pornografía no mejora tu desempeño - de hecho, drena tu energía, reduce tu motivación y afecta tu capacidad de enfoque. Con tiempo y técnicas adecuadas, descubrirás que puedes funcionar mejor sin eso, con más claridad y energía genuina."
        : "That's dependence, not need. Your brain has adapted to the behavior, but you can recondition it. Pornography doesn't improve your performance - in fact, it drains your energy, reduces your motivation, and affects your ability to focus. With time and proper techniques, you'll discover you can function better without it, with more clarity and genuine energy.",
      category: language === "pt" ? "Dependência" : language === "es" ? "Dependencia" : "Dependence",
      xp: XP_PER_ILLUSION
    },
    {
      id: "5",
      title: language === "pt" ? "Todos fazem isso" : language === "es" ? "Todos lo hacen" : "Everyone does this",
      description: language === "pt"
        ? "Usar a normalização social como justificativa"
        : language === "es"
        ? "Usar la normalización social como justificación"
        : "Using social normalization as justification",
      reality: language === "pt"
        ? "Nem todos fazem, e mesmo que fizessem, isso não torna o comportamento saudável para você. Muitas pessoas estão lutando contra esse vício em silêncio. Você está aqui porque reconheceu que isso está afetando sua vida negativamente. Foque no que é melhor para você, não nos outros. Sua jornada de recuperação é única e válida."
        : language === "es"
        ? "No todos lo hacen, y aunque lo hicieran, eso no hace el comportamiento saludable para ti. Muchas personas están luchando contra esta adicción en silencio. Estás aquí porque reconociste que esto está afectando tu vida negativamente. Enfócate en lo que es mejor para ti, no en los demás. Tu viaje de recuperación es único y válido."
        : "Not everyone does, and even if they did, that doesn't make the behavior healthy for you. Many people are struggling with this addiction in silence. You're here because you recognized this is negatively affecting your life. Focus on what's best for you, not others. Your recovery journey is unique and valid.",
      category: language === "pt" ? "Social" : language === "es" ? "Social" : "Social",
      xp: XP_PER_ILLUSION
    },
    {
      id: "6",
      title: language === "pt" ? "Não consigo parar, é muito difícil" : language === "es" ? "No puedo parar, es muy difícil" : "I can't stop, it's too hard",
      description: language === "pt"
        ? "Acreditar que mudar é impossível ou muito difícil"
        : language === "es"
        ? "Creer que cambiar es imposible o muy difícil"
        : "Believing change is impossible or too difficult",
      reality: language === "pt"
        ? "Mudar é desafiador, mas não impossível. Milhões de pessoas conseguiram. Você já deu o primeiro passo ao reconhecer o problema. Com suporte, técnicas adequadas e determinação, você pode superar isso. A recuperação não é linear - haverá altos e baixos, mas cada dia sem o vício é uma vitória. Um dia de cada vez, você pode vencer."
        : language === "es"
        ? "Cambiar es desafiante, pero no imposible. Millones de personas lo lograron. Ya diste el primer paso al reconocer el problema. Con apoyo, técnicas adecuadas y determinación, puedes superarlo. La recuperación no es lineal - habrá altibajos, pero cada día sin la adicción es una victoria. Un día a la vez, puedes vencer."
        : "Change is challenging but not impossible. Millions of people have succeeded. You've already taken the first step by recognizing the problem. With support, proper techniques, and determination, you can overcome this. Recovery is not linear - there will be ups and downs, but each day without the addiction is a victory. One day at a time, you can win.",
      category: language === "pt" ? "Mudança" : language === "es" ? "Cambio" : "Change",
      xp: XP_PER_ILLUSION
    }
  ]

  const badges: Badge[] = useMemo(() => [
    {
      id: "first",
      title: language === "pt" ? "Primeiro Passo" : language === "es" ? "Primer Paso" : "First Step",
      description: language === "pt" ? "Destruiu sua primeira ilusão!" : language === "es" ? "¡Destruiste tu primera ilusión!" : "Destroyed your first illusion!",
      icon: <Star className="h-8 w-8" />,
      color: "from-yellow-500 to-orange-500"
    },
    {
      id: "halfway",
      title: language === "pt" ? "Meio Caminho" : language === "es" ? "A Mitad del Camino" : "Halfway There",
      description: language === "pt" ? "Destruiu 3 ilusões!" : language === "es" ? "¡Destruiste 3 ilusiones!" : "Destroyed 3 illusions!",
      icon: <Target className="h-8 w-8" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "master",
      title: language === "pt" ? "Mestre da Consciência" : language === "es" ? "Maestro de la Conciencia" : "Master of Awareness",
      description: language === "pt" ? "Destruiu todas as ilusões!" : language === "es" ? "¡Destruiste todas las ilusiones!" : "Destroyed all illusions!",
      icon: <Trophy className="h-8 w-8" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "combo3",
      title: language === "pt" ? "Combo Triplo" : language === "es" ? "Combo Triple" : "Triple Combo",
      description: language === "pt" ? "Destruiu 3 ilusões em sequência!" : language === "es" ? "¡Destruiste 3 ilusiones seguidas!" : "Destroyed 3 illusions in a row!",
      icon: <Zap className="h-8 w-8" />,
      color: "from-yellow-400 to-orange-500"
    },
    {
      id: "streak5",
      title: language === "pt" ? "Raio de Consciência" : language === "es" ? "Rayo de Conciencia" : "Awareness Bolt",
      description: language === "pt" ? "5 ilusões destruídas!" : language === "es" ? "¡5 ilusiones destruidas!" : "5 illusions destroyed!",
      icon: <Flame className="h-8 w-8" />,
      color: "from-red-500 to-orange-500"
    }
  ], [language])

  // Carregar dados do banco quando o progresso for carregado
  useEffect(() => {
    if (!isLoadingProgress && progress && !hasLoadedFromDb.current) {
      setXp(progress.illusion_buster_xp)
      setLevel(progress.illusion_buster_level)
      setCombo(progress.current_combo)
      setStreak(progress.illusion_buster_streak)
      setViewedIllusions(new Set(progress.destroyed_illusions))
      setShownBadges(new Set(progress.earned_badges))
      hasLoadedFromDb.current = true
    }
  }, [isLoadingProgress, progress])

  // Salvar progresso no banco quando houver mudanças
  useEffect(() => {
    if (!hasLoadedFromDb.current) return // Não salvar durante o carregamento inicial

    const saveProgress = async () => {
      await updateProgress({
        xp,
        level,
        destroyedIllusions: Array.from(viewedIllusions),
        earnedBadges: Array.from(shownBadges),
        combo,
        streak
      })
    }

    // Debounce para não salvar a cada mudança
    const timer = setTimeout(() => {
      saveProgress()
    }, 1000) // Salva após 1 segundo de inatividade

    return () => clearTimeout(timer)
  }, [xp, level, viewedIllusions, shownBadges, combo, streak, updateProgress])

  // Calculate current level XP
  const currentLevelXp = xp % XP_PER_LEVEL
  const progressPercentage = (currentLevelXp / XP_PER_LEVEL) * 100

  // Create particles for explosion effect
  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color,
        life: 1
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    let animationId: number

    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.5,
            y: p.y + p.vy * 0.5,
            vy: p.vy + 0.3, // gravity
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0)
        
        if (updated.length > 0) {
          animationId = requestAnimationFrame(animate)
        }
        
        return updated
      })
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [particles.length])

  // Reset combo after 10 seconds of inactivity
  useEffect(() => {
    if (combo === 0) return

    const timer = setTimeout(() => {
      setCombo(0)
    }, 10000)

    return () => clearTimeout(timer)
  }, [combo, viewedIllusions.size])

  // Check for badges when modal closes (only trigger when modal transitions from open to closed)
  useEffect(() => {
    const isModalOpen = selectedIllusion !== null
    const wasModalJustClosed = previousModalOpen.current && !isModalOpen && !showBadge
    
    previousModalOpen.current = isModalOpen

    // Only check for badges when modal was just closed
    if (!wasModalJustClosed || viewedIllusions.size === 0) return

    const destroyedCount = viewedIllusions.size
    let badgeId: string | null = null

    // Priority order: master > combo > halfway > streak > first
    if (destroyedCount === 6 && !shownBadges.has("master")) {
      badgeId = "master"
    } else if (combo >= 3 && !shownBadges.has("combo3")) {
      badgeId = "combo3"
    } else if (destroyedCount === 3 && !shownBadges.has("halfway")) {
      badgeId = "halfway"
    } else if (destroyedCount === 5 && !shownBadges.has("streak5")) {
      badgeId = "streak5"
    } else if (destroyedCount === 1 && !shownBadges.has("first")) {
      badgeId = "first"
    }

    if (badgeId) {
      const badgeToShow = badges.find(b => b.id === badgeId)
      if (badgeToShow) {
        // Delay to ensure modal animation completes and user can read content
        const timer = setTimeout(() => {
          if (!selectedIllusion && !showBadge) {
            const newShownBadges = new Set([...shownBadges, badgeId!])
            setShownBadges(newShownBadges)
            setShowBadge(badgeToShow)
            // Salvar badge no banco imediatamente
            updateProgress({
              earnedBadges: Array.from(newShownBadges)
            })
          }
        }, 1000) // Increased delay to allow user to read
        return () => clearTimeout(timer)
      }
    }
  }, [selectedIllusion, showBadge, viewedIllusions.size, combo, badges, shownBadges, updateProgress])

  // Check level up - only show when modal is closed
  useEffect(() => {
    const newLevel = Math.floor(xp / XP_PER_LEVEL) + 1
    if (newLevel > level && xp > 0 && !selectedIllusion && !showBadge && hasLoadedFromDb.current) {
      setLevel(newLevel)
      // Salvar nível no banco
      updateProgress({
        level: newLevel
      })
      
      const levelBadgeId = `levelup-${newLevel}`
      if (!shownBadges.has(levelBadgeId)) {
        // Delay to allow other badges to show first
        const timer = setTimeout(() => {
          if (!showBadge && !selectedIllusion) {
            const newShownBadges = new Set([...shownBadges, levelBadgeId])
            setShownBadges(newShownBadges)
            setShowBadge({
              id: levelBadgeId,
              title: language === "pt" ? "Subiu de Nível!" : language === "es" ? "¡Subiste de Nivel!" : "Level Up!",
              description: language === "pt" ? `Nível ${newLevel} alcançado!` : language === "es" ? `¡Nivel ${newLevel} alcanzado!` : `Level ${newLevel} reached!`,
              icon: <TrendingUp className="h-8 w-8" />,
              color: "from-purple-500 to-indigo-500"
            })
            // Salvar badge no banco imediatamente
            updateProgress({
              earnedBadges: Array.from(newShownBadges)
            })
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [xp, level, language, showBadge, selectedIllusion, shownBadges, updateProgress])

  const handleDestroyIllusion = (illusion: Illusion) => {
    const cardElement = cardRefs.current.get(illusion.id)
    if (!cardElement) return

    const rect = cardElement.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    const wasNew = !viewedIllusions.has(illusion.id)

    if (wasNew) {
      // Create explosion effect
      setIsDestroying(true)
      setIsExploding(true)
      createParticles(x, y, "#ec4899")

      // Calculate XP with combo
      const baseXp = illusion.xp
      const comboMultiplier = combo > 0 ? COMBO_MULTIPLIER : 1
      const gainedXp = Math.floor(baseXp * comboMultiplier)

      // Update game state
      const newXp = xp + gainedXp
      const newCombo = combo + 1
      const newStreak = streak + 1
      const newViewedIllusions = new Set([...viewedIllusions, illusion.id])
      
      setXp(newXp)
      setCombo(newCombo)
      setStreak(newStreak)
      setViewedIllusions(newViewedIllusions)
      
      // Salvar no banco imediatamente
      updateProgress({
        xp: newXp,
        destroyedIllusions: Array.from(newViewedIllusions),
        combo: newCombo,
        streak: newStreak
      })

      // Show XP gain animation
      setShowXpGain({
        value: gainedXp,
        x: x,
        y: y
      })

      setTimeout(() => {
        setShowXpGain(null)
      }, 2000)

      // Reset explosion effect
      setTimeout(() => {
        setIsDestroying(false)
        setIsExploding(false)
      }, 1000)
    }

    // Show modal with reality
    setSelectedIllusion(illusion)
  }

  const handleCloseIllusion = () => {
    setSelectedIllusion(null)
    // Badges will be checked automatically by useEffect when modal closes
  }

  const handleConfirmReality = () => {
    setSelectedIllusion(null)
    // Badges will be checked automatically by useEffect when modal closes
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      [language === "pt" ? "Controle" : language === "es" ? "Control" : "Control"]: "from-pink-500 to-rose-500",
      [language === "pt" ? "Bem-estar" : language === "es" ? "Bienestar" : "Wellbeing"]: "from-blue-500 to-cyan-500",
      [language === "pt" ? "Realidade" : language === "es" ? "Realidad" : "Reality"]: "from-orange-500 to-amber-500",
      [language === "pt" ? "Dependência" : language === "es" ? "Dependencia" : "Dependence"]: "from-purple-500 to-indigo-500",
      [language === "pt" ? "Social" : language === "es" ? "Social" : "Social"]: "from-green-500 to-emerald-500",
      [language === "pt" ? "Mudança" : language === "es" ? "Cambio" : "Change"]: "from-yellow-500 to-orange-500"
    }
    return colors[category] || "from-gray-500 to-gray-600"
  }

  return (
    <div className="min-h-screen tools-background relative pb-24 overflow-hidden">
      <MobileHeader />
      <DesktopSidebar />

      {/* Particles Layer */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: `scale(${particle.life})`,
              transition: "opacity 0.1s, transform 0.1s"
            }}
          />
        ))}
      </div>

      {/* XP Gain Animation */}
      {showXpGain && (
        <div
          className="fixed z-50 pointer-events-none animate-bounce"
          style={{
            left: `${showXpGain.x}px`,
            top: `${showXpGain.y}px`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className="text-2xl font-bold text-yellow-400 drop-shadow-lg">
            +{showXpGain.value} XP
            {combo > 1 && (
              <span className="text-orange-400 ml-2">
                {combo}x COMBO!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Badge Notification */}
      {showBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <Card className={cn(
            "max-w-md w-full p-8 bg-gradient-to-br border-2 animate-in zoom-in-95 duration-500",
            `bg-gradient-to-br ${showBadge.color} border-white/30 backdrop-blur-xl`
          )}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn(
                "p-4 rounded-full bg-white/20 animate-pulse",
                `text-white`
              )}>
                {showBadge.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {showBadge.title}
                </h3>
                <p className="text-white/90">
                  {showBadge.description}
                </p>
              </div>
              <Button
                onClick={() => setShowBadge(null)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                {language === "pt" ? "Continuar" : language === "es" ? "Continuar" : "Continue"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className={cn(
        collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64",
        "transition-all duration-300"
      )}>
        <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <Link href="/tools">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.tools}
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 shrink-0">
                  <X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-pink-400" />
                </div>
                <span className="leading-tight">
                  {language === "pt" ? "Illusion Buster" : language === "es" ? "Rompedor de Ilusiones" : "Illusion Buster"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/70">
                {language === "pt"
                  ? "Destrua as ilusões que mantêm você preso no vício da pornografia. Ganhe XP, suba de nível e liberte-se!"
                  : language === "es"
                  ? "Destruye las ilusiones que te mantienen atrapado en la adicción a la pornografía. ¡Gana XP, sube de nivel y libérate!"
                  : "Destroy the illusions that keep you trapped in pornography addiction. Earn XP, level up, and free yourself!"}
              </p>
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-white/60">{language === "pt" ? "Nível" : language === "es" ? "Nivel" : "Level"}</span>
              </div>
              <div className="text-2xl font-bold text-white">{level}</div>
              <Progress value={progressPercentage} className="h-1.5 mt-2 bg-white/10" />
              <div className="text-xs text-white/60 mt-1">{currentLevelXp}/{XP_PER_LEVEL} XP</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-white/60">XP Total</span>
              </div>
              <div className="text-2xl font-bold text-white">{xp}</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-xs text-white/60">{language === "pt" ? "Destruídas" : language === "es" ? "Destruidas" : "Destroyed"}</span>
              </div>
              <div className="text-2xl font-bold text-white">{viewedIllusions.size}/{illusions.length}</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-red-400" />
                <span className="text-xs text-white/60">COMBO</span>
              </div>
              <div className="text-2xl font-bold text-white">{combo}x</div>
            </Card>
          </div>

          {/* Description Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-pink-500/20 border-pink-400/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-pink-500/20 shrink-0">
                <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === "pt" ? "Como Jogar" : language === "es" ? "Cómo Jugar" : "How to Play"}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {language === "pt"
                    ? "Clique em qualquer ilusão para descobrir a verdade e destruí-la! Cada ilusão destruída te dá XP. Mantenha um combo destruindo várias ilusões em sequência para ganhar mais XP. Suba de nível e ganhe badges incríveis enquanto liberta sua mente do vício da pornografia."
                    : language === "es"
                    ? "¡Haz clic en cualquier ilusión para descubrir la verdad y destruirla! Cada ilusión destruida te da XP. Mantén un combo destruyendo varias ilusiones seguidas para ganar más XP. Sube de nivel y gana badges increíbles mientras liberas tu mente de la adicción a la pornografía."
                    : "Click on any illusion to discover the truth and destroy it! Each destroyed illusion gives you XP. Maintain a combo by destroying multiple illusions in a row to earn more XP. Level up and earn amazing badges while freeing your mind from pornography addiction."}
                </p>
              </div>
            </div>
          </Card>

          {/* Illusions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {illusions.map((illusion) => {
              const isDestroyed = viewedIllusions.has(illusion.id)
              const categoryColor = getCategoryColor(illusion.category)
              
              return (
                <Card
                  key={illusion.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(illusion.id, el)
                  }}
                  onClick={() => handleDestroyIllusion(illusion)}
                  className={cn(
                    "p-4 sm:p-5 cursor-pointer transition-all duration-300 relative overflow-hidden",
                    "bg-black/20 backdrop-blur-md border border-white/10",
                    isDestroyed 
                      ? "border-green-400/50 bg-green-500/20 scale-95" 
                      : "hover:scale-105 hover:bg-black/30 hover:border-pink-400/30 hover:shadow-lg hover:shadow-pink-500/20",
                    isExploding && selectedIllusion?.id === illusion.id && "animate-pulse"
                  )}
                >
                  {/* Destruction effect overlay */}
                  {isDestroyed && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 animate-pulse" />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs font-semibold",
                            "bg-gradient-to-r text-white",
                            categoryColor
                          )}>
                            {illusion.category}
                          </span>
                          {isDestroyed && (
                            <CheckCircle2 className="h-4 w-4 text-green-400 animate-in zoom-in duration-300" />
                          )}
                        </div>
                        <h3 className={cn(
                          "text-base sm:text-lg font-bold mb-2 transition-all",
                          isDestroyed ? "text-green-300 line-through" : "text-white"
                        )}>
                          {illusion.title}
                        </h3>
                        <p className={cn(
                          "text-sm leading-relaxed transition-all",
                          isDestroyed ? "text-white/50" : "text-white/70"
                        )}>
                          {illusion.description}
                        </p>
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg shrink-0 transition-all",
                        isDestroyed 
                          ? "bg-green-500/30" 
                          : "bg-pink-500/20"
                      )}>
                        {isDestroyed ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                        ) : (
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                        )}
                      </div>
                    </div>
                    {!isDestroyed && (
                      <div className="flex items-center gap-2 text-xs text-pink-400">
                        <Sparkles className="h-3 w-3" />
                        <span>
                          {language === "pt" ? "Clique para destruir" : language === "es" ? "Haz clic para destruir" : "Click to destroy"}
                        </span>
                      </div>
                    )}
                    {isDestroyed && (
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <Trophy className="h-3 w-3" />
                        <span>
                          {language === "pt" ? "Destruída! +" + illusion.xp + " XP" : language === "es" ? "¡Destruida! +" + illusion.xp + " XP" : "Destroyed! +" + illusion.xp + " XP"}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Selected Illusion Modal */}
          {selectedIllusion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <Card className="max-w-2xl w-full p-6 sm:p-8 bg-gradient-to-br from-pink-950/95 via-rose-950/95 to-pink-950/95 border-pink-400/30 backdrop-blur-xl relative animate-in zoom-in-95 duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseIllusion}
                  className="absolute top-4 right-4 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl bg-gradient-to-r shrink-0 animate-pulse",
                      getCategoryColor(selectedIllusion.category)
                    )}>
                      <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-md text-xs font-semibold mb-2",
                        "bg-gradient-to-r text-white",
                        getCategoryColor(selectedIllusion.category)
                      )}>
                        {selectedIllusion.category}
                      </span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                        {selectedIllusion.title}
                      </h2>
                      <p className="text-sm sm:text-base text-white/70">
                        {selectedIllusion.description}
                      </p>
                    </div>
                  </div>

                  {/* Reality Section */}
                  <div className="p-4 sm:p-6 rounded-xl bg-green-500/20 border border-green-400/30 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                        <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-2">
                          {language === "pt" ? "A Realidade" : language === "es" ? "La Realidad" : "The Reality"}
                        </h3>
                        <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                          {selectedIllusion.reality}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={handleCloseIllusion}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {language === "pt" ? "Fechar" : language === "es" ? "Cerrar" : "Close"}
                    </Button>
                    <Button
                      onClick={handleConfirmReality}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      {language === "pt" ? "Aceitar Realidade" : language === "es" ? "Aceptar Realidad" : "Accept Reality"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Progress Card */}
          {viewedIllusions.size > 0 && (
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/20 border-green-400/30 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20 shrink-0">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {language === "pt" ? "Seu Progresso" : language === "es" ? "Tu Progreso" : "Your Progress"}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {language === "pt"
                      ? `Você destruiu ${viewedIllusions.size} ${viewedIllusions.size === 1 ? "ilusão" : "ilusões"}! Continue destruindo todas as ilusões para ganhar o badge de Mestre da Consciência!`
                      : language === "es"
                      ? `¡Has destruido ${viewedIllusions.size} ${viewedIllusions.size === 1 ? "ilusión" : "ilusiones"}! ¡Continúa destruyendo todas las ilusiones para ganar el badge de Maestro de la Conciencia!`
                      : `You've destroyed ${viewedIllusions.size} ${viewedIllusions.size === 1 ? "illusion" : "illusions"}! Keep destroying all illusions to earn the Master of Awareness badge!`}
                  </p>
                  <Progress 
                    value={(viewedIllusions.size / illusions.length) * 100} 
                    className="h-2 mt-3 bg-white/10" 
                  />
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
