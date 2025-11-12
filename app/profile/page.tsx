"use client"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Settings, Crown, LogOut } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ProfilePage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success("Logout realizado com sucesso")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      <div className={cn(collapsed ? "lg:ml-20" : "lg:ml-64")}>
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 lg:pb-8">
          {/* Profile Card */}
          <Card className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Anonymous User</h2>
                <p className="text-muted-foreground">Member since January 2025</p>
              </div>
            </div>
          </Card>

          {/* Upgrade to PRO */}
          <Card className="p-6 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/20 to-[oklch(0.7_0.18_30)]/20 border-[oklch(0.68_0.18_45)]">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] flex items-center justify-center shrink-0">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-1">{t.upgradePro}</h3>
                <p className="text-muted-foreground">
                  Unlock all features including advanced analytics, leaderboard, and premium content
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white shrink-0"
              >
                {t.upgradePro}
              </Button>
            </div>
          </Card>

          {/* Settings */}
          <div className="space-y-3">
            <Card className="p-4 hover:border-[oklch(0.54_0.18_285)] transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">Settings</span>
              </div>
            </Card>

            <Card 
              className="p-4 hover:border-red-500 transition-all cursor-pointer"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-4">
                <LogOut className="h-6 w-6 text-red-500" />
                <span className="font-medium text-red-500">Log Out</span>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
