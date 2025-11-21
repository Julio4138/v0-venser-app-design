"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import {
  Wind,
  Bot,
  Brain,
  ClipboardList,
  CloudRain,
  Waves,
  Flame,
  Radio,
  BookOpen,
  BarChart3,
  X,
  Diamond,
  FileText,
} from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export default function ToolsPage() {
  const { language } = useLanguage()
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | { stop: () => void } | null }>({})
  const audioContextRef = useRef<AudioContext | null>(null)

  // Custom breathing icon component
  const BreathingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
      <path
        d="M12 2C12 2 8 6 8 10C8 13 10 15 12 15C14 15 16 13 16 10C16 6 12 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
    </svg>
  )

  const quickActions = [
    { id: "breathing", icon: BreathingIcon, label: t.breathingExercise, path: "/breath-exercise" },
    { id: "melius", icon: Bot, label: t.meliusAITherapist, path: "/tony" },
    { id: "meditate", icon: Brain, label: t.meditate, path: "/meditar" },
    { id: "research", icon: ClipboardList, label: t.pornResearch, path: "/pesquisa" },
  ]

  // Função para gerar ruído branco usando Web Audio API
  const generateWhiteNoise = () => {
    const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext
    
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    const whiteNoise = audioContext.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true
    
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.15
    
    whiteNoise.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    whiteNoise.start()
    
    return {
      stop: () => {
        try {
          whiteNoise.stop()
          gainNode.disconnect()
        } catch (e) {
          // Já estava parado
        }
      }
    }
  }

  // Função para gerar som de chuva usando Web Audio API
  const generateRain = () => {
    const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext
    
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.2
    
    const sources: AudioBufferSourceNode[] = []
    
    // Criar múltiplos pingos de chuva para efeito realista
    for (let i = 0; i < 50; i++) {
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      
      // Criar som de pingo de chuva
      for (let j = 0; j < data.length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (audioContext.sampleRate * 0.05))
      }
      
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gainNode)
      
      source.start(audioContext.currentTime + i * 0.2)
      sources.push(source)
    }
    
    gainNode.connect(audioContext.destination)
    
    return {
      stop: () => {
        sources.forEach(source => {
          try {
            source.stop()
            source.disconnect()
          } catch (e) {
            // Já estava parado
          }
        })
        gainNode.disconnect()
      }
    }
  }

  // Função para gerar som de ondas do oceano usando Web Audio API
  const generateOcean = () => {
    const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext
    
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.25
    
    // Criar som de ondas usando osciladores modulados
    const oscillators: OscillatorNode[] = []
    
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator()
      const lfo = audioContext.createOscillator()
      const lfoGain = audioContext.createGain()
      
      oscillator.type = 'sawtooth'
      oscillator.frequency.value = 60 + i * 30
      lfo.type = 'sine'
      lfo.frequency.value = 0.1 + i * 0.05
      lfoGain.gain.value = 20
      
      lfo.connect(lfoGain)
      lfoGain.connect(oscillator.frequency)
      oscillator.connect(gainNode)
      
      oscillator.start()
      lfo.start()
      oscillators.push(oscillator)
    }
    
    // Adicionar ruído para parecer mais realista
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3
    }
    
    const noise = audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    noise.connect(gainNode)
    noise.start()
    
    gainNode.connect(audioContext.destination)
    
    return {
      stop: () => {
        oscillators.forEach(osc => {
          try {
            osc.stop()
            osc.disconnect()
          } catch (e) {}
        })
        try {
          noise.stop()
          noise.disconnect()
        } catch (e) {}
        gainNode.disconnect()
      }
    }
  }

  // Função para gerar som de fogueira usando Web Audio API
  const generateFire = () => {
    const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext
    
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.3
    
    // Criar múltiplos "estalos" de fogo
    const sources: AudioBufferSourceNode[] = []
    let isPlaying = true
    let timeoutId: NodeJS.Timeout | null = null
    
    const createCrackle = () => {
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.05, audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      
      for (let j = 0; j < data.length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (audioContext.sampleRate * 0.01))
      }
      
      return buffer
    }
    
    const scheduleCrackles = () => {
      if (!isPlaying) return
      
      const buffer = createCrackle()
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(gainNode)
      source.start()
      sources.push(source)
      
      // Agendar próximo estalo
      const nextTime = Math.random() * 0.5 + 0.2
      timeoutId = setTimeout(() => {
        if (isPlaying) {
          scheduleCrackles()
        }
      }, nextTime * 1000) as unknown as NodeJS.Timeout
    }
    
    // Adicionar ruído de fundo contínuo
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.2
    }
    
    const noise = audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    noise.connect(gainNode)
    noise.start()
    sources.push(noise)
    
    gainNode.connect(audioContext.destination)
    
    // Iniciar estalos
    scheduleCrackles()
    
    return {
      stop: () => {
        isPlaying = false
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        sources.forEach(source => {
          try {
            source.stop()
            source.disconnect()
          } catch (e) {
            // Já estava parado
          }
        })
        gainNode.disconnect()
      }
    }
  }

  // URLs de áudio gratuitos para sons ambientes
  const sounds = [
    { 
      id: "rain", 
      icon: CloudRain, 
      label: t.rain, 
      emoji: "🌧️",
      generateAudio: generateRain
    },
    { 
      id: "ocean", 
      icon: Waves, 
      label: t.oceanWaves, 
      emoji: "🌊",
      generateAudio: generateOcean
    },
    { 
      id: "fire", 
      icon: Flame, 
      label: t.campfire, 
      emoji: "🏕️",
      generateAudio: generateFire
    },
    { 
      id: "whitenoise", 
      icon: Radio, 
      label: t.whitenoise, 
      emoji: "💨",
      generateAudio: generateWhiteNoise
    },
  ]

  // Efeito para controlar a reprodução de áudio
  useEffect(() => {
    // Parar todos os sons primeiro
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio && 'stop' in audio && typeof audio.stop === 'function') {
        audio.stop()
      }
    })

    // Limpar referências
    audioRefs.current = {}

    // Se há um som selecionado, iniciar a reprodução
    if (playingSound) {
      const sound = sounds.find(s => s.id === playingSound)
      if (sound && sound.generateAudio) {
        try {
          const audio = sound.generateAudio()
          if (audio && 'stop' in audio) {
            audioRefs.current[playingSound] = audio
          }
        } catch (error) {
          console.error(`Erro ao criar som ${playingSound}:`, error)
        }
      }
    }

    // Cleanup: parar todos os sons quando o componente desmontar ou mudar
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio && 'stop' in audio && typeof audio.stop === 'function') {
          audio.stop()
        }
      })
      audioRefs.current = {}
    }
  }, [playingSound])

  // Função para lidar com o clique nos sons
  const handleSoundClick = (soundId: string) => {
    if (playingSound === soundId) {
      // Parar o som se já estiver tocando
      setPlayingSound(null)
    } else {
      // Tocar o som selecionado
      setPlayingSound(soundId)
    }
  }

  const toolsList = [
    { title: t.illusionBuster, icon: X, iconBg: "bg-pink-500", iconColor: "text-white", iconShape: "square", path: "/illusion-buster" },
    { title: t.dopamineVisualiser, icon: Diamond, iconBg: "bg-orange-500", iconColor: "text-white", iconShape: "diamond", path: "/dopamine-visualiser" },
    { title: t.journal, icon: FileText, iconBg: "bg-yellow-500", iconColor: "text-white", iconShape: "square", path: "/program" },
  ]

  const handleToolClick = (path: string) => {
    router.push(path)
  }

  const handleQuickActionClick = (path: string, id: string) => {
    setActiveAction(id)
    setTimeout(() => {
      router.push(path)
      setActiveAction(null)
    }, 150)
  }

  return (
    <div className="min-h-screen tools-background relative">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-8">{t.tools}</h1>

            {/* Quick actions row - Circular icons */}
            <div className="flex flex-wrap gap-4 md:gap-6 mb-6 md:mb-8">
              {quickActions.map((qa) => {
                const Icon = qa.icon
                const isCustomIcon = qa.id === "breathing"
                const isActive = activeAction === qa.id
                return (
                  <div 
                    key={qa.id} 
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                    onClick={() => handleQuickActionClick(qa.path, qa.id)}
                  >
                    <div 
                      className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center transition-all",
                        "group-hover:scale-105 active:scale-95",
                        isActive && "scale-95"
                      )}
                      style={{
                        backgroundColor: isActive 
                          ? "oklch(0.3 0.1 285)" 
                          : "oklch(0.2 0.1 285)",
                        borderColor: isActive 
                          ? "oklch(0.5 0.1 285)" 
                          : "oklch(0.3 0.1 285)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "oklch(0.25 0.1 285)";
                          e.currentTarget.style.borderColor = "oklch(0.4 0.1 285)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "oklch(0.2 0.1 285)";
                          e.currentTarget.style.borderColor = "oklch(0.3 0.1 285)";
                        }
                      }}
                    >
                      {isCustomIcon ? <Icon /> : <Icon className="h-7 w-7 text-white" />}
                    </div>
                    <span className="text-xs text-white/70 text-center max-w-[80px] group-hover:text-white transition-colors">{qa.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Category pills - 2x2 Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {/* Articles - Orange gradient */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 shadow-lg">
                {t.articles}
              </div>
              
              {/* Learn - Green gradient with chart icon */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-green-500 via-green-400 to-green-600 shadow-lg relative overflow-hidden">
                <span className="relative z-10">{t.learn}</span>
                <BarChart3 className="absolute bottom-2 right-4 h-4 w-4 text-white/50" />
              </div>
              
              {/* Podcasts - Blue gradient with waves */}
              <div 
                className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 shadow-lg relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => router.push("/playlist")}
              >
                <span className="relative z-10">{t.podcasts}</span>
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <svg viewBox="0 0 200 40" className="w-full h-full">
                    <path d="M0,20 Q50,10 100,20 T200,20" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M0,25 Q50,15 100,25 T200,25" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>
              
              {/* Leaderboard - Pink/Purple gradient */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 shadow-lg">
                {t.leaderboard}
              </div>
            </div>
          </div>

          {/* Relaxation Noises Section */}
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">{t.relaxationNoises}</h2>
            <div className="flex flex-wrap gap-4 md:gap-6">
              {sounds.map((sound) => {
                const Icon = sound.icon
                const isPlaying = playingSound === sound.id
                const hasEmoji = sound.emoji !== undefined

                return (
                  <div
                    key={sound.id}
                    onClick={() => handleSoundClick(sound.id)}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center transition-all",
                        "group-hover:scale-105 active:scale-95",
                        isPlaying
                          ? "bg-white/20 border-2 border-white/40 scale-105"
                          : "bg-black/30 border border-white/10 group-hover:bg-white/10"
                      )}
                    >
                      {hasEmoji ? (
                        <span className="text-3xl">{sound.emoji}</span>
                      ) : (
                        <Icon className={cn("h-8 w-8", isPlaying ? "text-white" : "text-white/70")} />
                      )}
                    </div>
                    <span className="text-xs text-white/70 text-center max-w-[80px] group-hover:text-white transition-colors">{sound.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tools Section */}
          <div className="relative z-10 space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{t.tools}</h2>
              <p className="text-sm text-white/60 mt-1">
                {t.scienceBasedMethods}
              </p>
            </div>
            
            <div className="space-y-3">
              {toolsList.map((tool) => {
                const Icon = tool.icon
                return (
                  <div
                    key={tool.title}
                    className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-4 flex items-center justify-between hover:bg-black/30 transition-all cursor-pointer"
                    onClick={() => handleToolClick(tool.path)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center", 
                        tool.iconBg,
                        tool.iconShape === "square" ? "rounded" : tool.iconShape === "diamond" ? "rotate-45" : "rounded"
                      )}>
                        <Icon className={cn("h-5 w-5", tool.iconColor, tool.iconShape === "diamond" && "-rotate-45")} />
                      </div>
                      <span className="font-medium text-white">{tool.title}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToolClick(tool.path)
                      }}
                    >
                      {t.open}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
