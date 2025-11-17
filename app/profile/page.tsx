"use client"
import { useState, useEffect } from "react"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, Settings, Crown, LogOut, User, Lock, Globe, Upload, X, Camera } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ProfileData {
  full_name: string | null
  email: string | null
  avatar_url: string | null
  language_preference: "pt" | "en" | "es"
  created_at: string | null
  biography: string | null
}

export default function ProfilePage() {
  const { language, setLanguage } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  // Form states
  const [fullName, setFullName] = useState("")
  const [biography, setBiography] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<"pt" | "en" | "es">("pt")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Load profile data
  useEffect(() => {
    loadProfileData()
  }, [])

  // Load profile when settings dialog opens
  useEffect(() => {
    if (isSettingsOpen) {
      loadProfileData()
    }
  }, [isSettingsOpen])

  const loadProfileData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user:", userError)
        toast.error(language === "pt" ? "Erro ao verificar autenticação" : "Error verifying authentication")
        setIsLoading(false)
        return
      }

      if (!user) {
        setIsLoading(false)
        return
      }

      // Load profile from profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      // PGRST116 = no rows returned (perfil não existe ainda)
      // 42501 = insufficient_privilege (problema de RLS)
      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile from database:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        
        // Se for erro de permissão RLS, tenta criar o perfil
        if (error.code === "42501" || error.message?.includes("permission") || error.message?.includes("policy")) {
          console.warn("RLS permission error detected, attempting to create profile...")
          // Não lança erro aqui, deixa tentar criar o perfil abaixo
        } else {
          throw error
        }
      }

      if (profile) {
        setProfileData(profile)
        setFullName(profile.full_name || "")
        setBiography(profile.biography || "")
        setSelectedLanguage(profile.language_preference || "pt")
        setAvatarPreview(profile.avatar_url)
      } else {
        // Create profile if doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: null,
            language_preference: "pt",
          })
          .select()
          .single()

        if (insertError) {
          console.error("Error creating profile:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          })
          throw insertError
        }

        if (newProfile) {
          setProfileData(newProfile)
          setFullName("")
          setBiography("")
          setSelectedLanguage("pt")
        }
      }
    } catch (error: any) {
      // Log detalhado do erro para debug
      const errorInfo = {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      }
      console.error("Error loading profile:", errorInfo)
      
      // Determinar mensagem de erro apropriada
      let errorMessage = language === "pt" ? "Erro ao carregar perfil" : "Error loading profile"
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Erro ${error.code}: ${errorMessage}`
      } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        // Se o erro tem propriedades mas não tem message, tenta stringificar
        try {
          const errorStr = JSON.stringify(error)
          if (errorStr !== '{}') {
            errorMessage = `${errorMessage}: ${errorStr}`
          }
        } catch (e) {
          // Ignora erro de stringificação
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(language === "pt" ? "Por favor, selecione uma imagem" : "Please select an image")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "pt" ? "A imagem deve ter no máximo 5MB" : "Image must be less than 5MB")
      return
    }

    try {
      setIsUploadingAvatar(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(language === "pt" ? "Usuário não encontrado" : "User not found")
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      // File path within the bucket (bucket name is 'avatars', so we just use the filename)
      const filePath = fileName

      // Delete old avatar if exists
      if (profileData?.avatar_url) {
        try {
          // Extract file path from URL
          // URL format: https://...supabase.co/storage/v1/object/public/avatars/filename.jpg
          const urlParts = profileData.avatar_url.split("/avatars/")
          if (urlParts.length > 1) {
            let filePath = urlParts[1].split("?")[0] // Remove query parameters
            // Remove 'avatars/' prefix if it exists (from old format)
            if (filePath.startsWith("avatars/")) {
              filePath = filePath.replace("avatars/", "")
            }
            await supabase.storage.from("avatars").remove([filePath])
          }
        } catch (error) {
          // Silently fail if old avatar can't be deleted
          console.warn("Could not delete old avatar:", error)
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
          toast.error(
            language === "pt"
              ? "Bucket de storage não configurado. Por favor, crie o bucket 'avatars' no Supabase Storage. Veja CONFIGURACAO_STORAGE_AVATARES.md para instruções."
              : "Storage bucket not configured. Please create the 'avatars' bucket in Supabase Storage. See CONFIGURACAO_STORAGE_AVATARES.md for instructions.",
            {
              duration: 8000,
            }
          )
          setAvatarPreview(profileData?.avatar_url || null)
          setIsUploadingAvatar(false)
          return
        }
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateError) throw updateError

      setProfileData((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null))
      setAvatarPreview(publicUrl)
      toast.success(language === "pt" ? "Foto de perfil atualizada!" : "Profile picture updated!")
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      
      // Check for bucket not found error in any part of the error chain
      const errorMessage = error.message || error.toString() || ""
      if (errorMessage.includes("Bucket not found") || errorMessage.includes("not found")) {
        toast.error(
          language === "pt"
            ? "Bucket de storage não configurado. Crie o bucket 'avatars' no Supabase Dashboard > Storage."
            : "Storage bucket not configured. Create the 'avatars' bucket in Supabase Dashboard > Storage.",
          {
            duration: 8000,
          }
        )
      } else {
        toast.error(
          error.message || (language === "pt" ? "Erro ao fazer upload da foto" : "Error uploading photo")
        )
      }
      setAvatarPreview(profileData?.avatar_url || null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Delete from storage
      if (profileData?.avatar_url) {
        try {
          // Extract file path from URL
          // URL format: https://...supabase.co/storage/v1/object/public/avatars/filename.jpg
          const urlParts = profileData.avatar_url.split("/avatars/")
          if (urlParts.length > 1) {
            let filePath = urlParts[1].split("?")[0] // Remove query parameters
            // Remove 'avatars/' prefix if it exists (from old format)
            if (filePath.startsWith("avatars/")) {
              filePath = filePath.replace("avatars/", "")
            }
            await supabase.storage.from("avatars").remove([filePath])
          }
        } catch (error) {
          // Silently fail if avatar can't be deleted from storage
          console.warn("Could not delete avatar from storage:", error)
        }
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id)

      if (error) throw error

      setProfileData((prev) => (prev ? { ...prev, avatar_url: null } : null))
      setAvatarPreview(null)
      toast.success(language === "pt" ? "Foto removida" : "Photo removed")
    } catch (error: any) {
      console.error("Error removing avatar:", error)
      toast.error(language === "pt" ? "Erro ao remover foto" : "Error removing photo")
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(language === "pt" ? "Usuário não encontrado" : "User not found")
        return
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          biography: biography || null,
          language_preference: selectedLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update profileData locally
      setProfileData((prev) => 
        prev ? {
          ...prev,
          full_name: fullName || null,
          biography: biography || null,
          language_preference: selectedLanguage,
        } : null
      )

      // Update language context
      setLanguage(selectedLanguage)

      toast.success(language === "pt" ? "Perfil atualizado!" : "Profile updated!")
      setIsSettingsOpen(false)
      await loadProfileData()
    } catch (error: any) {
      console.error("Error saving profile:", error)
      toast.error(error.message || (language === "pt" ? "Erro ao salvar perfil" : "Error saving profile"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      toast.error(
        language === "pt" ? "Preencha todos os campos" : "Please fill all fields"
      )
      return
    }

    if (newPassword.length < 6) {
      toast.error(
        language === "pt"
          ? "A nova senha deve ter pelo menos 6 caracteres"
          : "New password must be at least 6 characters"
      )
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        language === "pt" ? "As senhas não coincidem" : "Passwords do not match"
      )
      return
    }

    try {
      setIsSaving(true)

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success(language === "pt" ? "Senha alterada com sucesso!" : "Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(
        error.message || (language === "pt" ? "Erro ao alterar senha" : "Error changing password")
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success(language === "pt" ? "Logout realizado com sucesso" : "Logout successful")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || (language === "pt" ? "Erro ao fazer logout" : "Error logging out"))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          {/* Profile Card */}
          <Card className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {avatarPreview ? (
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-[oklch(0.54_0.18_285)]">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center venser-glow">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="w-full space-y-3">
                {/* Nome destacado */}
                <h2 className="text-2xl md:text-3xl font-bold">
                  {profileData?.full_name || "Anonymous User"}
                </h2>
                
                {/* E-mail em fonte menor */}
                <p className="text-sm md:text-base text-muted-foreground">
                  {profileData?.email || ""}
                </p>
                
                {/* Data de entrada */}
                <p className="text-sm text-muted-foreground">
                  {language === "pt"
                    ? `Membro desde ${formatDate(profileData?.created_at) || "janeiro 2025"}`
                    : language === "es"
                      ? `Miembro desde ${formatDate(profileData?.created_at) || "enero 2025"}`
                      : `Member since ${formatDate(profileData?.created_at) || "January 2025"}`}
                </p>
                
                {/* Biografia */}
                {profileData?.biography && profileData.biography.trim() && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                      {profileData.biography}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Upgrade to PRO */}
          <Card className="p-5 md:p-6 bg-gradient-to-br from-[oklch(0.68_0.18_45)]/20 to-[oklch(0.7_0.18_30)]/20 border-[oklch(0.68_0.18_45)]">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] flex items-center justify-center shrink-0">
                <Crown className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold mb-1">{t.upgradePro}</h3>
                <p className="text-muted-foreground">
                  Unlock all features including advanced analytics, leaderboard, and premium content
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white shrink-0"
              >
                {t.upgradePro}
              </Button>
            </div>
          </Card>

          {/* Settings */}
          <div className="space-y-3">
            <Card
              className="p-4 hover:border-[oklch(0.54_0.18_285)] transition-all cursor-pointer"
              onClick={() => setIsSettingsOpen(true)}
            >
              <div className="flex items-center gap-4">
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">
                  {language === "pt" ? "Configurações" : language === "es" ? "Configuración" : "Settings"}
                </span>
              </div>
            </Card>

            <Card 
              className="p-4 hover:border-red-500 transition-all cursor-pointer"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-4">
                <LogOut className="h-6 w-6 text-red-500" />
                <span className="font-medium text-red-500">Log Out</span>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "pt" ? "Configurações" : language === "es" ? "Configuración" : "Settings"}
            </DialogTitle>
            <DialogDescription>
              {language === "pt"
                ? "Gerencie suas informações pessoais e preferências"
                : language === "es"
                  ? "Gestiona tu información personal y preferencias"
                  : "Manage your personal information and preferences"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">
                  {language === "pt" ? "Foto de Perfil" : language === "es" ? "Foto de Perfil" : "Profile Picture"}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-[oklch(0.54_0.18_285)]">
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isUploadingAvatar}
                        id="avatar-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingAvatar}
                        className="cursor-pointer"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {language === "pt" ? "Enviar Foto" : language === "es" ? "Subir Foto" : "Upload Photo"}
                      </Button>
                    </label>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {language === "pt" ? "Remover" : language === "es" ? "Eliminar" : "Remove"}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "pt"
                      ? "JPG, PNG ou GIF. Máximo 5MB."
                      : language === "es"
                        ? "JPG, PNG o GIF. Máximo 5MB."
                        : "JPG, PNG or GIF. Max 5MB."}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">
                  {language === "pt"
                    ? "Informações Pessoais"
                    : language === "es"
                      ? "Información Personal"
                      : "Personal Information"}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {language === "pt" ? "Nome Completo" : language === "es" ? "Nombre Completo" : "Full Name"}
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={
                      language === "pt"
                        ? "Seu nome completo"
                        : language === "es"
                          ? "Tu nombre completo"
                          : "Your full name"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === "pt" ? "E-mail" : language === "es" ? "Correo" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    value={profileData?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "pt"
                      ? "O e-mail não pode ser alterado"
                      : language === "es"
                        ? "El correo no puede ser modificado"
                        : "Email cannot be changed"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biography">
                    {language === "pt" ? "Biografia" : language === "es" ? "Biografía" : "Biography"}
                  </Label>
                  <Textarea
                    id="biography"
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder={
                      language === "pt"
                        ? "Conte um pouco sobre você..."
                        : language === "es"
                          ? "Cuéntanos un poco sobre ti..."
                          : "Tell us a little about yourself..."
                    }
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "pt"
                      ? `${biography.length}/500 caracteres`
                      : language === "es"
                        ? `${biography.length}/500 caracteres`
                        : `${biography.length}/500 characters`}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">
                    {language === "pt" ? "Idioma" : language === "es" ? "Idioma" : "Language"}
                  </Label>
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as "pt" | "en" | "es")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">
                  {language === "pt" ? "Alterar Senha" : language === "es" ? "Cambiar Contraseña" : "Change Password"}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    {language === "pt"
                      ? "Senha Atual"
                      : language === "es"
                        ? "Contraseña Actual"
                        : "Current Password"}
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={
                      language === "pt"
                        ? "Digite sua senha atual"
                        : language === "es"
                          ? "Ingresa tu contraseña actual"
                          : "Enter your current password"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {language === "pt"
                      ? "Nova Senha"
                      : language === "es"
                        ? "Nueva Contraseña"
                        : "New Password"}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={
                      language === "pt"
                        ? "Digite sua nova senha"
                        : language === "es"
                          ? "Ingresa tu nueva contraseña"
                          : "Enter your new password"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {language === "pt"
                      ? "Confirmar Nova Senha"
                      : language === "es"
                        ? "Confirmar Nueva Contraseña"
                        : "Confirm New Password"}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={
                      language === "pt"
                        ? "Confirme sua nova senha"
                        : language === "es"
                          ? "Confirma tu nueva contraseña"
                          : "Confirm your new password"
                    }
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                  variant="outline"
                  className="w-full"
                >
                  {isSaving
                    ? language === "pt"
                      ? "Alterando..."
                      : language === "es"
                        ? "Cambiando..."
                        : "Changing..."
                    : language === "pt"
                      ? "Alterar Senha"
                      : language === "es"
                        ? "Cambiar Contraseña"
                        : "Change Password"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              {language === "pt" ? "Cancelar" : language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving || isUploadingAvatar}>
              {isSaving
                ? language === "pt"
                  ? "Salvando..."
                  : language === "es"
                    ? "Guardando..."
                    : "Saving..."
                : language === "pt"
                  ? "Salvar"
                  : language === "es"
                    ? "Guardar"
                    : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
