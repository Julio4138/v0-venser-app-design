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
import { Sparkles, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const t = translations[language]
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast.success(t.resetLinkSent)
    } catch (error: any) {
      toast.error(error.message || t.resetPasswordError)
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
                {emailSent ? (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                ) : (
                  <Mail className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {emailSent ? t.resetLinkSent.split("!")[0] + "!" : t.resetPassword}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? t.resetLinkSent
                : t.resetPasswordDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.resetLinkSent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'pt' && 'Verifique sua caixa de entrada e a pasta de spam.'}
                    {language === 'en' && 'Check your inbox and spam folder.'}
                    {language === 'es' && 'Revisa tu bandeja de entrada y carpeta de spam.'}
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] hover:opacity-90 text-white venser-card-glow transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.backToLogin}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'pt' && 'Enviaremos um link de recuperação para este e-mail.'}
                    {language === 'en' && 'We will send a recovery link to this email.'}
                    {language === 'es' && 'Enviaremos un enlace de recuperación a este correo.'}
                  </p>
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
                      <Mail className="mr-2 h-4 w-4" />
                      {t.sendResetLink}
                    </>
                  )}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t.rememberPassword} </span>
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

