"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface ToolCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: string
  buttonText: string
  isPro?: boolean
  onClick?: () => void
}

export function ToolCard({ icon: Icon, title, description, color, buttonText, isPro, onClick }: ToolCardProps) {
  return (
    <Card className="p-6 hover:border-[oklch(0.54_0.18_285)] transition-all hover:venser-card-glow group">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={`h-14 w-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          {isPro && (
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0"
            >
              PRO
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Button variant="outline" className="w-full bg-transparent" onClick={onClick}>
          {buttonText}
        </Button>
      </div>
    </Card>
  )
}
