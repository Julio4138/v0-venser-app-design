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
  Diamond, 
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  X,
  EyeOff,
  Eye,
  Palette
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface DopamineActivity {
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
  dopamine_level: number
  icon_name: string | null
  color_hex: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminDopaminePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<DopamineActivity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<DopamineActivity | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadActivities()
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

  const loadActivities = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("dopamine_activities")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error

      setActivities(data || [])
    } catch (error: any) {
      console.error("Error loading activities:", error)
      toast.error(error.message || "Erro ao carregar atividades")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedActivity({
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
      dopamine_level: 5,
      icon_name: null,
      color_hex: "#f59e0b",
      display_order: activities.length + 1,
      is_active: true,
      created_at: "",
      updated_at: ""
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (activity: DopamineActivity) => {
    setSelectedActivity({ ...activity })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (activityId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta atividade? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("dopamine_activities")
        .delete()
        .eq("id", activityId)

      if (error) throw error

      toast.success("Atividade deletada com sucesso!")
      await loadActivities()
    } catch (error: any) {
      console.error("Error deleting activity:", error)
      toast.error(error.message || "Erro ao deletar atividade")
    }
  }

  const handleSave = async () => {
    if (!selectedActivity) return

    // Validação básica
    if (!selectedActivity.title_pt || !selectedActivity.title_en || !selectedActivity.title_es) {
      toast.error("Preencha todos os títulos (PT, EN, ES)")
      return
    }

    if (!selectedActivity.description_pt || !selectedActivity.description_en || !selectedActivity.description_es) {
      toast.error("Preencha todas as descrições (PT, EN, ES)")
      return
    }

    if (!selectedActivity.category_pt || !selectedActivity.category_en || !selectedActivity.category_es) {
      toast.error("Preencha todas as categorias (PT, EN, ES)")
      return
    }

    if (selectedActivity.dopamine_level < 1 || selectedActivity.dopamine_level > 10) {
      toast.error("O nível de dopamina deve estar entre 1 e 10")
      return
    }

    try {
      setIsSaving(true)

      if (isEditing && selectedActivity.id) {
        // Atualizar atividade existente
        const { error } = await supabase
          .from("dopamine_activities")
          .update({
            title_pt: selectedActivity.title_pt,
            title_en: selectedActivity.title_en,
            title_es: selectedActivity.title_es,
            description_pt: selectedActivity.description_pt,
            description_en: selectedActivity.description_en,
            description_es: selectedActivity.description_es,
            category_pt: selectedActivity.category_pt,
            category_en: selectedActivity.category_en,
            category_es: selectedActivity.category_es,
            dopamine_level: selectedActivity.dopamine_level,
            icon_name: selectedActivity.icon_name || null,
            color_hex: selectedActivity.color_hex,
            display_order: selectedActivity.display_order,
            is_active: selectedActivity.is_active
          })
          .eq("id", selectedActivity.id)

        if (error) throw error
        toast.success("Atividade atualizada com sucesso!")
      } else {
        // Criar nova atividade
        const { error } = await supabase
          .from("dopamine_activities")
          .insert({
            title_pt: selectedActivity.title_pt,
            title_en: selectedActivity.title_en,
            title_es: selectedActivity.title_es,
            description_pt: selectedActivity.description_pt,
            description_en: selectedActivity.description_en,
            description_es: selectedActivity.description_es,
            category_pt: selectedActivity.category_pt,
            category_en: selectedActivity.category_en,
            category_es: selectedActivity.category_es,
            dopamine_level: selectedActivity.dopamine_level,
            icon_name: selectedActivity.icon_name || null,
            color_hex: selectedActivity.color_hex,
            display_order: selectedActivity.display_order,
            is_active: selectedActivity.is_active
          })

        if (error) throw error
        toast.success("Atividade criada com sucesso!")
      }

      setIsDialogOpen(false)
      setSelectedActivity(null)
      await loadActivities()
    } catch (error: any) {
      console.error("Error saving activity:", error)
      toast.error(error.message || "Erro ao salvar atividade")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (activity: DopamineActivity) => {
    try {
      const { error } = await supabase
        .from("dopamine_activities")
        .update({ is_active: !activity.is_active })
        .eq("id", activity.id)

      if (error) throw error

      toast.success(`Atividade ${!activity.is_active ? "ativada" : "desativada"} com sucesso!`)
      await loadActivities()
    } catch (error: any) {
      console.error("Error toggling activity:", error)
      toast.error(error.message || "Erro ao atualizar atividade")
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Exercício": "bg-green-500/20 text-green-400 border-green-400/30",
      "Exercise": "bg-green-500/20 text-green-400 border-green-400/30",
      "Ejercicio": "bg-green-500/20 text-green-400 border-green-400/30",
      "Bem-estar": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Wellbeing": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Bienestar": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Aprendizado": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Learning": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Aprendizaje": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Social": "bg-pink-500/20 text-pink-400 border-pink-400/30",
      "Criatividade": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Creativity": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Creatividad": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Natureza": "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
      "Nature": "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
      "Produtividade": "bg-cyan-500/20 text-cyan-400 border-cyan-400/30",
      "Productivity": "bg-cyan-500/20 text-cyan-400 border-cyan-400/30",
      "Productividad": "bg-cyan-500/20 text-cyan-400 border-cyan-400/30"
    }
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-400/30"
  }

  const getDopamineLevelColor = (level: number) => {
    if (level >= 8) return "bg-red-500/20 text-red-400 border-red-400/30"
    if (level >= 6) return "bg-orange-500/20 text-orange-400 border-orange-400/30"
    if (level >= 4) return "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
    return "bg-green-500/20 text-green-400 border-green-400/30"
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
              <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Dopamine Visualiser</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Adicione, edite ou remova atividades que geram dopamina
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* Activities List */}
        <div className="grid gap-4">
          {activities.length === 0 ? (
            <Card className="p-8 text-center">
              <Diamond className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira atividade
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Atividade
              </Button>
            </Card>
          ) : (
            activities.map((activity) => (
              <Card key={activity.id} className={`p-4 sm:p-6 ${!activity.is_active ? "opacity-50" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className={getCategoryColor(activity.category_pt)}>
                        {activity.category_pt}
                      </Badge>
                      <Badge variant="outline" className={getDopamineLevelColor(activity.dopamine_level)}>
                        Nível {activity.dopamine_level}/10
                      </Badge>
                      {!activity.is_active && (
                        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-400/30">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                        Ordem: {activity.display_order}
                      </Badge>
                      {activity.color_hex && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: activity.color_hex }}
                          />
                          <span className="text-xs text-muted-foreground">{activity.color_hex}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1">{activity.title_pt}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{activity.description_pt}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>EN:</strong> {activity.title_en}</p>
                        <p><strong>ES:</strong> {activity.title_es}</p>
                        {activity.icon_name && (
                          <p><strong>Ícone:</strong> {activity.icon_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(activity)}
                      title={activity.is_active ? "Desativar" : "Ativar"}
                    >
                      {activity.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(activity)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(activity.id)}
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
                {isEditing ? "Editar Atividade" : "Nova Atividade"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Edite os dados da atividade abaixo" : "Preencha os dados da nova atividade"}
              </DialogDescription>
            </DialogHeader>

            {selectedActivity && (
              <div className="space-y-6 py-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dopamine_level">Nível de Dopamina (1-10)</Label>
                    <Input
                      id="dopamine_level"
                      type="number"
                      min="1"
                      max="10"
                      value={selectedActivity.dopamine_level}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        dopamine_level: parseInt(e.target.value) || 5
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Ordem de Exibição</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={selectedActivity.display_order}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        display_order: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon_name">Nome do Ícone (lucide-react)</Label>
                    <Input
                      id="icon_name"
                      value={selectedActivity.icon_name || ""}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        icon_name: e.target.value || null
                      })}
                      placeholder="Ex: Dumbbell, Brain, BookOpen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color_hex">Cor (Hex)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color_hex"
                        value={selectedActivity.color_hex}
                        onChange={(e) => setSelectedActivity({
                          ...selectedActivity,
                          color_hex: e.target.value
                        })}
                        placeholder="#f59e0b"
                      />
                      <div 
                        className="w-10 h-10 rounded border border-gray-300"
                        style={{ backgroundColor: selectedActivity.color_hex }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="is_active"
                        checked={selectedActivity.is_active}
                        onCheckedChange={(checked) => setSelectedActivity({
                          ...selectedActivity,
                          is_active: checked
                        })}
                      />
                      <Label htmlFor="is_active">Ativa</Label>
                    </div>
                  </div>
                </div>

                {/* Português */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Português (PT)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="category_pt">Categoria</Label>
                    <Input
                      id="category_pt"
                      value={selectedActivity.category_pt}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        category_pt: e.target.value
                      })}
                      placeholder="Ex: Exercício, Social, Criatividade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_pt">Título</Label>
                    <Input
                      id="title_pt"
                      value={selectedActivity.title_pt}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        title_pt: e.target.value
                      })}
                      placeholder="Ex: Exercício Físico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_pt">Descrição</Label>
                    <Textarea
                      id="description_pt"
                      value={selectedActivity.description_pt}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        description_pt: e.target.value
                      })}
                      placeholder="Descrição da atividade"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Inglês */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">English (EN)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="category_en">Category</Label>
                    <Input
                      id="category_en"
                      value={selectedActivity.category_en}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        category_en: e.target.value
                      })}
                      placeholder="Ex: Exercise, Social, Creativity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title</Label>
                    <Input
                      id="title_en"
                      value={selectedActivity.title_en}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        title_en: e.target.value
                      })}
                      placeholder="Ex: Physical Exercise"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description</Label>
                    <Textarea
                      id="description_en"
                      value={selectedActivity.description_en}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        description_en: e.target.value
                      })}
                      placeholder="Activity description"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Espanhol */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Español (ES)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="category_es">Categoría</Label>
                    <Input
                      id="category_es"
                      value={selectedActivity.category_es}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        category_es: e.target.value
                      })}
                      placeholder="Ex: Ejercicio, Social, Creatividad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_es">Título</Label>
                    <Input
                      id="title_es"
                      value={selectedActivity.title_es}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        title_es: e.target.value
                      })}
                      placeholder="Ex: Ejercicio Físico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_es">Descripción</Label>
                    <Textarea
                      id="description_es"
                      value={selectedActivity.description_es}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        description_es: e.target.value
                      })}
                      placeholder="Descripción de la actividad"
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
      </div>
    </div>
  )
}



