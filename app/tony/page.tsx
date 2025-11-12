"use client"

import { useState, useRef, useEffect } from "react"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
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
    <div className="min-h-screen starry-background relative">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(
        "transition-all duration-300",
        collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64"
      )}>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-6 pb-24 md:pb-6">
          {/* Header Section - Redesenhado */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar e Título */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] via-[oklch(0.6_0.16_250)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shadow-lg venser-glow transform transition-transform hover:scale-105">
                    <Bot className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                    {t.tonyChat}
                  </h1>
                  <p className="text-sm md:text-base text-white/70 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {t.tonyDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Container - Redesenhado */}
          <Card className="p-0 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] lg:h-[calc(100vh-160px)]">
            {/* Messages Area - Melhorado */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
              {/* Welcome Message com destaque */}
              {messages.length === 1 && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shadow-xl">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-white/60 text-sm max-w-md">
                    {language === "pt" 
                      ? "Inicie uma conversa com o Tony. Ele está aqui para te apoiar em sua jornada."
                      : language === "es"
                      ? "Inicia una conversación con Tony. Él está aquí para apoyarte en tu viaje."
                      : "Start a conversation with Tony. He's here to support you on your journey."}
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.sender === "user" ? "justify-end" : "justify-start",
                    index === messages.length - 1 && "animate-in fade-in slide-in-from-bottom-4"
                  )}
                >
                  {message.sender === "tony" && (
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3 sm:py-4 shadow-lg transition-all duration-200",
                      message.sender === "user"
                        ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] via-[oklch(0.6_0.16_250)] to-[oklch(0.7_0.15_220)] text-white"
                        : "bg-white/15 text-white backdrop-blur-md border border-white/20 hover:bg-white/20"
                    )}
                  >
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    <p className={cn(
                      "text-xs mt-2 sm:mt-3",
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
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-pulse" />
                  </div>
                  <div className="bg-white/15 text-white backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl px-5 py-4 shadow-lg">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area - Redesenhado */}
            <div className="border-t border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-xl p-4 sm:p-5 lg:p-6">
              <div className="flex gap-3 sm:gap-4 items-end">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.typeMessage}
                    className="w-full h-12 sm:h-14 md:h-16 bg-white/15 border-white/30 text-white placeholder:text-white/50 focus:border-[oklch(0.54_0.18_285)] focus:ring-2 focus:ring-[oklch(0.54_0.18_285)]/50 text-base sm:text-lg rounded-xl sm:rounded-2xl px-4 sm:px-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  size="lg"
                  className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 p-0 bg-gradient-to-br from-[oklch(0.54_0.18_285)] via-[oklch(0.6_0.16_250)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>
              <p className="text-xs text-white/40 mt-3 text-center">
                {language === "pt" 
                  ? "Pressione Enter para enviar"
                  : language === "es"
                  ? "Presiona Enter para enviar"
                  : "Press Enter to send"}
              </p>
            </div>
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
