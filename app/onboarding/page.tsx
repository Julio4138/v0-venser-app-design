"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProgressRing } from "@/components/progress-ring"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Activity } from "lucide-react"

const questions = [
  {
    key: "question1" as const,
    options: ["option1_1", "option1_2", "option1_3", "option1_4"] as const,
    scores: [0, 1, 2, 3],
  },
  {
    key: "question2" as const,
    options: ["option2_1", "option2_2", "option2_3", "option2_4"] as const,
    scores: [0, 1, 2, 3],
  },
  {
    key: "question3" as const,
    options: ["option3_1", "option3_2", "option3_3", "option3_4"] as const,
    scores: [0, 1, 2, 3],
  },
]

export default function OnboardingPage() {
  const { language, setLanguage } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const t = translations[language]

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = score
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300)
    }
  }

  const calculateLevel = () => {
    const total = answers.reduce((sum, score) => sum + score, 0)
    const maxScore = questions.length * 3
    const percentage = (total / maxScore) * 100

    if (percentage >= 70) return { level: t.moderate, icon: TrendingUp, color: "text-green-400" }
    if (percentage >= 40) return { level: t.elevated, icon: Activity, color: "text-yellow-400" }
    return { level: t.critical, icon: TrendingDown, color: "text-red-400" }
  }

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const viewResults = () => {
    setShowResults(true)
  }

  if (showResults) {
    const result = calculateLevel()
    const Icon = result.icon
    const progress = (answers.reduce((sum, score) => sum + score, 0) / (questions.length * 3)) * 100

    return (
      <div className="min-h-screen venser-gradient flex flex-col">
        <header className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">VENSER</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="max-w-2xl w-full p-8 md:p-12 bg-card/80 backdrop-blur-xl border-border/50 venser-card-glow">
            <div className="space-y-8 text-center">
              <h2 className="text-3xl font-bold text-card-foreground">{t.dopamineLevel}</h2>

              <div className="flex justify-center">
                <ProgressRing progress={progress} size={240}>
                  <div className="text-center">
                    <Icon className={`h-16 w-16 mx-auto mb-2 ${result.color}`} />
                    <p className={`text-2xl font-bold ${result.color}`}>{result.level}</p>
                    <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}%</p>
                  </div>
                </ProgressRing>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">{t.recommendation}</p>

              <Button
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="h-14 px-8 text-lg bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 text-white venser-card-glow transition-all duration-300 hover:scale-105"
              >
                {t.start90Days}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen venser-gradient flex flex-col">
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">VENSER</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{t.dopamineTest}</span>
              <span>
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="h-2 bg-card/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Card className="p-8 md:p-12 bg-card/80 backdrop-blur-xl border-border/50 venser-card-glow">
            <h2 className="text-2xl md:text-3xl font-bold text-card-foreground mb-8 leading-relaxed text-balance">
              {t[question.key]}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => handleAnswer(question.scores[index])}
                  className="w-full h-auto py-4 px-6 text-left justify-start text-base hover:bg-accent hover:border-[oklch(0.54_0.18_285)] transition-all duration-200 hover:scale-[1.02]"
                >
                  {t[option]}
                </Button>
              ))}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack} disabled={currentQuestion === 0} className="text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>

            {currentQuestion === questions.length - 1 && answers.length === questions.length && (
              <Button
                onClick={viewResults}
                className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white"
              >
                {t.viewResults}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
