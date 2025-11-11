"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, Wrench, Users, Target, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"

export function DesktopSidebar() {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

  const navigation = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.program, href: "/program", icon: Target },
    { name: t.analytics, href: "/analytics", icon: TrendingUp },
    { name: t.tools, href: "/tools", icon: Wrench },
    { name: t.community, href: "/community", icon: Users },
    { name: t.missions, href: "/missions", icon: Sparkles },
    { name: t.profile, href: "/profile", icon: User },
  ]

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 venser-card border-r border-white/5">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">VENSER</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white venser-card-glow"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className="px-6 py-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Idioma</span>
            <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  )
}
