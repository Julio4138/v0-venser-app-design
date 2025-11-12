"use client"

import { useState } from "react"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import {
  Wind,
  Bot,
  Brain,
  ClipboardList,
  CloudRain,
  Waves,
  Flame,
  Radio,
  BookOpen,
  BarChart3,
  X,
  Diamond,
  FileText,
} from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

export default function ToolsPage() {
  const { language } = useLanguage()
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const t = translations[language]
  const { collapsed } = useSidebar()

  // Custom breathing icon component
  const BreathingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
      <path
        d="M12 2C12 2 8 6 8 10C8 13 10 15 12 15C14 15 16 13 16 10C16 6 12 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
    </svg>
  )

  const quickActions = [
    { id: "breathing", icon: BreathingIcon, label: "Breathing Exercise" },
    { id: "melius", icon: Bot, label: "Melius AI Therapist" },
    { id: "meditate", icon: Brain, label: "Meditate" },
    { id: "research", icon: ClipboardList, label: "Porn Research" },
  ]

  const sounds = [
    { id: "rain", icon: CloudRain, label: t.rain, emoji: "🌧️" },
    { id: "ocean", icon: Waves, label: "Ocean Waves", emoji: "🌊" },
    { id: "fire", icon: Flame, label: "Campfire", emoji: "🏕️" },
    { id: "whitenoise", icon: Radio, label: t.whitenoise, emoji: "💨" },
  ]

  const toolsList = [
    { title: "Illusion Buster", icon: X, iconBg: "bg-pink-500", iconColor: "text-white", iconShape: "square" },
    { title: "Dopamine Visualiser", icon: Diamond, iconBg: "bg-orange-500", iconColor: "text-white", iconShape: "diamond" },
    { title: "Journal", icon: FileText, iconBg: "bg-yellow-500", iconColor: "text-white", iconShape: "square" },
  ]

  return (
    <div className="min-h-screen tools-background relative">
      <DesktopSidebar />

      <div className={cn(collapsed ? "lg:ml-20" : "lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8 pb-20 lg:pb-8 relative z-10">
          {/* Header */}
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">{t.tools}</h1>

            {/* Quick actions row - Circular icons */}
            <div className="flex flex-wrap gap-6 mb-8">
              {quickActions.map((qa) => {
                const Icon = qa.icon
                const isCustomIcon = qa.id === "breathing"
                return (
                  <div key={qa.id} className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-full bg-[oklch(0.2_0.1_285)] flex items-center justify-center border border-[oklch(0.3_0.1_285)]">
                      {isCustomIcon ? <Icon /> : <Icon className="h-7 w-7 text-white" />}
                    </div>
                    <span className="text-xs text-white/70 text-center max-w-[80px]">{qa.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Category pills - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Articles - Orange gradient */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 shadow-lg">
                Articles
              </div>
              
              {/* Learn - Green gradient with chart icon */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-green-500 via-green-400 to-green-600 shadow-lg relative overflow-hidden">
                <span className="relative z-10">{t.learn}</span>
                <BarChart3 className="absolute bottom-2 right-4 h-4 w-4 text-white/50" />
              </div>
              
              {/* Podcasts - Blue gradient with waves */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 shadow-lg relative overflow-hidden">
                <span className="relative z-10">{t.podcasts}</span>
                <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30">
                  <svg viewBox="0 0 200 40" className="w-full h-full">
                    <path d="M0,20 Q50,10 100,20 T200,20" stroke="white" strokeWidth="2" fill="none" />
                    <path d="M0,25 Q50,15 100,25 T200,25" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>
              
              {/* Leaderboard - Pink/Purple gradient */}
              <div className="rounded-full h-20 px-6 flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 shadow-lg">
                {t.leaderboard}
              </div>
            </div>
          </div>

          {/* Relaxation Noises Section */}
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-bold text-white">Relaxation Noises</h2>
            <div className="flex flex-wrap gap-6">
              {sounds.map((sound) => {
                const Icon = sound.icon
                const isPlaying = playingSound === sound.id
                const hasEmoji = sound.emoji !== undefined

                return (
                  <div
                    key={sound.id}
                    onClick={() => setPlayingSound(isPlaying ? null : sound.id)}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center transition-all",
                        isPlaying
                          ? "bg-white/20 border-2 border-white/40"
                          : "bg-black/30 border border-white/10 group-hover:bg-white/10"
                      )}
                    >
                      {hasEmoji ? (
                        <span className="text-3xl">{sound.emoji}</span>
                      ) : (
                        <Icon className={cn("h-8 w-8", isPlaying ? "text-white" : "text-white/70")} />
                      )}
                    </div>
                    <span className="text-xs text-white/70 text-center">{sound.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tools Section */}
          <div className="relative z-10 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">{t.tools}</h2>
              <p className="text-sm text-white/60 mt-1">
                Science-based methods to aid in reframing your brain
              </p>
            </div>
            
            <div className="space-y-3">
              {toolsList.map((tool) => {
                const Icon = tool.icon
                return (
                  <div
                    key={tool.title}
                    className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-4 flex items-center justify-between hover:bg-black/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center", 
                        tool.iconBg,
                        tool.iconShape === "square" ? "rounded" : tool.iconShape === "diamond" ? "rotate-45" : "rounded"
                      )}>
                        <Icon className={cn("h-5 w-5", tool.iconColor, tool.iconShape === "diamond" && "-rotate-45")} />
                      </div>
                      <span className="font-medium text-white">{tool.title}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      Open
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
