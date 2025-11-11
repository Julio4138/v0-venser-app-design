import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color: string
  trend?: string
}

export function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
  return (
    <Card className="p-6 hover:border-[oklch(0.54_0.18_285)] transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div
          className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color.replace("text-", "from-")} to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  )
}
