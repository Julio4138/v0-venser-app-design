"use client"

import { Home, BarChart3, Wrench, Users, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  translations: {
    dashboard: string
    analytics: string
    tools: string
    community: string
    profile: string
  }
}

export function MobileNav({ translations: t }: MobileNavProps) {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", icon: Home, label: t.dashboard },
    { href: "/analytics", icon: BarChart3, label: t.analytics },
    { href: "/tools", icon: Wrench, label: t.tools },
    { href: "/community", icon: Users, label: t.community },
    { href: "/profile", icon: User, label: t.profile },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-[oklch(0.54_0.18_285)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
