"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  Video,
  Clock,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Podcast {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  description_pt: string | null
  description_en: string | null
  description_es: string | null
  media_type: "audio" | "video"
  media_url: string
  thumbnail_url: string | null
  duration: number | null
  category_pt: string | null
  category_en: string | null
  category_es: string | null
  author_pt: string | null
  author_en: string | null
  author_es: string | null
}

export default function PlaylistPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    loadPodcasts()
  }, [])

  useEffect(() => {
    if (currentPodcast) {
      if (currentPodcast.media_type === "audio" && audioRef.current) {
        audioRef.current.src = currentPodcast.media_url
        audioRef.current.load()
      } else if (currentPodcast.media_type === "video" && videoRef.current) {
        videoRef.current.src = currentPodcast.media_url
        videoRef.current.load()
      }
    }
  }, [currentPodcast])

  const loadPodcasts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error
      setPodcasts(data || [])
    } catch (error: any) {
      console.error("Error loading podcasts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = (podcast: Podcast) => {
    if (language === "pt") return podcast.title_pt
    if (language === "en") return podcast.title_en
    return podcast.title_es
  }

  const getDescription = (podcast: Podcast) => {
    if (language === "pt") return podcast.description_pt
    if (language === "en") return podcast.description_en
    return podcast.description_es
  }

  const getCategory = (podcast: Podcast) => {
    if (language === "pt") return podcast.category_pt
    if (language === "en") return podcast.category_en
    return podcast.category_es
  }

  const getAuthor = (podcast: Podcast) => {
    if (language === "pt") return podcast.author_pt
    if (language === "en") return podcast.author_en
    return podcast.author_es
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    if (!currentPodcast) return

    if (currentPodcast.media_type === "audio" && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } else if (currentPodcast.media_type === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handlePodcastSelect = (podcast: Podcast) => {
    if (currentPodcast?.id === podcast.id) {
      handlePlayPause()
    } else {
      setCurrentPodcast(podcast)
      setIsPlaying(true)
      setCurrentTime(0)
    }
  }

  const handleTimeUpdate = () => {
    if (currentPodcast?.media_type === "audio" && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration || 0)
    } else if (currentPodcast?.media_type === "video" && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (currentPodcast?.media_type === "audio" && audioRef.current) {
      audioRef.current.currentTime = newTime
    } else if (currentPodcast?.media_type === "video" && videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (currentPodcast?.media_type === "audio" && audioRef.current) {
      audioRef.current.volume = newVolume
    } else if (currentPodcast?.media_type === "video" && videoRef.current) {
      videoRef.current.volume = newVolume
    }
    if (newVolume > 0) {
      setIsMuted(false)
    }
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(previousVolume)
      if (currentPodcast?.media_type === "audio" && audioRef.current) {
        audioRef.current.volume = previousVolume
      } else if (currentPodcast?.media_type === "video" && videoRef.current) {
        videoRef.current.volume = previousVolume
      }
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      setVolume(0)
      if (currentPodcast?.media_type === "audio" && audioRef.current) {
        audioRef.current.volume = 0
      } else if (currentPodcast?.media_type === "video" && videoRef.current) {
        videoRef.current.volume = 0
      }
      setIsMuted(true)
    }
  }

  const handlePrevious = () => {
    if (!currentPodcast) return
    const currentIndex = podcasts.findIndex(p => p.id === currentPodcast.id)
    if (currentIndex > 0) {
      handlePodcastSelect(podcasts[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (!currentPodcast) return
    const currentIndex = podcasts.findIndex(p => p.id === currentPodcast.id)
    if (currentIndex < podcasts.length - 1) {
      handlePodcastSelect(podcasts[currentIndex + 1])
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    handleNext()
  }

  if (loading) {
    return (
      <div className="min-h-screen tools-background relative">
        <MobileHeader />
        <DesktopSidebar />
        <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen tools-background relative">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 pb-32 md:pb-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{t.podcasts}</h1>
            <p className="text-white/70">{t.podcastLibrary}</p>
          </div>

          {/* Video Player (se vídeo estiver tocando) */}
          {currentPodcast?.media_type === "video" && (
            <div className="mb-8 rounded-xl overflow-hidden bg-black/20 backdrop-blur-md border border-white/10">
              <video
                ref={videoRef}
                className="w-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                poster={currentPodcast.thumbnail_url || undefined}
              />
            </div>
          )}

          {/* Playlist */}
          <div className="space-y-2 mb-8">
            {podcasts.length === 0 ? (
              <div className="text-center py-12 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl">
                <Music className="h-12 w-12 mx-auto mb-4 text-white/50" />
                <p className="text-white/70">{t.noPodcasts}</p>
              </div>
            ) : (
              podcasts.map((podcast) => {
                const isCurrent = currentPodcast?.id === podcast.id
                return (
                  <div
                    key={podcast.id}
                    className={cn(
                      "bg-black/20 backdrop-blur-md border rounded-xl p-4 cursor-pointer transition-all",
                      isCurrent
                        ? "border-[oklch(0.54_0.18_285)] bg-[oklch(0.54_0.18_285)]/20"
                        : "border-white/10 hover:bg-black/30 hover:border-white/20"
                    )}
                    onClick={() => handlePodcastSelect(podcast)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {podcast.thumbnail_url ? (
                          <img
                            src={podcast.thumbnail_url}
                            alt={getTitle(podcast)}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={cn(
                            "w-16 h-16 rounded-lg flex items-center justify-center",
                            podcast.media_type === "audio"
                              ? "bg-gradient-to-br from-blue-500 to-blue-600"
                              : "bg-gradient-to-br from-purple-500 to-purple-600"
                          )}>
                            {podcast.media_type === "audio" ? (
                              <Music className="h-8 w-8 text-white" />
                            ) : (
                              <Video className="h-8 w-8 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{getTitle(podcast)}</h3>
                          {isCurrent && isPlaying && (
                            <div className="flex gap-1">
                              <div className="w-1 h-4 bg-[oklch(0.54_0.18_285)] rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
                              <div className="w-1 h-4 bg-[oklch(0.54_0.18_285)] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                              <div className="w-1 h-4 bg-[oklch(0.54_0.18_285)] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          {getAuthor(podcast) && (
                            <span className="truncate">{getAuthor(podcast)}</span>
                          )}
                          {getCategory(podcast) && (
                            <>
                              <span>•</span>
                              <span className="truncate">{getCategory(podcast)}</span>
                            </>
                          )}
                          {podcast.duration && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(podcast.duration)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isCurrent ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayPause()
                            }}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                        ) : (
                          <Play className="h-5 w-5 text-white/70" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>

      {/* Audio Player (hidden, para áudio) */}
      {currentPodcast?.media_type === "audio" && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Player Controls Bar (fixo na parte inferior) */}
      {currentPodcast && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 z-50">
          <div className={cn(
            "max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4",
            collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64"
          )}>
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Current Track Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {currentPodcast.thumbnail_url ? (
                  <img
                    src={currentPodcast.thumbnail_url}
                    alt={getTitle(currentPodcast)}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    currentPodcast.media_type === "audio"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-purple-500 to-purple-600"
                  )}>
                    {currentPodcast.media_type === "audio" ? (
                      <Music className="h-6 w-6 text-white" />
                    ) : (
                      <Video className="h-6 w-6 text-white" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{getTitle(currentPodcast)}</p>
                  {getAuthor(currentPodcast) && (
                    <p className="text-sm text-white/60 truncate">{getAuthor(currentPodcast)}</p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={handlePrevious}
                    disabled={podcasts.findIndex(p => p.id === currentPodcast.id) === 0}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-12 w-12"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={handleNext}
                    disabled={podcasts.findIndex(p => p.id === currentPodcast.id) === podcasts.length - 1}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 w-full max-w-md">
                  <span className="text-xs text-white/60 w-12 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[oklch(0.54_0.18_285)]"
                  />
                  <span className="text-xs text-white/60 w-12">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[oklch(0.54_0.18_285)]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav translations={t} />
    </div>
  )
}

