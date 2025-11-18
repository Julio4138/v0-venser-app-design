"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  MessageSquare, 
  Users, 
  Trash2, 
  Ban, 
  Clock, 
  AlertTriangle,
  Search,
  X,
  Eye,
  Shield,
  TrendingUp,
  Calendar,
  UserX,
  CheckCircle,
  Loader2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  likes_count: number
  comments_count: number
  is_anonymous: boolean
  is_deleted: boolean
  created_at: string
  user_name?: string
  user_initial?: string
}

interface UserRestriction {
  id: string
  user_id: string
  restriction_type: 'ban' | 'temporary_restriction' | 'warning'
  reason?: string
  starts_at: string
  ends_at?: string
  is_active: boolean
  user_name?: string
}

export default function AdminCommunityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestrictDialogOpen, setIsRestrictDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [restrictionType, setRestrictionType] = useState<'ban' | 'temporary_restriction' | 'warning'>('warning')
  const [restrictionReason, setRestrictionReason] = useState("")
  const [restrictionDays, setRestrictionDays] = useState(7)
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    activeUsers: 0,
    bannedUsers: 0,
    restrictedUsers: 0
  })

  useEffect(() => {
    checkAdminAccess()
    loadData()
  }, [])

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

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadPosts(),
        loadRestrictions(),
        loadStats()
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Total de posts
      const { count: postsCount } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false)

      // Total de comentários
      const { count: commentsCount } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false)

      // Total de likes
      const { count: likesCount } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })

      // Usuários únicos que postaram
      const { data: uniqueUsers } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("is_deleted", false)

      const activeUsers = new Set(uniqueUsers?.map(u => u.user_id) || []).size

      // Usuários banidos
      const { count: bannedCount } = await supabase
        .from("community_restrictions")
        .select("*", { count: "exact", head: true })
        .eq("restriction_type", "ban")
        .eq("is_active", true)

      // Usuários restritos temporariamente
      const { count: restrictedCount } = await supabase
        .from("community_restrictions")
        .select("*", { count: "exact", head: true })
        .eq("restriction_type", "temporary_restriction")
        .eq("is_active", true)

      setStats({
        totalPosts: postsCount || 0,
        totalComments: commentsCount || 0,
        totalLikes: likesCount || 0,
        activeUsers,
        bannedUsers: bannedCount || 0,
        restrictedUsers: restrictedCount || 0
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      if (!postsData) {
        setPosts([])
        return
      }

      // Buscar perfis dos usuários
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)

      const profilesMap = new Map(
        profiles?.map(p => [p.id, p]) || []
      )

      const formattedPosts: Post[] = postsData.map(post => {
        const profile = profilesMap.get(post.user_id)
        const getInitials = (name: string | null): string => {
          if (!name) return "U."
          const parts = name.trim().split(" ")
          if (parts.length === 1) return parts[0][0].toUpperCase() + "."
          return parts.slice(0, 2).map(p => p[0].toUpperCase()).join(".")
        }

        return {
          ...post,
          user_name: post.is_anonymous ? "Anônimo" : (profile?.full_name || "Usuário"),
          user_initial: post.is_anonymous ? "A." : getInitials(profile?.full_name)
        }
      })

      setPosts(formattedPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error("Erro ao carregar posts")
    }
  }

  const loadRestrictions = async () => {
    try {
      const { data: restrictionsData, error } = await supabase
        .from("community_restrictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      if (!restrictionsData) {
        setRestrictions([])
        return
      }

      // Buscar perfis dos usuários
      const userIds = [...new Set(restrictionsData.map(r => r.user_id))]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)

      const profilesMap = new Map(
        profiles?.map(p => [p.id, p]) || []
      )

      const formattedRestrictions: UserRestriction[] = restrictionsData.map(restriction => {
        const profile = profilesMap.get(restriction.user_id)
        return {
          ...restriction,
          user_name: profile?.full_name || "Usuário"
        }
      })

      setRestrictions(formattedRestrictions)
    } catch (error) {
      console.error("Error loading restrictions:", error)
      toast.error("Erro ao carregar restrições")
    }
  }

  const handleDeletePost = async () => {
    if (!selectedPost) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("community_posts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq("id", selectedPost.id)

      if (error) throw error

      toast.success("Post excluído com sucesso")
      setIsDeleteDialogOpen(false)
      setSelectedPost(null)
      loadData()
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Erro ao excluir post")
    }
  }

  const handleRestrictUser = async () => {
    if (!selectedUserId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let endsAt: string | null = null
      if (restrictionType === 'temporary_restriction') {
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + restrictionDays)
        endsAt = endDate.toISOString()
      }

      // Desativar restrições anteriores
      await supabase
        .from("community_restrictions")
        .update({ is_active: false })
        .eq("user_id", selectedUserId)
        .eq("is_active", true)

      // Criar nova restrição
      const { error } = await supabase
        .from("community_restrictions")
        .insert({
          user_id: selectedUserId,
          restriction_type: restrictionType,
          reason: restrictionReason || null,
          restricted_by: user.id,
          ends_at: endsAt,
          is_active: true
        })

      if (error) throw error

      const restrictionTypeText = 
        restrictionType === 'ban' ? 'banido permanentemente' :
        restrictionType === 'temporary_restriction' ? `restrito por ${restrictionDays} dias` :
        'advertido'

      toast.success(`Usuário ${restrictionTypeText} com sucesso`)
      setIsRestrictDialogOpen(false)
      setSelectedUserId(null)
      setRestrictionReason("")
      setRestrictionDays(7)
      loadData()
    } catch (error) {
      console.error("Error restricting user:", error)
      toast.error("Erro ao aplicar restrição")
    }
  }

  const handleRemoveRestriction = async (restrictionId: string) => {
    try {
      const { error } = await supabase
        .from("community_restrictions")
        .update({ is_active: false })
        .eq("id", restrictionId)

      if (error) throw error

      toast.success("Restrição removida com sucesso")
      loadData()
    } catch (error) {
      console.error("Error removing restriction:", error)
      toast.error("Erro ao remover restrição")
    }
  }

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center relative">
          <Link href="/admin" className="absolute left-0">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold">Gerenciamento da Comunidade</h1>
            <p className="text-muted-foreground mt-1">
              Modere posts, usuários e gerencie a comunidade
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Posts</p>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comentários</p>
                <p className="text-2xl font-bold">{stats.totalComments}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Likes</p>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Banidos</p>
                <p className="text-2xl font-bold">{stats.bannedUsers}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restritos</p>
                <p className="text-2xl font-bold">{stats.restrictedUsers}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Posts Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Posts da Comunidade</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum post encontrado</p>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {post.user_initial}
                        </div>
                        <div>
                          <p className="font-semibold">{post.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        {post.is_anonymous && (
                          <Badge variant="outline">Anônimo</Badge>
                        )}
                      </div>
                      <p className="text-sm mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post)
                          setSelectedUserId(post.user_id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(post.user_id)
                          setIsRestrictDialogOpen(true)
                        }}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Restrictions Management */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Restrições e Banimentos</h2>
          <div className="space-y-4">
            {restrictions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma restrição ativa</p>
            ) : (
              restrictions.map((restriction) => (
                <Card key={restriction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserX className="h-5 w-5 text-red-500" />
                        <p className="font-semibold">{restriction.user_name}</p>
                        <Badge
                          variant={
                            restriction.restriction_type === 'ban' ? 'destructive' :
                            restriction.restriction_type === 'temporary_restriction' ? 'default' :
                            'secondary'
                          }
                        >
                          {restriction.restriction_type === 'ban' ? 'Banido' :
                           restriction.restriction_type === 'temporary_restriction' ? 'Restrito' :
                           'Advertido'}
                        </Badge>
                        {restriction.is_active ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      {restriction.reason && (
                        <p className="text-sm text-muted-foreground mb-2">Motivo: {restriction.reason}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Início: {formatDistanceToNow(new Date(restriction.starts_at), { addSuffix: true, locale: ptBR })}</span>
                        {restriction.ends_at && (
                          <span>Fim: {formatDistanceToNow(new Date(restriction.ends_at), { addSuffix: true, locale: ptBR })}</span>
                        )}
                      </div>
                    </div>
                    {restriction.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRestriction(restriction.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Delete Post Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Post</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {selectedPost && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedPost.content.substring(0, 200)}...</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeletePost}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restrict User Dialog */}
        <Dialog open={isRestrictDialogOpen} onOpenChange={setIsRestrictDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restringir Usuário</DialogTitle>
              <DialogDescription>
                Aplique uma restrição ou banimento ao usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Restrição</label>
                <Select value={restrictionType} onValueChange={(value: any) => setRestrictionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Advertência</SelectItem>
                    <SelectItem value="temporary_restriction">Restrição Temporária</SelectItem>
                    <SelectItem value="ban">Banimento Permanente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {restrictionType === 'temporary_restriction' && (
                <div>
                  <label className="text-sm font-medium">Duração (dias)</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={restrictionDays}
                    onChange={(e) => setRestrictionDays(parseInt(e.target.value) || 7)}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Motivo</label>
                <Textarea
                  placeholder="Descreva o motivo da restrição..."
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRestrictDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRestrictUser}>
                Aplicar Restrição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

