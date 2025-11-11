"use client"

import { useState } from "react"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { ToolCard } from "@/components/tool-card"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Wind, Podcast, Trophy, CloudRain, Waves, Radio, Flame, BookOpen, Play, Lock } from "lucide-react"

export default function ToolsPage() {
  const { language } = useLanguage()
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const t = translations[language]

  const tools = [
    {
      icon: Brain,
      title: t.meditations,
      description: "Guided sessions to calm your mind",
      color: "from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)]",
      buttonText: t.startMeditation,
      isPro: false,
    },
    {
      icon: Wind,
      title: t.breathing,
      description: "Breathing techniques for relaxation",
      color: "from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)]",
      buttonText: t.startBreathing,
      isPro: false,
    },
    {
      icon: Podcast,
      title: t.podcasts,
      description: "Educational content for your journey",
      color: "from-[oklch(0.68_0.18_45)] to-[oklch(0.54_0.18_285)]",
      buttonText: t.listen,
      isPro: true,
    },
    {
      icon: Trophy,
      title: t.leaderboard,
      description: "See how you rank with others",
      color: "from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)]",
      buttonText: "View Ranking",
      isPro: true,
    },
  ]

  const sounds = [
    { id: "rain", icon: CloudRain, label: t.rain },
    { id: "ocean", icon: Waves, label: t.ocean },
    { id: "whitenoise", icon: Radio, label: t.whitenoise },
    { id: "fire", icon: Flame, label: t.fire },
  ]

  const meditations = [
    { id: 1, title: t.morningMeditation, duration: "10 min", isPro: false },
    { id: 2, title: t.focusMeditation, duration: "15 min", isPro: false },
    { id: 3, title: t.sleepMeditation, duration: "20 min", isPro: true },
  ]

  const breathingExercises = [
    { id: 1, title: t.boxBreathing, duration: "5 min", isPro: false },
    { id: 2, title: t.deepBreathing, duration: "8 min", isPro: false },
    { id: 3, title: t.calmingBreath, duration: "10 min", isPro: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      <div className="lg:ml-64">
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 lg:pb-8">
          {/* Main Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>

          {/* Focus Sounds */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{t.focusSounds}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sounds.map((sound) => {
                const Icon = sound.icon
                const isPlaying = playingSound === sound.id

                return (
                  <Card
                    key={sound.id}
                    onClick={() => setPlayingSound(isPlaying ? null : sound.id)}
                    className="p-6 cursor-pointer hover:border-[oklch(0.54_0.18_285)] transition-all hover:scale-105"
                  >
                    <div className="text-center space-y-3">
                      <div
                        className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center transition-all ${
                          isPlaying
                            ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] animate-pulse"
                            : "bg-muted"
                        }`}
                      >
                        <Icon className={`h-8 w-8 ${isPlaying ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <p className="text-sm font-medium">{sound.label}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </Card>

          {/* Meditations */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{t.meditations}</h2>
            <div className="space-y-3">
              {meditations.map((meditation) => (
                <Card key={meditation.id} className="p-4 hover:border-[oklch(0.54_0.18_285)] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center">
                        {meditation.isPro ? (
                          <Lock className="h-6 w-6 text-white" />
                        ) : (
                          <Play className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{meditation.title}</p>
                        <p className="text-sm text-muted-foreground">{meditation.duration}</p>
                      </div>
                    </div>
                    <Button variant={meditation.isPro ? "outline" : "default"} size="sm">
                      {meditation.isPro ? t.unlockFeature : t.playSound}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Breathing Exercises */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{t.breathing}</h2>
            <div className="space-y-3">
              {breathingExercises.map((exercise) => (
                <Card key={exercise.id} className="p-4 hover:border-[oklch(0.7_0.15_220)] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.68_0.18_45)] flex items-center justify-center">
                        <Wind className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{exercise.title}</p>
                        <p className="text-sm text-muted-foreground">{exercise.duration}</p>
                      </div>
                    </div>
                    <Button size="sm">{t.startBreathing}</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Learn Section */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{t.learn}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Understanding Dopamine", category: "Neuroscience" },
                { title: "Building Better Habits", category: "Psychology" },
                { title: "The Power of Meditation", category: "Wellness" },
              ].map((article, index) => (
                <Card key={index} className="p-4 hover:border-[oklch(0.68_0.18_45)] transition-all cursor-pointer">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.54_0.18_285)] flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{article.category}</p>
                      <p className="font-semibold">{article.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
