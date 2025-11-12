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
  ArrowLeft
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

      if (error) throw error

      // Carregar progresso de cada usuário
      const usersWithProgress = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: progressData } = await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", profile.id)
            .single()

          return {
            ...profile,
            progress: progressData || null,
          }
        })
      )

      setUsers(usersWithProgress as User[])
      setFilteredUsers(usersWithProgress as User[])
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Erro ao carregar usuários")
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
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
              <p className="text-muted-foreground mt-1">
                Controle de acessos e permissões de usuários
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} usuário(s)
            </span>
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
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {user.full_name || "Sem nome"}
                        </h3>
                        {user.is_pro && (
                          <Badge variant="default" className="bg-purple-500">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Cadastrado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {user.progress && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Dia Atual</p>
                        <p className="font-semibold">{user.progress.current_day}/90</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Streak</p>
                        <p className="font-semibold">{user.progress.current_streak} dias</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">XP Total</p>
                        <p className="font-semibold">{user.progress.total_xp.toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="font-semibold">{user.progress.recovery_score}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAdmin(user.id, user.is_pro)}
                    className={user.is_pro ? "text-purple-600" : ""}
                  >
                    {user.is_pro ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="p-12 text-center">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </p>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
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
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveUser}>Salvar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

