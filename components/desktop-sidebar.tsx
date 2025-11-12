"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, Wrench, Users, Target, User, Sparkles, PanelLeftOpen, PanelLeftClose, Shield, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { useSidebar } from "@/lib/sidebar-context"
import { supabase } from "@/lib/supabase/client"

export function DesktopSidebar() {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()
  const t = translations[language]
  const { collapsed, toggle } = useSidebar()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_pro")
          .eq("id", user.id)
          .single()

        setIsAdmin(profile?.is_pro || false)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
    }
  }

  const navigation = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.program, href: "/program", icon: Target },
    { name: t.analytics, href: "/analytics", icon: TrendingUp },
    { name: t.tools, href: "/tools", icon: Wrench },
    { name: t.community, href: "/community", icon: Users },
    { name: t.missions, href: "/missions", icon: Sparkles },
    { name: t.tony, href: "/tony", icon: Bot },
    { name: t.profile, href: "/profile", icon: User },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: Shield }] : []),
  ]

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 venser-card border-r border-white/5 transition-[width] duration-200",
        collapsed ? "md:w-20 lg:w-20" : "md:w-56 lg:w-64",
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo + Collapse */}
        <div className={cn("flex items-center px-3 md:px-4 py-4", collapsed ? "justify-center" : "justify-between gap-2")}>
          <div className="flex items-center gap-2">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
            {!collapsed && <h1 className="text-xl md:text-2xl font-bold text-white">VENSER</h1>}
          </div>
          <button
            type="button"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={toggle}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors",
              collapsed ? "h-10 w-10" : "h-9 w-9",
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5 text-white" /> : <PanelLeftClose className="h-5 w-5 text-white" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 py-4 space-y-1", collapsed ? "px-2" : "px-2 md:px-3")}>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white venser-card-glow"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className={cn("py-4 border-t border-white/5 space-y-3", collapsed ? "px-2" : "px-3 md:px-6")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
            {!collapsed && <span className="text-xs md:text-sm text-gray-400">Idioma</span>}
            <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          </div>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
            {!collapsed && <span className="text-xs md:text-sm text-gray-400">Tema</span>}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  )
}
