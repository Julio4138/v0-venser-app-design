"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
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
import { X, ArrowLeft, Sparkles, Star, Zap, Trophy, TrendingUp, Award, Target, Flame, Crown, Loader2 } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { useIllusionBusterProgress } from "@/lib/use-illusion-buster-progress"

interface Monster {
  id: string
  x: number
  y: number
  type: "normal" | "boss"
  health: number
  maxHealth: number
  size: number
  animationType: "float" | "walk" | "vibrate" | "static"
  animationOffset: number
  color: string
  glowColor: string
  isDying?: boolean
  deathProgress?: number // 0 a 1 para animação de morte
  deathStartY?: number // Posição Y inicial quando começou a morrer
}

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
}

interface FloatingText {
  id: string
  text: string
  x: number
  y: number
  type: "xp" | "combo" | "message"
  life: number
}

interface Badge {
  id: string
  title: string
  description: string
  level: number
}

// Mensagens de verdade
const TRUTH_MESSAGES = {
  common: [
    "Substitua o tempo gasto com pornografia por atividades produtivas",
    "Mantenha-se ocupado para reduzir tentações",
    "Evite ficar sozinho em momentos que te levam ao vício",
    "Identifique gatilhos e prepare estratégias",
    "Mantenha dispositivos fora do quarto",
    "Use seus dispositivos em locais comuns",
    "Bloquear o acesso é um passo fundamental",
    "Disciplina diária vence tentações momentâneas"
  ],
  medium: [
    "Assuma responsabilidade e avise alguém de confiança",
    "Peça ajuda para configurar senhas de bloqueio",
    "Mudar o ambiente muda o comportamento",
    "Um ambiente digital saudável fortalece sua resistência",
    "Remova tentações para avançar",
    "Use BlockSite, SPIN Safe Browser, Safe Surfer",
    "Use Family Link, Screen Time e Qustodio",
    "Extensões como StayFocusd e Cold Turkey ajudam a bloquear",
    "Ferramentas existem para te apoiar"
  ],
  legendary: [
    "Superar o vício começa ao assumir controle",
    "Mudança é construída diariamente com disciplina",
    "Seu ambiente pode ser mais forte que suas tentações",
    "Determinação e disciplina constroem sua liberdade",
    "Cada escolha consciente fortalece sua mente",
    "Você evolui quando protege sua mente e seu ambiente"
  ],
  motivational: [
    "Proteger seus dispositivos é proteger sua mente",
    "Bloqueadores são ferramentas de controle pessoal",
    "Ambiente controlado = mentalidade forte",
    "Quanto mais difícil acessar pornografia, mais fácil superá-la",
    "Pequenas mudanças geram grandes transformações",
    "A jornada começa quando você bloqueia o que te destrói"
  ]
}

// Badges por nível
const LEVEL_BADGES: Badge[] = [
  { id: "level-3", title: "Iniciante", description: "Nível 3 alcançado!", level: 3 },
  { id: "level-5", title: "Caçador de Ilusões", description: "Nível 5 alcançado!", level: 5 },
  { id: "level-10", title: "Libertador", description: "Nível 10 alcançado!", level: 10 },
  { id: "level-20", title: "Iluminado", description: "Nível 20 alcançado!", level: 20 }
]

// Sistema de combo progressivo: 1, 2, 3, 5, 10, 15, 20, 30, 50...
const getComboMultiplier = (combo: number): number => {
  if (combo <= 1) return 1
  if (combo <= 2) return 2
  if (combo <= 3) return 3
  if (combo <= 5) return 5
  if (combo <= 10) return 10
  if (combo <= 15) return 15
  if (combo <= 20) return 20
  if (combo <= 30) return 30
  if (combo <= 50) return 50
  return 100
}

// Selecionar mensagem baseada em probabilidade
const getRandomMessage = (): string => {
  const rand = Math.random()
  
  // Lendárias: 5% de chance
  if (rand < 0.05) {
    return TRUTH_MESSAGES.legendary[Math.floor(Math.random() * TRUTH_MESSAGES.legendary.length)]
  }
  
  // Motivacionais: 15% de chance
  if (rand < 0.20) {
    return TRUTH_MESSAGES.motivational[Math.floor(Math.random() * TRUTH_MESSAGES.motivational.length)]
  }
  
  // Médias: 30% de chance
  if (rand < 0.50) {
    return TRUTH_MESSAGES.medium[Math.floor(Math.random() * TRUTH_MESSAGES.medium.length)]
  }
  
  // Comuns: 50% de chance
  return TRUTH_MESSAGES.common[Math.floor(Math.random() * TRUTH_MESSAGES.common.length)]
}

const MIN_MONSTERS = 6
const MAX_MONSTERS = 8 // Reduzido de 12 para melhor performance
const BOSS_SPAWN_CHANCE = 0.15 // 15% de chance de spawnar um boss
const XP_PER_MONSTER = 10
const XP_PER_BOSS = 50
const XP_PER_LEVEL = 100
const MAX_PARTICLES = 30 // Reduzido de 100 para melhor performance
const MAX_FLOATING_TEXTS = 8 // Reduzido de 20 para melhor performance
const YELLOW_SPAWN_CHANCE = 0.05 // 5% de chance de spawnar um monstro amarelo (raro)
const YELLOW_MONSTERS_FOR_LEGENDARY = 5 // Quantos monstros amarelos para ganhar mensagem lendária
const DEATH_ANIMATION_DURATION = 2000 // 2 segundos para animação de morte (tempo para subir e sair do card)
const MONSTER_HEALTH_NORMAL = 2 // Vida padrão para monstros normais
const MONSTER_HEALTH_BOSS = 3 // Vida para bosses

// Cores disponíveis (sem amarelo, que será especial)
const NORMAL_COLORS = ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#ef4444"]
const YELLOW_COLOR = "#f59e0b"

// Função de comparação customizada para memo (otimização)
const areMonstersEqual = (prevProps: { monster: Monster; onClick: (monster: Monster, e: React.MouseEvent | React.TouchEvent) => void; cardHeight: number }, nextProps: { monster: Monster; onClick: (monster: Monster, e: React.MouseEvent | React.TouchEvent) => void; cardHeight: number }) => {
  const prev = prevProps.monster
  const next = nextProps.monster
  
  // Comparar apenas propriedades que afetam a renderização visual
  return (
    prev.id === next.id &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.size === next.size &&
    prev.color === next.color &&
    prev.health === next.health &&
    prev.maxHealth === next.maxHealth &&
    prev.isDying === next.isDying &&
    Math.abs((prev.deathProgress || 0) - (next.deathProgress || 0)) < 0.01 && // Tolerância para valores float
    prev.type === next.type
  )
}

// Componente de monstro memoizado para evitar re-renders desnecessários
const MonsterComponent = memo(({ monster, onClick, cardHeight }: { monster: Monster; onClick: (monster: Monster, e: React.MouseEvent | React.TouchEvent) => void; cardHeight: number }) => {
  const deathProgress = monster.deathProgress || 0
  const isDying = monster.isDying || false
  
  // Calcular distância necessária para sair do card (cacheado)
  // O monstro precisa subir até passar completamente da borda superior
  const deathStartY = monster.deathStartY || monster.y
  const halfSize = monster.size * 0.5 // Cache de cálculo
  const distanceToTop = deathStartY + halfSize // Distância até a borda superior
  const totalDistance = distanceToTop + monster.size // Distância total para sair completamente
  
  return (
    <div
      onClick={(e) => !isDying && onClick(monster, e)}
      onTouchStart={(e) => !isDying && onClick(monster, e)}
      className={cn(
        "absolute", // Removido transition-all para melhor performance
        isDying ? "pointer-events-none" : "cursor-pointer",
        monster.type === "boss" ? "monster-boss" : "monster-normal"
      )}
      style={{
        left: `${monster.x}px`,
        top: `${monster.y}px`,
        transform: isDying 
          ? `translate3d(-50%, calc(-50% - ${deathProgress * totalDistance}px), 0) scale(${1 - deathProgress * 0.5})`
          : "translate3d(-50%, -50%, 0)",
        width: `${monster.size}px`,
        height: `${monster.size}px`,
        filter: isDying 
          ? `drop-shadow(0 0 ${monster.size / 4 * (1 - deathProgress)}px ${monster.glowColor})`
          : `drop-shadow(0 0 ${monster.size / 4}px ${monster.glowColor})`,
        opacity: isDying ? Math.max(0, 1 - deathProgress * 1.2) : 1,
        zIndex: isDying ? 100 : 1,
        willChange: isDying ? "transform, opacity" : "transform",
        transformOrigin: "center center"
      }}
    >
      <div
        className="w-full h-full rounded-full relative"
        style={{
          backgroundColor: monster.color,
          boxShadow: `0 0 ${monster.size / 2}px ${monster.glowColor}, inset 0 0 ${monster.size / 4}px rgba(255,255,255,0.3)`
        }}
      >
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white rounded-full" />
        {monster.type === "boss" && (
          <Crown className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-yellow-300" />
        )}
        {/* Barra de vida para todos os monstros */}
        {monster.health < monster.maxHealth && (
          <div className="absolute -bottom-4 left-0 right-0 h-1 bg-red-500/30 rounded">
            <div
              className="h-full bg-red-500 rounded transition-all"
              style={{ width: `${(monster.health / monster.maxHealth) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}, areMonstersEqual)
MonsterComponent.displayName = "MonsterComponent"

export default function IllusionBusterPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const { progress, updateProgress, isLoading: isLoadingProgress } = useIllusionBusterProgress()
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const comboTimeoutRef = useRef<NodeJS.Timeout>()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Refs para valores que não precisam causar re-render
  const monstersRef = useRef<Monster[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatingTextsRef = useRef<FloatingText[]>([])
  const animationTimeRef = useRef<number>(0)
  const lastSaveTimeRef = useRef<number>(0)
  const pendingSaveRef = useRef<any>(null)
  const isVisibleRef = useRef<boolean>(true) // Para pausar quando não visível
  const isPausedRef = useRef<boolean>(false) // Controle de pausa
  
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [combo, setCombo] = useState(0)
  const [totalKills, setTotalKills] = useState(0)
  const [showBadge, setShowBadge] = useState<Badge | null>(null)
  const [showMessage, setShowMessage] = useState<string | null>(null)
  const [gameAreaSize, setGameAreaSize] = useState({ width: 0, height: 0 })
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false)
  const [confettiParticles, setConfettiParticles] = useState<Array<{ id: string; x: number; y: number; color: string; delay: number; xOffset: number }>>([])
  
  // Sistema de pontuação por cor (gerado aleatoriamente a cada sessão)
  const [colorXpMap, setColorXpMap] = useState<Record<string, number>>(() => {
    // Gerar pontuações aleatórias para cada cor (entre 5 e 25 XP)
    const map: Record<string, number> = {}
    NORMAL_COLORS.forEach(color => {
      map[color] = Math.floor(Math.random() * 21) + 5 // 5-25 XP
    })
    // Amarelo sempre dá mais XP (raro)
    map[YELLOW_COLOR] = Math.floor(Math.random() * 21) + 30 // 30-50 XP
    return map
  })
  
  // Rastrear monstros amarelos mortos
  const [yellowKills, setYellowKills] = useState(0)

  // Carregar dados do banco
  useEffect(() => {
    if (!isLoadingProgress && !hasLoadedFromDb) {
      if (progress) {
        setXp(progress.illusion_buster_xp)
        setLevel(progress.illusion_buster_level)
        setCombo(progress.current_combo)
        setTotalKills(progress.destroyed_illusions?.length || 0)
        // Carregar kills de monstros amarelos se existir
        const savedYellowKills = (progress as any).yellow_monster_kills || 0
        setYellowKills(savedYellowKills)
      }
      // Marcar como carregado mesmo se não houver progresso
      setHasLoadedFromDb(true)
    }
  }, [isLoadingProgress, progress, hasLoadedFromDb])

  // Atualizar tamanho da área de jogo
  useEffect(() => {
    const updateSize = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setGameAreaSize({ width: rect.width, height: rect.height })
        }
      }
    }
    
    // Tentar atualizar imediatamente
    updateSize()
    
    // Se não conseguir, tentar novamente após um pequeno delay
    const timeoutId = setTimeout(() => {
      updateSize()
    }, 100)
    
    window.addEventListener("resize", updateSize)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", updateSize)
    }
  }, [])

  // Criar monstro
  const createMonster = useCallback((isBoss: boolean = false): Monster => {
    const types: ("float" | "walk" | "vibrate" | "static")[] = ["float", "walk", "vibrate", "static"]
    const animationType = types[Math.floor(Math.random() * types.length)]
    
    // Obter tamanho atual da área (com fallback)
    let width = gameAreaSize.width
    let height = gameAreaSize.height
    
    if (width === 0 || height === 0) {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          width = rect.width
          height = rect.height
        } else {
          width = 800
          height = 500
        }
      } else {
        width = 800
        height = 500
      }
    }
    
    if (isBoss) {
      return {
        id: `boss-${Date.now()}-${Math.random()}`,
        x: Math.random() * Math.max(100, width - 100) + 50,
        y: Math.random() * Math.max(100, height - 100) + 50,
        type: "boss",
        health: MONSTER_HEALTH_BOSS,
        maxHealth: MONSTER_HEALTH_BOSS,
        size: 80,
        animationType,
        animationOffset: Math.random() * Math.PI * 2,
        color: "#f59e0b",
        glowColor: "#fbbf24",
        isDying: false,
        deathProgress: 0
      }
    }
    
    // Decidir se é amarelo (raro) ou cor normal
    const isYellow = Math.random() < YELLOW_SPAWN_CHANCE
    const color = isYellow ? YELLOW_COLOR : NORMAL_COLORS[Math.floor(Math.random() * NORMAL_COLORS.length)]
    
    const glowColors: Record<string, string> = {
      "#ec4899": "#f472b6",
      "#8b5cf6": "#a78bfa",
      "#3b82f6": "#60a5fa",
      "#10b981": "#34d399",
      "#f59e0b": "#fbbf24",
      "#ef4444": "#f87171"
    }
    
    return {
      id: `monster-${Date.now()}-${Math.random()}`,
      x: Math.random() * Math.max(60, width - 60) + 30,
      y: Math.random() * Math.max(60, height - 60) + 30,
      type: "normal",
      health: MONSTER_HEALTH_NORMAL,
      maxHealth: MONSTER_HEALTH_NORMAL,
      size: 40 + Math.random() * 20,
      animationType,
      animationOffset: Math.random() * Math.PI * 2,
      color,
      glowColor: glowColors[color] || color,
      isDying: false,
      deathProgress: 0
    }
  }, [gameAreaSize])

  // Inicializar monstros
  useEffect(() => {
    // Se já tem monstros, não reinicializar
    if (monsters.length > 0) return
    
    // Aguardar até que as condições sejam satisfeitas
    if (hasLoadedFromDb) {
      // Se gameAreaSize ainda não foi calculado, usar valores padrão ou tentar calcular novamente
      let width = gameAreaSize.width
      let height = gameAreaSize.height
      
      if (width === 0 || height === 0) {
        if (gameAreaRef.current) {
          const rect = gameAreaRef.current.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            width = rect.width
            height = rect.height
            setGameAreaSize({ width, height })
          } else {
            // Usar valores padrão se ainda não conseguir calcular
            width = 800
            height = 500
          }
        } else {
          // Usar valores padrão se ref ainda não estiver disponível
          width = 800
          height = 500
        }
      }
      
      if (width > 0 && height > 0) {
        const initialCount = Math.floor(Math.random() * (MAX_MONSTERS - MIN_MONSTERS + 1)) + MIN_MONSTERS
        const initialMonsters: Monster[] = []
        
        // Criar monstros com tamanho atual ou padrão
        const tempGameAreaSize = { width, height }
        for (let i = 0; i < initialCount; i++) {
          const isBoss = Math.random() < BOSS_SPAWN_CHANCE && i === 0
          const types: ("float" | "walk" | "vibrate" | "static")[] = ["float", "walk", "vibrate", "static"]
          const animationType = types[Math.floor(Math.random() * types.length)]
          
          if (isBoss) {
            initialMonsters.push({
              id: `boss-${Date.now()}-${Math.random()}`,
              x: Math.random() * (tempGameAreaSize.width - 100) + 50,
              y: Math.random() * (tempGameAreaSize.height - 100) + 50,
              type: "boss",
              health: MONSTER_HEALTH_BOSS,
              maxHealth: MONSTER_HEALTH_BOSS,
              size: 80,
              animationType,
              animationOffset: Math.random() * Math.PI * 2,
              color: "#f59e0b",
              glowColor: "#fbbf24",
              isDying: false,
              deathProgress: 0
            })
          } else {
            // Decidir se é amarelo (raro) ou cor normal
            const isYellow = Math.random() < YELLOW_SPAWN_CHANCE
            const color = isYellow ? YELLOW_COLOR : NORMAL_COLORS[Math.floor(Math.random() * NORMAL_COLORS.length)]
            const glowColors: Record<string, string> = {
              "#ec4899": "#f472b6",
              "#8b5cf6": "#a78bfa",
              "#3b82f6": "#60a5fa",
              "#10b981": "#34d399",
              "#f59e0b": "#fbbf24",
              "#ef4444": "#f87171"
            }
            
            initialMonsters.push({
              id: `monster-${Date.now()}-${Math.random()}`,
              x: Math.random() * (tempGameAreaSize.width - 60) + 30,
              y: Math.random() * (tempGameAreaSize.height - 60) + 30,
              type: "normal",
              health: MONSTER_HEALTH_NORMAL,
              maxHealth: MONSTER_HEALTH_NORMAL,
              size: 40 + Math.random() * 20,
              animationType,
              animationOffset: Math.random() * Math.PI * 2,
              color,
              glowColor: glowColors[color] || color,
              isDying: false,
              deathProgress: 0
            })
          }
        }
        
        setMonsters(initialMonsters)
        monstersRef.current = initialMonsters
      }
    }
  }, [gameAreaSize, hasLoadedFromDb, monsters.length])

  // Sincronizar refs com estado quando mudam
  useEffect(() => {
    monstersRef.current = monsters
  }, [monsters])

  useEffect(() => {
    particlesRef.current = particles
  }, [particles])

  useEffect(() => {
    floatingTextsRef.current = floatingTexts
  }, [floatingTexts])

  // Pausar animações quando a página não está visível (Intersection Observer)
  useEffect(() => {
    if (!gameAreaRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting
          isPausedRef.current = !entry.isIntersecting
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(gameAreaRef.current)

    // Também pausar quando a aba não está visível
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      isPausedRef.current = document.hidden
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Consolidar todas as animações em um único loop otimizado
  useEffect(() => {
    if (monstersRef.current.length === 0 && particlesRef.current.length === 0 && floatingTextsRef.current.length === 0) return
    if (isPausedRef.current) return // Pausar se não estiver visível

    let animationId: number
    let frameCount = 0

    const animate = (currentTime: number) => {
      // Pausar se não estiver visível
      if (isPausedRef.current || !isVisibleRef.current) {
        animationId = requestAnimationFrame(animate)
        return
      }

      animationTimeRef.current = currentTime * 0.001
      frameCount++

      // Animar monstros usando refs (evita re-renders)
      // Cache de valores para evitar recálculos
      const time = animationTimeRef.current
      const width = gameAreaSize.width
      const height = gameAreaSize.height
      
      // Processar monstros apenas a cada 2 frames quando não estão morrendo (30fps)
      const shouldUpdateMonsters = frameCount % 2 === 0
      
      const updatedMonsters = monstersRef.current.map(monster => {
        // Se está morrendo, sempre animar morte (prioridade)
        if (monster.isDying) {
          const currentProgress = monster.deathProgress || 0
          // Usar incremento fixo mais eficiente
          const increment = 0.00835 // ~16.7ms / 2000ms por frame
          const newDeathProgress = Math.min(1, currentProgress + increment)
          return { ...monster, deathProgress: newDeathProgress }
        }
        
        // Se não está morrendo e não é hora de atualizar, retornar sem mudanças
        if (!shouldUpdateMonsters) {
          return monster
        }
        
        // Cache de valores de animação
        let newX = monster.x
        let newY = monster.y
        const offset = monster.animationOffset

        // Simplificar animações para melhor performance
        switch (monster.animationType) {
          case "float": {
            // Usar apenas uma função trigonométrica (mais rápido)
            const sinVal = Math.sin(time + offset)
            newX += sinVal * 1.0 // Dobrar movimento para compensar frames pulados
            newY += sinVal * 1.0
            break
          }
          case "walk": {
            // Simplificado: usar apenas sin
            const sinVal = Math.sin(time * 1.5 + offset)
            newX += sinVal * 1.2 // Dobrar movimento
            newY += sinVal * 0.8
            break
          }
          case "vibrate": {
            // Reduzir ainda mais a frequência de Math.random()
            if (frameCount % 10 === 0) {
              const rand = (Math.random() - 0.5) * 3.0 // Dobrar amplitude
              newX += rand
              newY += rand
            }
            break
          }
          case "static":
            // Sem movimento
            break
        }

        // Limites otimizados (cache de cálculos)
        const halfSize = monster.size / 2
        newX = Math.max(halfSize, Math.min(width - halfSize, newX))
        newY = Math.max(halfSize, Math.min(height - halfSize, newY))

        return { ...monster, x: newX, y: newY }
      })
      
      // Remover monstros que completaram a animação de morte
      const monstersToRemove = updatedMonsters.filter(m => m.isDying && (m.deathProgress || 0) >= 1)

      // Animar partículas (muito otimizado - processar apenas se necessário)
      const particleCount = particlesRef.current.length
      let updatedParticles: Particle[] = []
      if (particleCount > 0) {
        // Processar apenas a cada 2 frames para partículas (30fps)
        if (frameCount % 2 === 0) {
          updatedParticles = particlesRef.current
            .map(p => {
              const newLife = p.life - 0.04 // Dobrar decremento para compensar frames pulados
              if (newLife <= 0) return null
              return {
                ...p,
                x: p.x + p.vx, // Dobrar movimento para compensar frames pulados
                y: p.y + p.vy,
                vy: p.vy + 0.6, // Dobrar gravidade
                life: newLife
              }
            })
            .filter((p): p is Particle => p !== null)
            .slice(0, MAX_PARTICLES)
        } else {
          updatedParticles = particlesRef.current // Manter partículas sem atualizar
        }
      }

      // Animar textos flutuantes (muito otimizado)
      const textCount = floatingTextsRef.current.length
      let updatedTexts: FloatingText[] = []
      if (textCount > 0) {
        // Processar apenas a cada 2 frames para textos (30fps)
        if (frameCount % 2 === 0) {
          updatedTexts = floatingTextsRef.current
            .map(ft => {
              const newLife = ft.life - 0.03 // Dobrar decremento
              if (newLife <= 0) return null
              return {
                ...ft,
                y: ft.y - 4, // Dobrar movimento
                life: newLife
              }
            })
            .filter((ft): ft is FloatingText => ft !== null)
            .slice(0, MAX_FLOATING_TEXTS)
        } else {
          updatedTexts = floatingTextsRef.current // Manter textos sem atualizar
        }
      }

      // Remover monstros que saíram do card (otimizado)
      const aliveMonsters = updatedMonsters.filter(m => {
        if (!m.isDying) return true
        
        const progress = m.deathProgress || 0
        // Se progresso >= 1, remover imediatamente (sem cálculos extras)
        if (progress >= 1) return false
        
        // Verificação simplificada: se progresso > 0.9, considerar como fora
        if (progress > 0.9) {
          const deathStartY = m.deathStartY || m.y
          const halfSize = m.size / 2
          const distanceToTop = deathStartY + halfSize
          const totalDistance = distanceToTop + m.size
          const currentY = deathStartY - (progress * totalDistance)
          return currentY > -halfSize
        }
        
        return true
      })
      
      // Verificar mudanças antes de atualizar refs
      const hasDyingMonsters = aliveMonsters.some(m => m.isDying)
      const hasChanges = 
        aliveMonsters.length !== monstersRef.current.length ||
        updatedParticles.length !== particlesRef.current.length ||
        updatedTexts.length !== floatingTextsRef.current.length
      
      // Atualizar refs
      monstersRef.current = aliveMonsters
      particlesRef.current = updatedParticles
      floatingTextsRef.current = updatedTexts

      // Sincronizar com estado (otimizado - muito mais agressivo)
      // Atualizar apenas quando necessário
      // Se há monstros morrendo, atualizar a cada 2 frames (30fps)
      // Se há mudanças significativas, atualizar
      // Caso contrário, atualizar a cada 5 frames (12fps para UI normal - muito mais leve)
      if (hasDyingMonsters) {
        // Monstros morrendo: atualizar a cada 2 frames
        if (frameCount % 2 === 0) {
          setMonsters([...aliveMonsters])
          setParticles([...updatedParticles])
          setFloatingTexts([...updatedTexts])
        }
      } else if (hasChanges || frameCount % 5 === 0) {
        // Mudanças ou atualização periódica: a cada 5 frames
        setMonsters([...aliveMonsters])
        setParticles([...updatedParticles])
        setFloatingTexts([...updatedTexts])
      }

      // Continuar animação se houver algo para animar
      // Verificar refs ao invés de arrays atualizados para melhor performance
      if (monstersRef.current.length > 0 || particlesRef.current.length > 0 || floatingTextsRef.current.length > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameAreaSize.width, gameAreaSize.height])

  // Reset combo após inatividade
  useEffect(() => {
    if (combo > 0) {
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current)
      }
      
      comboTimeoutRef.current = setTimeout(() => {
        setCombo(0)
      }, 3000) // 3 segundos de inatividade
    }

    return () => {
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current)
      }
    }
  }, [combo, totalKills])

  // Criar partículas de explosão (muito otimizado - mínimo de partículas)
  const createExplosion = useCallback((x: number, y: number, color: string, isBoss: boolean = false) => {
    // Reduzido drasticamente: apenas 8 partículas para boss, 4 para normal
    const particleCount = isBoss ? 8 : 4
    const newParticles: Particle[] = []
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: `p-${Date.now()}-${i}`, // ID mais simples
        x,
        y,
        vx: (Math.random() - 0.5) * (isBoss ? 10 : 6),
        vy: (Math.random() - 0.5) * (isBoss ? 10 : 6),
        color,
        life: 1,
        size: isBoss ? 3 : 2
      })
    }
    
    setParticles(prev => [...prev, ...newParticles].slice(-MAX_PARTICLES))
  }, [])

  // Adicionar texto flutuante (otimizado - limitado)
  const addFloatingText = useCallback((text: string, x: number, y: number, type: "xp" | "combo" | "message") => {
    const newText: FloatingText = {
      id: `text-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      type,
      life: 1
    }
    setFloatingTexts(prev => [...prev, newText].slice(-MAX_FLOATING_TEXTS))
  }, [])

  // Destruir monstro
  const handleMonsterClick = useCallback((monster: Monster, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    
    // Reduzir vida
    const newHealth = monster.health - 1
    
    if (newHealth <= 0) {
      // Monstro destruído - iniciar animação de morte
      const isBoss = monster.type === "boss"
      const isYellow = monster.color === YELLOW_COLOR
      
      // Marcar monstro como morrendo e salvar posição inicial
      setMonsters(prev => prev.map(m => 
        m.id === monster.id 
          ? { ...m, health: 0, isDying: true, deathProgress: 0, deathStartY: monster.y }
          : m
      ))
      
      // Usar pontuação por cor (ou XP padrão para boss)
      const baseXp = isBoss 
        ? XP_PER_BOSS 
        : (colorXpMap[monster.color] || XP_PER_MONSTER)
      
      const newCombo = combo + 1
      const comboMultiplier = getComboMultiplier(newCombo)
      const gainedXp = baseXp * comboMultiplier
      
      // Criar explosão
      createExplosion(monster.x, monster.y, monster.color, isBoss)
      
      // Adicionar texto de XP
      addFloatingText(`+${gainedXp} XP`, monster.x, monster.y, "xp")
      
      // Se for amarelo, rastrear e verificar se chegou a 5
      if (isYellow && !isBoss) {
        const newYellowKills = yellowKills + 1
        setYellowKills(newYellowKills)
        
        // Adicionar texto especial para monstro amarelo
        addFloatingText("RARO!", monster.x, monster.y - 40, "combo")
        
        // Se chegou a 5, mostrar mensagem lendária
        if (newYellowKills >= YELLOW_MONSTERS_FOR_LEGENDARY) {
          const legendaryMessage = TRUTH_MESSAGES.legendary[Math.floor(Math.random() * TRUTH_MESSAGES.legendary.length)]
          setShowMessage(legendaryMessage)
          setTimeout(() => setShowMessage(null), 5000)
          addFloatingText("MENSAGEM LENDÁRIA!", monster.x, monster.y - 60, "message")
          
          // Salvar progresso dos monstros amarelos
          pendingSaveRef.current = {
            ...pendingSaveRef.current,
            yellowMonsterKills: newYellowKills
          }
        } else {
          // Mostrar progresso
          addFloatingText(`${newYellowKills}/${YELLOW_MONSTERS_FOR_LEGENDARY} Amarelos`, monster.x, monster.y - 70, "message")
        }
      }
      
      // Se for boss, mostrar mensagem
      if (isBoss) {
        const message = getRandomMessage()
        setShowMessage(message)
        setTimeout(() => setShowMessage(null), 4000)
        addFloatingText(message, monster.x, monster.y - 50, "message")
      }
      
      // Atualizar combo
      if (newCombo > 1) {
        addFloatingText(`${newCombo}x COMBO! (x${comboMultiplier})`, monster.x, monster.y - 30, "combo")
      }
      
      // Atualizar estado
      const newXp = xp + gainedXp
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
      const newTotalKills = totalKills + 1
      
      setXp(newXp)
      setCombo(newCombo)
      setTotalKills(newTotalKills)
      
      // Calcular yellowKills atualizado
      const updatedYellowKills = isYellow && !isBoss ? yellowKills + 1 : yellowKills
      
      // Salvar no banco com debounce melhorado
      pendingSaveRef.current = {
        xp: newXp,
        level: newLevel,
        combo: newCombo,
        yellowMonsterKills: updatedYellowKills
      }
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          updateProgress(pendingSaveRef.current)
          pendingSaveRef.current = null
        }
      }, 2000) // Salvar no máximo a cada 2 segundos
      
      // Verificar level up
      if (newLevel > level) {
        setLevel(newLevel)
        
        // Criar efeito de confete
        const colors = ["#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#ef4444"]
        const newConfetti: Array<{ id: string; x: number; y: number; color: string; delay: number; xOffset: number }> = []
        for (let i = 0; i < 50; i++) {
          newConfetti.push({
            id: `confetti-${Date.now()}-${i}`,
            x: Math.random() * 100,
            y: -10,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.5,
            xOffset: (Math.random() - 0.5) * 200
          })
        }
        setConfettiParticles(newConfetti)
        setTimeout(() => setConfettiParticles([]), 3000)
        
        // Verificar badge
        const badge = LEVEL_BADGES.find(b => b.level === newLevel)
        if (badge) {
          setTimeout(() => {
            setShowBadge(badge)
            setTimeout(() => setShowBadge(null), 3000)
          }, 500)
          
          // Salvar badge
          const currentBadges = progress?.earned_badges || []
          if (!currentBadges.includes(badge.id)) {
            updateProgress({
              earnedBadges: [...currentBadges, badge.id]
            })
          }
        }
      }
      
      // Adicionar novo monstro após a animação de morte (com delay para dar tempo de ver recompensas)
      setTimeout(() => {
        setMonsters(prev => {
          // Verificar se o monstro ainda existe (não foi removido pela animação)
          const stillExists = prev.some(m => m.id === monster.id)
          if (!stillExists) {
            // Verificar se não excedeu o máximo de monstros
            const aliveMonsters = prev.filter(m => !m.isDying || (m.deathProgress || 0) < 1)
            if (aliveMonsters.length < MAX_MONSTERS) {
              // Adicionar novo monstro (pode ser boss ocasionalmente)
              const isNewBoss = Math.random() < BOSS_SPAWN_CHANCE
              const newMonster = createMonster(isNewBoss)
              return [...prev, newMonster]
            }
          }
          return prev
        })
      }, DEATH_ANIMATION_DURATION - 200) // Adicionar novo monstro um pouco antes da animação terminar
    } else {
      // Ainda tem vida - atualizar vida
      setMonsters(prev => prev.map(m => 
        m.id === monster.id ? { ...m, health: newHealth } : m
      ))
      
      // Efeito de hit
      createExplosion(monster.x, monster.y, monster.color, false)
    }
  }, [combo, xp, totalKills, level, progress, createMonster, createExplosion, addFloatingText, updateProgress, colorXpMap, yellowKills])

  // Memoizar cálculos para evitar recálculos desnecessários
  const currentLevelXp = useMemo(() => xp % XP_PER_LEVEL, [xp])
  const progressPercentage = useMemo(() => (currentLevelXp / XP_PER_LEVEL) * 100, [currentLevelXp])

  if (isLoadingProgress || !hasLoadedFromDb) {
    return (
      <div className="min-h-screen tools-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen tools-background relative pb-24 overflow-hidden">
      <MobileHeader />
      <DesktopSidebar />

      {/* Partículas */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: `translate3d(0, 0, 0) scale(${particle.life})`,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              willChange: "transform, opacity"
            }}
          />
        ))}
      </div>

      {/* Confetti */}
      {confettiParticles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[45]">
          {confettiParticles.map(confetti => (
            <div
              key={confetti.id}
              className="confetti"
              style={{
                left: `${confetti.x}%`,
                top: `${confetti.y}%`,
                backgroundColor: confetti.color,
                animationDelay: `${confetti.delay}s`,
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                "--confetti-x": confetti.xOffset
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Textos flutuantes */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className="absolute whitespace-nowrap"
            style={{
              left: `${ft.x}px`,
              top: `${ft.y}px`,
              transform: "translate3d(-50%, -50%, 0)",
              opacity: ft.life,
              fontSize: ft.type === "message" ? "14px" : ft.type === "combo" ? "20px" : "24px",
              fontWeight: "bold",
              color: ft.type === "xp" ? "#fbbf24" : ft.type === "combo" ? "#f59e0b" : "#10b981",
              textShadow: "0 0 10px currentColor, 0 2px 4px rgba(0,0,0,0.8)",
              willChange: "transform, opacity"
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Mensagem de verdade (popup) */}
      {showMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <Card className="max-w-md w-full p-6 bg-gradient-to-br from-green-500/90 to-emerald-500/90 border-green-400/50 backdrop-blur-xl animate-in zoom-in-95 duration-300 pointer-events-auto">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-white mx-auto mb-3 animate-pulse" />
              <p className="text-white font-semibold text-lg leading-relaxed">
                {showMessage}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Badge notification */}
      {showBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <Card className="max-w-md w-full p-8 bg-gradient-to-br from-purple-500 to-indigo-500 border-white/30 backdrop-blur-xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-white/20 animate-pulse">
                <Crown className="h-12 w-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {showBadge.title}
                </h3>
                <p className="text-white/90">
                  {showBadge.description}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className={cn(
        collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64",
        "transition-all duration-300"
      )}>
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
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
                  {language === "pt" ? "Derrote a Ilusão" : language === "es" ? "Derrota la Ilusión" : "Defeat the Illusion"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/70">
                {language === "pt"
                  ? "Toque nos monstros para destruí-los! Mantenha o combo e ganhe XP!"
                  : language === "es"
                  ? "¡Toca los monstruos para destruirlos! ¡Mantén el combo y gana XP!"
                  : "Tap monsters to destroy them! Keep the combo and earn XP!"}
              </p>
            </div>
          </div>

          {/* Stats */}
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

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-red-400" />
                <span className="text-xs text-white/60">COMBO</span>
              </div>
              <div className="text-2xl font-bold text-white">{combo}x</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-xs text-white/60">{language === "pt" ? "Eliminados" : language === "es" ? "Eliminados" : "Kills"}</span>
              </div>
              <div className="text-2xl font-bold text-white">{totalKills}</div>
            </Card>
          </div>

          {/* Pontuações por cor e progresso amarelo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">
                  {language === "pt" ? "Pontuações por Cor" : language === "es" ? "Puntuaciones por Color" : "Points by Color"}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(colorXpMap).map(([color, xpValue]) => {
                  const isYellow = color === YELLOW_COLOR
                  return (
                    <div
                      key={color}
                      className={cn(
                        "p-2 rounded-lg text-center",
                        isYellow ? "bg-yellow-500/30 border-2 border-yellow-400/50" : "bg-black/20"
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-xs font-bold text-white">{xpValue} XP</div>
                      {isYellow && (
                        <div className="text-[10px] text-yellow-300 font-semibold mt-0.5">RARO</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-4 sm:p-5 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">
                  {language === "pt" ? "Monstros Amarelos Raros" : language === "es" ? "Monstruos Amarillos Raros" : "Rare Yellow Monsters"}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70">
                    {language === "pt" ? "Progresso:" : language === "es" ? "Progreso:" : "Progress:"}
                  </span>
                  <span className="text-sm font-bold text-yellow-300">
                    {yellowKills}/{YELLOW_MONSTERS_FOR_LEGENDARY}
                  </span>
                </div>
                <Progress 
                  value={(yellowKills / YELLOW_MONSTERS_FOR_LEGENDARY) * 100} 
                  className="h-2 bg-white/10" 
                />
                <p className="text-xs text-white/60 mt-2">
                  {language === "pt"
                    ? `Elimine ${YELLOW_MONSTERS_FOR_LEGENDARY} monstros amarelos raros para desbloquear uma mensagem lendária!`
                    : language === "es"
                    ? `¡Elimina ${YELLOW_MONSTERS_FOR_LEGENDARY} monstruos amarillos raros para desbloquear un mensaje legendario!`
                    : `Eliminate ${YELLOW_MONSTERS_FOR_LEGENDARY} rare yellow monsters to unlock a legendary message!`}
                </p>
              </div>
            </Card>
          </div>

          {/* Game Area */}
          <Card className="p-4 sm:p-6 bg-black/20 backdrop-blur-md border-white/10 relative overflow-hidden" style={{ minHeight: "500px" }}>
            <div
              ref={gameAreaRef}
              className="relative w-full h-full"
              style={{ minHeight: "500px" }}
            >
              {monsters.map(monster => (
                <MonsterComponent
                  key={monster.id}
                  monster={monster}
                  onClick={handleMonsterClick}
                  cardHeight={gameAreaSize.height || 500}
                />
              ))}
              
              {monsters.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>{language === "pt" ? "Carregando monstros..." : language === "es" ? "Cargando monstruos..." : "Loading monsters..."}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-pink-500/20 border-pink-400/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-pink-500/20 shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === "pt" ? "Como Jogar" : language === "es" ? "Cómo Jugar" : "How to Play"}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {language === "pt"
                    ? "Toque nos monstros para destruí-los e ganhar XP! Mantenha um combo tocando rapidamente para multiplicar seus pontos. Monstros maiores (com coroa) são chefões que dão mais XP e revelam mensagens de verdade quando derrotados. Suba de nível e desbloqueie badges incríveis!"
                    : language === "es"
                    ? "¡Toca los monstruos para destruirlos y ganar XP! Mantén un combo tocando rápidamente para multiplicar tus puntos. Los monstruos grandes (con corona) son jefes que dan más XP y revelan mensajes de verdad cuando son derrotados. ¡Sube de nivel y desbloquea badges increíbles!"
                    : "Tap monsters to destroy them and earn XP! Keep a combo by tapping quickly to multiply your points. Bigger monsters (with crown) are bosses that give more XP and reveal truth messages when defeated. Level up and unlock amazing badges!"}
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
