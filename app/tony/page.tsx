"use client"

import { useState, useRef, useEffect } from "react"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, Sparkles, MessageCircle, Heart } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "tony"
  timestamp: Date
}

export default function TonyPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: language === "pt" 
        ? "Olá! Eu sou o Tony, seu companheiro de jornada. Estou aqui para te apoiar, motivar e ajudar sempre que precisar. Como posso te ajudar hoje?"
        : language === "es"
        ? "¡Hola! Soy Tony, tu compañero de viaje. Estoy aquí para apoyarte, motivarte y ayudarte siempre que lo necesites. ¿Cómo puedo ayudarte hoy?"
        : "Hello! I'm Tony, your journey companion. I'm here to support, motivate, and help you whenever you need. How can I help you today?",
      sender: "tony",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Auto-focus no input quando a página carrega
    inputRef.current?.focus()
  }, [])

  const getTonyResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Respostas motivacionais baseadas em palavras-chave
    if (lowerMessage.includes("difícil") || lowerMessage.includes("difficult") || lowerMessage.includes("difícil")) {
      return language === "pt"
        ? "Entendo que está difícil. Mas lembre-se: você já chegou até aqui, e isso mostra sua força. Cada momento difícil é uma oportunidade de crescimento. Você não está sozinho nisso. 💪"
        : language === "es"
        ? "Entiendo que es difícil. Pero recuerda: ya has llegado hasta aquí, y eso muestra tu fuerza. Cada momento difícil es una oportunidad de crecimiento. No estás solo en esto. 💪"
        : "I understand it's difficult. But remember: you've come this far, and that shows your strength. Every difficult moment is an opportunity for growth. You're not alone in this. 💪"
    }
    
    if (lowerMessage.includes("recaída") || lowerMessage.includes("relapse") || lowerMessage.includes("recaída")) {
      return language === "pt"
        ? "Recaídas fazem parte do processo de recuperação. O importante não é a queda, mas sim a decisão de se levantar novamente. Você tem o poder de recomeçar agora mesmo. Cada novo dia é uma nova chance. 🌱"
        : language === "es"
        ? "Las recaídas son parte del proceso de recuperación. Lo importante no es la caída, sino la decisión de levantarse nuevamente. Tienes el poder de comenzar de nuevo ahora mismo. Cada nuevo día es una nueva oportunidad. 🌱"
        : "Relapses are part of the recovery process. What matters is not the fall, but the decision to get back up again. You have the power to start over right now. Each new day is a new chance. 🌱"
    }
    
    if (lowerMessage.includes("motivação") || lowerMessage.includes("motivation") || lowerMessage.includes("motivación")) {
      return language === "pt"
        ? "Você está construindo uma nova versão de si mesmo. Cada dia sem recaída é uma vitória. Cada momento de disciplina é um investimento no seu futuro. Continue assim, você está no caminho certo! 🚀"
        : language === "es"
        ? "Estás construyendo una nueva versión de ti mismo. Cada día sin recaída es una victoria. Cada momento de disciplina es una inversión en tu futuro. ¡Sigue así, vas por buen camino! 🚀"
        : "You're building a new version of yourself. Every day without relapse is a victory. Every moment of discipline is an investment in your future. Keep going, you're on the right track! 🚀"
    }
    
    if (lowerMessage.includes("conselho") || lowerMessage.includes("advice") || lowerMessage.includes("consejo")) {
      return language === "pt"
        ? "Meu conselho é: foco no presente. Não se preocupe com o passado ou o futuro distante. O que você faz agora, neste momento, é o que importa. Pequenos passos consistentes levam a grandes transformações. 🌟"
        : language === "es"
        ? "Mi consejo es: enfócate en el presente. No te preocupes por el pasado o el futuro lejano. Lo que haces ahora, en este momento, es lo que importa. Pequeños pasos consistentes llevan a grandes transformaciones. 🌟"
        : "My advice is: focus on the present. Don't worry about the past or distant future. What you do now, in this moment, is what matters. Small consistent steps lead to great transformations. 🌟"
    }
    
    if (lowerMessage.includes("obrigado") || lowerMessage.includes("thanks") || lowerMessage.includes("gracias")) {
      return language === "pt"
        ? "De nada! Estou sempre aqui para você. Lembre-se: você é mais forte do que pensa e capaz de superar qualquer desafio. Continue firme na sua jornada! 💚"
        : language === "es"
        ? "¡De nada! Siempre estoy aquí para ti. Recuerda: eres más fuerte de lo que piensas y capaz de superar cualquier desafío. ¡Sigue firme en tu viaje! 💚"
        : "You're welcome! I'm always here for you. Remember: you're stronger than you think and capable of overcoming any challenge. Stay strong on your journey! 💚"
    }
    
    // Resposta padrão empática
    return language === "pt"
      ? "Entendo o que você está passando. Cada jornada é única, e você está fazendo o melhor que pode. Continue se esforçando, e lembre-se: progresso, não perfeição. Estou aqui para te apoiar. 💙"
      : language === "es"
      ? "Entiendo por lo que estás pasando. Cada viaje es único, y estás haciendo lo mejor que puedes. Sigue esforzándote, y recuerda: progreso, no perfección. Estoy aquí para apoyarte. 💙"
      : "I understand what you're going through. Every journey is unique, and you're doing the best you can. Keep pushing forward, and remember: progress, not perfection. I'm here to support you. 💙"
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)
    inputRef.current?.focus()

    // Simular delay de resposta do Tony
    setTimeout(() => {
      const tonyResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getTonyResponse(userMessage.text),
        sender: "tony",
        timestamp: new Date(),
      }
      setIsTyping(false)
      setMessages((prev) => [...prev, tonyResponse])
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen starry-background relative flex flex-col">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(
        "transition-all duration-300 flex-1 flex flex-col",
        mounted && collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64"
      )}>
        {/* Header fixo no topo */}
        <header className="sticky top-0 z-10 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] via-[oklch(0.6_0.16_250)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shadow-lg venser-glow">
                  <Bot className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                  {t.tonyChat}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 flex items-center gap-1.5 truncate">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{t.tonyDescription}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Área de mensagens - ocupa todo o espaço disponível */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {/* Welcome Message com destaque - apenas desktop */}
              {messages.length === 1 && (
                <div className="hidden md:block">
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shadow-xl">
                      <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <p className="text-white/60 text-sm sm:text-base max-w-md px-4">
                      {language === "pt" 
                        ? "Inicie uma conversa com o Tony. Ele está aqui para te apoiar em sua jornada."
                        : language === "es"
                        ? "Inicia una conversación con Tony. Él está aquí para apoyarte en tu viaje."
                        : "Start a conversation with Tony. He's here to support you on your journey."}
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 sm:gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.sender === "user" ? "justify-end" : "justify-start",
                    index === messages.length - 1 && "animate-in fade-in slide-in-from-bottom-4"
                  )}
                >
                  {message.sender === "tony" && (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] rounded-2xl sm:rounded-3xl px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 shadow-lg transition-all duration-200",
                      message.sender === "user"
                        ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] via-[oklch(0.6_0.16_250)] to-[oklch(0.7_0.15_220)] text-white"
                        : "bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/15"
                    )}
                  >
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    <p className={cn(
                      "text-[10px] sm:text-xs mt-1.5 sm:mt-2 md:mt-3",
                      message.sender === "user" ? "text-white/70" : "text-white/50"
                    )}>
                      {message.timestamp.toLocaleTimeString(
                        language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-2 sm:gap-3 md:gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white animate-pulse" />
                  </div>
                  <div className="bg-white/10 text-white backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3 sm:py-4 shadow-lg">
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-2 sm:h-4" />
            </div>
          </div>

          {/* Input Area fixo na parte inferior */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background/95 via-background/90 to-background/80 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-5 mb-20 md:mb-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 sm:gap-3 md:gap-4 items-end">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.typeMessage}
                    className="w-full h-11 sm:h-12 md:h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[oklch(0.54_0.18_285)] focus:ring-2 focus:ring-[oklch(0.54_0.18_285)]/50 text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/15 focus:bg-white/15"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  size="lg"
                  className="h-11 sm:h-12 md:h-14 w-11 sm:w-12 md:w-14 p-0 bg-gradient-to-br from-[oklch(0.54_0.18_285)] via-[oklch(0.6_0.16_250)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
              </div>
              <p className="text-[10px] sm:text-xs text-white/40 mt-2 sm:mt-3 text-center">
                {language === "pt" 
                  ? "Pressione Enter para enviar"
                  : language === "es"
                  ? "Presiona Enter para enviar"
                  : "Press Enter to send"}
              </p>
            </div>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
