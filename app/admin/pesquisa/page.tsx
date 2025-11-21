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
  BookOpen,
  BarChart3,
  Brain,
  FileText,
  Diamond,
  ClipboardList,
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Search
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface ResearchArticle {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  description_pt: string
  description_en: string
  description_es: string
  category_pt: string
  category_en: string
  category_es: string
  icon_name: string
  icon_color: string
  gradient_from: string
  gradient_to: string
  stats_text_pt: string | null
  stats_text_en: string | null
  stats_text_es: string | null
  external_link: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const AVAILABLE_ICONS = [
  { name: "BookOpen", label: "Livro Aberto", icon: BookOpen },
  { name: "BarChart3", label: "Gráfico", icon: BarChart3 },
  { name: "Brain", label: "Cérebro", icon: Brain },
  { name: "FileText", label: "Documento", icon: FileText },
  { name: "Diamond", label: "Diamante", icon: Diamond },
  { name: "ClipboardList", label: "Lista", icon: ClipboardList },
]

const ICON_COLORS = [
  { value: "text-orange-400", label: "Laranja" },
  { value: "text-green-400", label: "Verde" },
  { value: "text-blue-400", label: "Azul" },
  { value: "text-purple-400", label: "Roxo" },
  { value: "text-pink-400", label: "Rosa" },
  { value: "text-yellow-400", label: "Amarelo" },
  { value: "text-cyan-400", label: "Ciano" },
  { value: "text-red-400", label: "Vermelho" },
]

export default function AdminResearchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<ResearchArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<ResearchArticle[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<ResearchArticle | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadArticles()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = articles.filter(
        (article) =>
          article.title_pt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.description_pt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.category_pt.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredArticles(filtered)
    } else {
      setFilteredArticles(articles)
    }
  }, [searchTerm, articles])

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

  const loadArticles = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("research_articles")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error

      setArticles(data || [])
    } catch (error: any) {
      console.error("Error loading articles:", error)
      toast.error(error.message || "Erro ao carregar artigos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedArticle({
      id: "",
      title_pt: "",
      title_en: "",
      title_es: "",
      description_pt: "",
      description_en: "",
      description_es: "",
      category_pt: "",
      category_en: "",
      category_es: "",
      icon_name: "BookOpen",
      icon_color: "text-orange-400",
      gradient_from: "from-orange-500/20",
      gradient_to: "to-orange-600/20",
      stats_text_pt: null,
      stats_text_en: null,
      stats_text_es: null,
      external_link: null,
      display_order: articles.length + 1,
      is_active: true,
      created_at: "",
      updated_at: ""
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (article: ResearchArticle) => {
    setSelectedArticle({ ...article })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm("Tem certeza que deseja deletar este artigo? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("research_articles")
        .delete()
        .eq("id", articleId)

      if (error) throw error

      toast.success("Artigo deletado com sucesso!")
      await loadArticles()
    } catch (error: any) {
      console.error("Error deleting article:", error)
      toast.error(error.message || "Erro ao deletar artigo")
    }
  }

  const handleSave = async () => {
    if (!selectedArticle) return

    // Validação básica
    if (!selectedArticle.title_pt || !selectedArticle.description_pt || !selectedArticle.category_pt) {
      toast.error("Preencha pelo menos os campos em português")
      return
    }

    try {
      setIsSaving(true)

      if (isEditing && selectedArticle.id) {
        // Atualizar artigo existente
        const { error } = await supabase
          .from("research_articles")
          .update({
            title_pt: selectedArticle.title_pt,
            title_en: selectedArticle.title_en,
            title_es: selectedArticle.title_es,
            description_pt: selectedArticle.description_pt,
            description_en: selectedArticle.description_en,
            description_es: selectedArticle.description_es,
            category_pt: selectedArticle.category_pt,
            category_en: selectedArticle.category_en,
            category_es: selectedArticle.category_es,
            icon_name: selectedArticle.icon_name,
            icon_color: selectedArticle.icon_color,
            gradient_from: selectedArticle.gradient_from,
            gradient_to: selectedArticle.gradient_to,
            stats_text_pt: selectedArticle.stats_text_pt || null,
            stats_text_en: selectedArticle.stats_text_en || null,
            stats_text_es: selectedArticle.stats_text_es || null,
            external_link: selectedArticle.external_link || null,
            display_order: selectedArticle.display_order,
            is_active: selectedArticle.is_active
          })
          .eq("id", selectedArticle.id)

        if (error) throw error
        toast.success("Artigo atualizado com sucesso!")
      } else {
        // Criar novo artigo
        const { error } = await supabase
          .from("research_articles")
          .insert({
            title_pt: selectedArticle.title_pt,
            title_en: selectedArticle.title_en,
            title_es: selectedArticle.title_es,
            description_pt: selectedArticle.description_pt,
            description_en: selectedArticle.description_en,
            description_es: selectedArticle.description_es,
            category_pt: selectedArticle.category_pt,
            category_en: selectedArticle.category_en,
            category_es: selectedArticle.category_es,
            icon_name: selectedArticle.icon_name,
            icon_color: selectedArticle.icon_color,
            gradient_from: selectedArticle.gradient_from,
            gradient_to: selectedArticle.gradient_to,
            stats_text_pt: selectedArticle.stats_text_pt || null,
            stats_text_en: selectedArticle.stats_text_en || null,
            stats_text_es: selectedArticle.stats_text_es || null,
            external_link: selectedArticle.external_link || null,
            display_order: selectedArticle.display_order,
            is_active: selectedArticle.is_active
          })

        if (error) throw error
        toast.success("Artigo criado com sucesso!")
      }

      setIsDialogOpen(false)
      setSelectedArticle(null)
      await loadArticles()
    } catch (error: any) {
      console.error("Error saving article:", error)
      toast.error(error.message || "Erro ao salvar artigo")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (article: ResearchArticle) => {
    try {
      const { error } = await supabase
        .from("research_articles")
        .update({ is_active: !article.is_active })
        .eq("id", article.id)

      if (error) throw error

      toast.success(`Artigo ${!article.is_active ? "ativado" : "desativado"} com sucesso!`)
      await loadArticles()
    } catch (error: any) {
      console.error("Error toggling article:", error)
      toast.error(error.message || "Erro ao atualizar artigo")
    }
  }

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName)
    return icon ? icon.icon : BookOpen
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Neurociência": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Neuroscience": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Dependência": "bg-green-500/20 text-green-400 border-green-400/30",
      "Addiction": "bg-green-500/20 text-green-400 border-green-400/30",
      "Recuperação": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Recovery": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Relacionamentos": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Relationships": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Saúde Mental": "bg-pink-500/20 text-pink-400 border-pink-400/30",
      "Mental Health": "bg-pink-500/20 text-pink-400 border-pink-400/30",
      "Ciência": "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
      "Science": "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
    }
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-400/30"
  }

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Artigos de Pesquisa</h1>
              <p className="text-muted-foreground mt-1">
                Adicione, edite ou remova artigos de pesquisa sobre pornografia
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Artigo
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar artigos por título, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Articles List */}
        <div className="grid gap-4">
          {filteredArticles.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Nenhum artigo corresponde à sua busca" : "Comece criando seu primeiro artigo"}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Artigo
                </Button>
              )}
            </Card>
          ) : (
            filteredArticles.map((article) => {
              const IconComponent = getIconComponent(article.icon_name)
              return (
                <Card key={article.id} className={`p-6 ${!article.is_active ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${article.icon_color.replace("text-", "bg-").replace("-400", "-500/20")} border ${article.icon_color.replace("text-", "border-").replace("-400", "-400/30")}`}>
                          <IconComponent className={`h-5 w-5 ${article.icon_color}`} />
                        </div>
                        <Badge variant="outline" className={getCategoryColor(article.category_pt)}>
                          {article.category_pt}
                        </Badge>
                        {!article.is_active && (
                          <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-400/30">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                          Ordem: {article.display_order}
                        </Badge>
                        {article.stats_text_pt && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                            {article.stats_text_pt}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{article.title_pt}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{article.description_pt}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>EN:</strong> {article.title_en}</p>
                          <p><strong>ES:</strong> {article.title_es}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(article)}
                        title={article.is_active ? "Desativar" : "Ativar"}
                      >
                        {article.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Artigo" : "Novo Artigo"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Edite as informações do artigo" : "Preencha as informações para criar um novo artigo"}
              </DialogDescription>
            </DialogHeader>

            {selectedArticle && (
              <div className="space-y-6">
                {/* Português */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-lg">Português (PT)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_pt">Título *</Label>
                      <Input
                        id="title_pt"
                        value={selectedArticle.title_pt}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, title_pt: e.target.value })}
                        placeholder="Efeitos no Cérebro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category_pt">Categoria *</Label>
                      <Input
                        id="category_pt"
                        value={selectedArticle.category_pt}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, category_pt: e.target.value })}
                        placeholder="Neurociência"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_pt">Descrição *</Label>
                    <Textarea
                      id="description_pt"
                      value={selectedArticle.description_pt}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, description_pt: e.target.value })}
                      placeholder="Como a pornografia afeta a estrutura e função cerebral..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stats_text_pt">Estatísticas (opcional)</Label>
                    <Input
                      id="stats_text_pt"
                      value={selectedArticle.stats_text_pt || ""}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, stats_text_pt: e.target.value || null })}
                      placeholder="50+ estudos"
                    />
                  </div>
                </div>

                {/* Inglês */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-lg">Inglês (EN)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_en">Title</Label>
                      <Input
                        id="title_en"
                        value={selectedArticle.title_en}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, title_en: e.target.value })}
                        placeholder="Effects on the Brain"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category_en">Category</Label>
                      <Input
                        id="category_en"
                        value={selectedArticle.category_en}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, category_en: e.target.value })}
                        placeholder="Neuroscience"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description</Label>
                    <Textarea
                      id="description_en"
                      value={selectedArticle.description_en}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, description_en: e.target.value })}
                      placeholder="How pornography affects brain structure..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stats_text_en">Stats (optional)</Label>
                    <Input
                      id="stats_text_en"
                      value={selectedArticle.stats_text_en || ""}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, stats_text_en: e.target.value || null })}
                      placeholder="50+ studies"
                    />
                  </div>
                </div>

                {/* Espanhol */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-lg">Espanhol (ES)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_es">Título</Label>
                      <Input
                        id="title_es"
                        value={selectedArticle.title_es}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, title_es: e.target.value })}
                        placeholder="Efectos en el Cerebro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category_es">Categoría</Label>
                      <Input
                        id="category_es"
                        value={selectedArticle.category_es}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, category_es: e.target.value })}
                        placeholder="Neurociencia"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_es">Descripción</Label>
                    <Textarea
                      id="description_es"
                      value={selectedArticle.description_es}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, description_es: e.target.value })}
                      placeholder="Cómo la pornografía afecta la estructura..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stats_text_es">Estadísticas (opcional)</Label>
                    <Input
                      id="stats_text_es"
                      value={selectedArticle.stats_text_es || ""}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, stats_text_es: e.target.value || null })}
                      placeholder="50+ estudios"
                    />
                  </div>
                </div>

                {/* Configurações Visuais */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-lg">Configurações Visuais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon_name">Ícone</Label>
                      <Select
                        value={selectedArticle.icon_name}
                        onValueChange={(value) => setSelectedArticle({ ...selectedArticle, icon_name: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ICONS.map((icon) => {
                            const IconComponent = icon.icon
                            return (
                              <SelectItem key={icon.name} value={icon.name}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {icon.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon_color">Cor do Ícone</Label>
                      <Select
                        value={selectedArticle.icon_color}
                        onValueChange={(value) => setSelectedArticle({ ...selectedArticle, icon_color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradient_from">Gradiente De</Label>
                      <Input
                        id="gradient_from"
                        value={selectedArticle.gradient_from}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, gradient_from: e.target.value })}
                        placeholder="from-orange-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradient_to">Gradiente Para</Label>
                      <Input
                        id="gradient_to"
                        value={selectedArticle.gradient_to}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, gradient_to: e.target.value })}
                        placeholder="to-orange-600/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Outras Configurações */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Outras Configurações</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Ordem de Exibição</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={selectedArticle.display_order}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="external_link">Link Externo (opcional)</Label>
                      <Input
                        id="external_link"
                        type="url"
                        value={selectedArticle.external_link || ""}
                        onChange={(e) => setSelectedArticle({ ...selectedArticle, external_link: e.target.value || null })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={selectedArticle.is_active}
                        onCheckedChange={(checked) => setSelectedArticle({ ...selectedArticle, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Artigo Ativo</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
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

