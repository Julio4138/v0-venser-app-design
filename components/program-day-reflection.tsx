"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgramDayReflectionProps {
  reflectionText?: string
  onReflectionChange: (text: string) => void
  language?: "pt" | "en" | "es"
  placeholder?: string
  disabled?: boolean
}

export function ProgramDayReflection({
  reflectionText = "",
  onReflectionChange,
  language = "pt",
  placeholder,
  disabled = false,
}: ProgramDayReflectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const defaultPlaceholder =
    language === "pt"
      ? "Como me senti hoje? O que aprendi? O que posso melhorar?"
      : language === "en"
        ? "How did I feel today? What did I learn? What can I improve?"
        : "¿Cómo me sentí hoy? ¿Qué aprendí? ¿Qué puedo mejorar?"

  // Show saving indicator when text changes
  useEffect(() => {
    if (reflectionText && reflectionText.length > 0) {
      setIsSaving(true)
      setIsSaved(false)
      const timer = setTimeout(() => {
        setIsSaving(false)
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [reflectionText])

  return (
    <Card className="p-6 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/10 to-[oklch(0.68_0.18_45)]/10 border-[oklch(0.7_0.15_220)]/20">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {language === "pt"
                  ? "Reflexão Final"
                  : language === "en"
                    ? "Final Reflection"
                    : "Reflexión Final"}
              </h3>
              <Sparkles className="h-4 w-4 text-[oklch(0.68_0.18_45)]" />
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "pt"
                ? "Reserve alguns minutos para refletir sobre o seu dia e sua jornada. Sua reflexão é salva automaticamente."
                : language === "en"
                  ? "Take a few minutes to reflect on your day and your journey. Your reflection is saved automatically."
                  : "Tómate unos minutos para reflexionar sobre tu día y tu viaje. Tu reflexión se guarda automáticamente."}
            </p>
          </div>
        </div>

        <Textarea
          value={reflectionText}
          onChange={(e) => onReflectionChange(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className="min-h-[120px] resize-none"
          maxLength={500}
          disabled={disabled}
          readOnly={disabled}
        />

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {language === "pt"
                ? "Sua reflexão é privada e confidencial"
                : language === "en"
                  ? "Your reflection is private and confidential"
                  : "Tu reflexión es privada y confidencial"}
            </span>
            {isSaving && (
              <span className="text-muted-foreground animate-pulse">
                {language === "pt" ? "Salvando..." : language === "en" ? "Saving..." : "Guardando..."}
              </span>
            )}
            {isSaved && (
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {language === "pt" ? "Salvo" : language === "en" ? "Saved" : "Guardado"}
              </span>
            )}
          </div>
          <span className="text-muted-foreground">{reflectionText.length} / 500</span>
        </div>
      </div>
    </Card>
  )
}

