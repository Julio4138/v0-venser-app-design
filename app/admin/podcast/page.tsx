"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Music, 
  Video,
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  X,
  EyeOff,
  Eye,
  Clock
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface Podcast {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  description_pt: string | null
  description_en: string | null
  description_es: string | null
  media_type: "audio" | "video"
  media_url: string
  thumbnail_url: string | null
  duration: number | null
  category_pt: string | null
  category_en: string | null
  category_es: string | null
  author_pt: string | null
  author_en: string | null
  author_es: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminPodcastPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadPodcasts()
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

  const loadPodcasts = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error

      setPodcasts(data || [])
    } catch (error: any) {
      console.error("Error loading podcasts:", error)
      toast.error(error.message || "Erro ao carregar podcasts")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedPodcast({
      id: "",
      title_pt: "",
      title_en: "",
      title_es: "",
      description_pt: "",
      description_en: "",
      description_es: "",
      media_type: "audio",
      media_url: "",
      thumbnail_url: "",
      duration: null,
      category_pt: "",
      category_en: "",
      category_es: "",
      author_pt: "",
      author_en: "",
      author_es: "",
      display_order: podcasts.length + 1,
      is_active: true,
      created_at: "",
      updated_at: ""
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (podcast: Podcast) => {
    setSelectedPodcast({ ...podcast })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (podcastId: string) => {
    if (!confirm("Tem certeza que deseja deletar este podcast? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", podcastId)

      if (error) throw error

      toast.success("Podcast deletado com sucesso!")
      await loadPodcasts()
    } catch (error: any) {
      console.error("Error deleting podcast:", error)
      toast.error(error.message || "Erro ao deletar podcast")
    }
  }

  const handleSave = async () => {
    if (!selectedPodcast) return

    // Validação básica
    if (!selectedPodcast.title_pt || !selectedPodcast.title_en || !selectedPodcast.title_es) {
      toast.error("Preencha todos os títulos (PT, EN, ES)")
      return
    }

    if (!selectedPodcast.media_url) {
      toast.error("URL do arquivo de mídia é obrigatória")
      return
    }

    if (selectedPodcast.duration && (selectedPodcast.duration < 0 || selectedPodcast.duration > 86400)) {
      toast.error("Duração deve estar entre 0 e 86400 segundos (24 horas)")
      return
    }

    try {
      setIsSaving(true)

      const podcastData = {
        title_pt: selectedPodcast.title_pt,
        title_en: selectedPodcast.title_en,
        title_es: selectedPodcast.title_es,
        description_pt: selectedPodcast.description_pt || null,
        description_en: selectedPodcast.description_en || null,
        description_es: selectedPodcast.description_es || null,
        media_type: selectedPodcast.media_type,
        media_url: selectedPodcast.media_url,
        thumbnail_url: selectedPodcast.thumbnail_url || null,
        duration: selectedPodcast.duration ? parseInt(selectedPodcast.duration.toString()) : null,
        category_pt: selectedPodcast.category_pt || null,
        category_en: selectedPodcast.category_en || null,
        category_es: selectedPodcast.category_es || null,
        author_pt: selectedPodcast.author_pt || null,
        author_en: selectedPodcast.author_en || null,
        author_es: selectedPodcast.author_es || null,
        display_order: selectedPodcast.display_order,
        is_active: selectedPodcast.is_active
      }

      if (isEditing && selectedPodcast.id) {
        // Atualizar podcast existente
        const { error } = await supabase
          .from("podcasts")
          .update(podcastData)
          .eq("id", selectedPodcast.id)

        if (error) throw error
        toast.success("Podcast atualizado com sucesso!")
      } else {
        // Criar novo podcast
        const { error } = await supabase
          .from("podcasts")
          .insert(podcastData)

        if (error) throw error
        toast.success("Podcast criado com sucesso!")
      }

      setIsDialogOpen(false)
      setSelectedPodcast(null)
      await loadPodcasts()
    } catch (error: any) {
      console.error("Error saving podcast:", error)
      toast.error(error.message || "Erro ao salvar podcast")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (podcast: Podcast) => {
    try {
      const { error } = await supabase
        .from("podcasts")
        .update({ is_active: !podcast.is_active })
        .eq("id", podcast.id)

      if (error) throw error

      toast.success(`Podcast ${!podcast.is_active ? "ativado" : "desativado"} com sucesso!`)
      await loadPodcasts()
    } catch (error: any) {
      console.error("Error toggling podcast:", error)
      toast.error(error.message || "Erro ao atualizar podcast")
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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
              <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Podcasts</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Adicione, edite ou remova áudios e vídeos de podcasts
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Podcast
          </Button>
        </div>

        {/* Podcasts List */}
        <div className="grid gap-4">
          {podcasts.length === 0 ? (
            <Card className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum podcast encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro podcast
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Podcast
              </Button>
            </Card>
          ) : (
            podcasts.map((podcast) => (
              <Card key={podcast.id} className={`p-4 sm:p-6 ${!podcast.is_active ? "opacity-50" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className={
                        podcast.media_type === "audio"
                          ? "bg-blue-500/20 text-blue-400 border-blue-400/30"
                          : "bg-purple-500/20 text-purple-400 border-purple-400/30"
                      }>
                        {podcast.media_type === "audio" ? (
                          <>
                            <Music className="h-3 w-3 mr-1" />
                            Áudio
                          </>
                        ) : (
                          <>
                            <Video className="h-3 w-3 mr-1" />
                            Vídeo
                          </>
                        )}
                      </Badge>
                      {!podcast.is_active && (
                        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-400/30">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                        Ordem: {podcast.display_order}
                      </Badge>
                      {podcast.duration && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(podcast.duration)}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1">{podcast.title_pt}</h3>
                      {podcast.description_pt && (
                        <p className="text-sm text-muted-foreground mb-2">{podcast.description_pt}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>EN:</strong> {podcast.title_en}</p>
                        <p><strong>ES:</strong> {podcast.title_es}</p>
                        {podcast.author_pt && (
                          <p><strong>Autor:</strong> {podcast.author_pt}</p>
                        )}
                        {podcast.category_pt && (
                          <p><strong>Categoria:</strong> {podcast.category_pt}</p>
                        )}
                        <p><strong>URL:</strong> <a href={podcast.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{podcast.media_url.substring(0, 50)}...</a></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(podcast)}
                      title={podcast.is_active ? "Desativar" : "Ativar"}
                    >
                      {podcast.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(podcast)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(podcast.id)}
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

        {/* Dialog para Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Podcast" : "Novo Podcast"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Edite os dados do podcast abaixo" : "Preencha os dados do novo podcast"}
              </DialogDescription>
            </DialogHeader>

            {selectedPodcast && (
              <div className="space-y-6 py-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="media_type">Tipo de Mídia</Label>
                    <Select
                      value={selectedPodcast.media_type}
                      onValueChange={(value: "audio" | "video") => setSelectedPodcast({
                        ...selectedPodcast,
                        media_type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audio">Áudio</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Ordem de Exibição</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={selectedPodcast.display_order}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        display_order: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={selectedPodcast.duration || ""}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        duration: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Ex: 3600 (1 hora)"
                    />
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="is_active"
                        checked={selectedPodcast.is_active}
                        onCheckedChange={(checked) => setSelectedPodcast({
                          ...selectedPodcast,
                          is_active: checked
                        })}
                      />
                      <Label htmlFor="is_active">Ativo</Label>
                    </div>
                  </div>
                </div>

                {/* URLs */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">URLs</h3>
                  <div className="space-y-2">
                    <Label htmlFor="media_url">URL do Arquivo de Mídia *</Label>
                    <Input
                      id="media_url"
                      value={selectedPodcast.media_url}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        media_url: e.target.value
                      })}
                      placeholder="https://exemplo.com/audio.mp3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_url">URL da Thumbnail (opcional)</Label>
                    <Input
                      id="thumbnail_url"
                      value={selectedPodcast.thumbnail_url || ""}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        thumbnail_url: e.target.value || null
                      })}
                      placeholder="https://exemplo.com/thumbnail.jpg"
                    />
                  </div>
                </div>

                {/* Português */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Português (PT)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="title_pt">Título *</Label>
                    <Input
                      id="title_pt"
                      value={selectedPodcast.title_pt}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        title_pt: e.target.value
                      })}
                      placeholder="Título do podcast"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_pt">Descrição</Label>
                    <Textarea
                      id="description_pt"
                      value={selectedPodcast.description_pt || ""}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        description_pt: e.target.value || null
                      })}
                      placeholder="Descrição do podcast"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_pt">Categoria</Label>
                      <Input
                        id="category_pt"
                        value={selectedPodcast.category_pt || ""}
                        onChange={(e) => setSelectedPodcast({
                          ...selectedPodcast,
                          category_pt: e.target.value || null
                        })}
                        placeholder="Ex: Educação, Entretenimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author_pt">Autor</Label>
                      <Input
                        id="author_pt"
                        value={selectedPodcast.author_pt || ""}
                        onChange={(e) => setSelectedPodcast({
                          ...selectedPodcast,
                          author_pt: e.target.value || null
                        })}
                        placeholder="Nome do autor"
                      />
                    </div>
                  </div>
                </div>

                {/* Inglês */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">English (EN)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title *</Label>
                    <Input
                      id="title_en"
                      value={selectedPodcast.title_en}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        title_en: e.target.value
                      })}
                      placeholder="Podcast title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description</Label>
                    <Textarea
                      id="description_en"
                      value={selectedPodcast.description_en || ""}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        description_en: e.target.value || null
                      })}
                      placeholder="Podcast description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_en">Category</Label>
                      <Input
                        id="category_en"
                        value={selectedPodcast.category_en || ""}
                        onChange={(e) => setSelectedPodcast({
                          ...selectedPodcast,
                          category_en: e.target.value || null
                        })}
                        placeholder="Ex: Education, Entertainment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author_en">Author</Label>
                      <Input
                        id="author_en"
                        value={selectedPodcast.author_en || ""}
                        onChange={(e) => setSelectedPodcast({
                          ...selectedPodcast,
                          author_en: e.target.value || null
                        })}
                        placeholder="Author name"
                      />
                    </div>
                  </div>
                </div>

                {/* Espanhol */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Español (ES)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="title_es">Título *</Label>
                    <Input
                      id="title_es"
                      value={selectedPodcast.title_es}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        title_es: e.target.value
                      })}
                      placeholder="Título del podcast"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_es">Descripción</Label>
                    <Textarea
                      id="description_es"
                      value={selectedPodcast.description_es || ""}
                      onChange={(e) => setSelectedPodcast({
                        ...selectedPodcast,
                        description_es: e.target.value || null
                      })}
                      placeholder="Descripción del podcast"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_es">Categoría</Label>
                      <Input
                        id="category_es"
                        value={selectedPodcast.category_es || ""}
                        onChange={(e) => setSelectedPodcast({
                          ...selectedPodcast,
                          category_es: e.target.value || null
                        })}
                        placeholder="Ex: Educación, Entretenimiento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author_es">Autor</Label>
                      <Input
                        id="author_es"
                        value={selectedPodcast.author_es || ""}
                        onChange={(e) => setSelectedPodcast({
                          ...selectedPodcast,
                          author_es: e.target.value || null
                        })}
                        placeholder="Nombre del autor"
                      />
                    </div>
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
      </div>
    </div>
  )
}

