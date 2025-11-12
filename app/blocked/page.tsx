"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, ArrowLeft, Heart, Brain } from "lucide-react"
import Link from "next/link"

export default function BlockedPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const [attemptedSite, setAttemptedSite] = useState<string>("")

  useEffect(() => {
    // Tenta obter o site que foi bloqueado (se disponível)
    if (typeof window !== "undefined") {
      const referrer = document.referrer
      if (referrer) {
        try {
          const url = new URL(referrer)
          setAttemptedSite(url.hostname)
        } catch {
          // Ignora erros
        }
      }
    }
  }, [])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen starry-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            {/* Shield Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-red-900/80 to-red-800/80 p-8 rounded-full border-4 border-red-400/50">
                <Shield className="h-16 w-16 text-red-400" strokeWidth={1.5} />
              </div>
            </div>

            {/* Message Card */}
            <Card className="p-8 bg-gradient-to-br from-red-950/80 to-orange-950/80 border-red-500/30 backdrop-blur-sm max-w-2xl w-full text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Site Bloqueado
              </h1>
              
              {attemptedSite && (
                <p className="text-red-400 font-semibold text-lg">
                  {attemptedSite}
                </p>
              )}

              <div className="space-y-4 text-white/90">
                <p className="text-lg leading-relaxed">
                  O bloqueador VENSER detectou uma tentativa de acesso a um site problemático.
                </p>
                
                <div className="bg-white/5 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-6 w-6 text-red-400 mt-1 shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold mb-1">Você é mais forte do que isso</p>
                      <p className="text-sm text-white/70">
                        Cada momento de resistência te torna mais forte. Você está no caminho certo.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Brain className="h-6 w-6 text-blue-400 mt-1 shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold mb-1">Sua mente está se recuperando</p>
                      <p className="text-sm text-white/70">
                        Cada dia sem recaída é uma vitória. Continue sua jornada de recuperação.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-white/80 italic">
                  "Você não precisa de pornografia — você precisa de paz."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                
                <Link href="/dashboard">
                  <Button
                    className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90"
                  >
                    Ir para Dashboard
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Motivational Quote */}
            <Card className="p-6 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-white/10 backdrop-blur-sm max-w-2xl w-full">
              <p className="text-white/90 text-center text-lg leading-relaxed">
                Continue sua jornada. Você está fazendo progresso. Cada momento de resistência é uma vitória.
              </p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

