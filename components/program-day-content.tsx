"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, Volume2, Video } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgramDayContentProps {
  title: string
  contentText?: string
  contentAudioUrl?: string
  contentVideoUrl?: string
  motivationalQuote?: string
  language?: "pt" | "en" | "es"
}

export function ProgramDayContent({
  title,
  contentText,
  contentAudioUrl,
  contentVideoUrl,
  motivationalQuote,
  language = "pt",
}: ProgramDayContentProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {motivationalQuote && (
          <p className="mt-2 text-muted-foreground italic">"{motivationalQuote}"</p>
        )}
      </div>

      {/* Text Content */}
      {contentText && (
        <Card className="p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold">
                {language === "pt"
                  ? "Conteúdo do Dia"
                  : language === "en"
                    ? "Day Content"
                    : "Contenido del Día"}
              </h3>
              <div
                className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contentText }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Audio Content */}
      {contentAudioUrl && (
        <Card className="p-6 bg-gradient-to-br from-[oklch(0.7_0.15_220)]/10 to-[oklch(0.68_0.18_45)]/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center shrink-0">
              <Volume2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold">
                {language === "pt"
                  ? "Áudio Motivacional"
                  : language === "en"
                    ? "Motivational Audio"
                    : "Audio Motivacional"}
              </h3>
              <audio controls className="w-full">
                <source src={contentAudioUrl} type="audio/mpeg" />
                {language === "pt"
                  ? "Seu navegador não suporta áudio."
                  : language === "en"
                    ? "Your browser does not support audio."
                    : "Tu navegador no soporta audio."}
              </audio>
            </div>
          </div>
        </Card>
      )}

      {/* Video Content */}
      {contentVideoUrl && (
        <Card className="p-6 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/10 to-[oklch(0.7_0.18_30)]/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] flex items-center justify-center shrink-0">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold">
                {language === "pt"
                  ? "Vídeo Motivacional"
                  : language === "en"
                    ? "Motivational Video"
                    : "Video Motivacional"}
              </h3>
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <video controls className="w-full h-full">
                  <source src={contentVideoUrl} type="video/mp4" />
                  {language === "pt"
                    ? "Seu navegador não suporta vídeo."
                    : language === "en"
                      ? "Your browser does not support video."
                      : "Tu navegador no soporta video."}
                </video>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

