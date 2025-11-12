"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles, Loader2, Lock, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const t = translations[language]
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    if (password.length < 6) {
      toast.error(t.passwordTooShort)
      return false
    }
    if (password !== confirmPassword) {
      toast.error(t.passwordsDoNotMatch)
      return false
    }
    return true
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      toast.success("Senha redefinida com sucesso!")
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen venser-gradient flex flex-col">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md venser-card-glow border-border/50 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
                {success ? (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                ) : (
                  <Lock className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {success ? t.passwordResetSuccess : t.newPassword}
            </CardTitle>
            <CardDescription>
              {success
                ? t.passwordResetSuccessDesc
                : language === 'pt' ? "Digite sua nova senha" : language === 'en' ? "Enter your new password" : "Ingresa tu nueva contraseña"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.passwordResetSuccess}
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 text-white venser-card-glow transition-all duration-300"
                >
                  {t.goToLogin}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.passwordTooShort}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-background"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 text-white venser-card-glow transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.loading}
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      {t.resetPasswordButton}
                    </>
                  )}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                {t.backToLogin}
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

