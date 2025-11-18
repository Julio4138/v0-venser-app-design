"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldOff,
  Mail,
  Calendar,
  Award,
  Loader2,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
  Key
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  is_pro: boolean
  start_date: string | null
  language_preference: string
  progress?: {
    current_streak: number
    longest_streak: number
    total_days_clean: number
    current_day: number
    total_xp: number
    recovery_score: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null)
  
  // Form states for creating user
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserFullName, setNewUserFullName] = useState("")
  const [newUserLanguage, setNewUserLanguage] = useState<"pt" | "en" | "es">("pt")
  const [newUserIsPro, setNewUserIsPro] = useState(false)
  const [newUserStartDate, setNewUserStartDate] = useState("")

  useEffect(() => {
    checkAdminAccess()
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Acesso negado. Faça login como administrador.")
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single()

      if (!profile?.is_pro) {
        toast.error("Acesso negado. Você precisa ser um administrador.")
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      toast.error("Erro ao verificar acesso")
      router.push("/dashboard")
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)

      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading profiles:", error)
        toast.error(`Erro ao carregar usuários: ${error.message}`)
        return
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([])
        setFilteredUsers([])
        return
      }

      // Carregar progresso de cada usuário
      const usersWithProgress = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: progressData, error: progressError } = await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", profile.id)
            .single()

          if (progressError && progressError.code !== 'PGRST116') {
            // PGRST116 = no rows returned, que é ok se o usuário não tem progresso ainda
            console.warn(`Error loading progress for user ${profile.id}:`, progressError)
          }

          return {
            ...profile,
            progress: progressData || null,
          }
        })
      )

      setUsers(usersWithProgress as User[])
      setFilteredUsers(usersWithProgress as User[])
    } catch (error: any) {
      console.error("Error loading users:", error)
      toast.error(`Erro ao carregar usuários: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_pro: !currentStatus })
        .eq("id", userId)

      if (error) throw error

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: currentStatus ? 'admin_removed' : 'admin_granted',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_details: { is_pro: !currentStatus }
      })

      toast.success(
        currentStatus
          ? "Privilégios de administrador removidos"
          : "Privilégios de administrador concedidos"
      )
      await loadUsers()
    } catch (error: any) {
      console.error("Error toggling admin:", error)
      toast.error(error.message || "Erro ao atualizar privilégios")
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: selectedUser.full_name,
          language_preference: selectedUser.language_preference,
          is_pro: selectedUser.is_pro,
        })
        .eq("id", selectedUser.id)

      if (error) throw error

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'user_updated',
        p_entity_type: 'user',
        p_entity_id: selectedUser.id,
        p_details: { 
          full_name: selectedUser.full_name,
          language_preference: selectedUser.language_preference,
          is_pro: selectedUser.is_pro
        }
      })

      toast.success("Usuário atualizado com sucesso!")
      setIsDialogOpen(false)
      setSelectedUser(null)
      await loadUsers()
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast.error(error.message || "Erro ao salvar usuário")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      // Obter informações do usuário antes de deletar para o log
      const userToDelete = users.find(u => u.id === userId)

      // Nota: Para deletar usuários do auth, é necessário usar uma Server Action ou API Route
      // Por enquanto, apenas removemos o perfil (o usuário ainda existirá no auth)
      // Para deletar completamente, você precisará criar uma API route ou Server Action
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (error) throw error

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'user_deleted',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_details: { 
          email: userToDelete?.email || 'Unknown',
          full_name: userToDelete?.full_name || 'Unknown'
        }
      })

      toast.success("Perfil do usuário excluído com sucesso!")
      toast.info("Nota: Para deletar completamente o usuário do sistema de autenticação, use o painel do Supabase ou crie uma API route.")
      await loadUsers()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error(error.message || "Erro ao excluir usuário")
    }
  }

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Email e senha são obrigatórios")
      return
    }

    if (newUserPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      setIsCreating(true)

      // Obter token de autenticação do admin
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.")
        return
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserFullName || null,
          language_preference: newUserLanguage,
          is_pro: newUserIsPro,
          start_date: newUserStartDate || new Date().toISOString().split('T')[0],
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'user_created',
        p_entity_type: 'user',
        p_entity_id: data.user.id,
        p_details: { 
          email: newUserEmail,
          full_name: newUserFullName,
          is_pro: newUserIsPro
        }
      })

      toast.success("Usuário criado com sucesso!")
      setIsCreateDialogOpen(false)
      
      // Reset form
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserFullName("")
      setNewUserLanguage("pt")
      setNewUserIsPro(false)
      setNewUserStartDate("")
      
      await loadUsers()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast.error(error.message || "Erro ao criar usuário")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenResetPassword = (user: User) => {
    setUserToResetPassword(user)
    setNewPassword("")
    setConfirmPassword("")
    setIsResetPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!userToResetPassword) return

    if (!newPassword || !confirmPassword) {
      toast.error("Preencha ambos os campos de senha")
      return
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    try {
      setIsResettingPassword(true)

      // Obter token de autenticação do admin
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.")
        return
      }

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: userToResetPassword.id,
          newPassword: newPassword,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha')
      }

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'password_reset',
        p_entity_type: 'user',
        p_entity_id: userToResetPassword.id,
        p_details: { 
          email: userToResetPassword.email,
          full_name: userToResetPassword.full_name
        }
      })

      toast.success("Senha alterada com sucesso!")
      toast.info("A senha provisória foi definida. O usuário deve alterá-la no próximo login.")
      setIsResetPasswordDialogOpen(false)
      setUserToResetPassword(null)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast.error(error.message || "Erro ao alterar senha")
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">Gerenciar Usuários</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Controle de acessos e permissões de usuários
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                {filteredUsers.length} usuário(s)
              </span>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
              className="shrink-0"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Criar Usuário</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Users List */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base sm:text-lg truncate">
                          {user.full_name || "Sem nome"}
                        </h3>
                        {user.is_pro && (
                          <Badge variant="default" className="bg-purple-500 shrink-0">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Cadastrado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {user.progress && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Dia Atual</p>
                        <p className="font-semibold text-sm sm:text-base">{user.progress.current_day}/90</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Streak</p>
                        <p className="font-semibold text-sm sm:text-base">{user.progress.current_streak} dias</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">XP Total</p>
                        <p className="font-semibold text-sm sm:text-base">{user.progress.total_xp.toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Score</p>
                        <p className="font-semibold text-sm sm:text-base">{user.progress.recovery_score}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 sm:ml-4 shrink-0 flex-wrap sm:flex-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    title="Editar usuário"
                    className="flex-1 sm:flex-initial"
                  >
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenResetPassword(user)}
                    title="Alterar senha provisória"
                    className="flex-1 sm:flex-initial"
                  >
                    <Key className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Senha</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAdmin(user.id, user.is_pro)}
                    className={`flex-1 sm:flex-initial ${user.is_pro ? "text-purple-600" : ""}`}
                    title={user.is_pro ? "Remover privilégios de admin" : "Conceder privilégios de admin"}
                  >
                    {user.is_pro ? (
                      <>
                        <ShieldOff className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Remover Admin</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Tornar Admin</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-destructive hover:text-destructive flex-1 sm:flex-initial"
                    title="Excluir usuário"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Excluir</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="p-8 sm:p-12 text-center">
            <UserX className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </p>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input
                    value={selectedUser.full_name || ""}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, full_name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={selectedUser.email}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Idioma</label>
                  <select
                    value={selectedUser.language_preference}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        language_preference: e.target.value,
                      })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_pro"
                    checked={selectedUser.is_pro}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, is_pro: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="is_pro" className="text-sm font-medium">
                    Administrador
                  </label>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveUser}
                    className="w-full sm:w-auto"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie uma nova conta de usuário com permissões e acessos personalizados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Senha *</label>
                <Input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Nome Completo</label>
                <Input
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="Nome completo do usuário"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Idioma</label>
                <select
                  value={newUserLanguage}
                  onChange={(e) => setNewUserLanguage(e.target.value as "pt" | "en" | "es")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Data de Início</label>
                <Input
                  type="date"
                  value={newUserStartDate}
                  onChange={(e) => setNewUserStartDate(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe em branco para usar a data atual
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new_user_is_pro"
                  checked={newUserIsPro}
                  onChange={(e) => setNewUserIsPro(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="new_user_is_pro" className="text-sm font-medium">
                  Conceder privilégios de administrador
                </label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setNewUserEmail("")
                    setNewUserPassword("")
                    setNewUserFullName("")
                    setNewUserLanguage("pt")
                    setNewUserIsPro(false)
                    setNewUserStartDate("")
                  }}
                  disabled={isCreating}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={isCreating || !newUserEmail || !newUserPassword}
                  className="w-full sm:w-auto"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar Senha Provisória</DialogTitle>
              <DialogDescription>
                Defina uma nova senha provisória para {userToResetPassword?.email || "o usuário"}. 
                O usuário deve alterá-la no próximo login.
              </DialogDescription>
            </DialogHeader>
            {userToResetPassword && (
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Nova Senha *</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Confirmar Senha *</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="mt-1"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsResetPasswordDialogOpen(false)
                      setUserToResetPassword(null)
                      setNewPassword("")
                      setConfirmPassword("")
                    }}
                    disabled={isResettingPassword}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleResetPassword}
                    disabled={isResettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full sm:w-auto"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      "Alterar Senha"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

