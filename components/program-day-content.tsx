"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Play, Volume2, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface ProgramDayContentProps {
  title: string
  contentText?: string
  contentAudioUrl?: string
  contentVideoUrl?: string
  motivationalQuote?: string
  language?: "pt" | "en" | "es"
}

// Função para extrair ID do vídeo do YouTube
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Função para verificar se é URL do YouTube
function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}

export function ProgramDayContent({
  title,
  contentText,
  contentAudioUrl,
  contentVideoUrl,
  motivationalQuote,
  language = "pt",
}: ProgramDayContentProps) {
  // Verificar se é URL do YouTube e extrair ID
  const youtubeVideoId = useMemo(() => {
    if (!contentVideoUrl) return null
    if (isYouTubeUrl(contentVideoUrl)) {
      return getYouTubeVideoId(contentVideoUrl)
    }
    return null
  }, [contentVideoUrl])

  const isYouTube = youtubeVideoId !== null

  return (
    <div className="space-y-4">
      {/* Motivational Quote */}
      {motivationalQuote && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-[oklch(0.54_0.18_285)]/20 to-[oklch(0.7_0.15_220)]/20 border border-white/10">
          <p className="text-sm md:text-base text-foreground italic leading-relaxed text-center">
            "{motivationalQuote}"
          </p>
        </div>
      )}

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
              <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                {isYouTube ? (
                  // Embed do YouTube usando iframe
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Vídeo Motivacional"
                  />
                ) : (
                  // Vídeo HTML5 para URLs diretas
                  <video 
                    controls 
                    className="w-full h-full"
                    preload="metadata"
                    playsInline
                    onError={(e) => {
                      const videoElement = e.currentTarget as HTMLVideoElement
                      console.error("=== Erro ao carregar vídeo ===")
                      console.error("URL:", contentVideoUrl)
                      console.error("Network state:", videoElement.networkState)
                      console.error("Ready state:", videoElement.readyState)
                      
                      // Verificar se há erro disponível
                      if (videoElement.error) {
                        console.error("Código de erro:", videoElement.error.code)
                        console.error("Mensagem:", videoElement.error.message)
                        
                        // Mensagens de erro mais específicas
                        switch (videoElement.error.code) {
                          case 1: // MEDIA_ERR_ABORTED
                            console.error("Erro: O carregamento do vídeo foi abortado")
                            break
                          case 2: // MEDIA_ERR_NETWORK
                            console.error("Erro: Problema de rede ao carregar o vídeo")
                            break
                          case 3: // MEDIA_ERR_DECODE
                            console.error("Erro: Não foi possível decodificar o vídeo (formato não suportado ou arquivo corrompido)")
                            break
                          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                            console.error("Erro: Formato de vídeo não suportado ou URL inválida")
                            break
                          default:
                            console.error("Erro desconhecido:", videoElement.error.code)
                        }
                      } else {
                        // Se não há error object, verificar networkState
                        if (videoElement.networkState === 3) { // NETWORK_NO_SOURCE
                          console.error("Erro: Nenhuma fonte de vídeo válida encontrada")
                          console.error("Verifique se a URL está correta e acessível")
                        } else if (videoElement.networkState === 2) { // NETWORK_ERROR
                          console.error("Erro: Problema de rede ao carregar o vídeo")
                        } else {
                          console.error("Erro: Estado da rede:", videoElement.networkState)
                          console.error("Estado de prontidão:", videoElement.readyState)
                        }
                      }
                      console.error("==============================")
                    }}
                    onLoadStart={() => {
                      console.log("Iniciando carregamento do vídeo:", contentVideoUrl)
                    }}
                    onLoadedMetadata={() => {
                      console.log("Metadados do vídeo carregados com sucesso")
                    }}
                    onCanPlay={() => {
                      console.log("Vídeo pronto para reprodução")
                    }}
                  >
                    <source src={contentVideoUrl} type="video/mp4" />
                    <source src={contentVideoUrl} type="video/webm" />
                    <source src={contentVideoUrl} type="video/ogg" />
                    {language === "pt"
                      ? "Seu navegador não suporta vídeo. Verifique se a URL do vídeo está correta."
                      : language === "en"
                        ? "Your browser does not support video. Please check if the video URL is correct."
                        : "Tu navegador no soporta video. Verifica si la URL del video es correcta."}
                  </video>
                )}
              </div>
              {/* Debug info - remover em produção */}
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-muted-foreground">
                  URL: {contentVideoUrl}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

