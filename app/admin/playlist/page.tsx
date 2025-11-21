"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  X,
  EyeOff,
  Eye,
  Music,
  Video
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Playlist {
  id: string
  name_pt: string
  name_en: string
  name_es: string
  description_pt: string | null
  description_en: string | null
  description_es: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Podcast {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  media_type: "audio" | "video"
}

interface PlaylistItem {
  id: string
  playlist_id: string
  podcast_id: string
  display_order: number
  podcast: Podcast
}

export default function AdminPlaylistPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [availablePodcasts, setAvailablePodcasts] = useState<Podcast[]>([])
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false)
  const [selectedPlaylistForItems, setSelectedPlaylistForItems] = useState<Playlist | null>(null)

  useEffect(() => {
    checkAdminAccess()
    loadPlaylists()
    loadAvailablePodcasts()
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

  const loadPlaylists = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error

      setPlaylists(data || [])
    } catch (error: any) {
      console.error("Error loading playlists:", error)
      toast.error(error.message || "Erro ao carregar playlists")
    } finally {
      setLoading(false)
    }
  }

  const loadAvailablePodcasts = async () => {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, title_pt, title_en, title_es, media_type")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error

      setAvailablePodcasts(data || [])
    } catch (error: any) {
      console.error("Error loading podcasts:", error)
    }
  }

  const loadPlaylistItems = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from("playlist_items")
        .select(`
          id,
          playlist_id,
          podcast_id,
          display_order,
          podcast:podcasts(id, title_pt, title_en, title_es, media_type)
        `)
        .eq("playlist_id", playlistId)
        .order("display_order", { ascending: true })

      if (error) throw error

      setPlaylistItems(data || [])
    } catch (error: any) {
      console.error("Error loading playlist items:", error)
      toast.error(error.message || "Erro ao carregar itens da playlist")
    }
  }

  const handleCreateNew = () => {
    setSelectedPlaylist({
      id: "",
      name_pt: "",
      name_en: "",
      name_es: "",
      description_pt: "",
      description_en: "",
      description_es: "",
      display_order: playlists.length + 1,
      is_active: true,
      created_at: "",
      updated_at: ""
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (playlist: Playlist) => {
    setSelectedPlaylist({ ...playlist })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (playlistId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta playlist? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId)

      if (error) throw error

      toast.success("Playlist deletada com sucesso!")
      await loadPlaylists()
    } catch (error: any) {
      console.error("Error deleting playlist:", error)
      toast.error(error.message || "Erro ao deletar playlist")
    }
  }

  const handleSave = async () => {
    if (!selectedPlaylist) return

    // Validação básica
    if (!selectedPlaylist.name_pt || !selectedPlaylist.name_en || !selectedPlaylist.name_es) {
      toast.error("Preencha todos os nomes (PT, EN, ES)")
      return
    }

    try {
      setIsSaving(true)

      const playlistData = {
        name_pt: selectedPlaylist.name_pt,
        name_en: selectedPlaylist.name_en,
        name_es: selectedPlaylist.name_es,
        description_pt: selectedPlaylist.description_pt || null,
        description_en: selectedPlaylist.description_en || null,
        description_es: selectedPlaylist.description_es || null,
        display_order: selectedPlaylist.display_order,
        is_active: selectedPlaylist.is_active
      }

      if (isEditing && selectedPlaylist.id) {
        // Atualizar playlist existente
        const { error } = await supabase
          .from("playlists")
          .update(playlistData)
          .eq("id", selectedPlaylist.id)

        if (error) throw error
        toast.success("Playlist atualizada com sucesso!", {
          description: selectedPlaylist.is_active 
            ? "A playlist está visível na página de playlists" 
            : "A playlist está inativa e não aparecerá na página de playlists"
        })
      } else {
        // Criar nova playlist
        const { error } = await supabase
          .from("playlists")
          .insert(playlistData)

        if (error) throw error
        
        const message = selectedPlaylist.is_active
          ? "Playlist criada com sucesso! Ela já está disponível na página de playlists."
          : "Playlist criada com sucesso! Ative-a para aparecer na página de playlists."
        
        toast.success(message, {
          action: selectedPlaylist.is_active ? {
            label: "Ver Playlists",
            onClick: () => router.push("/playlist")
          } : undefined
        })
      }

      setIsDialogOpen(false)
      setSelectedPlaylist(null)
      await loadPlaylists()
    } catch (error: any) {
      console.error("Error saving playlist:", error)
      toast.error(error.message || "Erro ao salvar playlist")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (playlist: Playlist) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .update({ is_active: !playlist.is_active })
        .eq("id", playlist.id)

      if (error) throw error

      toast.success(`Playlist ${!playlist.is_active ? "ativada" : "desativada"} com sucesso!`)
      await loadPlaylists()
    } catch (error: any) {
      console.error("Error toggling playlist:", error)
      toast.error(error.message || "Erro ao atualizar playlist")
    }
  }

  const handleManageItems = (playlist: Playlist) => {
    setSelectedPlaylistForItems(playlist)
    loadPlaylistItems(playlist.id)
    setIsItemsDialogOpen(true)
  }

  const handleAddPodcastToPlaylist = async (podcastId: string) => {
    if (!selectedPlaylistForItems) return

    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from("playlist_items")
        .select("id")
        .eq("playlist_id", selectedPlaylistForItems.id)
        .eq("podcast_id", podcastId)
        .single()

      if (existing) {
        toast.error("Este podcast já está na playlist")
        return
      }

      // Adicionar
      const maxOrder = playlistItems.length > 0 
        ? Math.max(...playlistItems.map(item => item.display_order))
        : 0

      const { error } = await supabase
        .from("playlist_items")
        .insert({
          playlist_id: selectedPlaylistForItems.id,
          podcast_id: podcastId,
          display_order: maxOrder + 1
        })

      if (error) throw error

      toast.success("Podcast adicionado à playlist!")
      await loadPlaylistItems(selectedPlaylistForItems.id)
    } catch (error: any) {
      console.error("Error adding podcast to playlist:", error)
      toast.error(error.message || "Erro ao adicionar podcast")
    }
  }

  const handleRemovePodcastFromPlaylist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("playlist_items")
        .delete()
        .eq("id", itemId)

      if (error) throw error

      toast.success("Podcast removido da playlist!")
      if (selectedPlaylistForItems) {
        await loadPlaylistItems(selectedPlaylistForItems.id)
      }
    } catch (error: any) {
      console.error("Error removing podcast from playlist:", error)
      toast.error(error.message || "Erro ao remover podcast")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Playlists</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Crie e gerencie playlists de podcasts
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Playlist
          </Button>
        </div>

        {/* Playlists List */}
        <div className="grid gap-4">
          {playlists.length === 0 ? (
            <Card className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma playlist encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira playlist
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Playlist
              </Button>
            </Card>
          ) : (
            playlists.map((playlist) => (
              <Card key={playlist.id} className={`p-4 sm:p-6 ${!playlist.is_active ? "opacity-50" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {!playlist.is_active && (
                        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-400/30">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                        Ordem: {playlist.display_order}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1">{playlist.name_pt}</h3>
                      {playlist.description_pt && (
                        <p className="text-sm text-muted-foreground mb-2">{playlist.description_pt}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>EN:</strong> {playlist.name_en}</p>
                        <p><strong>ES:</strong> {playlist.name_es}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageItems(playlist)}
                    >
                      Gerenciar Podcasts
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(playlist)}
                      title={playlist.is_active ? "Desativar" : "Ativar"}
                    >
                      {playlist.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(playlist)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(playlist.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para Criar/Editar Playlist */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Playlist" : "Nova Playlist"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Edite os dados da playlist abaixo" : "Preencha os dados da nova playlist"}
              </DialogDescription>
            </DialogHeader>

            {selectedPlaylist && (
              <div className="space-y-6 py-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Ordem de Exibição</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={selectedPlaylist.display_order}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        display_order: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="is_active"
                        checked={selectedPlaylist.is_active}
                        onCheckedChange={(checked) => setSelectedPlaylist({
                          ...selectedPlaylist,
                          is_active: checked
                        })}
                      />
                      <Label htmlFor="is_active">Ativo</Label>
                    </div>
                  </div>
                </div>

                {/* Português */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Português (PT)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name_pt">Nome *</Label>
                    <Input
                      id="name_pt"
                      value={selectedPlaylist.name_pt}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        name_pt: e.target.value
                      })}
                      placeholder="Nome da playlist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_pt">Descrição</Label>
                    <Textarea
                      id="description_pt"
                      value={selectedPlaylist.description_pt || ""}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        description_pt: e.target.value || null
                      })}
                      placeholder="Descrição da playlist"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Inglês */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">English (EN)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name_en">Name *</Label>
                    <Input
                      id="name_en"
                      value={selectedPlaylist.name_en}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        name_en: e.target.value
                      })}
                      placeholder="Playlist name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description</Label>
                    <Textarea
                      id="description_en"
                      value={selectedPlaylist.description_en || ""}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        description_en: e.target.value || null
                      })}
                      placeholder="Playlist description"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Espanhol */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Español (ES)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name_es">Nombre *</Label>
                    <Input
                      id="name_es"
                      value={selectedPlaylist.name_es}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        name_es: e.target.value
                      })}
                      placeholder="Nombre de la playlist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_es">Descripción</Label>
                    <Textarea
                      id="description_es"
                      value={selectedPlaylist.description_es || ""}
                      onChange={(e) => setSelectedPlaylist({
                        ...selectedPlaylist,
                        description_es: e.target.value || null
                      })}
                      placeholder="Descripción de la playlist"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para Gerenciar Itens da Playlist */}
        <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Gerenciar Podcasts da Playlist
              </DialogTitle>
              <DialogDescription>
                {selectedPlaylistForItems && `Adicione ou remova podcasts da playlist "${selectedPlaylistForItems.name_pt}"`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Adicionar Podcast */}
              <div className="space-y-2">
                <Label>Adicionar Podcast</Label>
                <Select onValueChange={handleAddPodcastToPlaylist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um podcast para adicionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePodcasts
                      .filter(podcast => !playlistItems.some(item => item.podcast_id === podcast.id))
                      .map((podcast) => (
                        <SelectItem key={podcast.id} value={podcast.id}>
                          <div className="flex items-center gap-2">
                            {podcast.media_type === "audio" ? (
                              <Music className="h-4 w-4" />
                            ) : (
                              <Video className="h-4 w-4" />
                            )}
                            {podcast.title_pt}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Podcasts na Playlist */}
              <div className="space-y-2">
                <Label>Podcasts na Playlist ({playlistItems.length})</Label>
                {playlistItems.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum podcast nesta playlist</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {playlistItems.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.podcast.media_type === "audio" ? (
                              <Music className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Video className="h-5 w-5 text-purple-500" />
                            )}
                            <div>
                              <p className="font-semibold">{item.podcast.title_pt}</p>
                              <p className="text-sm text-muted-foreground">
                                Ordem: {item.display_order}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePodcastFromPlaylist(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

