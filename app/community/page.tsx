"use client"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Flame, Award, MessageCircle } from "lucide-react"

export default function CommunityPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const leaderboard = [
    { rank: 1, initial: "J.", streak: 45, isPro: true },
    { rank: 2, initial: "M.", streak: 38, isPro: true },
    { rank: 3, initial: "A.", streak: 31, isPro: false },
    { rank: 4, initial: "K.", streak: 28, isPro: true },
    { rank: 5, initial: "L.", streak: 21, isPro: false },
    { rank: 6, initial: "R.", streak: 19, isPro: false },
    { rank: 7, initial: "S.", streak: 17, isPro: false },
    { rank: 8, initial: "T.", streak: 14, isPro: true },
  ]

  const victoryStories = [
    {
      id: 1,
      initial: "D.",
      days: 90,
      date: "2 weeks ago",
      story:
        "Completed the full 90-day program. My focus and energy are completely transformed. This app changed my life.",
    },
    {
      id: 2,
      initial: "M.",
      days: 60,
      date: "1 month ago",
      story: "60 days clean! The meditation tools and daily missions kept me accountable. Feeling stronger every day.",
    },
    {
      id: 3,
      initial: "C.",
      days: 30,
      date: "3 days ago",
      story: "First month complete! The community support and progress tracking made all the difference.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      <div className="lg:ml-64">
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 lg:pb-8">
          {/* Leaderboard */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-[oklch(0.68_0.18_45)]" />
                {t.topPerformers}
              </h2>
              <Badge className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0">
                {t.proLabel}
              </Badge>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <Card
                  key={entry.rank}
                  className={`p-4 transition-all ${
                    entry.rank <= 3
                      ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 border-[oklch(0.54_0.18_285)]/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          entry.rank === 1
                            ? "bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white"
                            : entry.rank === 2
                              ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white"
                              : entry.rank === 3
                                ? "bg-gradient-to-br from-[oklch(0.68_0.18_45)]/70 to-[oklch(0.7_0.15_220)]/70 text-white"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.rank === 1 && <Trophy className="h-6 w-6" />}
                        {entry.rank !== 1 && entry.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{entry.initial}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Flame className="h-4 w-4 text-[oklch(0.68_0.18_45)]" />
                          <span>
                            {entry.streak} {t.days}
                          </span>
                        </div>
                      </div>
                    </div>
                    {entry.isPro && (
                      <Badge variant="outline" className="text-[oklch(0.68_0.18_45)]">
                        {t.proLabel}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button className="w-full mt-4 bg-transparent" variant="outline">
              {t.upgradePro}
            </Button>
          </Card>

          {/* Victory Stories */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="h-6 w-6 text-[oklch(0.54_0.18_285)]" />
                {t.victoryStories}
              </h2>
            </div>

            <div className="space-y-4">
              {victoryStories.map((story) => (
                <Card key={story.id} className="p-6 hover:border-[oklch(0.54_0.18_285)] transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center mx-auto text-white font-bold">
                          {story.initial}
                        </div>
                        <div>
                          <p className="font-semibold">{story.initial}</p>
                          <p className="text-sm text-muted-foreground">{story.date}</p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0">
                        {story.days} {t.days}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{story.story}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Button className="w-full mt-6 bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white">
              <MessageCircle className="mr-2 h-4 w-4" />
              {t.shareVictory}
            </Button>
          </Card>

          {/* Anonymous Support */}
          <Card className="p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{t.anonymousSupport}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Connect with others on the same journey. Share experiences and support each other anonymously.
                </p>
              </div>
              <Button size="lg" variant="outline">
                Join Community Forum
              </Button>
            </div>
          </Card>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}
