"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Check, BookOpen, Brain, FileText, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string
  task_type: "checklist" | "reflection" | "meditation" | "reading"
  xp_reward: number
  is_required: boolean
  completed: boolean
}

interface ProgramDayChecklistProps {
  tasks: Task[]
  onTaskComplete: (taskId: string, completed: boolean) => void
  language?: "pt" | "en" | "es"
}

const taskIcons = {
  checklist: Check,
  reflection: FileText,
  meditation: Brain,
  reading: BookOpen,
}

const taskColors = {
  checklist: "from-blue-500 to-cyan-500",
  reflection: "from-purple-500 to-pink-500",
  meditation: "from-indigo-500 to-purple-500",
  reading: "from-green-500 to-emerald-500",
}

export function ProgramDayChecklist({
  tasks,
  onTaskComplete,
  language = "pt",
}: ProgramDayChecklistProps) {
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {language === "pt" ? "Tarefas do Dia" : language === "en" ? "Day Tasks" : "Tareas del Día"}
          </span>
          <span className="text-muted-foreground">
            {completedCount} / {totalCount}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = taskIcons[task.task_type] || Check
          const colorClass = taskColors[task.task_type] || "from-gray-500 to-gray-600"

          return (
            <Card
              key={task.id}
              className={cn(
                "p-4 transition-all",
                task.completed && "bg-gradient-to-br opacity-75",
                !task.completed && "hover:border-primary"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    task.completed
                      ? `bg-gradient-to-br ${colorClass}`
                      : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      task.completed ? "text-white" : "text-muted-foreground"
                    )}
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            "font-medium text-sm",
                            task.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </h4>
                        {task.is_required && (
                          <span className="text-xs text-muted-foreground">*</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[oklch(0.68_0.18_45)]">
                        +{task.xp_reward} XP
                      </span>
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) =>
                          onTaskComplete(task.id, checked === true)
                        }
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

