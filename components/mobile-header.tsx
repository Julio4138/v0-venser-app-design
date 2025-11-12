"use client"

import { useState } from "react"
import { Sparkles, Menu } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { useLanguage } from "@/lib/language-context"

export function MobileHeader() {
  const { language, setLanguage } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-background/98 backdrop-blur-xl border-b border-border shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          {/* Logo + Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">VENSER</h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}

