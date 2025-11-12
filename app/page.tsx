"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function WelcomePage() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const t = translations[language]
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      // Redirect authenticated users to dashboard
      if (user) {
        router.push("/dashboard")
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push("/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen venser-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen venser-gradient flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">VENSER</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <p className="text-venser-cyan text-lg font-medium tracking-wide">{t.welcome}</p>
            <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">VENSER</h2>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">{t.tagline}</p>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="h-14 px-8 text-lg bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 text-white venser-card-glow transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {t.login}
            </Button>
            <Button
              size="lg"
              onClick={() => router.push("/auth/signup")}
              variant="outline"
              className="h-14 px-8 text-lg border-2 border-white/20 hover:bg-white/10 text-white transition-all duration-300 hover:scale-105"
            >
              {t.signup}
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="pt-12 flex justify-center gap-2">
            <div className="h-1 w-12 rounded-full bg-[oklch(0.54_0.18_285)]" />
            <div className="h-1 w-12 rounded-full bg-[oklch(0.7_0.15_220)]" />
            <div className="h-1 w-12 rounded-full bg-[oklch(0.68_0.18_45)]" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-400">
        <p>{t.footerTagline}</p>
      </footer>
    </div>
  )
}
