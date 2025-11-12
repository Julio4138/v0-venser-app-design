"use client"

import { TreeGrowthAnimation } from "@/components/tree-growth-animation"
import { useTreeProgress } from "@/lib/use-tree-progress"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TreePage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const treeProgress = useTreeProgress()

  return (
    <div className="min-h-screen starry-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          {/* Header com botão de voltar */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.dashboard}
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {t.lifeTree}
            </h1>
          </div>

          {/* Área de animação */}
          <div className="relative w-full min-h-[500px] rounded-lg overflow-hidden bg-gradient-to-br from-green-950/95 to-teal-950/95 backdrop-blur-lg border border-green-500/20">
            {treeProgress.isLoading ? (
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center text-white/60">
                  <div className="text-lg mb-2">{t.loading}</div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <TreeGrowthAnimation
                  daysCompleted={treeProgress.currentTreeProgress}
                  daysFailed={treeProgress.totalDaysFailed}
                  daysPerTree={7}
                />
              </div>
            )}
          </div>

          {/* Informações e ações */}
          {!treeProgress.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-white/10">
                <p className="text-2xl font-bold text-[oklch(0.68_0.18_45)]">
                  {treeProgress.totalTrees}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.treesCompleted}
                </p>
              </div>
              <div className="text-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-white/10">
                <p className="text-2xl font-bold text-[oklch(0.54_0.18_285)]">
                  {treeProgress.currentTreeProgress}/7
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.currentTreeProgress}
                </p>
              </div>
              <div className="text-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-white/10">
                <p className="text-2xl font-bold text-[oklch(0.7_0.15_220)]">
                  {treeProgress.totalDaysCompleted}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.daysCompleted}
                </p>
              </div>
            </div>
          )}

          {/* Botão para ir ao programa */}
          {!treeProgress.isLoading && (
            <div className="flex justify-center mt-6">
              <Link href="/program">
                <Button 
                  className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 px-8 py-6 text-lg"
                >
                  {t.program}
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

